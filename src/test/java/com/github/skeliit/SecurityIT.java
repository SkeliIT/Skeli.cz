package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.*;

/** Security headers, POST logout, live admin role check, newsletter double opt-in, fixed dead pages. */
class SecurityIT extends UiTestSupport {

    private static HttpResponse<Void> get(String path) throws Exception {
        return HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create(BASE_URL + path)).GET().build(),
                HttpResponse.BodyHandlers.discarding());
    }

    @Test
    @DisplayName("Every page sends the security headers")
    void securityHeaders() throws Exception {
        for (String path : new String[]{"/", "/texty.jsp", "/login.jsp", "/css/base.css"}) {
            HttpResponse<Void> r = get(path);
            assertEquals("nosniff", r.headers().firstValue("X-Content-Type-Options").orElse(null), path);
            assertEquals("SAMEORIGIN", r.headers().firstValue("X-Frame-Options").orElse(null), path);
            assertEquals("strict-origin-when-cross-origin", r.headers().firstValue("Referrer-Policy").orElse(null), path);
            assertTrue(r.headers().firstValue("Content-Security-Policy").orElse("").contains("frame-ancestors 'self'"), path);
            assertTrue(r.headers().firstValue("Permissions-Policy").isPresent(), path);
        }
    }

    @Test
    @DisplayName("/music redirects to the music page, the unused contact and gallery pages are gone")
    void deadPagesFixed() throws Exception {
        HttpResponse<Void> music = get("/music");
        assertEquals(301, music.statusCode());
        assertTrue(music.headers().firstValue("Location").orElse("").endsWith("/music.jsp"));
        assertEquals(404, get("/kontakt.jsp").statusCode());
        assertEquals(404, get("/galerie.jsp").statusCode());
    }

    @Test
    @DisplayName("A plain GET /logout does not log out; the header's POST form does")
    void logoutNeedsPost() throws Exception {
        registerAndLogin("sec" + uniq());
        driver.get(BASE_URL + "/logout");
        waitReady();
        assertFalse(driver.findElements(By.cssSelector("form.logout-form")).isEmpty(), "still logged in after GET /logout");

        logout();
        assertTrue(driver.findElements(By.cssSelector("form.logout-form")).isEmpty(), "logged out after the POST form");
    }

    @Test
    @DisplayName("Taking ADMIN away works at once, without logging the person out")
    void demotedAdminLosesAccessImmediately() throws Exception {
        String name = "adm" + uniq();
        int id = insertUser(name, "ADMIN");
        login(name, PASSWORD);
        assertEquals(200, httpStatus("/admin.jsp"));

        update("UPDATE users SET role='USER' WHERE id=?", id);
        assertEquals(403, httpStatus("/admin.jsp"), "the old session must not keep admin rights");
        assertEquals(403, httpStatus("/admin/newsletter"));
    }

    @Test
    @DisplayName("Newsletter: invalid address and bots are refused, the e-mail link confirms the subscription")
    void newsletterDoubleOptIn() throws Exception {
        String email = "nl" + uniq() + "@example.com";
        String bot = "bot" + uniq() + "@example.com";
        try {
            driver.get(BASE_URL + "/newsletter.jsp");
            driver.findElement(By.name("email")).sendKeys("not-an-address@");
            ((org.openqa.selenium.JavascriptExecutor) driver).executeScript(
                    "document.querySelector('input[name=email]').type='text'"); // get past the browser's own check
            submit(By.cssSelector("form[action='/newsletter/subscribe'] button[type=submit]"));
            assertTrue(driver.getCurrentUrl().contains("error=invalid"), driver.getCurrentUrl());

            // the hidden honeypot field is filled: looks fine to the bot, nothing is stored
            driver.get(BASE_URL + "/newsletter.jsp");
            driver.findElement(By.name("email")).sendKeys(bot);
            ((org.openqa.selenium.JavascriptExecutor) driver).executeScript(
                    "document.querySelector('input[name=website]').value='http://spam.example'");
            submit(By.cssSelector("form[action='/newsletter/subscribe'] button[type=submit]"));
            assertTrue(driver.getCurrentUrl().contains("success=1"));
            assertFalse(exists("SELECT 1 FROM newsletter_emails WHERE email=?", bot), "honeypot sign-up must not be stored");

            // a real sign-up waits for the link; the link (token known to the test) confirms it
            String token = "test-" + uniq() + uniq();
            update("INSERT INTO newsletter_emails (email, unsubscribe_token, confirm_token_hash, confirm_sent_at) VALUES (?, ?, ?, NOW())",
                    email, "u" + uniq(), sha256(token));
            driver.get(BASE_URL + "/newsletter/confirm?token=wrong" + token);
            assertTrue(driver.getCurrentUrl().contains("error=confirm"), driver.getCurrentUrl());
            assertTrue(exists("SELECT 1 FROM newsletter_emails WHERE email=? AND confirmed_at IS NULL", email));

            driver.get(BASE_URL + "/newsletter/confirm?token=" + token);
            assertTrue(driver.getCurrentUrl().contains("confirmed=1"), driver.getCurrentUrl());
            assertTrue(exists("SELECT 1 FROM newsletter_emails WHERE email=? AND confirmed_at IS NOT NULL AND confirm_token_hash IS NULL", email));

            driver.get(BASE_URL + "/newsletter/confirm?token=" + token);
            assertTrue(driver.getCurrentUrl().contains("error=confirm"), "a link works only once");
        } finally {
            update("DELETE FROM newsletter_emails WHERE email IN (?, ?)", email, bot);
        }
    }

    private static String sha256(String s) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
    }
}
