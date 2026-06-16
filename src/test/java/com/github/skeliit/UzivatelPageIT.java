package com.github.skeliit;

import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.file.Files;
import java.sql.*;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Exercises every interactive option on /uzivatel.jsp (account settings) while logged in:
 * profile update, password change, data export, avatar upload, account deletion.
 * Requires a running local instance (start with: mvn org.eclipse.jetty:jetty-maven-plugin:11.0.15:run).
 * Verifies effects directly in the local MariaDB (jdbc:mariadb://localhost:3306/skeliweb).
 */
public class UzivatelPageIT {
    private static final String BASE_URL = "http://localhost:8080";
    private static final String DB_URL = "jdbc:mariadb://localhost:3306/skeliweb?useUnicode=true&characterEncoding=utf8mb4";
    private static final String DB_USER = "Skeli";
    private static final String DB_PASS = "skeli";

    private WebDriver driver;
    private String username;
    private String password = "Sel3nium#Test2026";
    private int userId;

    @BeforeEach
    void setup() throws Exception {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--window-size=1400,900");
        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));

        String ts = String.valueOf(System.nanoTime());
        username = "up" + ts;
        registerAndLogin(username, "up" + ts + "@example.com", password);
        userId = queryUserId(username);
    }

    @AfterEach
    void teardown() {
        if (driver != null) driver.quit();
    }

    @Test
    @DisplayName("Profile update form persists display name, age, city, bio, theme and language")
    void profileUpdate() throws Exception {
        driver.get(BASE_URL + "/uzivatel.jsp");
        driver.findElement(By.name("display_name")).sendKeys("Selenium Tester");
        driver.findElement(By.name("age")).sendKeys("33");
        driver.findElement(By.name("city")).sendKeys("Praha");
        driver.findElement(By.name("bio")).sendKeys("Bio from IT test");
        new org.openqa.selenium.support.ui.Select(driver.findElement(By.name("theme"))).selectByValue("light");
        new org.openqa.selenium.support.ui.Select(driver.findElement(By.name("lang"))).selectByValue("en");

        String oldUrl = driver.getCurrentUrl();
        jsClick(driver.findElement(By.xpath(
                "//form[@action='/profile/update']//button[@type='submit']")));
        waitUrlChange(oldUrl);

        assertTrue(driver.getCurrentUrl().contains("saved=true"),
                "should redirect with saved=true, got: " + driver.getCurrentUrl());

        try (Connection c = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
             PreparedStatement ps = c.prepareStatement(
                     "SELECT display_name, age, city, bio, theme, lang FROM user_profiles WHERE user_id=?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                assertTrue(rs.next(), "profile row should exist after save");
                assertEquals("Selenium Tester", rs.getString(1));
                assertEquals(33, rs.getInt(2));
                assertEquals("Praha", rs.getString(3));
                assertEquals("Bio from IT test", rs.getString(4));
                assertEquals("light", rs.getString(5));
                assertEquals("en", rs.getString(6));
            }
        }
    }

    @Test
    @DisplayName("Change password form updates the password hash and new password works at login")
    void changePassword() throws Exception {
        String newPassword = "Sel3nium#Changed2026";
        driver.get(BASE_URL + "/uzivatel.jsp");
        driver.findElement(By.name("old_password")).sendKeys(password);
        driver.findElement(By.name("new_password")).sendKeys(newPassword);
        driver.findElement(By.name("confirm_password")).sendKeys(newPassword);

        String oldUrl = driver.getCurrentUrl();
        jsClick(driver.findElement(By.xpath(
                "//form[@action='/profile/change-password']//button[@type='submit']")));
        waitUrlChange(oldUrl);

        assertTrue(driver.getCurrentUrl().contains("password_changed=true"),
                "should redirect with password_changed=true, got: " + driver.getCurrentUrl());

        // log out, then confirm the new password logs in
        driver.get(BASE_URL + "/logout");
        waitReady();
        driver.get(BASE_URL + "/login");
        driver.findElement(By.name("username")).sendKeys(username);
        driver.findElement(By.name("password")).sendKeys(newPassword);
        oldUrl = driver.getCurrentUrl();
        jsClick(driver.findElement(By.cssSelector("form button[type=submit]")));
        waitUrlChange(oldUrl);

        String body = driver.findElement(By.tagName("body")).getText();
        assertTrue(body.contains(username), "should be logged in with the new password");
    }

    @Test
    @DisplayName("Export data returns JSON containing the account's username")
    void exportData() throws Exception {
        // /profile/export sends Content-Disposition: attachment, so a real browser
        // downloads the file instead of rendering it; fetch it directly with the
        // session cookie instead of navigating there with the WebDriver.
        String sessionCookie = driver.manage().getCookieNamed("JSESSIONID").getValue();
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create(BASE_URL + "/profile/export"))
                .header("Cookie", "JSESSIONID=" + sessionCookie)
                .GET()
                .build();
        java.net.http.HttpResponse<String> response = client.send(request,
                java.net.http.HttpResponse.BodyHandlers.ofString());

        assertEquals(200, response.statusCode());
        String body = response.body();
        assertTrue(body.contains(username), "exported JSON should contain the username, got: " + body);
        assertTrue(body.contains("\"comments\""), "exported JSON should contain a comments array");
        assertTrue(body.contains("\"favorites\""), "exported JSON should contain a favorites array");
    }

    @Test
    @DisplayName("Avatar upload resizes and stores the image, updating the user's avatar_url")
    void avatarUpload() throws Exception {
        File tmp = File.createTempFile("avatar", ".jpg");
        BufferedImage img = new BufferedImage(200, 200, BufferedImage.TYPE_INT_RGB);
        ImageIO.write(img, "jpg", tmp);

        driver.get(BASE_URL + "/uzivatel.jsp");
        WebElement fileInput = driver.findElement(By.id("avatar-file-hidden"));
        fileInput.sendKeys(tmp.getAbsolutePath());
        ((JavascriptExecutor) driver).executeScript(
                "document.getElementById('avatar-form').submit();");
        waitReady();

        String body = driver.findElement(By.tagName("body")).getText();
        assertTrue(body.contains("\"ok\":true"), "avatar upload should respond with ok:true, got: " + body);

        try (Connection c = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
             PreparedStatement ps = c.prepareStatement("SELECT avatar_url FROM users WHERE id=?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                assertTrue(rs.next());
                String url = rs.getString(1);
                assertNotNull(url, "avatar_url should be set after upload");
                assertTrue(url.contains(userId + ".jpg"), "avatar_url should reference the uploaded file: " + url);
            }
        }

        Files.deleteIfExists(tmp.toPath());
    }

    @Test
    @DisplayName("Delete account requires typing DELETE and anonymizes the account")
    void deleteAccountRequiresConfirmText() throws Exception {
        // Wrong confirmation text should be rejected
        driver.get(BASE_URL + "/uzivatel.jsp");
        driver.findElement(By.name("confirm")).sendKeys("nope");
        String oldUrl = driver.getCurrentUrl();
        jsClick(driver.findElement(By.xpath("//form[@action='/profile/delete']//button[@type='submit']")));
        waitUrlChange(oldUrl);
        assertTrue(driver.getCurrentUrl().contains("confirm=required"),
                "wrong confirmation text should be rejected, got: " + driver.getCurrentUrl());

        try (Connection c = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
             PreparedStatement ps = c.prepareStatement("SELECT role FROM users WHERE id=?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                assertTrue(rs.next());
                assertEquals("USER", rs.getString(1), "account should NOT be deleted after a wrong confirmation");
            }
        }

        // Correct confirmation text deletes (anonymizes) the account
        driver.get(BASE_URL + "/uzivatel.jsp");
        driver.findElement(By.name("confirm")).sendKeys("DELETE");
        oldUrl = driver.getCurrentUrl();
        jsClick(driver.findElement(By.xpath("//form[@action='/profile/delete']//button[@type='submit']")));
        waitUrlChange(oldUrl);
        assertTrue(driver.getCurrentUrl().contains("account=deleted"),
                "correct confirmation should redirect to index.jsp?account=deleted, got: " + driver.getCurrentUrl());

        try (Connection c = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
             PreparedStatement ps = c.prepareStatement("SELECT username, email, role FROM users WHERE id=?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                assertTrue(rs.next());
                assertNotEquals(username, rs.getString(1), "username should be anonymized");
                assertNull(rs.getString(2), "email should be cleared");
                assertEquals("DELETED", rs.getString(3));
            }
        }
    }

    private void registerAndLogin(String username, String email, String password) {
        driver.get(BASE_URL + "/register");
        driver.findElement(By.name("username")).sendKeys(username);
        driver.findElement(By.name("email")).sendKeys(email);
        driver.findElement(By.name("password")).sendKeys(password);
        driver.findElement(By.name("password2")).sendKeys(password);
        jsClick(driver.findElement(By.name("consent")));
        String oldUrl = driver.getCurrentUrl();
        jsClick(driver.findElement(By.cssSelector("form button[type=submit]")));
        waitUrlChange(oldUrl);

        driver.get(BASE_URL + "/login");
        driver.findElement(By.name("username")).sendKeys(username);
        driver.findElement(By.name("password")).sendKeys(password);
        oldUrl = driver.getCurrentUrl();
        jsClick(driver.findElement(By.cssSelector("form button[type=submit]")));
        waitUrlChange(oldUrl);
    }

    private void jsClick(WebElement el) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", el);
    }

    private void waitReady() {
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> "complete".equals(((JavascriptExecutor) d).executeScript("return document.readyState")));
    }

    private void waitUrlChange(String oldUrl) {
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> !d.getCurrentUrl().equals(oldUrl));
        waitReady();
    }

    private static int queryUserId(String username) throws SQLException {
        try (Connection c = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
             PreparedStatement ps = c.prepareStatement("SELECT id FROM users WHERE username=?")) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                assertTrue(rs.next(), "registered user should exist in DB");
                return rs.getInt(1);
            }
        }
    }
}
