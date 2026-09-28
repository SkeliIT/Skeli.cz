package com.github.skeliit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comment ownership rules on lyric pages (/comment) and music-page videos (/video-comment):
 * the author and admins may edit or delete, nobody else may. Also login by e-mail and
 * the uploaded avatar in the header.
 */
public class CommentsIT extends UiTestSupport {
    private static final int LYRIC_ID = 1;
    private static final String YT = "pZx0xa6MpbE";
    private final List<Integer> videoCommentIds = new ArrayList<>();

    @AfterEach
    void deleteVideoComments() throws SQLException {
        // video_comments has no foreign key to users, so it is not cleaned up by the user delete
        for (int id : videoCommentIds) update("DELETE FROM video_comments WHERE id=?", id);
    }

    private int insertLyricComment(int userId, String text) throws SQLException {
        update("INSERT INTO comments (lyric_id, user_id, content) VALUES (?, ?, ?)", LYRIC_ID, userId, text);
        return queryInt("SELECT id FROM comments WHERE user_id=? AND content=?", userId, text);
    }

    private int insertVideoComment(int userId, String text) throws SQLException {
        update("INSERT INTO video_comments (user_id, youtube_id, content) VALUES (?, ?, ?)", userId, YT, text);
        int id = queryInt("SELECT id FROM video_comments WHERE user_id=? AND content=?", userId, text);
        videoCommentIds.add(id);
        return id;
    }

    /** Opens the pencil of a comment on the lyric page, types new text and saves. */
    private void editLyricComment(int commentId, String newText) {
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        WebElement item = driver.findElement(By.id("comment-" + commentId));
        jsClick(item.findElement(By.cssSelector(".comment-edit-toggle")));
        WebElement ta = item.findElement(By.cssSelector(".comment-edit-form textarea"));
        ta.clear();
        ta.sendKeys(newText);
        clickAndWaitReload(item.findElement(By.cssSelector(".comment-edit-form button[type=submit]")), false);
    }

    @Test
    @DisplayName("The author edits their own lyric comment; it is marked as edited")
    void authorEditsOwnComment() throws SQLException {
        String name = "ce" + uniq();
        int userId = insertUser(name, "USER");
        login(name, PASSWORD);
        int commentId = insertLyricComment(userId, "before " + uniq());

        String edited = "after " + uniq();
        editLyricComment(commentId, edited);

        assertEquals(edited, queryString("SELECT content FROM comments WHERE id=?", commentId));
        assertNotNull(queryString("SELECT updated_at FROM comments WHERE id=?", commentId));
        WebElement item = driver.findElement(By.id("comment-" + commentId));
        assertFalse(item.findElements(By.cssSelector(".comment-edited")).isEmpty(), "edited marker should be shown");
    }

    @Test
    @DisplayName("Another user gets no edit/delete controls and cannot delete through the server")
    void otherUserCannotTouchComment() throws SQLException {
        int authorId = insertUser("ca" + uniq(), "USER");
        int commentId = insertLyricComment(authorId, "mine " + uniq());
        String other = "co" + uniq();
        insertUser(other, "USER");
        login(other, PASSWORD);

        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        WebElement item = driver.findElement(By.id("comment-" + commentId));
        assertTrue(item.findElements(By.cssSelector(".comment-edit-toggle, .comment-delete")).isEmpty(), "no edit/delete for others");
        assertFalse(item.findElements(By.cssSelector(".comment-report")).isEmpty(), "others may report");

        browserPost("/comment", Map.of("action", "delete", "comment_id", String.valueOf(commentId)), true);
        browserPost("/comment", Map.of("action", "update", "comment_id", String.valueOf(commentId), "content", "hacked"), true);
        assertTrue(exists("SELECT 1 FROM comments WHERE id=? AND content LIKE 'mine %'", commentId));
    }

