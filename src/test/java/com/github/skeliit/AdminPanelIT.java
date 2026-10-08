package com.github.skeliit;

import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;

import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Exercises the admin section as a logged-in ADMIN: dashboard, user management,
 * comment moderation, newsletter subscribers, video editing and the songs overview.
 * The admin account is registered through the UI, promoted in the DB and deleted afterwards.
 * Requires a running local instance and MariaDB, see {@link UiTestSupport}.
 */
public class AdminPanelIT extends UiTestSupport {
    private String adminName;

    @BeforeEach
    void loginAsAdmin() throws SQLException {
        adminName = "ad" + uniq();
        int id = registerAndLogin(adminName);
        update("UPDATE users SET role='ADMIN' WHERE id=?", id);
        // role is stored in the session at login time, so log in again to pick it up
        logout();
        login(adminName, PASSWORD);
    }

    @Test
    @DisplayName("Admin sees the Admin link in the nav and the dashboard loads")
    void dashboardIsReachableFromNav() throws Exception {
        driver.get(BASE_URL + "/index.jsp");
        WebElement adminLink = driver.findElement(By.cssSelector("a.admin[href$='/admin.jsp']"));
        jsClick(adminLink);
        waitReady();

        assertTrue(driver.getCurrentUrl().endsWith("/admin.jsp"), "got: " + driver.getCurrentUrl());
        assertEquals("Admin", driver.findElement(By.cssSelector(".admin-head h2")).getText());
        assertFalse(driver.findElements(By.cssSelector(".admin-bar a.active[href='/admin.jsp']")).isEmpty(), "the admin bar marks the dashboard");
        assertFalse(driver.findElements(By.cssSelector("form[action='/admin/video']")).isEmpty());
        assertFalse(driver.findElements(By.cssSelector("form[action='/admin/comment']")).isEmpty());
    }

    @Test
    @DisplayName("All admin pages return 200 for an admin")
    void adminPagesLoad() throws Exception {
        for (String path : new String[]{"/admin.jsp", "/admin_users.jsp", "/admin/songs", "/admin/newsletter"}) {
            assertEquals(200, httpStatus(path), "ADMIN GET " + path);
        }

        driver.get(BASE_URL + "/admin/songs");
        assertFalse(driver.findElements(By.cssSelector("table.songs-table")).isEmpty(), "songs table expected");
    }

    @Test
    @DisplayName("User list shows the admin; admin can promote and demote another user")
    void changeUserRole() throws Exception {
        String targetName = "at" + uniq();
        int targetId = insertUser(targetName, "USER");

        driver.get(BASE_URL + "/admin_users.jsp");
        assertTrue(bodyText().contains(adminName), "admin should be listed in the user table");

        setRole(targetName, "ADMIN");
        assertEquals("ADMIN", queryString("SELECT role FROM users WHERE id=?", targetId));

        setRole(targetName, "USER");
        assertEquals("USER", queryString("SELECT role FROM users WHERE id=?", targetId));
    }

    @Test
    @DisplayName("Admin can delete a user from the user list (after confirming)")
    void deleteUser() throws Exception {
        String targetName = "at" + uniq();
        int targetId = insertUser(targetName, "USER");

        driver.get(BASE_URL + "/admin_users.jsp");
        WebElement deleteBtn = userRow(targetName).findElement(By.cssSelector("input[name=action][value=delete]"))
                .findElement(By.xpath("./ancestor::form//button"));
        clickAndWaitReload(deleteBtn, true);

        assertFalse(exists("SELECT 1 FROM users WHERE id=?", targetId), "user should be deleted");
        assertFalse(bodyText().contains(targetName), "deleted user must disappear from the list");
    }

    @Test
    @DisplayName("Comment moderation form deletes a comment by ID")
    void deleteComment() throws Exception {
        int authorId = insertUser("ac" + uniq(), "USER");
        String text = "Admin IT comment " + uniq();
        update("INSERT INTO comments (lyric_id, user_id, content) VALUES (1, ?, ?)", authorId, text);
        int commentId = queryInt("SELECT id FROM comments WHERE user_id=? AND content=?", authorId, text);

        driver.get(BASE_URL + "/admin.jsp");
        driver.findElement(By.cssSelector("form[action='/admin/comment'] input[name=comment_id]"))
                .sendKeys(String.valueOf(commentId));
        clickAndWaitReload(driver.findElement(By.cssSelector("form[action='/admin/comment'] button[type=submit]")), false);

        assertTrue(driver.getCurrentUrl().endsWith("/admin.jsp"), "got: " + driver.getCurrentUrl());
        assertFalse(exists("SELECT 1 FROM comments WHERE id=?", commentId), "comment should be deleted");
    }

