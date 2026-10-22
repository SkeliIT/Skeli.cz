package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/** „Pomoz nám dopsat text“: návštěvník napíše chybějící kus pod píseň, admin si ho přečte a smaže. */
class LyricHelpIT extends UiTestSupport {

    @Test
    @DisplayName("Marihuanaalamadama asks for its Spanish part from 2:15; a visitor's text waits in the admin, deleted when done")
    void visitorSendsTheMissingPart() throws Exception {
        int lyricId = queryInt("SELECT l.id FROM lyrics l JOIN songs s ON s.id = l.song_id "
                + "WHERE s.name LIKE '%Marihuana%' AND l.lang = 'cs' ORDER BY l.id LIMIT 1");
        int songId = queryInt("SELECT song_id FROM lyrics WHERE id=?", lyricId);
        String text = "IT parte " + uniq();
        try {
            driver.get(BASE_URL + "/lyrics/" + lyricId);
            WebElement card = driver.findElement(By.id("lyric-help"));
            assertTrue(card.getText().contains("2:15"), "from where in the clip: " + card.getText());
            card.findElement(By.name("message")).sendKeys(text);
            jsClick(card.findElement(By.cssSelector(".lyric-help-form button[type=submit]")));
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".lyric-help-msg.ok")));
            assertTrue(exists("SELECT 1 FROM lyric_help WHERE song_id=? AND message=?", songId, text), "stored for the admin");

            // admin: karta u písně ho ukazuje, „Hotovo, smazat“ ho odstraní
            int admin = registerAndLogin("lh" + uniq());
            update("UPDATE users SET role='ADMIN' WHERE id=?", admin);
            logout();
            login(queryString("SELECT username FROM users WHERE id=?", admin), PASSWORD);
            driver.get(BASE_URL + "/admin.jsp");
            assertTrue(bodyText().contains("hledáme pomoc"), "on the to-do list");
            driver.get(BASE_URL + "/admin/song?id=" + songId);
            WebElement del = driver.findElement(By.xpath("//article[contains(@class,'help-sent')][.//pre[text()='" + text + "']]//button"));
            ((org.openqa.selenium.JavascriptExecutor) driver).executeScript("window.confirm = function () { return true; }");
            clickAndWaitReload(del, false);
            assertFalse(exists("SELECT 1 FROM lyric_help WHERE message=?", text), "gone once done");
        } finally {
            update("DELETE FROM lyric_help WHERE message=?", text);
        }
    }
}