    @Test
    @DisplayName("An admin edits and deletes someone else's lyric comment")
    void adminModeratesLyricComment() throws SQLException {
        int authorId = insertUser("cb" + uniq(), "USER");
        int commentId = insertLyricComment(authorId, "rude " + uniq());
        String admin = "cm" + uniq();
        insertUser(admin, "ADMIN");
        login(admin, PASSWORD);

        editLyricComment(commentId, "moderated");
        assertEquals("moderated", queryString("SELECT content FROM comments WHERE id=?", commentId));

        WebElement item = driver.findElement(By.id("comment-" + commentId));
        clickAndWaitReload(item.findElement(By.cssSelector(".comment-delete")), true);
        assertFalse(exists("SELECT 1 FROM comments WHERE id=?", commentId));
    }

    @Test
    @DisplayName("Czech diacritics, line breaks and emoji survive the comment form")
    void commentKeepsCzechAndEmoji() throws SQLException {
        String name = "cd" + uniq();
        int userId = insertUser(name, "USER");
        login(name, PASSWORD);
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();

        String text = "Refrén žluťoučký kůň úpěl ďábelské ódy\nДякую 🔥";
        driver.findElement(By.cssSelector("form.comment-form textarea[name=content]")).sendKeys(text);
        clickAndWaitReload(driver.findElement(By.cssSelector("form.comment-form button[type=submit]")), false);

        assertEquals(text, queryString("SELECT content FROM comments WHERE user_id=?", userId));
        assertTrue(bodyText().contains("Refrén žluťoučký kůň"));
    }

    @Test
    @DisplayName("A comment over the length limit is not saved")
    void tooLongCommentIsRejected() throws SQLException {
        String name = "cl" + uniq();
        int userId = insertUser(name, "USER");
        login(name, PASSWORD);
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();

        browserPost("/comment", Map.of("lyric_id", String.valueOf(LYRIC_ID),
                "content", "x".repeat(WebUtils.COMMENT_MAX_LENGTH + 1)), true);
        assertFalse(exists("SELECT 1 FROM comments WHERE user_id=?", userId));
    }

    @Test
    @DisplayName("Video comments: only the author or an admin may delete or edit")
    void videoCommentOwnership() throws SQLException {
        int authorId = insertUser("va" + uniq(), "USER");
        int commentId = insertVideoComment(authorId, "video " + uniq());

        // another user: refused
        String other = "vo" + uniq();
        insertUser(other, "USER");
        login(other, PASSWORD);
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID); // any page with a CSRF field
        waitReady();
        browserPost("/video-comment", Map.of("action", "delete", "comment_id", String.valueOf(commentId)), true);
        assertTrue(exists("SELECT 1 FROM video_comments WHERE id=?", commentId));
        logout();