    @Test
    @DisplayName("Newsletter admin lists a subscriber and can remove them")
    void removeNewsletterSubscriber() throws Exception {
        String email = "nl" + uniq() + "@example.com";
        update("INSERT INTO newsletter_emails (email, unsubscribe_token) VALUES (?, ?)", email, "tok" + uniq());
        try {
            driver.get(BASE_URL + "/admin/newsletter");
            assertTrue(bodyText().contains(email), "subscriber should be listed");

            WebElement btn = driver.findElement(By.xpath(
                    "//form[@action='/admin/newsletter'][.//input[@name='email'][@value='" + email + "']]//button"));
            clickAndWaitReload(btn, true);

            assertFalse(exists("SELECT 1 FROM newsletter_emails WHERE email=?", email), "subscriber should be removed");
        } finally {
            update("DELETE FROM newsletter_emails WHERE email=?", email);
        }
    }

    @Test
    @DisplayName("Video form renames a video and links it to a song")
    void editVideo() throws Exception {
        String youtubeId = "it" + uniq();
        String songName = "IT Song " + uniq();
        update("INSERT INTO videos (youtube_id, title) VALUES (?, 'old title')", youtubeId);
        try {
            driver.get(BASE_URL + "/admin.jsp");
            driver.findElement(By.cssSelector("form[action='/admin/video'] input[name=youtube_id]")).sendKeys(youtubeId);
            driver.findElement(By.cssSelector("form[action='/admin/video'] input[name=title]")).sendKeys("New IT title");
            driver.findElement(By.cssSelector("form[action='/admin/video'] input[name=song_name]")).sendKeys(songName);
            driver.findElement(By.cssSelector("form[action='/admin/video'] input[name=year]")).sendKeys("2026");
            clickAndWaitReload(driver.findElement(By.cssSelector("form[action='/admin/video'] button[type=submit]")), false);

            assertEquals("New IT title", queryString("SELECT title FROM videos WHERE youtube_id=?", youtubeId));
            assertEquals(songName, queryString(
                    "SELECT s.name FROM videos v JOIN songs s ON s.id = v.song_id WHERE v.youtube_id=?", youtubeId));
        } finally {
            update("DELETE FROM videos WHERE youtube_id=?", youtubeId);
            update("DELETE FROM songs WHERE name=?", songName);
        }
    }

    @Test
    @DisplayName("A video from another channel (pasted as a link) and a song without video appear in the discography")
    void addOutsideSongsToDiscography() throws Exception {
        String youtubeId = "it" + uniq();
        String withVideo = "IT Feat " + uniq();
        String noVideo = "IT Spotify only " + uniq();
        try {
            driver.get(BASE_URL + "/admin.jsp");
            driver.findElement(By.cssSelector("form[action='/admin/video'] input[name=youtube_id]"))
                    .sendKeys("https://youtu.be/" + youtubeId + "?si=x");
            driver.findElement(By.cssSelector("form[action='/admin/video'] input[name=title]")).sendKeys("Other channel clip");
            driver.findElement(By.cssSelector("form[action='/admin/video'] input[name=song_name]")).sendKeys(withVideo);
            driver.findElement(By.cssSelector("form[action='/admin/video'] input[name=year]")).sendKeys("2024");
            clickAndWaitReload(driver.findElement(By.cssSelector("form[action='/admin/video'] button[type=submit]")), false);

            assertEquals(withVideo, queryString(
                    "SELECT s.name FROM videos v JOIN songs s ON s.id = v.song_id WHERE v.youtube_id=?", youtubeId));

            driver.findElement(By.cssSelector("form[action='/admin/video'] input[name=song_name]")).sendKeys(noVideo);
            clickAndWaitReload(driver.findElement(By.cssSelector("form[action='/admin/video'] button[type=submit]")), false);
            assertTrue(exists("SELECT 1 FROM songs WHERE name=?", noVideo));

            driver.get(BASE_URL + "/music.jsp");
            String disco = driver.findElement(By.cssSelector(".discography")).getText();
            assertTrue(disco.contains(withVideo), "song with outside video listed");
            assertTrue(disco.contains(noVideo), "song without video listed");
        } finally {
            update("DELETE FROM videos WHERE youtube_id=?", youtubeId);
            update("DELETE FROM songs WHERE name IN (?, ?)", withVideo, noVideo);
        }
    }

