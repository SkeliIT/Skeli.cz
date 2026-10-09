# Skeli.cz

Oficiální web rappera Skeliho (SKELO SQUAD): hudba, texty písní, klipy, aktuality ze sociálních sítí, komentáře a hlasování.

- **Stack:** Java 21, Jakarta Servlet + JSP, Jetty 11, MariaDB, Flyway, Maven (WAR)
- **Jazyky webu:** čeština (výchozí), angličtina, němčina, ukrajinština, vietnamština
- **Prostředí:** větev `main` → test.skeli.cz, větev `production` → www.skeli.cz

## Požadavky

- **JDK 21 nebo novější** (vynucuje `maven-enforcer-plugin`, build cílí na Javu 21)
- Maven 3.9+
- MariaDB 10.6+ (lokálně stačí ta z XAMPP)
- Pro UI testy: Google Chrome

Na Windows, kde je v `PATH` starší Java, nastavte před Mavenem `JAVA_HOME`:

```bash
export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-25.0.4.101-hotspot"   # Git Bash
```

## Rychlý start (lokální vývoj)

1. **Databáze:** spusťte MariaDB a vytvořte DB `skeliweb` s uživatelem `Skeli` / `skeli`.
   S XAMPP:
   ```bash
   C:\xampp\mysql\bin\mysqld.exe --defaults-file=C:\xampp\mysql\bin\my.ini --standalone
   ```
2. **Konfigurace:** zkopírujte `.env.example` na `.env` a doplňte hodnoty (viz níže). `.env` je v `.gitignore`.
3. **Migrace a spuštění:**
   ```bash
   mvn flyway:migrate
   mvn jetty:run
   ```
4. Web běží na http://localhost:8080/

Jetty se samo nerestartuje: změny v JSP a CSS se projeví hned (po obnovení stránky), změny v Java kódu až po restartu `mvn jetty:run`.

**Docker (volitelně):** `docker compose up --build` spustí MariaDB a aplikaci na portu 8080. Je to jen vývojový image s výchozími hesly, ne produkční nasazení.

## Konfigurace (`.env`)

| Proměnná | K čemu slouží |
|---|---|
| `DB_URL`, `DB_USER`, `DB_PASS` | připojení k MariaDB |
| `SMTP_*` | odesílání e-mailů (registrace, reset hesla, newsletter). Když je SMTP nastavené, noví uživatelé musí potvrdit e-mail, než smějí komentovat a hlasovat. |
| `APP_BASE_URL` | veřejná adresa webu pro odkazy v e-mailech, canonical a Open Graph (nikdy se nebere z hlavičky `Host`) |
| `UPLOAD_DIR` | složka mimo WAR pro avatary a obrázky z Instagramu, aby přežily nasazení nové verze |
| `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` | synchronizace klipů z kanálu (`/admin/sync`) |
| `INSTAGRAM_ACCESS_TOKEN` | příspěvky z Instagramu v Aktualitách; stačí pro první start, aplikace si token každý týden prodlouží a uloží do DB |
| `SOCIAL_TOKEN` | tajný klíč pro `POST /api/social-posts`; bez něj je zápis vypnutý |
| `APPLE_MUSIC_*` | synchronizace s Apple Music (`/admin/apple-sync`) |

## Databáze a migrace

- Migrace jsou v `src/main/resources/db/migration`, pojmenované `V{číslo}__popis.sql`. Každá změna schématu nebo dat = nová migrace s dalším číslem; už nasazené migrace se nikdy neupravují.
- `flyway-maven-plugin` má v `pom.xml` lokální přihlašovací údaje. Na jiném prostředí je přepište:
  ```bash
  mvn flyway:migrate -Dflyway.url="$DB_URL" -Dflyway.user="$DB_USER" -Dflyway.password="$DB_PASS"
  ```
- Migrace se na serveru pouštějí **před** restartem aplikace.
- **Testovací databáze se nikdy nekopíruje do produkční.** Produkce dostává jen migrace; před migrací udělejte zálohu (`mysqldump`).
- Prvního admina nastavíte v DB: `UPDATE users SET role='ADMIN' WHERE username='...';`

## Testy

```bash
mvn test                          # unit testy (běží i v mvn verify)
mvn test -Dtest='*IT'             # UI testy v prohlížeči – potřebují běžící web a lokální DB
mvn test -Dtest=HeaderFitIT       # jeden konkrétní test
```

