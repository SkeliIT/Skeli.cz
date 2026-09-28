#!/usr/bin/env bash
# Deploys one environment on the server. Piped over SSH by .github/workflows/deploy.yml:
#
#   ssh skeli@<host> bash -s -- <dir> <service> <port> <branch> <sha> <backup:yes|no> < deploy/remote-deploy.sh
#
# The app runs straight from a git checkout (systemd service running `mvn jetty:run`), so a
# deploy is: check the checkout is clean -> back up the DB (production) -> fast-forward to the
# pushed commit -> Flyway migrations -> restart the service -> smoke test. If anything after the
# fast-forward fails, the code goes back to the previous commit and the service is restarted.
# Migrations are not undone automatically; the backup file is printed for that case.
set -euo pipefail

DIR=$1 SERVICE=$2 PORT=$3 BRANCH=$4 SHA=$5 BACKUP=$6

log()  { printf '\n== %s\n' "$*"; }
fail() { echo "::error::$*"; exit 1; }

cd "$DIR" || fail "missing $DIR"

log "Checking $DIR"
# never overwrite work done directly on the server: changed tracked files anywhere in the code,
# plus new code files (uploaded images under src/main/webapp/uploads are data, not code)
DIRTY=$( { git status --porcelain --untracked-files=no -- src pom.xml
           git status --porcelain -- src/main/java src/main/resources; } | sort -u)
if [ -n "$DIRTY" ]; then
  echo "$DIRTY"
  fail "$DIR has uncommitted changes (listed above). Commit or move them away first; nothing was deployed."
fi
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$CURRENT_BRANCH" = "$BRANCH" ] || fail "$DIR is on branch $CURRENT_BRANCH, expected $BRANCH"
PREV=$(git rev-parse HEAD)
git fetch --quiet origin "$BRANCH"
git cat-file -e "$SHA^{commit}" || fail "commit $SHA not found after fetch"

# DB credentials from this environment's .env (read line by line, not sourced: values contain & and ?)
env_value() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"; }
DB_URL=$(env_value DB_URL); DB_USER=$(env_value DB_USER); DB_PASS=$(env_value DB_PASS)
[ -n "$DB_URL" ] && [ -n "$DB_USER" ] || fail "DB_URL / DB_USER missing in $DIR/.env"

BACKUP_FILE="(none)"
if [ "$BACKUP" = yes ]; then
  log "Backing up the database"
  rest=${DB_URL#*://}; hostport=${rest%%/*}; db=${rest#*/}; db=${db%%\?*}
  host=${hostport%%:*}; port=${hostport##*:}; [ "$port" = "$hostport" ] && port=3306
  mkdir -p ~/backups && chmod 700 ~/backups
  BACKUP_FILE=~/backups/$SERVICE-$(date +%Y%m%d-%H%M%S)-${PREV:0:7}.sql.gz
  MYSQL_PWD=$DB_PASS mariadb-dump --single-transaction --routines -h "$host" -P "$port" -u "$DB_USER" "$db" | gzip > "$BACKUP_FILE"
  chmod 600 "$BACKUP_FILE"
  # keep the 14 newest backups of this service
  ls -1t ~/backups/"$SERVICE"-*.sql.gz | tail -n +15 | xargs -r rm --
  echo "backup: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
fi

status() { curl -s -o /dev/null -m 10 -w '%{http_code}' "http://127.0.0.1:$PORT$1" || true; }
wait_up() {
  for _ in $(seq 1 60); do [ "$(status /)" = 200 ] && return 0; sleep 5; done
  return 1
}
rollback() {
  trap - ERR
  log "ROLLBACK to $PREV"
  git reset --hard --quiet "$PREV"
  sudo -n /bin/systemctl restart "$SERVICE.service"
  wait_up && echo "previous version is running again" || echo "::error::previous version did not come up either"
  echo "database migrations were NOT undone; backup: $BACKUP_FILE"
  exit 1
}

log "Code $PREV -> $SHA"
git merge --ff-only --quiet "$SHA" || fail "cannot fast-forward to $SHA (does the server have its own commits?)"
trap rollback ERR

log "Database migrations (Flyway)"
mvn -B -q flyway:migrate -Dflyway.url="$DB_URL" -Dflyway.user="$DB_USER" -Dflyway.password="$DB_PASS"

log "Restarting $SERVICE"
sudo -n /bin/systemctl restart "$SERVICE.service"
wait_up || { echo "::error::$SERVICE did not answer on port $PORT within 5 minutes"; rollback; }

log "Smoke test"
ok=1
for check in "/ 200" "/texty.jsp 200" "/login.jsp 200" "/css/base.css 200" "/admin.jsp 403"; do
  set -- $check
  got=$(status "$1")
  echo "$1 -> $got (expected $2)"
  [ "$got" = "$2" ] || ok=0
done
[ "$ok" = 1 ] || { echo "::error::smoke test failed"; rollback; }

trap - ERR
log "Deployed $SHA to $SERVICE"
