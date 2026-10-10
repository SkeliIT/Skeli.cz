package com.github.skeliit;

import com.github.skeliit.security.Tokens;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.sql.SQLException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comments like on YouTube (js/comments.js + /api/comments), the same under lyrics and clips:
 * the author and admins may edit or delete, nobody else may; replies hide under "N replies";
 * thumbs up/down; the artist pins and hearts; reports reach the admin. Also login by e-mail
 * and the uploaded avatar in the header.
 */
public class CommentsIT extends UiTestSupport {
    private static final int LYRIC_ID = 1;
    private static final String YT = "pZx0xa6MpbE";
    private final List<Integer> videoCommentIds = new ArrayList<>();

    @AfterEach
    void deleteVideoComments() throws SQLException {
        // video_comments has no foreign key to users, so it is not cleaned up by the user delete
        for (int id : videoCommentIds) {
            update("DELETE FROM video_comment_votes WHERE comment_id=?", id);
            update("DELETE FROM video_comments WHERE id=? OR parent_id=?", id, id);
        }
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

    /** Opens the song page and waits until the script has drawn the comment. */
    private WebElement openLyricComment(int commentId) {
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        return comment(commentId);
    }

    private WebElement comment(int commentId) {
        return new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> d.findElement(By.id("comment-" + commentId)));
    }

    /** Clicks an item of the comment's "⋮" menu (edit, delete, pin, report). */
    private void menu(WebElement item, String itemCss) {
        // in one script: the list may be redrawn between two separate clicks
        ((JavascriptExecutor) driver).executeScript(
                "const it = document.getElementById(arguments[0]);"
                + "it.querySelector(':scope > .cmt-body .cmt-menu summary').click();"
                + "it.querySelector(':scope > .cmt-body .cmt-menu-list ' + arguments[1]).click();", item.getAttribute("id"), itemCss);
    }

    private void waitFor(java.util.function.BooleanSupplier check) {
        // the list may be redrawn while we look at it
        new WebDriverWait(driver, Duration.ofSeconds(10)).ignoring(StaleElementReferenceException.class).until(d -> check.getAsBoolean());
    }

    private boolean dbHas(String sql, Object... args) {
        try { return exists(sql, args); } catch (SQLException e) { throw new RuntimeException(e); }
    }

    private void editInPlace(WebElement item, String newText) {
        menu(item, ".cmt-edit");
        WebElement ta = item.findElement(By.cssSelector(".cmt-composer.is-edit textarea"));
        ta.clear();
        ta.sendKeys(newText);
        jsClick(item.findElement(By.cssSelector(".cmt-composer.is-edit .cmt-send")));
    }

    @Test
    @DisplayName("The author edits their own lyric comment; it is marked as edited")
    void authorEditsOwnComment() throws SQLException {
        String name = "ce" + uniq();
        int userId = insertUser(name, "USER");
        login(name, PASSWORD);
        int commentId = insertLyricComment(userId, "before " + uniq());

        String edited = "after " + uniq();
        editInPlace(openLyricComment(commentId), edited);
        waitFor(() -> dbHas("SELECT 1 FROM comments WHERE id=? AND content=?", commentId, edited));

        assertNotNull(queryString("SELECT updated_at FROM comments WHERE id=?", commentId));
        WebElement item = openLyricComment(commentId);
        assertFalse(item.findElements(By.cssSelector(".cmt-edited")).isEmpty(), "edited marker should be shown");
        assertTrue(item.getText().contains(edited));
    }

    @Test
    @DisplayName("Another user gets no edit/delete in the menu and cannot change the comment through the server")
    void otherUserCannotTouchComment() throws SQLException {
        int authorId = insertUser("ca" + uniq(), "USER");
        int commentId = insertLyricComment(authorId, "mine " + uniq());
        String other = "co" + uniq();
        insertUser(other, "USER");
        login(other, PASSWORD);

        WebElement item = openLyricComment(commentId);
        assertTrue(item.findElements(By.cssSelector(".cmt-edit, .cmt-delete")).isEmpty(), "no edit/delete for others");
        assertFalse(item.findElements(By.cssSelector(".cmt-report")).isEmpty(), "others may report");

        assertEquals(403, browserPost("/api/comments", Map.of("kind", "lyric", "action", "delete", "id", String.valueOf(commentId)), true));
        assertEquals(403, browserPost("/api/comments", Map.of("kind", "lyric", "action", "edit", "id", String.valueOf(commentId), "content", "hacked"), true));
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

        editInPlace(openLyricComment(commentId), "moderated");
        waitFor(() -> dbHas("SELECT 1 FROM comments WHERE id=? AND content='moderated'", commentId));

        WebElement item = openLyricComment(commentId);
        jsClick(item.findElement(By.cssSelector(".cmt-menu summary")));
        item.findElement(By.cssSelector(".cmt-menu-list .cmt-delete")).click(); // native click raises confirm()
        acceptConfirm();
        waitFor(() -> !dbHas("SELECT 1 FROM comments WHERE id=?", commentId));
    }