- **Unit testy** (`*Test`) nepotřebují nic dalšího.
- **UI testy** (`*IT`) ovládají headless Chrome proti `http://localhost:8080` a lokální DB `skeliweb`. Účty, které si vytvoří, po sobě smažou. Adresu a DB lze změnit přes `-Dit.baseUrl`, `-Dit.dbUrl`, `-Dit.dbUser`, `-Dit.dbPass`.
- Některé UI testy umí uložit snímky obrazovky pro kontrolu designu: `-Dit.shots=C:/cesta/ke/slozce`.
- Užitečné hlídače: `I18nTest` (všechny jazyky mají stejné klíče), `HeaderFitIT` (hlavička se vejde ve všech jazycích a šířkách), `MobileMenuIT`, `LanguageFlagsIT`, `AboutPageIT`.

## Struktura projektu

```
src/main/java/com/github/skeliit/   základ, který používá všechno: Config, Db, DbInit, I18n, WebUtils, EmailUtil
  web/admin/                         administrace (písně, texty, klipy, uživatelé, synchronizace, export)
  web/auth/                          přihlášení, registrace, zapomenuté heslo, ověření e-mailu
  web/profile/                       profil a nastavení účtu (avatar, heslo, export dat, smazání)
  web/site/                          veřejný web: texty, písně, komentáře, hlasy, newsletter, sitemap,
                                     staré adresy (LegacyRedirectServlet)
  web/api/                           JSON pro skripty (Kevin, hledání, aktuality, kdo je na webu)
  web/files/                         obrázky (avatary, náhledy písní, Instagram, YouTube)
  filter/                            filtry (CSRF, admin, bezpečnostní hlavičky, cache…)
  security/                          limity pokusů, uniklá hesla, tokeny, sessions, mazání účtu
  job/                               úlohy na pozadí (Instagram, názvy a data klipů)
  dao/, model/, service/             přístup k DB, datové třídy, služby (Apple Music, překlad, statistiky)
src/main/webapp/                     JSP stránky
  includes/header.jsp, footer.jsp    společná hlavička a patička (menu, jazyk, téma)
  WEB-INF/i18n/messages_*.properties překlady
  WEB-INF/views/                     šablony pro servlety (detail textu), views/admin/ = stránky adminu
  WEB-INF/tags/                      JSP tagy (úvodní pás stránky, komentář)
  WEB-INF/web.xml                    jen filtry (záleží na pořadí), chybové stránky, session
  css/base.css                       design tokeny (barvy, písma, velikosti), světlé téma
  css/components.css                 hlavička, tlačítka, menu, patička
  css/pages.css                      jednotlivé stránky
  css/effects.css                    efekty a fotky (třpyt, kouř v logu, střídání pozadí)
  css/admin.css                      administrace (načítá se jen pod /admin)
  js/                                skripty (Kevin, souhlas s cookies, heslo, avatar…), js/vendor = knihovny
  img/                               obrázky, loga, vlajky (img/flags)
src/main/resources/db/migration/     Flyway migrace
src/test/java/                       unit testy a UI testy (*IT)
```

## Překlady a jazyky

- Texty se čtou jen ze souborů `WEB-INF/i18n/messages_{jazyk}.properties` (UTF-8). Chybějící klíč se zobrazí česky.
- V JSP je překlad v proměnné `t` (`t.getProperty("klic")`), aktuální jazyk v `cur`.
- **Nový jazyk** vyžaduje:
  1. `messages_xx.properties` se všemi klíči (hlídá `I18nTest`),
  2. `xx` v `I18n.SUPPORTED_LANGS` a v `AdminLyricsServlet.LANGS`,
  3. položku v seznamu jazyků v `includes/header.jsp` (rozbalovací seznam i pole jazyků pro mobil), v `uzivatel.jsp` a v `WEB-INF/views/admin/lyrics.jsp`,
  4. vlajku `img/flags/xx.svg` a řádek `.lang-btn[data-lang="xx"]` v `components.css`,
  5. kontrolu písma: Bruno Ace SC umí jen latinku (ne azbuku ani vietnamštinu). Ukrajinština proto padá na Exo 2 a vietnamština přepíná celý web na Exo 2 (`html:lang(vi)` v `base.css`).

## Design

