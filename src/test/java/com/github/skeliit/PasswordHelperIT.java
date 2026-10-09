package com.github.skeliit;

import com.github.skeliit.security.Tokens;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The live password helper (js/password-helper.js) on registration and the reset page,
 * and the whole reset flow: link -> new password twice -> login with it -> link is used up.
 */
class PasswordHelperIT extends UiTestSupport {

    private WebElement rule(String code) {
        return driver.findElement(By.cssSelector(".pw-rules li[data-rule=" + code + "]"));
    }

    private boolean has(WebElement el, String cls) {
        return (" " + el.getAttribute("class") + " ").contains(" " + cls + " ");
    }

    @Test
    void registrationTicksTheRulesAndBlocksAWeakOrMismatchedPassword() throws SQLException {
        String username = "pwh" + uniq();
        driver.get(BASE_URL + "/register");
        driver.findElement(By.name("username")).sendKeys(username);
        driver.findElement(By.name("email")).sendKeys(username + "@example.com");
        WebElement pw = driver.findElement(By.name("password"));

        pw.sendKeys("abc");
        assertTrue(has(rule("lower"), "ok"), "lower-case letter is there");
        assertFalse(has(rule("length"), "ok"));
        assertFalse(has(rule("digit"), "ok"));
        assertEquals("1", driver.findElement(By.cssSelector("[data-pw-meter]")).getAttribute("data-level"));

        pw.clear();
        pw.sendKeys(PASSWORD);
        for (String code : new String[]{"length", "lower", "upper", "digit", "special"}) {
            assertTrue(has(rule(code), "ok"), code + " should be ticked for " + PASSWORD);
        }
        assertNotEquals("1", driver.findElement(By.cssSelector("[data-pw-meter]")).getAttribute("data-level"));

        driver.findElement(By.name("password2")).sendKeys(PASSWORD + "x");
        WebElement match = driver.findElement(By.cssSelector("[data-pw-match]"));
        assertTrue(match.isDisplayed() && has(match, "bad"), "mismatch should be shown");

        jsClick(driver.findElement(By.name("consent")));
        jsClick(driver.findElement(By.cssSelector("form button[type=submit]")));
        waitReady();
        assertTrue(driver.getCurrentUrl().contains("/register"), "the helper keeps the form on the page");
        assertFalse(exists("SELECT 1 FROM users WHERE username=?", username), "no account for a mismatched password");

        driver.findElement(By.name("password2")).clear();
        driver.findElement(By.name("password2")).sendKeys(PASSWORD);
        assertTrue(has(match, "ok"), "passwords match now");
    }

    @Test
    void spacesAreNamedAsCharactersThatCannotBeUsed() {
        driver.get(BASE_URL + "/register");
        driver.findElement(By.name("password")).sendKeys("Silne Heslo42!");
        WebElement invalid = rule("invalid");
        assertTrue(invalid.isDisplayed() && has(invalid, "bad"), "space should be reported");
        assertTrue(invalid.getText().contains(":"), "the offending character is listed: " + invalid.getText());
    }

    @Test
    void resetLinkSetsANewPasswordOnceAndSaysSo() throws Exception {
        String username = "pwr" + uniq();
        int userId = registerAndLogin(username);
        logout();

        String token = "it-" + uniq() + "-" + uniq();
        update("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))",
                userId, Tokens.hash(token));
        String link = BASE_URL + "/reset.jsp?token=" + token;
        String newPassword = "Nove#Heslo2026x";

        driver.get(link);
        driver.findElement(By.name("password")).sendKeys(newPassword);
        driver.findElement(By.name("password2")).sendKeys(newPassword);
        submit(By.cssSelector("form button[type=submit]"));
        assertTrue(driver.getCurrentUrl().contains("reset=1"), "back to login with a message: " + driver.getCurrentUrl());
        assertFalse(driver.findElements(By.cssSelector(".form-success")).isEmpty(), "success message on login");

        login(username, newPassword);
        assertFalse(driver.findElements(By.cssSelector("form.logout-form")).isEmpty(), "logged in with the new password");
        logout();

        driver.get(link);
        assertFalse(driver.findElements(By.cssSelector(".auth-card .form-alert")).isEmpty(), "used link says it expired");
        assertTrue(driver.findElements(By.name("password")).isEmpty(), "no form for a used link");
    }

    @Test
    void forgotSaysTheMailIsOnItsWayAndWhereToLook() {
        driver.get(BASE_URL + "/forgot.jsp");
        driver.findElement(By.name("username")).sendKeys("nikdo" + uniq());
        submit(By.cssSelector(".auth-card button[type=submit]"));
        assertTrue(driver.getCurrentUrl().contains("sent=true"), driver.getCurrentUrl());
        assertFalse(driver.findElements(By.cssSelector(".mail-sent .mail-spam")).isEmpty(), "the confirmation with the spam hint");
        assertTrue(driver.findElements(By.name("username")).isEmpty(), "no form any more");
    }
}