    @Test
    @DisplayName("Czech diacritics, line breaks and emoji (also from the emoji picker) survive the comment box")
    void commentKeepsCzechAndEmoji() throws SQLException {
        String name = "cd" + uniq();
        int userId = insertUser(name, "USER");
        login(name, PASSWORD);
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();

        WebElement box = new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> d.findElement(By.cssSelector(".cmts-composer-slot textarea")));
        jsClick(box);
        box.click();
        box.sendKeys("Refrén žluťoučký kůň úpěl ďábelské ódy\nДякую ");
        jsClick(driver.findElement(By.cssSelector(".cmts-composer-slot .cmt-emoji-btn")));
        jsClick(driver.findElement(By.cssSelector(".cmts-composer-slot .cmt-emoji button[data-emoji='🔥']")));
        jsClick(driver.findElement(By.cssSelector(".cmts-composer-slot .cmt-send")));

        String text = "Refrén žluťoučký kůň úpěl ďábelské ódy\nДякую 🔥";
        waitFor(() -> dbHas("SELECT 1 FROM comments WHERE user_id=?", userId));
        assertEquals(text, queryString("SELECT content FROM comments WHERE user_id=?", userId));
        waitFor(() -> bodyText().contains("Refrén žluťoučký kůň"));
    }

    @Test
    @DisplayName("A comment over the length limit is not saved")
    void tooLongCommentIsRejected() throws SQLException {
        String name = "cl" + uniq();
        int userId = insertUser(name, "USER");
        login(name, PASSWORD);
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();

        assertEquals(400, browserPost("/api/comments", Map.of("kind", "lyric", "action", "add", "target", String.valueOf(LYRIC_ID),
                "content", "x".repeat(WebUtils.COMMENT_MAX_LENGTH + 1)), true));
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
        assertEquals(403, browserPost("/api/comments", Map.of("kind", "video", "action", "delete", "id", String.valueOf(commentId)), true));
        assertTrue(exists("SELECT 1 FROM video_comments WHERE id=?", commentId));
        logout();

        // admin: allowed
        String admin = "vm" + uniq();
        insertUser(admin, "ADMIN");
        login(admin, PASSWORD);
        driver.get(BASE_URL + "/api/comments?kind=video&target=" + YT);
        assertTrue(driver.getPageSource().contains("\"canEdit\":true"), "admin should be offered edit/delete");
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();
        assertEquals(200, browserPost("/api/comments",
                Map.of("kind", "video", "action", "edit", "id", String.valueOf(commentId), "content", "moderated"), true));
        assertEquals("moderated", queryString("SELECT content FROM video_comments WHERE id=?", commentId));
        assertEquals(200, browserPost("/api/comments", Map.of("kind", "video", "action", "delete", "id", String.valueOf(commentId)), true));
        assertFalse(exists("SELECT 1 FROM video_comments WHERE id=?", commentId));
    }

    @Test
    @DisplayName("A reply goes under the comment, hidden behind \"1 reply\" until opened")
    void replyToLyricComment() throws SQLException {
        int authorId = insertUser("ra" + uniq(), "USER");
        int parentId = insertLyricComment(authorId, "question " + uniq());
        String name = "rr" + uniq();
        int replierId = insertUser(name, "USER");
        login(name, PASSWORD);

        WebElement item = openLyricComment(parentId);
        jsClick(item.findElement(By.cssSelector(".cmt-reply-btn")));
        String answer = "answer " + uniq();
        item.findElement(By.cssSelector(".cmt-composer.is-reply textarea")).sendKeys(answer);
        jsClick(item.findElement(By.cssSelector(".cmt-composer.is-reply .cmt-send")));
        waitFor(() -> dbHas("SELECT 1 FROM comments WHERE user_id=? AND content=?", replierId, answer));

        int replyId = queryInt("SELECT id FROM comments WHERE user_id=? AND content=?", replierId, answer);
        assertEquals(String.valueOf(parentId), queryString("SELECT parent_id FROM comments WHERE id=?", replyId));

        // a fresh visit: the reply waits behind "1 reply"
        openLyricComment(parentId);
        WebElement thread = driver.findElement(By.cssSelector(".cmt-thread[data-thread='" + parentId + "']"));
        WebElement toggle = thread.findElement(By.cssSelector(".cmt-replies-toggle"));
        assertTrue(toggle.getText().contains("1"), "the toggle counts the replies: " + toggle.getText());
        assertFalse(thread.findElement(By.cssSelector(".cmt-replies")).isDisplayed());
        jsClick(toggle);
        assertTrue(thread.findElement(By.id("comment-" + replyId)).isDisplayed());

        // answering the reply attaches to the same top-level comment (one level deep)
        assertEquals(200, browserPost("/api/comments", Map.of("kind", "lyric", "action", "add", "target", String.valueOf(LYRIC_ID),
                "parent", String.valueOf(replyId), "content", "nested " + uniq()), true));
        assertEquals(String.valueOf(parentId),
                queryString("SELECT parent_id FROM comments WHERE user_id=? AND content LIKE 'nested %'", replierId));
    }

    @Test
    @DisplayName("Thumbs up counts, the same thumb again takes it back, thumbs down replaces it")
    void votesOnLyricComments() throws SQLException {
        int authorId = insertUser("ta" + uniq(), "USER");
        int commentId = insertLyricComment(authorId, "vote me " + uniq());
        String name = "tv" + uniq();
        int voterId = insertUser(name, "USER");
        login(name, PASSWORD);

        WebElement item = openLyricComment(commentId);
        jsClick(item.findElement(By.cssSelector(".cmt-vote.up")));
        waitFor(() -> dbHas("SELECT 1 FROM lyric_comment_votes WHERE comment_id=? AND user_id=? AND vote=1", commentId, voterId));
        waitFor(() -> "1".equals(item.findElement(By.cssSelector(".cmt-vote.up .n")).getText()));
        assertTrue(item.findElement(By.cssSelector(".cmt-vote.up")).getAttribute("class").contains("on"));

        jsClick(item.findElement(By.cssSelector(".cmt-vote.up")));
        waitFor(() -> !dbHas("SELECT 1 FROM lyric_comment_votes WHERE comment_id=? AND user_id=?", commentId, voterId));

        jsClick(item.findElement(By.cssSelector(".cmt-vote.down")));
        waitFor(() -> dbHas("SELECT 1 FROM lyric_comment_votes WHERE comment_id=? AND user_id=? AND vote=-1", commentId, voterId));
    }

    @Test
    @DisplayName("The artist pins a comment and gives it a heart; others may not")
    void artistPinsAndHearts() throws SQLException {
        int authorId = insertUser("pf" + uniq(), "USER");
        int commentId = insertLyricComment(authorId, "fan " + uniq());
        int otherId = insertLyricComment(authorId, "other " + uniq());

        // an ordinary user: refused
        String fan = "pu" + uniq();
        insertUser(fan, "USER");
        login(fan, PASSWORD);
        openLyricComment(commentId);
        assertEquals(403, browserPost("/api/comments", Map.of("kind", "lyric", "action", "pin", "id", String.valueOf(commentId), "on", "1"), true));
        assertEquals(403, browserPost("/api/comments", Map.of("kind", "lyric", "action", "heart", "id", String.valueOf(commentId), "on", "1"), true));
        logout();

        String artist = "pa" + uniq();
        int artistId = insertUser(artist, "USER");
        update("UPDATE users SET is_artist=1 WHERE id=?", artistId);
        login(artist, PASSWORD);

        WebElement item = openLyricComment(commentId);
        jsClick(item.findElement(By.cssSelector(".cmt-heart")));
        waitFor(() -> dbHas("SELECT 1 FROM comments WHERE id=? AND hearted_at IS NOT NULL", commentId));
        waitFor(() -> !comment(commentId).findElements(By.cssSelector(".cmt-heart.on")).isEmpty());
        menu(comment(commentId), "button[data-act='pin']");
        waitFor(() -> dbHas("SELECT 1 FROM comments WHERE id=? AND pinned_at IS NOT NULL", commentId));
        // the pinned comment is drawn first, with its label
        waitFor(() -> !comment(commentId).findElements(By.cssSelector(".cmt-pinned")).isEmpty());
        String first = (String) ((JavascriptExecutor) driver).executeScript("return document.querySelector('.cmts-list .cmt').id");
        assertEquals("comment-" + commentId, first);
        assertNull(queryString("SELECT updated_at FROM comments WHERE id=?", commentId), "pinning is not an edit");

        // only one pinned comment per song
        menu(comment(otherId), "button[data-act='pin']");
        waitFor(() -> dbHas("SELECT 1 FROM comments WHERE id=? AND pinned_at IS NOT NULL", otherId));
        assertFalse(exists("SELECT 1 FROM comments WHERE id=? AND pinned_at IS NOT NULL", commentId));

        // his own comments carry the artist badge
        int ownId = insertLyricComment(artistId, "from Skeli " + uniq());
        assertFalse(openLyricComment(ownId).findElements(By.cssSelector(".cmt-name.is-artist")).isEmpty());
    }

    @Test
    @DisplayName("Top puts the liked comment first, Newest the latest one")
    void sortTopAndNewest() throws Exception {
        int a = insertUser("sa" + uniq(), "USER");
        int liked = insertLyricComment(a, "liked " + uniq());
        update("UPDATE comments SET created_at = NOW() - INTERVAL 1 DAY WHERE id=?", liked);
        int b = insertUser("sb" + uniq(), "USER");
        update("INSERT INTO lyric_comment_votes (comment_id, user_id, vote) VALUES (?, ?, 1), (?, ?, 1)", liked, a, liked, b);
        int fresh = insertLyricComment(b, "fresh " + uniq());

        driver.get(BASE_URL + "/api/comments?kind=lyric&target=" + LYRIC_ID + "&sort=top");
        String top = driver.findElement(By.tagName("body")).getText();
        assertTrue(top.indexOf("\"id\":" + liked) < top.indexOf("\"id\":" + fresh), "top: the liked one first");
        driver.get(BASE_URL + "/api/comments?kind=lyric&target=" + LYRIC_ID + "&sort=new");
        String newest = driver.findElement(By.tagName("body")).getText();
        assertTrue(newest.indexOf("\"id\":" + fresh) < newest.indexOf("\"id\":" + liked), "newest: the fresh one first");
    }

    @Test
    @DisplayName("A user reports someone else's comment; the admin sees the thread and dismisses or deletes it")
    void reportAndModerate() throws SQLException {
        int authorId = insertUser("pa" + uniq(), "USER");
        int commentId = insertLyricComment(authorId, "spam " + uniq());
        String reporter = "pr" + uniq();
        int reporterId = insertUser(reporter, "USER");
        login(reporter, PASSWORD);

        WebElement item = openLyricComment(commentId);
        jsClick(item.findElement(By.cssSelector(".cmt-menu summary")));
        item.findElement(By.cssSelector(".cmt-menu-list .cmt-report")).click();
        acceptConfirm();
        waitFor(() -> dbHas("SELECT 1 FROM comment_reports WHERE kind='lyric' AND comment_id=? AND reporter_id=?", commentId, reporterId));
        waitFor(() -> driver.findElement(By.cssSelector(".cmts-note")).isDisplayed());

        // own comment cannot be reported
        int ownId = insertLyricComment(reporterId, "own " + uniq());
        browserPost("/comment/report", Map.of("kind", "lyric", "comment_id", String.valueOf(ownId)), true);
        assertFalse(exists("SELECT 1 FROM comment_reports WHERE comment_id=? AND kind='lyric'", ownId));
        // a reply, so the admin list shows it under the reported comment
        int replyId = insertLyricComment(reporterId, "reply to spam " + uniq());
        update("UPDATE comments SET parent_id=? WHERE id=?", commentId, replyId);
        logout();

        String admin = "pm" + uniq();
        insertUser(admin, "ADMIN");
        login(admin, PASSWORD);
        driver.get(BASE_URL + "/admin/comments");
        waitReady();
        WebElement reports = driver.findElement(By.id("reports"));
        assertTrue(reports.getText().contains("spam "), "reported comment should be listed");
        WebElement thread = driver.findElement(By.id("admin-comment-lyric-" + commentId)).findElement(By.xpath(".."));
        assertFalse(thread.findElements(By.cssSelector("#admin-comment-lyric-" + replyId + ".is-reply")).isEmpty(),
                "the reply is shown in the thread of the comment it answers");

        // dismiss keeps the comment, removes the report
        WebElement dismiss = reports.findElement(By.xpath(
                ".//form[.//input[@name='comment_id'][@value='" + commentId + "']][.//input[@name='action'][@value='dismiss']]//button"));
        clickAndWaitReload(dismiss, false);
        assertTrue(exists("SELECT 1 FROM comments WHERE id=?", commentId));
        assertFalse(exists("SELECT 1 FROM comment_reports WHERE kind='lyric' AND comment_id=?", commentId));

        // report again, then delete from the admin list: the reply goes with it
        update("INSERT INTO comment_reports (kind, comment_id, reporter_id) VALUES ('lyric', ?, ?)", commentId, reporterId);
        driver.get(BASE_URL + "/admin/comments");
        waitReady();
        WebElement delete = driver.findElement(By.id("reports")).findElement(By.xpath(
                ".//form[.//input[@name='comment_id'][@value='" + commentId + "']][not(.//input[@name='action'])]//button"));
        clickAndWaitReload(delete, true);
        assertFalse(exists("SELECT 1 FROM comments WHERE id=?", commentId));
        assertFalse(exists("SELECT 1 FROM comments WHERE id=?", replyId));
        assertFalse(exists("SELECT 1 FROM comment_reports WHERE kind='lyric' AND comment_id=?", commentId));
    }

    @Test
    @DisplayName("Video comments: replies nest, others can report, the Music page shows them under the clip")
    void videoReplyAndReport() throws SQLException {
        int authorId = insertUser("wa" + uniq(), "USER");
        int parentId = insertVideoComment(authorId, "top " + uniq());
        String name = "wr" + uniq();
        int userId = insertUser(name, "USER");
        login(name, PASSWORD);
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();

        assertEquals(200, browserPost("/api/comments", Map.of("kind", "video", "action", "add", "target", YT,
                "parent", String.valueOf(parentId), "content", "reply " + uniq()), true));
        int replyId = queryInt("SELECT id FROM video_comments WHERE user_id=? AND content LIKE 'reply %'", userId);
        videoCommentIds.add(replyId);
        assertEquals(String.valueOf(parentId), queryString("SELECT parent_id FROM video_comments WHERE id=?", replyId));

        assertEquals(200, browserPost("/comment/report", Map.of("kind", "video", "comment_id", String.valueOf(parentId)), true));
        assertTrue(exists("SELECT 1 FROM comment_reports WHERE kind='video' AND comment_id=?", parentId));
        update("DELETE FROM comment_reports WHERE kind='video' AND comment_id=?", parentId);

        // the admin's link opens Music on that clip and shows the comment
        driver.get(BASE_URL + "/music.jsp?clip=" + YT + "#comment-" + parentId);
        assertTrue(comment(parentId).isDisplayed());
    }

    @Test
    @DisplayName("Spam protection: honeypot comments are dropped, the 6th comment within a minute is refused")
    void spamProtection() throws SQLException {
        String name = "sp" + uniq();
        int userId = insertUser(name, "USER");
        login(name, PASSWORD);
        driver.get(BASE_URL + "/lyrics/" + LYRIC_ID);
        waitReady();

        browserPost("/api/comments", Map.of("kind", "lyric", "action", "add", "target", String.valueOf(LYRIC_ID),
                "content", "bot", "website", "http://spam"), true);
        assertFalse(exists("SELECT 1 FROM comments WHERE user_id=?", userId), "honeypot comment must be dropped");

        for (int i = 0; i < 6; i++) {
            browserPost("/api/comments", Map.of("kind", "lyric", "action", "add", "target", String.valueOf(LYRIC_ID),
                    "content", "burst " + i), true);
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
                Tokens.hash(token), id);

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