        // admin: allowed
        String admin = "vm" + uniq();
        insertUser(admin, "ADMIN");
        login(admin, PASSWORD);
        driver.get(BASE_URL + "/video-comment?yt=" + YT);
        assertTrue(driver.getPageSource().contains("\"canEdit\":true"), "admin should be offered edit/delete");
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        assertEquals(200, browserPost("/video-comment",
                Map.of("action", "update", "comment_id", String.valueOf(commentId), "content", "moderated"), true));
        assertEquals("moderated", queryString("SELECT content FROM video_comments WHERE id=?", commentId));
        assertEquals(200, browserPost("/video-comment", Map.of("action", "delete", "comment_id", String.valueOf(commentId)), true));
        assertFalse(exists("SELECT 1 FROM video_comments WHERE id=?", commentId));
    }

    @Test
    @DisplayName("Replying through the reply form nests the answer under the comment")
    void replyToLyricComment() throws SQLException {
        int authorId = insertUser("ra" + uniq(), "USER");
        int parentId = insertLyricComment(authorId, "question " + uniq());
        String name = "rr" + uniq();
        int replierId = insertUser(name, "USER");
        login(name, PASSWORD);

        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        WebElement item = driver.findElement(By.id("comment-" + parentId));
        jsClick(item.findElement(By.cssSelector(".comment-reply-toggle")));
        String answer = "answer " + uniq();
        item.findElement(By.cssSelector(".comment-reply-form textarea")).sendKeys(answer);
        clickAndWaitReload(item.findElement(By.cssSelector(".comment-reply-form button[type=submit]")), false);

        int replyId = queryInt("SELECT id FROM comments WHERE user_id=? AND content=?", replierId, answer);
        assertEquals(String.valueOf(parentId), queryString("SELECT parent_id FROM comments WHERE id=?", replyId));
        // shown inside the parent's thread
        WebElement thread = driver.findElement(By.id("comment-" + parentId)).findElement(By.xpath("./.."));
        assertFalse(thread.findElements(By.cssSelector(".comment-replies #comment-" + replyId)).isEmpty());

        // answering the reply attaches to the same top-level comment (one level deep)
        browserPost("/comment", Map.of("lyric_id", String.valueOf(LYRIC_ID), "parent_id", String.valueOf(replyId),
                "content", "nested " + uniq()), true);
        assertEquals(String.valueOf(parentId),
                queryString("SELECT parent_id FROM comments WHERE user_id=? AND content LIKE 'nested %'", replierId));
    }

    @Test
    @DisplayName("A user reports someone else's comment; the admin sees it and dismisses or deletes it")
    void reportAndModerate() throws SQLException {
        int authorId = insertUser("pa" + uniq(), "USER");
        int commentId = insertLyricComment(authorId, "spam " + uniq());
        String reporter = "pr" + uniq();
        int reporterId = insertUser(reporter, "USER");
        login(reporter, PASSWORD);

        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        WebElement item = driver.findElement(By.id("comment-" + commentId));
        clickAndWaitReload(item.findElement(By.cssSelector(".comment-report")), true);
        assertTrue(exists("SELECT 1 FROM comment_reports WHERE kind='lyric' AND comment_id=? AND reporter_id=?",
                commentId, reporterId));
        assertTrue(driver.findElement(By.cssSelector(".flash-ok")).isDisplayed(), "thank-you message expected");

        // own comment cannot be reported
        int ownId = insertLyricComment(reporterId, "own " + uniq());
        browserPost("/comment/report", Map.of("kind", "lyric", "comment_id", String.valueOf(ownId)), true);
        assertFalse(exists("SELECT 1 FROM comment_reports WHERE comment_id=? AND kind='lyric'", ownId));
        logout();

        String admin = "pm" + uniq();
        insertUser(admin, "ADMIN");
        login(admin, PASSWORD);
        driver.get(BASE_URL + "/admin.jsp");
        waitReady();
        WebElement reports = driver.findElement(By.id("reports"));
        assertTrue(reports.getText().contains("spam "), "reported comment should be listed");

        // dismiss keeps the comment, removes the report
        WebElement dismiss = reports.findElement(By.xpath(
                ".//form[.//input[@name='comment_id'][@value='" + commentId + "']][.//input[@name='action'][@value='dismiss']]//button"));
        clickAndWaitReload(dismiss, false);
        assertTrue(exists("SELECT 1 FROM comments WHERE id=?", commentId));
        assertFalse(exists("SELECT 1 FROM comment_reports WHERE kind='lyric' AND comment_id=?", commentId));

        // report again, then delete from the admin list
        update("INSERT INTO comment_reports (kind, comment_id, reporter_id) VALUES ('lyric', ?, ?)", commentId, reporterId);
        driver.get(BASE_URL + "/admin.jsp");
        waitReady();
        WebElement delete = driver.findElement(By.id("reports")).findElement(By.xpath(
                ".//form[.//input[@name='comment_id'][@value='" + commentId + "']][not(.//input[@name='action'])]//button"));
        clickAndWaitReload(delete, true);
        assertFalse(exists("SELECT 1 FROM comments WHERE id=?", commentId));
        assertFalse(exists("SELECT 1 FROM comment_reports WHERE kind='lyric' AND comment_id=?", commentId));
    }

    @Test
    @DisplayName("Video comments: replies nest, others can report")
    void videoReplyAndReport() throws SQLException {
        int authorId = insertUser("wa" + uniq(), "USER");
        int parentId = insertVideoComment(authorId, "top " + uniq());
        String name = "wr" + uniq();
        int userId = insertUser(name, "USER");
        login(name, PASSWORD);
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();

        assertEquals(200, browserPost("/video-comment", Map.of("action", "add", "yt", YT,
                "parent_id", String.valueOf(parentId), "content", "reply " + uniq()), true));
        int replyId = queryInt("SELECT id FROM video_comments WHERE user_id=? AND content LIKE 'reply %'", userId);
        videoCommentIds.add(replyId);
        assertEquals(String.valueOf(parentId), queryString("SELECT parent_id FROM video_comments WHERE id=?", replyId));

        assertEquals(200, browserPost("/comment/report", Map.of("kind", "video", "comment_id", String.valueOf(parentId)), true));
        assertTrue(exists("SELECT 1 FROM comment_reports WHERE kind='video' AND comment_id=?", parentId));
        update("DELETE FROM comment_reports WHERE kind='video' AND comment_id=?", parentId);
    }

    @Test
    @DisplayName("Spam protection: honeypot comments are dropped, the 6th comment within a minute is refused")
    void spamProtection() throws SQLException {
        String name = "sp" + uniq();
        int userId = insertUser(name, "USER");
        login(name, PASSWORD);
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();

        browserPost("/comment", Map.of("lyric_id", String.valueOf(LYRIC_ID), "content", "bot", "website", "http://spam"), true);
        assertFalse(exists("SELECT 1 FROM comments WHERE user_id=?", userId), "honeypot comment must be dropped");

        for (int i = 0; i < 6; i++) {
            browserPost("/comment", Map.of("lyric_id", String.valueOf(LYRIC_ID), "content", "burst " + i), true);
        }
        assertEquals(5, queryInt("SELECT COUNT(*) FROM comments WHERE user_id=?", userId));
    }

    @Test
    @DisplayName("Registration with the honeypot filled in creates no account")
    void registerHoneypot() throws SQLException {
        String name = "hp" + uniq();
        driver.get(BASE_URL + "/register.jsp");
        waitReady();
        browserPost("/register", Map.of("username", name, "email", name + "@example.com", "password", PASSWORD,
                "password2", PASSWORD, "consent", "1", "website", "x"), true);
        assertFalse(exists("SELECT 1 FROM users WHERE username=?", name));
    }

    @Test
    @DisplayName("The e-mail link confirms the account; a wrong link shows a warning")
    void emailVerificationLink() throws SQLException {
        int id = insertUser("ev" + uniq(), "USER");
        String token = "tok" + uniq() + uniq();
        update("UPDATE users SET email_verified_at=NULL, verify_token_hash=?, verify_expires_at=DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id=?",
                ResetPasswordServlet.hashToken(token), id);

        driver.get(BASE_URL + "/verify?token=" + token);
        waitReady();
        assertNotNull(queryString("SELECT email_verified_at FROM users WHERE id=?", id));
        assertNull(queryString("SELECT verify_token_hash FROM users WHERE id=?", id));
        assertTrue(driver.getCurrentUrl().contains("verified=1"));

        driver.get(BASE_URL + "/verify?token=" + token); // already used
        waitReady();
        assertTrue(driver.getCurrentUrl().contains("verified=invalid"));
        assertFalse(driver.findElements(By.cssSelector(".flash-warn")).isEmpty());
    }

    @Test
    @DisplayName("Password fields get a show/hide button")
    void passwordToggle() {
        driver.get(BASE_URL + "/login.jsp");
        waitReady();
        WebElement pw = driver.findElement(By.name("password"));
        jsClick(driver.findElement(By.cssSelector(".pw-toggle")));
        assertEquals("text", pw.getAttribute("type"));
        jsClick(driver.findElement(By.cssSelector(".pw-toggle")));
        assertEquals("password", pw.getAttribute("type"));
    }

    @Test
    @DisplayName("Login works with the e-mail address and the header shows the uploaded avatar")
    void loginByEmailShowsAvatar() throws SQLException {
        String name = "cv" + uniq();
        int id = insertUser(name, "USER");
        update("UPDATE users SET avatar_url='/img/avatar-default.svg' WHERE id=?", id);

        login(name + "@example.com", PASSWORD);
        assertFalse(driver.findElements(By.cssSelector("form[action$='/logout']")).isEmpty(), "should be logged in");
        WebElement avatar = driver.findElement(By.cssSelector("img.user-avatar"));
        assertTrue(avatar.getAttribute("src").endsWith("/img/avatar-default.svg"));
    }
}