    @Test
    @DisplayName("Lyrics editor: new song, text saved and shown, clip turned into a song")
    void lyricsEditor() throws Exception {
        String songName = "IT Lyrics " + uniq();
        String youtubeId = "it" + uniq();
        update("INSERT INTO videos (youtube_id, title) VALUES (?, 'Skeli - IT Clip OFFICIAL VIDEO')", youtubeId);
        try {
            driver.get(BASE_URL + "/admin/lyrics");
            driver.findElement(By.cssSelector(".ls-new input[name=name]")).sendKeys(songName);
            driver.findElement(By.cssSelector(".ls-new input[name=year]")).sendKeys("2026");
            clickAndWaitReload(driver.findElement(By.cssSelector(".ls-new button")), false);
            int songId = queryInt("SELECT id FROM songs WHERE name=?", songName);
            assertTrue(driver.getCurrentUrl().contains("song=" + songId));

            String text = "První řádek\nDruhý řádek\n\nRefrén";
            WebElement ta = driver.findElement(By.cssSelector(".lyrics-edit textarea[name=words]"));
            ta.sendKeys(text);
            clickAndWaitReload(driver.findElement(By.cssSelector(".lyrics-edit button[type=submit]")), false);
            assertEquals(text, queryString("SELECT words FROM lyrics WHERE song_id=? AND lang='cs'", songId));
            assertFalse(driver.findElements(By.cssSelector(".form-success")).isEmpty());

            int lyricId = queryInt("SELECT id FROM lyrics WHERE song_id=? AND lang='cs'", songId);
            driver.get(BASE_URL + "/lyrics/" + lyricId);
            assertTrue(driver.findElement(By.cssSelector(".lyrics-text")).getText().contains("Druhý řádek"));

            driver.get(BASE_URL + "/admin/lyrics");
            WebElement clip = driver.findElement(By.xpath(
                    "//form[contains(@class,'ls-video')][.//input[@name='youtube_id'][@value='" + youtubeId + "']]//button"));
            clickAndWaitReload(clip, false);
            assertEquals("IT Clip", queryString(
                    "SELECT s.name FROM videos v JOIN songs s ON s.id=v.song_id WHERE v.youtube_id=?", youtubeId));
        } finally {
            update("DELETE FROM lyrics WHERE song_id IN (SELECT id FROM songs WHERE name IN (?, 'IT Clip'))", songName);
            update("DELETE FROM videos WHERE youtube_id=?", youtubeId);
            update("DELETE FROM songs WHERE name IN (?, 'IT Clip')", songName);
        }
    }

    @Test
    @DisplayName("The dashboard shows the visits and the counters can be reset to zero")
    void visitStatsAndReset() throws Exception {
        driver.get(BASE_URL + "/admin.jsp");
        assertFalse(driver.findElements(By.cssSelector("#stats")).isEmpty(), "Návštěvnost section");
        assertEquals(6, driver.findElements(By.cssSelector(".admin-visits .admin-stat")).size());

        WebElement form = driver.findElement(By.cssSelector("form[action='/admin/stats-reset']"));
        jsClick(form.findElement(By.name("confirm")));
        clickAndWaitReload(form.findElement(By.cssSelector("button[type=submit]")), false);
        assertTrue(driver.getCurrentUrl().contains("statsReset=1"), "got: " + driver.getCurrentUrl());
        assertEquals(0, queryInt("SELECT COUNT(*) FROM lyric_views"));
        assertEquals(0, queryInt("SELECT COUNT(*) FROM visit_days"));
    }

    private WebElement userRow(String username) {
        return driver.findElement(By.xpath("//table[contains(@class,'admin-table')]//tr[td[normalize-space()='"
                + username + "']]"));
    }

    private void setRole(String username, String role) {
        driver.get(BASE_URL + "/admin_users.jsp");
        WebElement row = userRow(username);
        new Select(row.findElement(By.name("role"))).selectByVisibleText(role);
        WebElement save = row.findElement(By.cssSelector("input[name=action][value=role]"))
                .findElement(By.xpath("./ancestor::form//button"));
        clickAndWaitReload(save, false);
    }
}
