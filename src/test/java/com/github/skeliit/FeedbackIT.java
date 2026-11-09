package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;

import static org.junit.jupiter.api.Assertions.*;

/** "Co říkáš na web?" on the home page and /admin/feedback. Requires a running local instance, see {@link UiTestSupport}. */
public class FeedbackIT extends UiTestSupport {

    /** the references band on the home page (not the author's own text in the form) */
    private String hearted() {
        return driver.findElements(By.cssSelector(".fb-refs")).stream().map(e -> e.getText()).findFirst().orElse("");
    }

    @Test
    @DisplayName("A visitor who is not signed in is asked to sign in, not shown the form")
    void signInFirst() {
        driver.get(BASE_URL + "/about.jsp");
        assertFalse(driver.findElements(By.cssSelector("#feedback .fb-login")).isEmpty(), "the sign-in button");
        assertTrue(driver.findElements(By.cssSelector("#feedback form.fb-form")).isEmpty(), "no form");
    }

    @Test
    @DisplayName("A rating with a message is saved, can be changed, and shows on the home page only with the artist's heart")
    void rateChangeAndHeart() throws Exception {
        String name = "fb" + uniq();
        int uid = registerAndLogin(name);
        String msg = "Web je super " + uniq();
        driver.get(BASE_URL + "/about.jsp#feedback");
        jsClick(driver.findElement(By.cssSelector("#feedback input[name=vote][value=up]")));
        driver.findElement(By.cssSelector("#feedback textarea[name=message]")).sendKeys(msg);
        clickAndWaitReload(driver.findElement(By.cssSelector("#feedback .fb-form button[type=submit]")), false);
        assertTrue(driver.getCurrentUrl().contains("feedback=thanks"), driver.getCurrentUrl());
        assertEquals(1, queryInt("SELECT vote FROM site_feedback WHERE user_id=?", uid));
        assertFalse(hearted().contains(msg), "not among the shown messages before the heart");

        // changing it keeps one row per user
        jsClick(driver.findElement(By.cssSelector("#feedback input[name=vote][value=down]")));
        clickAndWaitReload(driver.findElement(By.cssSelector("#feedback .fb-form button[type=submit]")), false);
        assertEquals(1, queryInt("SELECT COUNT(*) FROM site_feedback WHERE user_id=?", uid));
        assertEquals(-1, queryInt("SELECT vote FROM site_feedback WHERE user_id=?", uid));

        // the admin gives it a heart: it shows on the home page
        logout();
        String admin = "fa" + uniq();
        int aid = registerAndLogin(admin);
        update("UPDATE users SET role='ADMIN' WHERE id=?", aid);
        logout();
        login(admin, PASSWORD);
        driver.get(BASE_URL + "/admin/feedback");
        assertTrue(bodyText().contains(msg), "the admin sees the message");
        int fid = queryInt("SELECT id FROM site_feedback WHERE user_id=?", uid);
        clickAndWaitReload(driver.findElement(By.cssSelector("#f" + fid + " input[value=heart] ~ button")), false);
        assertTrue(exists("SELECT 1 FROM site_feedback WHERE id=? AND hearted_at IS NOT NULL", fid));
        driver.get(BASE_URL + "/about.jsp");
        assertTrue(hearted().contains(msg), "shown on the home page with the heart");
        update("DELETE FROM site_feedback WHERE id=?", fid);
    }
}
