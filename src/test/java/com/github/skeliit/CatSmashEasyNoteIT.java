package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** CatSmash: na Lehké se odznaky neodemykají a hráč to musí vidět. Odznak za obtížnost platí pro zápas jakékoli délky. */
class CatSmashEasyNoteIT extends UiTestSupport {

    private WebElement level(int d) {
        return driver.findElement(By.cssSelector(".kpong-level[data-d='" + d + "']"));
    }

    @Test
    @DisplayName("Telefon: u Lehké je vidět upozornění, u Normální ne, a menu se vejde")
    void noteShowsOnEasyOnly() throws Exception {
        driver.quit();
        ChromeOptions o = new ChromeOptions();
        o.addArguments("--headless=new");
        o.setExperimentalOption("mobileEmulation", Map.of("deviceMetrics", Map.of("width", 390, "height", 664, "pixelRatio", 2)));
        driver = new ChromeDriver(o);
        driver.get(BASE_URL + "/index.jsp");
        // Kevin s hrou startuje až po odpovědi na cookie lištu; výuku prvního zápasu přeskočit
        ((JavascriptExecutor) driver).executeScript("localStorage.setItem('cookieConsent','true'); localStorage.setItem('kevinLite','1'); localStorage.setItem('kevinPongTut','1');");
        driver.get(BASE_URL + "/index.jsp?kevin=pong");
        new WebDriverWait(driver, Duration.ofSeconds(60)).until(d -> d.findElement(By.cssSelector(".kpong-play")).isDisplayed());

        jsClick(level(2));
        assertFalse(driver.findElement(By.cssSelector(".kp-easy-note")).isDisplayed(), "na Normální nic");
        jsClick(level(1));
        WebElement note = driver.findElement(By.cssSelector(".kp-easy-note"));
        assertTrue(note.isDisplayed(), "na Lehké je upozornění");
        assertFalse(note.getText().isBlank());
        Files.createDirectories(Path.of("target"));
        Files.write(Path.of("target/easy-note.png"), ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES));
        Object playBottom = ((JavascriptExecutor) driver).executeScript(
                "var p = document.querySelector('.kpong-panel'); var b = document.querySelector('.kpong-play'); b.scrollIntoView({block:'nearest'}); "
                + "return b.getBoundingClientRect().bottom <= innerHeight;");
        assertEquals(Boolean.TRUE, playBottom, "tlačítko Hrát jde vidět");
    }

    @Test
    @DisplayName("Výhra na Normální v zápase do 20 gólů dá odznak za obtížnost")
    void normalBadgeForAnyLength() throws Exception {
        int id = registerAndLogin("ce" + uniq());
        update("INSERT INTO pong_results (user_id, difficulty, duration_ms, kevin_goals, match_len) VALUES (?, 2, 180000, 5, 20)", id);
        driver.get(BASE_URL + "/uzivatel.jsp#odznaky");
        waitReady();
        String json = (String) ((JavascriptExecutor) driver).executeAsyncScript(
                "var done = arguments[arguments.length - 1]; fetch('/api/pong/me').then(function (r) { return r.text(); }).then(done);");
        assertTrue(json.contains("\"normal\""), json);
        assertTrue(json.contains("\"first\""), json);
        assertFalse(json.contains("\"angry\""), json);
    }
}
