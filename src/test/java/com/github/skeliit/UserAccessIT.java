package com.github.skeliit;

import org.junit.jupiter.api.*;
import org.openqa.selenium.By;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * What a regular (USER) account can and cannot do: login errors, account menu,
 * no access to the admin section, CSRF protection and newsletter sign-up.
 * Requires a running local instance and MariaDB, see {@link UiTestSupport}.
 */
public class UserAccessIT extends UiTestSupport {
    private static final List<String> ADMIN_PATHS = List.of(
            "/admin.jsp", "/admin_users.jsp", "/admin/songs", "/admin/song", "/admin/newsletter", "/admin/lyrics", "/admin/comments");
    /** the admin templates live in WEB-INF: only their servlets show them, never their own address */
    private static final List<String> TEMPLATES = List.of(
            "/admin_song.jsp", "/admin_songs.jsp", "/admin_newsletter.jsp", "/WEB-INF/views/admin/song.jsp");

    @Test
    @DisplayName("Wrong password shows an error and does not log the user in")
    void wrongPasswordIsRejected() throws Exception {
        String username = "ua" + uniq();
        registerAndLogin(username);
        logout();

        login(username, "Wrong#Password123");

        assertTrue(driver.getCurrentUrl().contains("/login"), "should stay on login, got: " + driver.getCurrentUrl());
        assertFalse(driver.findElements(By.cssSelector(".form-alert")).isEmpty(), "login error should be shown");
        driver.get(BASE_URL + "/index.jsp");
        assertTrue(driver.findElements(By.cssSelector("form[action$='/logout']")).isEmpty(),
                "logout link must not be shown after a failed login");
    }

    @Test
    @DisplayName("Logged-in user sees their name and settings link but no Admin link")
    void userMenuHasNoAdminLink() throws Exception {
        String username = "ua" + uniq();
        registerAndLogin(username);

        driver.get(BASE_URL + "/index.jsp");
        assertTrue(bodyText().contains(username), "username should be shown in the nav");
        assertFalse(driver.findElements(By.cssSelector("a[href$='/uzivatel.jsp']")).isEmpty(), "settings link expected");
        assertFalse(driver.findElements(By.cssSelector("form[action$='/logout']")).isEmpty(), "logout link expected");
        assertTrue(driver.findElements(By.cssSelector("a[href$='/admin.jsp']")).isEmpty(),
                "regular user must not see the Admin link");
    }

    @Test
    @DisplayName("Anonymous visitor gets 403 on every admin page")
    void anonymousIsForbiddenFromAdmin() throws Exception {
        driver.get(BASE_URL + "/index.jsp");
        for (String path : ADMIN_PATHS) {
            assertEquals(403, httpStatus(path), "anonymous GET " + path);
        }
        for (String path : TEMPLATES) {
            assertEquals(404, httpStatus(path), "template " + path);
        }
    }

    @Test
    @DisplayName("Regular user gets 403 on every admin page")
    void userIsForbiddenFromAdmin() throws Exception {
        registerAndLogin("ua" + uniq());

        for (String path : ADMIN_PATHS) {
            assertEquals(403, httpStatus(path), "USER GET " + path);
        }
        driver.get(BASE_URL + "/admin.jsp");
        assertTrue(bodyText().contains("403"), "the site's error page with 403 on /admin.jsp");
        assertTrue(driver.findElements(By.cssSelector("a[href^='/login.jsp?next=']")).isEmpty(), "signed in: no sign-in button");
    }

    @Test
    @DisplayName("Signed out on an admin page: sign in and land back there")
    void signInFromForbiddenAdminPageLeadsBack() throws Exception {
        String name = "ua" + uniq();
        registerAndLogin(name);
        update("UPDATE users SET role='ADMIN' WHERE username=?", name);
        logout();

        driver.get(BASE_URL + "/admin.jsp");
        assertTrue(bodyText().contains("403"));
        submit(By.cssSelector("a[href^='/login.jsp?next=']"));
        driver.findElement(By.name("username")).sendKeys(name);
        driver.findElement(By.name("password")).sendKeys(PASSWORD);
        submit(By.cssSelector(".auth-card button[type=submit]"));
        assertTrue(driver.getCurrentUrl().endsWith("/admin.jsp"), "back on the admin page, got: " + driver.getCurrentUrl());
    }

    @Test
    @DisplayName("Regular user cannot promote themselves or delete others via admin endpoints")
    void userCannotCallAdminActions() throws Exception {
        String username = "ua" + uniq();
        int userId = registerAndLogin(username);
        int victimId = insertUser("uv" + uniq(), "USER");

        driver.get(BASE_URL + "/newsletter.jsp"); // any page with a CSRF token in a form
        long promote = browserPost("/admin/users",
                Map.of("action", "role", "role", "ADMIN", "user_id", String.valueOf(userId)), true);
        long delete = browserPost("/admin/users",
                Map.of("action", "delete", "user_id", String.valueOf(victimId)), true);

        assertEquals(403, promote, "self-promotion must be forbidden");
        assertEquals(403, delete, "deleting users must be forbidden");
        assertEquals("USER", queryString("SELECT role FROM users WHERE id=?", userId));
        assertTrue(exists("SELECT 1 FROM users WHERE id=?", victimId), "victim must still exist");
    }

    @Test
    @DisplayName("POST without a CSRF token is rejected with 400 and has no effect")
    void postWithoutCsrfIsRejected() throws Exception {
        int userId = registerAndLogin("ua" + uniq());
        String text = "CSRF probe " + uniq();

        driver.get(BASE_URL + "/lyrics/1");
        long status = browserPost("/api/comments", Map.of("action", "add", "kind", "lyric", "target", "1", "content", text), false);

        assertEquals(400, status);
        assertFalse(exists("SELECT 1 FROM comments WHERE user_id=? AND content=?", userId, text),
                "comment must not be stored without a CSRF token");
    }

    @Test
    @DisplayName("Newsletter sign-up stores the e-mail as waiting for confirmation (double opt-in)")
    void newsletterSignUp() throws Exception {
        String email = "nl" + uniq() + "@example.com";
        try {
            driver.get(BASE_URL + "/newsletter.jsp");
            driver.findElement(By.name("email")).sendKeys(email);
            submit(By.cssSelector("form[action='/newsletter/subscribe'] button[type=submit]"));

            assertTrue(driver.getCurrentUrl().contains("success=1"), "got: " + driver.getCurrentUrl());
            assertFalse(driver.findElements(By.cssSelector(".form-success")).isEmpty(), "success message expected");
            assertTrue(exists("SELECT 1 FROM newsletter_emails WHERE email=? AND confirmed_at IS NULL AND confirm_token_hash IS NOT NULL", email),
                    "the address waits for the link in the confirmation e-mail");
        } finally {
            update("DELETE FROM newsletter_emails WHERE email=?", email);
        }
    }
}
