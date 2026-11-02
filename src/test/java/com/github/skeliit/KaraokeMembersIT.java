package com.github.skeliit;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Karaoke na stránce písně je pro přihlášené: nepřihlášený text čte, ale mikrofon, celá obrazovka s textem i klávesa K
 * ukážou výzvu k přihlášení (karta .k-lock, odkaz na přihlášení se vrátí na píseň). Přihlášený karaoke zapíná normálně.
 * Potřebuje píseň s klipem, ke kterému jsou karaoke časy (-Dsong=/cs/song/<uuid>, jinak Zoom – Drama).
 */
class KaraokeMembersIT extends UiTestSupport {
    private static final String SONG = System.getProperty("song", "/cs/song/951d4f7f-ba9e-11f1-b270-d843ae676849");

    private void openSong() {
        driver.get(BASE_URL + SONG);
        // tlačítko se ukáže, až dorazí karaoke časy klipu
        new WebDriverWait(driver, Duration.ofSeconds(30)).until(d -> Boolean.TRUE.equals(((JavascriptExecutor) d)
                .executeScript("var b = document.getElementById('karaokeToggle'); return !!b && !b.hidden;")));
    }

    @Test
    void guestSeesLoginPromptInsteadOfKaraoke() throws Exception {
        JavascriptExecutor js = (JavascriptExecutor) driver;
        driver.get(BASE_URL + "/");
        js.executeScript("localStorage.setItem('cookieConsent','true'); localStorage.setItem('kevin','hidden'); localStorage.removeItem('karaoke');");
        openSong();
        assertEquals("true", driver.findElement(By.id("karaokeToggle")).getAttribute("data-guest"));
        assertTrue(driver.findElement(By.id("karaokeToggle")).getAttribute("class").contains("locked"), "zámeček u mikrofonu");
        js.executeScript("document.getElementById('karaokeToggle').click()");
        new WebDriverWait(driver, Duration.ofSeconds(5)).until(d -> !d.findElements(By.cssSelector(".k-lock")).isEmpty());
        String href = driver.findElement(By.cssSelector(".k-lock a.btn-primary")).getAttribute("href");
        assertTrue(href.contains("/login.jsp?next=" + SONG.replace("/", "%2F")), "po přihlášení zpět na píseň: " + href);
        assertEquals("false", driver.findElement(By.id("karaokeToggle")).getAttribute("aria-pressed"), "karaoke se nezapnulo");
        String dir = System.getProperty("shots");
        if (dir != null) {
            Files.createDirectories(Path.of(dir));
            Files.write(Path.of(dir, "karaoke-zamek.png"), ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES));
        }
        // křížek zavře; tlačítko celé obrazovky s textem ukáže totéž
        js.executeScript("document.querySelector('.k-lock-x').click()");
        assertTrue(driver.findElements(By.cssSelector(".k-lock")).isEmpty());
        js.executeScript("var b = document.querySelector('.fs-lyrics-btn'); if (b) b.click();");
        Object fsLock = js.executeScript("return !!document.querySelector('.fs-lyrics-btn') && !!document.querySelector('.k-lock')");
        Object fs = js.executeScript("return !!document.fullscreenElement || !!document.querySelector('.fake-fs')");
        assertEquals(Boolean.FALSE, fs, "celá obrazovka s textem se nepustila");
        System.out.println("CELA OBRAZOVKA -> vyzva " + fsLock);
    }

    @Test
    void memberCanTurnKaraokeOn() throws Exception {
        JavascriptExecutor js = (JavascriptExecutor) driver;
        registerAndLogin("kar" + uniq());
        js.executeScript("localStorage.setItem('cookieConsent','true'); localStorage.setItem('kevin','hidden'); localStorage.setItem('karaoke','off');");
        openSong();
        assertEquals("false", driver.findElement(By.id("karaokeToggle")).getAttribute("data-guest"));
        js.executeScript("document.getElementById('karaokeToggle').click()");
        assertEquals("true", driver.findElement(By.id("karaokeToggle")).getAttribute("aria-pressed"), "přihlášený karaoke zapne");
        assertTrue(driver.findElements(By.cssSelector(".k-lock")).isEmpty(), "žádná výzva");
    }
}
