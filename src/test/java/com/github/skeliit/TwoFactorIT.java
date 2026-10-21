package com.github.skeliit;

import com.github.skeliit.security.Totp;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Two-factor sign-in, as a person does it: switch it on with the app, sign in with a code, a backup code, off again. */
class TwoFactorIT extends UiTestSupport {

    private void code(String code, String action) {
        WebElement input = driver.findElement(By.cssSelector(".tfa-form input[name=code]"));
        input.clear();
        input.sendKeys(code);
        submit(By.cssSelector(".tfa-form button[value=" + action + "]"));
    }

    private void loginCode(String code) {
        WebElement input = driver.findElement(By.cssSelector(".tfa-login input[name=code]"));
        input.clear();
        input.sendKeys(code);
        // a wrong code shows the same address again, a right one moves on: wait for the page to be replaced
        clickAndWaitReload(driver.findElement(By.cssSelector(".tfa-login button[type=submit]")), false);
    }

    @Test
    @DisplayName("On with the app's code, ten backup codes once, sign-in asks for a code (backup or app), wrong one refused, off again")
    void wholeWay() throws Exception {
        String name = "tf" + uniq();
        int id = registerAndLogin(name);

        // on: the key from the page, the code the app would show
        driver.get(BASE_URL + "/uzivatel.jsp#zabezpeceni");
        submit(By.cssSelector(".acct-tfa form button[type=submit]"));
        String key = driver.findElement(By.cssSelector(".tfa-key")).getText().replace(" ", "");
        assertTrue(driver.findElement(By.cssSelector(".tfa-qr svg")).isDisplayed(), "the QR code for the app");
        code("000000".equals(Totp.code(key, Totp.step(System.currentTimeMillis()))) ? "111111" : "000000", "confirm");
        assertFalse(driver.findElements(By.cssSelector(".acct-tfa .form-alert")).isEmpty(), "a wrong code doesn't switch it on");
        long step = Totp.step(System.currentTimeMillis());
        code(Totp.code(key, step), "confirm");
        List<WebElement> backup = driver.findElements(By.cssSelector(".tfa-codes li code"));
        assertEquals(10, backup.size(), "ten backup codes, shown once");
        List<String> codes = backup.stream().map(WebElement::getText).toList();
        String backupCode = codes.get(0);
        assertTrue(exists("SELECT 1 FROM users WHERE id=? AND totp_enabled_at IS NOT NULL", id));
        driver.navigate().refresh();
        assertTrue(driver.findElements(By.cssSelector(".tfa-codes")).isEmpty(), "not shown a second time");

        // the password alone is not enough any more
        logout();
        login(name, PASSWORD);
        assertTrue(driver.getCurrentUrl().contains("/login/2fa"), "on to the code: " + driver.getCurrentUrl());
        assertTrue(driver.findElements(By.cssSelector("form.logout-form")).isEmpty(), "not signed in yet");
        loginCode("12345");
        assertFalse(driver.findElements(By.cssSelector(".auth-card .form-alert")).isEmpty(), "a wrong code is refused");
        loginCode(backupCode.toLowerCase());   // typed in small letters: fine
        assertFalse(driver.findElements(By.cssSelector("form.logout-form")).isEmpty(), "signed in with a backup code");
        assertTrue(exists("SELECT 1 FROM user_recovery_codes WHERE user_id=? AND used_at IS NOT NULL", id), "the backup code is used up");

        // with the app's next code (the one used to switch it on can't come again)
        logout();
        login(name, PASSWORD);
        loginCode(Totp.code(key, step + 1));
        assertFalse(driver.findElements(By.cssSelector("form.logout-form")).isEmpty(), "signed in with the app's code");

        // off again, with another backup code
        driver.get(BASE_URL + "/uzivatel.jsp#zabezpeceni");
        assertTrue(driver.findElement(By.cssSelector(".acct-tfa")).getText().contains(": 9."), "nine backup codes left");
        code("XXXXX-XXXXX", "disable");   // a wrong one first
        assertTrue(exists("SELECT 1 FROM users WHERE id=? AND totp_enabled_at IS NOT NULL", id), "still on after a wrong code");
        code(codes.get(1), "disable");
        assertFalse(exists("SELECT 1 FROM users WHERE id=? AND totp_enabled_at IS NOT NULL", id), "off");
        assertFalse(exists("SELECT 1 FROM user_recovery_codes WHERE user_id=?", id), "and the backup codes gone");
        logout();
        login(name, PASSWORD);
        assertFalse(driver.findElements(By.cssSelector("form.logout-form")).isEmpty(), "the password is enough again");
    }
}
