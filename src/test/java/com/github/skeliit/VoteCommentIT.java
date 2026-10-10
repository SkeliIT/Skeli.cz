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
    @DisplayName("The heart next to Share likes the song, a second click takes it back; it survives a reload")
    void heartOnOffThenStays() throws Exception {
        assertNull(queryVote(LYRIC_ID, userId), "should have no pre-existing vote");

        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        WebElement like = driver.findElement(By.id("likeSong"));
        jsClick(like);
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> "true".equals(like.getAttribute("aria-pressed")));
        assertEquals(1, queryVote(LYRIC_ID, userId), "the heart is stored as a vote of 1");
        assertEquals("1", like.findElement(By.cssSelector(".like-count")).getText());

        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        WebElement again = driver.findElement(By.id("likeSong"));
        assertEquals("true", again.getAttribute("aria-pressed"), "still filled after a reload");
        jsClick(again);
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> "false".equals(again.getAttribute("aria-pressed")));
        assertNull(queryVote(LYRIC_ID, userId), "a second click takes the heart back");
    }

    @Test
    @DisplayName("Posting then deleting a comment updates the comments table")
    void postThenDeleteComment() throws Exception {
        String commentText = "JUnit IT comment " + System.currentTimeMillis();

        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        // the comment box is drawn by js/comments.js
        WebElement textarea = new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> d.findElement(By.cssSelector(".cmts-composer-slot textarea")));
        textarea.click();
        textarea.sendKeys(commentText);
        jsClick(driver.findElement(By.cssSelector(".cmts-composer-slot .cmt-send")));
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> {
            try { return queryCommentId(LYRIC_ID, userId, commentText) != null; } catch (SQLException e) { return false; }
        });
        Integer commentId = queryCommentId(LYRIC_ID, userId, commentText);
        assertNotNull(commentId, "comment should be persisted in DB");

        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        WebElement item = new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> d.findElement(By.id("comment-" + commentId)));
        jsClick(item.findElement(By.cssSelector(".cmt-menu summary")));
        item.findElement(By.cssSelector(".cmt-menu-list .cmt-delete")).click();
        acceptAlertIfPresent();
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> {
            try { return queryCommentId(LYRIC_ID, userId, commentText) == null; } catch (SQLException e) { return false; }
        });
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
        // registration signs the new account in straight away
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
