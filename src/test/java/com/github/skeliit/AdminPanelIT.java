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
        assertFalse(driver.findElements(By.cssSelector("a[href='/admin/comments']")).isEmpty(), "the dashboard links to the comments");
    }

    @Test
    @DisplayName("All admin pages return 200 for an admin")
    void adminPagesLoad() throws Exception {
        for (String path : new String[]{"/admin.jsp", "/admin_users.jsp", "/admin/songs", "/admin/newsletter", "/admin/comments", "/admin/track", "/admin/quotes"}) {
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
    @DisplayName("Every comment is listed on /admin/comments and can be deleted there")
    void deleteComment() throws Exception {
        int authorId = insertUser("ac" + uniq(), "USER");
        String text = "Admin IT comment " + uniq();
        update("INSERT INTO comments (lyric_id, user_id, content) VALUES (1, ?, ?)", authorId, text);
        int commentId = queryInt("SELECT id FROM comments WHERE user_id=? AND content=?", authorId, text);

        driver.get(BASE_URL + "/admin/comments");
        WebElement row = driver.findElement(By.xpath("//div[@id='commentList']/div[contains(@class,'report-row')][.//div[contains(@class,'report-text')][normalize-space()='" + text + "']]"));
        assertEquals("lyric", row.getAttribute("data-kind"));
        clickAndWaitReload(row.findElement(By.cssSelector("button.btn-delete")), true);

        assertTrue(driver.getCurrentUrl().endsWith("/admin/comments"), "got: " + driver.getCurrentUrl());
        assertFalse(exists("SELECT 1 FROM comments WHERE id=?", commentId), "comment should be deleted");
        assertFalse(bodyText().contains(text), "the deleted comment is gone from the list");
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

            String text = "PrvnĂ­ Ĺ™Ăˇdek\nDruhĂ˝ Ĺ™Ăˇdek\n\nRefrĂ©n";
            WebElement ta = driver.findElement(By.cssSelector(".lyrics-edit textarea[name=words]"));
            ta.sendKeys(text);
            clickAndWaitReload(driver.findElement(By.cssSelector(".lyrics-edit button[type=submit]")), false);
            assertEquals(text, queryString("SELECT words FROM lyrics WHERE song_id=? AND lang='cs'", songId));
            assertFalse(driver.findElements(By.cssSelector(".form-success")).isEmpty());

            int lyricId = queryInt("SELECT id FROM lyrics WHERE song_id=? AND lang='cs'", songId);
            driver.get(BASE_URL + "/lyrics/" + lyricId);
            assertTrue(driver.findElement(By.cssSelector(".lyrics-text")).getText().contains("DruhĂ˝ Ĺ™Ăˇdek"));

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
    @DisplayName("Song hub: the picture in the Texty row is dragged and resized by hand, then automatic again")
    void rowArtPlacedByHand() throws Exception {
        String songName = "IT Row Art " + uniq();
        update("INSERT INTO songs (uuid, name, year, preview_image_url) VALUES (UUID(), ?, 2026, '/img/IMG_0090.webp')", songName);
        int songId = queryInt("SELECT id FROM songs WHERE name=?", songName);
        update("INSERT INTO lyrics (song_id, lang, words, score) VALUES (?, 'cs', 'ĹĂˇdek', 0)", songId);
        try {
            driver.get(BASE_URL + "/admin/song?id=" + songId);
            new org.openqa.selenium.support.ui.WebDriverWait(driver, java.time.Duration.ofSeconds(10)).until(d ->
                    (Boolean) ((org.openqa.selenium.JavascriptExecutor) d).executeScript(
                            "var i = document.querySelector('.art-desk img'); return i.complete && i.naturalWidth > 0;"));
            WebElement row = driver.findElement(By.cssSelector(".art-desk .art-row"));
            ((org.openqa.selenium.JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'})", row);
            ((org.openqa.selenium.JavascriptExecutor) driver).executeScript(
                    "var r = document.getElementById('artZoom'); r.value = 150; r.dispatchEvent(new Event('input'));");
            new org.openqa.selenium.interactions.Actions(driver).dragAndDropBy(row, 0, 30).perform();
            new org.openqa.selenium.interactions.Actions(driver).dragAndDropBy(row, 300, 0).perform();
            assertTrue(Double.parseDouble(driver.findElement(By.id("artX")).getAttribute("value")) > 5, "the picture moves sideways too");
            String dir = System.getProperty("it.shots");
            if (dir != null) ((org.openqa.selenium.JavascriptExecutor) driver).executeScript(
                    "document.querySelectorAll('[class*=cookie]').forEach(function (e) { e.remove(); });");
            if (dir != null) java.nio.file.Files.write(java.nio.file.Path.of(dir, "row-art-admin.png"),
                    driver.findElement(By.id("row-art")).getScreenshotAs(org.openqa.selenium.OutputType.BYTES));
            clickAndWaitReload(driver.findElement(By.cssSelector("#artForm button[type=submit]:not([name])")), false);

            assertEquals(1.5, Double.parseDouble(queryString("SELECT art_zoom FROM songs WHERE id=?", songId)), 0.001);
            double y = Double.parseDouble(queryString("SELECT art_y FROM songs WHERE id=?", songId));
            assertTrue(y < 45, "dragging down shows a higher part of the picture on the middle line, got " + y);
            assertTrue(Double.parseDouble(queryString("SELECT art_x FROM songs WHERE id=?", songId)) > 5, "moved to the right");

            driver.get(BASE_URL + "/texty.jsp");
            String style = driver.findElement(By.cssSelector("a.song-row[data-song='" + songId + "'] img")).getAttribute("style");
            assertTrue(style.contains("--az: 1.5"), "got: " + style);

            driver.get(BASE_URL + "/admin/song?id=" + songId);
            clickAndWaitReload(driver.findElement(By.cssSelector("#artForm button[name=auto]")), false);
            assertNull(queryString("SELECT art_zoom FROM songs WHERE id=?", songId));
            if (dir != null) {
                jsClick(driver.findElement(By.id("artWhole")));
                java.nio.file.Files.write(java.nio.file.Path.of(dir, "row-art-whole.png"),
                        driver.findElement(By.id("row-art")).getScreenshotAs(org.openqa.selenium.OutputType.BYTES));
            }
            driver.get(BASE_URL + "/texty.jsp");
            assertNull(driver.findElement(By.cssSelector("a.song-row[data-song='" + songId + "'] img")).getAttribute("data-manual"));
        } finally {
            update("DELETE FROM lyrics WHERE song_id=?", songId);
            update("DELETE FROM songs WHERE id=?", songId);
        }
    }

    @Test
    @DisplayName("The dashboard shows the visits and the counters can be reset to zero")
    void visitStatsAndReset() throws Exception {
        driver.get(BASE_URL + "/admin.jsp");
        assertFalse(driver.findElements(By.cssSelector("#stats")).isEmpty(), "NĂˇvĹˇtÄ›vnost section");
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

    @Test
    @DisplayName("Add a track from YouTube: link, check, one button - the song, its clip, Spotify and lyrics are in")
    void addTrackInOneGo() throws Exception {
        String youtubeId = "it" + uniq();
        String songName = "IT Track " + uniq();
        try {
            driver.get(BASE_URL + "/admin/track");
            driver.findElement(By.cssSelector(".track-lookup input[name=url]")).sendKeys("https://youtu.be/" + youtubeId);
            clickAndWaitReload(driver.findElement(By.cssSelector(".track-lookup button[type=submit]")), false);
            WebElement form = driver.findElement(By.cssSelector("form.track-form"));
            assertEquals(youtubeId, form.findElement(By.name("youtube_id")).getAttribute("value"), "the ID is read from the link");
            form.findElement(By.cssSelector("input[name=song_mode][value=new]")).click();
            WebElement name = form.findElement(By.name("song_name"));
            name.clear();
            name.sendKeys(songName);
            form.findElement(By.name("year")).clear();
            form.findElement(By.name("year")).sendKeys("2026");
            form.findElement(By.name("spotify")).sendKeys("https://open.spotify.com/track/0123456789abcdefABCDEF?si=x");
            form.findElement(By.name("lyrics")).sendKeys("první řádek\ndruhý řádek");
            clickAndWaitReload(form.findElement(By.cssSelector("button[type=submit]")), false);

            assertTrue(driver.getCurrentUrl().contains("/admin/song?uuid="), "the new song opens, got " + driver.getCurrentUrl());
            assertEquals(songName, queryString("SELECT s.name FROM videos v JOIN songs s ON s.id = v.song_id WHERE v.youtube_id=?", youtubeId));
            assertEquals("0123456789abcdefABCDEF", queryString("SELECT spotify_id FROM songs WHERE name=?", songName));
            assertTrue(queryString("SELECT l.words FROM lyrics l JOIN songs s ON s.id = l.song_id WHERE s.name=? AND l.lang='cs'", songName).startsWith("první řádek"));
        } finally {
            update("DELETE l FROM lyrics l JOIN songs s ON s.id = l.song_id WHERE s.name=?", songName);
            update("DELETE FROM videos WHERE youtube_id=?", youtubeId);
            update("DELETE FROM songs WHERE name=?", songName);
        }
    }

    @Test
    @DisplayName("Quotes for the home page can be added, edited and deleted")
    void quotesCanBeManaged() throws Exception {
        String line = "IT citát " + uniq();
        try {
            driver.get(BASE_URL + "/admin/quotes");
            WebElement add = driver.findElement(By.cssSelector("form.quote-form input[name=action][value=add]")).findElement(By.xpath("./ancestor::form"));
            new Select(add.findElement(By.name("song_id"))).selectByIndex(1);
            add.findElement(By.name("line1")).sendKeys("„" + line);
            add.findElement(By.name("line2")).sendKeys("druhý řádek“");
            clickAndWaitReload(add.findElement(By.cssSelector("button[type=submit]")), false);
            assertEquals(line, queryString("SELECT line1 FROM home_quotes WHERE line1=?", line), "saved without the quotation marks");
            int id = queryInt("SELECT id FROM home_quotes WHERE line1=?", line);

            WebElement card = driver.findElement(By.id("q" + id));
            WebElement l2 = card.findElement(By.name("line2"));
            l2.clear();
            l2.sendKeys("upravený řádek");
            clickAndWaitReload(card.findElement(By.cssSelector("form.quote-form button[type=submit]")), false);
            assertEquals("upravený řádek", queryString("SELECT line2 FROM home_quotes WHERE id=?", id));

            card = driver.findElement(By.id("q" + id));
            WebElement del = card.findElement(By.cssSelector("form.quote-delete button"));
            ((org.openqa.selenium.JavascriptExecutor) driver).executeScript("window.confirm = () => true");
            clickAndWaitReload(del, false);
            assertFalse(exists("SELECT 1 FROM home_quotes WHERE id=?", id), "deleted");
        } finally {
            update("DELETE FROM home_quotes WHERE line1=?", line);
        }
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