- Barvy, písma a velikosti jsou jako proměnné v `css/base.css` (`--accent`, `--panel`, `--fs-h1` … `--fs-small`). Nové prvky napojujte na ně, ne na pevná čísla. Světlé téma = třída `body.light`.
- Písma: Bruno Ace SC (nadpisy, menu, tlačítka), Oswald Light (odstavce v kartách), Exo 2 (náhrada pro azbuku a vietnamštinu).
- Loga jsou CSS masky, takže mají barvu textu: `.logo-mark` (nápis SKELOSQUAD) a `.squad-mark` (nápis s obličeji squadu, hlavička a stránka O mně).
- Po změně CSS zvyšte `assetVersion` v `includes/header.jsp`, aby prohlížeče nenačítaly starou verzi z cache.
- Každou změnu vzhledu kontrolujte ve světlém i tmavém režimu a na mobilu.

## Administrace

Po přihlášení s rolí ADMIN je dostupné `/admin.jsp` (bez přihlášení 403):
- synchronizace YouTube (`/admin/sync`), Instagramu (`/admin/instagram-sync`) a Apple Music (`/admin/apple-sync`),
- přidání songu nebo klipu i mimo vlastní kanál (`/admin/video`),
- editor textů písní ve všech jazycích (`/admin/lyrics`),
- stránka písně (`/admin/song?uuid=…`): název, rok, Spotify / Apple Music (stačí vložit odkaz), náhled, obrázek v seznamu Texty (posun a velikost myší), texty a SEO po jazycích,
- export textů jako TTML v ZIPu (`/admin/lyrics-export`, např. pro DistroKid),
- moderace komentářů a nahlášené komentáře, uživatelé, odběratelé newsletteru.

## Nasazení

Na serveru běží dvě systemd služby, které spouštějí aplikaci přímo ze zdrojáků (`mvn … jetty-maven-plugin:11.0.15:run`) za Apache:

| Služba | Větev | Web | Port |
|---|---|---|---|
| `skeli-test` | `main` | test.skeli.cz | 8082 |
| `skeli-production` | `production` | www.skeli.cz | 8083 |

Každé prostředí má vlastní checkout, vlastní `.env` a vlastní databázi.

Nasazuje se **automaticky pushem** do `main` (test) nebo `production` (produkce), případně ručně tlačítkem *Run workflow* v GitHub Actions. Workflow `.github/workflows/deploy.yml`:

1. postaví projekt a pustí unit testy (`mvn verify`),
2. připojí se přes SSH (klíč `DEPLOY_KEY`, pevně zapsaný otisk serveru),
3. na serveru spustí `deploy/remote-deploy.sh`:
   - zastaví se, pokud jsou v checkoutu neuložené změny v `src/` nebo `pom.xml` (nic nepřepíše),
   - u produkce zazálohuje databázi do `~/backups` (drží 14 posledních),
   - posune checkout na pushnutý commit (jen fast-forward),
   - pustí Flyway migrace s údaji z `.env` daného prostředí,
   - restartuje službu (`sudo systemctl restart skeli-…`, jiné příkazy uživatel `skeli` přes sudo nesmí),
   - počká, až web odpoví, a zkontroluje `/`, `/texty.jsp`, `/login.jsp`, `/css/base.css` (200) a `/admin.jsp` (403),
   - když něco selže, vrátí kód na předchozí commit a službu znovu restartuje. **Migrace se nevracejí** – případně obnovte zálohu,
4. zkontroluje stejné stránky zvenku přes HTTPS.

GitHub secrets: `DEPLOY_KEY` (soukromý klíč; na serveru je jeho veřejná část v `authorized_keys` s omezením `restrict`), `DEPLOY_HOST` (`magnymph.vitexsoftware.com`, bez `http://`), `DEPLOY_USER` (`skeli`).

## Bezpečnost

- Admin sekce chráněné filtrem, CSRF token u všech formulářů (`CsrfFilter`), omezení pokusů o přihlášení a registraci, honeypot proti spamu.
- Hesla jako bcrypt hash, tokeny pro reset hesla a ověření e-mailu se ukládají jen jako SHA-256.
- SQL jen přes prepared statements, výstup v JSP escapovat (`WebUtils.escapeHtml`, `c:out`).
- Tajné hodnoty patří do `.env` na serveru, nikdy do Gitu. `.webui_secret_key` byl v minulosti commitnutý – považujte ho za prozrazený.
