package com.github.skeliit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.mindrot.jbcrypt.BCrypt;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.*;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Shared browser + DB helpers for the Selenium UI tests (*IT).
 * Requires a running local instance on BASE_URL and the local MariaDB on DB_URL
 * (start with: mvn jetty:run, JAVA_HOME pointing to JDK 21+).
 * Every user created through {@link #registerAndLogin} or {@link #insertUser} is deleted after the test.
 */
abstract class UiTestSupport {
    static final String BASE_URL = System.getProperty("it.baseUrl", "http://localhost:8080");
    static final String DB_URL = System.getProperty("it.dbUrl",
            "jdbc:mariadb://localhost:3306/skeliweb?useUnicode=true&characterEncoding=utf8mb4");
    static final String DB_USER = System.getProperty("it.dbUser", "Skeli");
    static final String DB_PASS = System.getProperty("it.dbPass", "skeli");
    static final String PASSWORD = "Sel3nium#Test2026";

    protected WebDriver driver;
    private final List<Integer> createdUserIds = new ArrayList<>();

    @BeforeEach
    void openBrowser() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--window-size=1400,900");
        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
    }

    @AfterEach
    void closeBrowserAndCleanUp() throws SQLException {
        if (driver != null) driver.quit();
        for (int id : createdUserIds) {
            update("DELETE FROM users WHERE id=?", id); // comments, votes, profiles cascade
        }
    }

    /** Short unique suffix; usernames are limited to 50 chars, youtube_id to 20. */
    static String uniq() {
        return Long.toString(System.nanoTime(), 36);
    }

    // ---------- browser flows ----------

    /** Registers through /register, logs in through /login and returns the new user's id. */
    int registerAndLogin(String username) throws SQLException {
        driver.get(BASE_URL + "/register");
        driver.findElement(By.name("username")).sendKeys(username);
        driver.findElement(By.name("email")).sendKeys(username + "@example.com");
        driver.findElement(By.name("password")).sendKeys(PASSWORD);
        driver.findElement(By.name("password2")).sendKeys(PASSWORD);
        jsClick(driver.findElement(By.name("consent")));
        submit(By.cssSelector("form button[type=submit]"));
        assertTrue(driver.getCurrentUrl().contains("registered=1"),
                "registration should redirect with registered=1, got: " + driver.getCurrentUrl());

        int id = queryInt("SELECT id FROM users WHERE username=?", username);
        createdUserIds.add(id);
        login(username, PASSWORD);
        return id;
    }

    void login(String username, String password) {
        driver.get(BASE_URL + "/login");
        driver.findElement(By.name("username")).sendKeys(username);
        driver.findElement(By.name("password")).sendKeys(password);
        submit(By.cssSelector("form button[type=submit]"));
    }

    /** Logout is a POST form in the header (with the CSRF token); a plain GET no longer logs out. */
    void logout() {
        ((JavascriptExecutor) driver).executeScript("document.querySelector('form.logout-form').submit()");
        waitReady();
    }

    /** Clicks a submit button and waits for the resulting navigation. */
    void submit(By button) {
        String oldUrl = driver.getCurrentUrl();
        jsClick(driver.findElement(button));
        waitUrlChange(oldUrl);
    }

    String bodyText() {
        return driver.findElement(By.tagName("body")).getText();
    }

    void jsClick(WebElement el) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", el);
    }

    void waitReady() {
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> "complete".equals(((JavascriptExecutor) d).executeScript("return document.readyState")));
    }

    void waitUrlChange(String oldUrl) {
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> !d.getCurrentUrl().equals(oldUrl));
        waitReady();
    }

    void acceptConfirm() {
        new WebDriverWait(driver, Duration.ofSeconds(3)).until(ExpectedConditions.alertIsPresent());
        driver.switchTo().alert().accept();
    }

    /**
     * Clicks a button whose form redirects back to the same URL, optionally accepts the
     * confirm() dialog, and waits until the old page is really replaced.
     */
    void clickAndWaitReload(WebElement button, boolean confirm) {
        if (confirm) {
            button.click(); // native click so the confirm() dialog is raised reliably
            acceptConfirm();
        } else {
            jsClick(button); // the floating Spotify player can cover buttons low on the page
        }
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.stalenessOf(button));
        waitReady();
    }

    // ---------- raw HTTP with the browser's session ----------

    /** GET status code for a path, sent with the browser's current session cookie (or none). */
    int httpStatus(String path) throws Exception {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(BASE_URL + path)).GET();
        Cookie session = driver.manage().getCookieNamed("JSESSIONID");
        if (session != null) b.header("Cookie", "JSESSIONID=" + session.getValue());
        return HttpClient.newHttpClient().send(b.build(), HttpResponse.BodyHandlers.discarding()).statusCode();
    }

    /**
     * POSTs a form from inside the browser page (same session, same origin) and returns the HTTP status.
     * The current page must contain a form with a CSRF token when {@code withCsrf} is true.
     */
    long browserPost(String path, Map<String, String> params, boolean withCsrf) {
        String script = """
                const [path, params, withCsrf, done] = arguments;
                const body = new URLSearchParams(params);
                if (withCsrf) body.set('csrf', document.querySelector('input[name=csrf]').value);
                fetch(path, {method: 'POST', body, redirect: 'manual', credentials: 'same-origin'})
                    .then(r => done(r.type === 'opaqueredirect' ? 302 : r.status))
                    .catch(e => done(-1));
                """;
        Object status = ((JavascriptExecutor) driver).executeAsyncScript(script, path, params, withCsrf);
        return ((Number) status).longValue();
    }

    // ---------- DB helpers ----------

    static Connection db() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
    }

    static int update(String sql, Object... args) throws SQLException {
        try (Connection c = db(); PreparedStatement ps = c.prepareStatement(sql)) {
            for (int i = 0; i < args.length; i++) ps.setObject(i + 1, args[i]);
            return ps.executeUpdate();
        }
    }

    /** First column of the first row as String, or null when there is no row. */
    static String queryString(String sql, Object... args) throws SQLException {
        try (Connection c = db(); PreparedStatement ps = c.prepareStatement(sql)) {
            for (int i = 0; i < args.length; i++) ps.setObject(i + 1, args[i]);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    static int queryInt(String sql, Object... args) throws SQLException {
        String v = queryString(sql, args);
        assertTrue(v != null, "expected a row for: " + sql);
        return Integer.parseInt(v);
    }

    static boolean exists(String sql, Object... args) throws SQLException {
        return queryString(sql, args) != null;
    }

    /** Creates a user directly in the DB (no browser session) and schedules it for cleanup. */
    int insertUser(String username, String role) throws SQLException {
        try (Connection c = db(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, username);
            ps.setString(2, username + "@example.com");
            ps.setString(3, BCrypt.hashpw(PASSWORD, BCrypt.gensalt(4)));
            ps.setString(4, role);
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                rs.next();
                int id = rs.getInt(1);
                createdUserIds.add(id);
                return id;
            }
        }
    }
}
