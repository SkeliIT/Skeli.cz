package com.github.skeliit;

import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.sql.*;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/**
 * End-to-end check of voting and commenting on a lyric while logged in,
 * against a running local instance (start with: mvn org.eclipse.jetty:jetty-maven-plugin:11.0.15:run).
 * Verifies effects directly in the local MariaDB (jdbc:mariadb://localhost:3306/skeliweb).
 */
public class VoteCommentIT {
    private static final String BASE_URL = "http://localhost:8080";
    private static final String DB_URL = "jdbc:mariadb://localhost:3306/skeliweb?useUnicode=true&characterEncoding=utf8mb4";
    private static final String DB_USER = "Skeli";
    private static final String DB_PASS = "skeli";
    private static final int LYRIC_ID = 1;

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

        String ts = String.valueOf(System.currentTimeMillis());
        username = "vc" + ts;
        registerAndLogin(username, "vc" + ts + "@example.com", password);
        userId = queryUserId(username);
    }

    @AfterEach
    void teardown() {
        if (driver != null) driver.quit();
    }

    @Test
    @DisplayName("Voting up then down on a lyric updates the stored vote")
    void voteUpThenDown() throws Exception {
        assertNull(queryVote(LYRIC_ID, userId), "should have no pre-existing vote");

        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        jsClick(driver.findElement(By.cssSelector("button.vote-btn.up")));
        waitReady();
        assertEquals(1, queryVote(LYRIC_ID, userId), "vote should be recorded as up (1)");

        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        jsClick(driver.findElement(By.cssSelector("button.vote-btn.down")));
        waitReady();
        assertEquals(-1, queryVote(LYRIC_ID, userId), "vote should flip to down (-1)");
    }

    @Test
    @DisplayName("Posting then deleting a comment updates the comments table")
    void postThenDeleteComment() throws Exception {
        String commentText = "JUnit IT comment " + System.currentTimeMillis();

        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        driver.findElement(By.cssSelector("form[action='/comment'] textarea[name=content]")).sendKeys(commentText);
        jsClick(driver.findElement(
                By.xpath("//form[@action='/comment'][.//textarea[@name='content']]//button[@type='submit']")));
        waitReady();

        Integer commentId = queryCommentId(LYRIC_ID, userId, commentText);
        assertNotNull(commentId, "comment should be persisted in DB");

        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        WebElement deleteBtn = driver.findElement(By.xpath(
                "//form[@action='/comment'][.//input[@name='comment_id'][@value='" + commentId + "']]"
                        + "[.//input[@name='action'][@value='delete']]//button"));
        jsClick(deleteBtn);
        acceptAlertIfPresent();
        waitReady();

        assertNull(queryCommentId(LYRIC_ID, userId, commentText), "comment should be removed after delete");
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

    private void acceptAlertIfPresent() {
        try {
            new WebDriverWait(driver, Duration.ofSeconds(3)).until(ExpectedConditions.alertIsPresent());
            driver.switchTo().alert().accept();
        } catch (Exception ignored) {
            // no confirm() dialog appeared
        }
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

    private static Integer queryVote(int lyricId, int userId) throws SQLException {
        try (Connection c = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
             PreparedStatement ps = c.prepareStatement(
                     "SELECT vote FROM lyrics_votes WHERE lyric_id=? AND user_id=?")) {
            ps.setInt(1, lyricId);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : null;
            }
        }
    }

    private static Integer queryCommentId(int lyricId, int userId, String content) throws SQLException {
        try (Connection c = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
             PreparedStatement ps = c.prepareStatement(
                     "SELECT id FROM comments WHERE lyric_id=? AND user_id=? AND content=?")) {
            ps.setInt(1, lyricId);
            ps.setInt(2, userId);
            ps.setString(3, content);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : null;
            }
        }
    }
}
