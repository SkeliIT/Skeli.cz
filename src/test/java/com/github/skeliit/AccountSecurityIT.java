package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import static org.junit.jupiter.api.Assertions.*;

/** Breached passwords, deleting an account for real, signing out the other devices. */
class AccountSecurityIT extends UiTestSupport {

    @Test
    @DisplayName("A password known from data breaches is refused at sign-up")
    void breachedPasswordIsRefused() throws Exception {
        String name = "pw" + uniq();
        driver.get(BASE_URL + "/register");
        driver.findElement(By.name("username")).sendKeys(name);
        driver.findElement(By.name("email")).sendKeys(name + "@example.com");
        driver.findElement(By.name("password")).sendKeys("Password123!");
        driver.findElement(By.name("password2")).sendKeys("Password123!");
        jsClick(driver.findElement(By.name("consent")));
        submit(By.cssSelector(".auth-card button[type=submit]"));
        assertTrue(bodyText().contains("uniklých databázích"), "the breach message");
        assertFalse(exists("SELECT 1 FROM users WHERE username=?", name), "no account was made");
    }

    @Test
    @DisplayName("Deleting the account removes the personal data, keeps votes and the comments as 'Deleted account', no sign-in")
    void deletedAccountIsGone() throws Exception {
        String name = "dl" + uniq();
        int id = registerAndLogin(name);
        int lyricId = queryInt("SELECT MIN(id) FROM lyrics");
        update("INSERT INTO comments (lyric_id, user_id, content) VALUES (?, ?, ?)", lyricId, id, "komentar pred smazanim uctu");
        update("INSERT INTO lyrics_votes (lyric_id, user_id, vote) VALUES (?, ?, 1)", lyricId, id);
        update("INSERT INTO user_profiles (user_id, city, age) VALUES (?, 'Plzen', 30) ON DUPLICATE KEY UPDATE city='Plzen', age=30", id);

        driver.get(BASE_URL + "/uzivatel.jsp");
        driver.findElement(By.name("confirm")).sendKeys("DELETE");
        String old = driver.getCurrentUrl();
        jsClick(driver.findElement(By.xpath("//form[@action='/profile/delete']//button[@type='submit']")));
        waitUrlChange(old);

        assertEquals("DELETED", queryString("SELECT role FROM users WHERE id=?", id));
        assertEquals("", queryString("SELECT password_hash FROM users WHERE id=?", id), "no password left");
        assertNull(queryString("SELECT email FROM users WHERE id=?", id));
        assertFalse(exists("SELECT 1 FROM user_profiles WHERE user_id=?", id), "profile (city, age…) deleted");
        assertTrue(exists("SELECT 1 FROM comments WHERE user_id=?", id), "the comment stays");
        assertTrue(exists("SELECT 1 FROM lyrics_votes WHERE user_id=?", id), "the vote stays counted (the user's wish)");

        driver.get(BASE_URL + "/lyrics/" + lyricId);
        assertTrue(bodyText().contains("Smazaný účet"), "shown as a deleted account");
        assertFalse(bodyText().contains(name), "the old name is nowhere");

        login(name, PASSWORD);
        assertFalse(driver.findElements(By.cssSelector(".auth-card .form-alert")).isEmpty(), "can't sign in any more");
        update("DELETE FROM comments WHERE user_id=?", id);
        update("DELETE FROM lyrics_votes WHERE user_id=?", id);
        update("DELETE FROM users WHERE id=?", id);
    }

    @Test
    @DisplayName("'Sign out other devices' ends the other sessions, this one stays")
    void signOutOtherDevices() throws Exception {
        String name = "so" + uniq();
        registerAndLogin(name);
        ChromeOptions o = new ChromeOptions();
        o.addArguments("--headless=new", "--window-size=1200,800");
        WebDriver other = new ChromeDriver(o);
        try {
            other.get(BASE_URL + "/login.jsp");
            other.findElement(By.name("username")).sendKeys(name);
            other.findElement(By.name("password")).sendKeys(PASSWORD);
            ((org.openqa.selenium.JavascriptExecutor) other).executeScript("arguments[0].click()",
                    other.findElement(By.cssSelector(".auth-card button[type=submit]")));
            Thread.sleep(800);
            other.get(BASE_URL + "/");
            assertFalse(other.findElements(By.cssSelector("form.logout-form")).isEmpty(), "the other device is signed in");

            driver.get(BASE_URL + "/uzivatel.jsp");
            submit(By.cssSelector("form[action='/profile/signout-others'] button"));
            assertTrue(driver.getCurrentUrl().contains("signedOut="), driver.getCurrentUrl());

            other.get(BASE_URL + "/");
            assertTrue(other.findElements(By.cssSelector("form.logout-form")).isEmpty(), "the other device is signed out");
            driver.get(BASE_URL + "/");
            assertFalse(driver.findElements(By.cssSelector("form.logout-form")).isEmpty(), "this device stays signed in");
        } finally {
            other.quit();
        }
    }
}
