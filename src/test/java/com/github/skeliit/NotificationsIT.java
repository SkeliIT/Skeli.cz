package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.sql.SQLException;
import java.time.Duration;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** The bell: a reply to your comment and a heart from Skeli show up, opening the list reads them. */
public class NotificationsIT extends UiTestSupport {
    private static final int LYRIC_ID = 1;

    @Test
    @DisplayName("A reply and a heart reach the author under the bell; opening the panel marks them read")
    void replyAndHeartNotify() throws SQLException {
        String author = "na" + uniq();
        int authorId = insertUser(author, "USER");
        update("INSERT INTO comments (lyric_id, user_id, content) VALUES (?, ?, ?)", LYRIC_ID, authorId, "ask " + uniq());
        int commentId = queryInt("SELECT id FROM comments WHERE user_id=?", authorId);

        // someone answers
        String replier = "nr" + uniq();
        insertUser(replier, "USER");
        login(replier, PASSWORD);
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        assertEquals(200, browserPost("/api/comments", Map.of("kind", "lyric", "action", "add", "target", String.valueOf(LYRIC_ID),
                "parent", String.valueOf(commentId), "content", "answer " + uniq()), true));
        logout();

        // Skeli gives the comment a heart
        String artist = "ns" + uniq();
        int artistId = insertUser(artist, "USER");
        update("UPDATE users SET is_artist=1 WHERE id=?", artistId);
        login(artist, PASSWORD);
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        assertEquals(200, browserPost("/api/comments", Map.of("kind", "lyric", "action", "heart", "id", String.valueOf(commentId), "on", "1"), true));
        logout();

        assertEquals(2, queryInt("SELECT COUNT(*) FROM notifications WHERE user_id=? AND read_at IS NULL", authorId));

        login(author, PASSWORD);
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        WebElement badge = driver.findElement(By.cssSelector(".notif-btn .notif-badge"));
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> badge.isDisplayed() && "2".equals(badge.getText()));

        jsClick(driver.findElement(By.cssSelector(".notif-btn")));
        WebElement panel = driver.findElement(By.id("notifPanel"));
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> panel.findElements(By.cssSelector(".notif-item")).size() == 2);
        assertTrue(panel.getText().contains(replier), "the reply names who answered");
        assertTrue(panel.findElement(By.cssSelector(".notif-item")).getAttribute("href").contains("#comment-"));
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> !badge.isDisplayed());
        assertEquals(0, queryInt("SELECT COUNT(*) FROM notifications WHERE user_id=? AND read_at IS NULL", authorId));
    }

    @Test
    @DisplayName("Answering yourself and signed-out visitors get no notifications")
    void noNotificationsForYourselfOrStrangers() throws Exception {
        String name = "nn" + uniq();
        int id = insertUser(name, "USER");
        update("INSERT INTO comments (lyric_id, user_id, content) VALUES (?, ?, ?)", LYRIC_ID, id, "own " + uniq());
        int commentId = queryInt("SELECT id FROM comments WHERE user_id=?", id);
        login(name, PASSWORD);
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        assertEquals(200, browserPost("/api/comments", Map.of("kind", "lyric", "action", "add", "target", String.valueOf(LYRIC_ID),
                "parent", String.valueOf(commentId), "content", "me again " + uniq()), true));
        assertEquals(0, queryInt("SELECT COUNT(*) FROM notifications WHERE user_id=?", id));
        logout();
        assertEquals(401, httpStatus("/api/notifications"));
    }

    @Test
    @DisplayName("My account lists my comments under lyrics and clips; the old Profile address leads there")
    void accountPageListsComments() throws Exception {
        String name = "nm" + uniq();
        int id = insertUser(name, "USER");
        String lyricText = "lyric note " + uniq(), clipText = "clip note " + uniq();
        update("INSERT INTO comments (lyric_id, user_id, content) VALUES (?, ?, ?)", LYRIC_ID, id, lyricText);
        String yt = queryString("SELECT youtube_id FROM videos LIMIT 1");
        update("INSERT INTO video_comments (user_id, youtube_id, content) VALUES (?, ?, ?)", id, yt, clipText);
        try {
            login(name, PASSWORD);
            driver.get(BASE_URL + "/profile.jsp");
            waitReady();
            assertTrue(driver.getCurrentUrl().endsWith("/uzivatel.jsp"), "Profile and Settings are one page now");
            WebElement list = driver.findElement(By.id("komentare"));
            assertTrue(list.getText().contains(lyricText));
            assertTrue(list.getText().contains(clipText));
            assertEquals("2", driver.findElement(By.cssSelector(".acct-stats li strong")).getText());
        } finally {
            update("DELETE FROM video_comments WHERE user_id=?", id);
        }
    }
}
