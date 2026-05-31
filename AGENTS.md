# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Maven WAR-based JSP web app served via Jetty (configured in pom.xml).
- Views: JSPs under src/main/webapp with simple includes (header.jsp, footer.jsp); static assets in src/main/webapp/css and src/main/webapp/img.
- Database migrations: Flyway SQL scripts in src/main/resources/db/migration targeting MySQL. Naming follows V{version}__Description.sql.

Key commands
Prerequisites: Java (JDK) and Maven installed; MySQL available as configured in pom.xml.

- Build WAR
```bash path=null start=null
mvn -q clean package
```
Artifact: target/SkeliCZ-1.0-SNAPSHOT.war

- Run locally with Jetty (serves context path "/")
```bash path=null start=null
mvn -q jetty:run
```
Default port is Jetty’s default (override with -Djetty.port=8080 if needed):
```bash path=null start=null
mvn -q -Djetty.port=8080 jetty:run
```

- Dev server URL and health-check
```bash path=null start=null
# Open: http://localhost:8080/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/
```
```powershell path=null start=null
(Invoke-WebRequest http://localhost:8080/ -UseBasicParsing).StatusCode
```

- Database migrations (Flyway)
Runs against the JDBC URL and credentials defined in pom.xml.
```bash path=null start=null
mvn -q flyway:info
mvn flyway:migrate
```
Flyway scans src/main/resources/db/migration.

Additional CLI overrides (use local credentials without editing pom.xml):
```bash path=null start=null
mvn -q -Dflyway.url=jdbc:mysql://localhost:3306/skeliweb -Dflyway.user={{DB_USER}} -Dflyway.password={{DB_PASSWORD}} flyway:migrate
```

- Update process
Code changes and patches:
  1. Update sources in `src/main/java`, `src/main/webapp`, or `src/main/resources`.
  2. Add any DB schema changes as a new Flyway migration SQL file in `src/main/resources/db/migration` using the next `V{n}__description.sql` version.
  3. Rebuild the WAR:
```bash path=null start=null
mvn -q clean package
```
  4. Apply database migrations on the target environment before deploying the new WAR:
```bash path=null start=null
mvn -q -Dflyway.url=jdbc:mysql://<host>:<port>/<database> -Dflyway.user=<user> -Dflyway.password=<pass> flyway:migrate
```
  5. Deploy `target/SkeliCZ-1.0-SNAPSHOT.war` to the servlet container, or restart `mvn -q jetty:run` for development.

  Notes:
  - Always increase Flyway migration version when schema changes are required.
  - For production updates, run Flyway before restarting the app so the new schema is ready.

- Tests
There are no tests in this repo. If tests are added under src/test/java, you can run them with:
```bash path=null start=null
mvn -q test
```
Run a single test (or method):
```bash path=null start=null
mvn -q -Dtest=ClassName test
mvn -q -Dtest=ClassName#methodName test
```

- Lint/Static analysis
No lint/static analysis plugins (Checkstyle/PMD/SpotBugs) are configured in pom.xml.

Architecture and layout (big picture)
- Web layer: JSP pages (index.jsp, about.jsp, music.jsp, texty.jsp) render directly without a Java controller layer. Shared layout via src/main/webapp/includes/header.jsp and footer.jsp.
- Static assets: src/main/webapp/css and src/main/webapp/img are served by the servlet container.
- Persistence/migrations: Flyway drives schema evolution; initial table creation lives in V1__LyricsTable.sql.
- Runtime: Jetty Maven Plugin runs the webapp in-process for local development; packaging is war for deployment to a servlet container.
