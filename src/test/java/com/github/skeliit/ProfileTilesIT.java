package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Můj profil a /hrac/ jako dlaždice: čísla, poslední komentář, nic nepřetéká na telefonu, veřejný profil bez úprav. */
class ProfileTilesIT extends UiTestSupport {

    @Test
    @DisplayName("Můj profil: dlaždice s čísly a escapovaným posledním komentářem")
    void ownProfileShowsTiles() throws Exception {
        String name = "pt" + uniq();
        int id = registerAndLogin(name);
        String yt = queryString("SELECT youtube_id FROM videos LIMIT 1");
        update("INSERT INTO video_comments (user_id, youtube_id, content) VALUES (?, ?, ?)", id, yt, "<b>muj komentar</b>");
        try {
            driver.get(BASE_URL + "/uzivatel.jsp");
            waitReady();
            assertEquals(3, driver.findElements(By.cssSelector(".pt-stat")).size(), "CatSmash v bočním panelu Přehledu, dvě v Hrách");
            assertEquals(5, driver.findElements(By.cssSelector(".pt-chips .pt-chip")).size(), "čísla jako štítky pod hlavičkou");
            assertEquals("1", driver.findElement(By.cssSelector(".pt-chips a[href='#komentare'] b")).getText());
            assertEquals("<b>muj komentar</b>", driver.findElement(By.cssSelector(".pt-quote")).getText());
            assertTrue(driver.findElement(By.cssSelector(".pt-song.pt-empty")).getAttribute("href").endsWith("/nastaveni.jsp#profil"));
            driver.get(BASE_URL + "/uzivatel.jsp#hry");
            assertTrue(driver.findElement(By.id("pong")).isDisplayed());
            assertEquals("–", driver.findElement(By.cssSelector(".pt-lv b")).getText(), "pomlčka se nerozsype");
            assertTrue(driver.findElement(By.id("odznaky")).isDisplayed());
            assertTrue(driver.findElement(By.cssSelector(".pt-play")).getAttribute("data-play-game") != null, "tlačítko otevře hru na místě");
            driver.get(BASE_URL + "/uzivatel.jsp#komentare");
            assertTrue(driver.findElement(By.id("komentare")).isDisplayed());
        } finally {
            update("DELETE FROM video_comments WHERE user_id=?", id);
        }
    }

    @Test
    @DisplayName("Telefon: profil se vejde na šířku a dlaždice nemají rozmazané sklo")
    void phoneFitsAndSkipsTheBlur() throws Exception {
        driver.quit();
        ChromeOptions o = new ChromeOptions();
        o.addArguments("--headless=new");
        o.setExperimentalOption("mobileEmulation", Map.of("deviceMetrics", Map.of("width", 390, "height", 844, "pixelRatio", 2.0, "touch", true)));
        driver = new ChromeDriver(o);
        registerAndLogin("pm" + uniq());
        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        JavascriptExecutor js = (JavascriptExecutor) driver;
        assertEquals(Boolean.TRUE, js.executeScript("return document.documentElement.scrollWidth <= window.innerWidth"), "nic nepřetéká");
        assertEquals("none", js.executeScript("return getComputedStyle(document.querySelector('.pt'), '::before').backdropFilter"));
    }

    @Test
    @DisplayName("Veřejný profil: dlaždice bez úprav a bez e-mailu")
    void publicProfileHasNoEditing() throws Exception {
        String name = "pp" + uniq();
        int id = insertUser(name, "USER");
        update("UPDATE users SET profile_public=1 WHERE id=?", id);
        String email = queryString("SELECT email FROM users WHERE id=?", id);
        registerAndLogin("pv" + uniq());
        driver.get(BASE_URL + "/hrac/" + name);
        waitReady();
        assertTrue(driver.findElement(By.cssSelector(".pt-hero .acct-name")).getText().contains(name));
        assertEquals(4, driver.findElements(By.cssSelector(".pt-stat")).size(), "jedna v Přehledu, tři v Hrách");
        driver.get(BASE_URL + "/hrac/" + name + "#hry");
        assertTrue(driver.findElement(By.id("pong")).isDisplayed());
        assertTrue(driver.findElements(By.cssSelector(".pt-gear")).isEmpty(), "cizí profil nejde upravit");
        assertFalse(email != null && driver.getPageSource().contains(email), "e-mail se neukazuje");
    }
}
