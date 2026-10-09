# AGENTS.md

Guidance for coding agents working in this repository. The full, current description (setup,
configuration, tests, deployment) is in `README.md` (Czech); this file only lists the rules that
are easy to get wrong.

## Project
- Java 21+ (`release 21`), Jakarta Servlet + JSP (`jakarta.*`, never `javax.*`), Jetty 11, MariaDB,
  Flyway, Maven WAR. Run locally with `mvn flyway:migrate` and `mvn jetty:run` (port 8080).
- Servlets register themselves with `@WebServlet`; `WEB-INF/web.xml` holds only what needs an order
  or has no annotation (DbInit listener, the filters, error pages, the session cookie).
- Branch `main` deploys to test.skeli.cz, `production` to www.skeli.cz (`.github/workflows/deploy.yml`
  + `deploy/remote-deploy.sh`: migrations before the restart, smoke test, roll back on failure).

## Rules
- Database changes = a new `src/main/resources/db/migration/V{next}__description.sql`. Never edit a
  migration that has been deployed. The test database is never copied to production.
- Every visible text goes through `WEB-INF/i18n/messages_{cs,en,de,uk,vi}.properties` with the same
  keys in all five files (`I18nTest` checks it). Song lyrics and titles are translated too.
- Colours, fonts and sizes come from the variables in `css/base.css`; check light and dark theme and
  a phone. After a CSS or JS change raise `assetVersion` in `includes/header.jsp`.
- Escape output (`WebUtils.escapeHtml`, `c:out`), SQL only through prepared statements, every form
  posts the CSRF token. Secrets live in `.env` on the server, never in Git.

## Tests
- `mvn test` runs the unit tests (`*Test`, also part of `mvn verify`).
- `*IT` are Selenium tests (headless Chrome) against a running local site and the local database
  `skeliweb`: `mvn test -Dtest='*IT'`.
