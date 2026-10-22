package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;

import static org.junit.jupiter.api.Assertions.*;

/** Text písně v cizím jazyce: přepínač Originál · Překlad · Obojí (js/lyric-bilingual.js). */
class LyricModeIT extends UiTestSupport {

    @Test
    @DisplayName("Anglická stránka písně: výchozí Obojí (český řádek a pod ním překlad), Originál = jen česky, Překlad = jen anglicky, volba se pamatuje")
    void prepinac() throws Exception {
        String uuid = queryString("SELECT s.uuid FROM songs s WHERE s.name LIKE 'Fajn%' LIMIT 1");
        String cs = queryString("SELECT l.words FROM lyrics l JOIN songs s ON s.id = l.song_id WHERE s.uuid = ? AND l.lang = 'cs'", uuid);
        String en = queryString("SELECT l.words FROM lyrics l JOIN songs s ON s.id = l.song_id WHERE s.uuid = ? AND l.lang = 'en'", uuid);
        String csFirst = cs.strip().split("\\R")[0].strip(), enFirst = en.strip().split("\\R")[0].strip();

        driver.get(BASE_URL + "/en/song/" + uuid);
        ((org.openqa.selenium.JavascriptExecutor) driver).executeScript("localStorage.removeItem('lyricMode')");
        driver.navigate().refresh();
        By pre = By.cssSelector(".lyrics-text pre");
        assertFalse(driver.findElements(By.cssSelector(".lyrics-text pre .bi-tr")).isEmpty(), "výchozí Obojí: pod řádky překlad");
        assertEquals(enFirst, driver.findElement(By.cssSelector(".lyrics-text pre .bi-tr")).getText());

        jsClick(driver.findElement(By.cssSelector(".lyric-mode [data-mode=orig]")));
        assertTrue(driver.findElements(By.cssSelector(".lyrics-text pre .bi-tr")).isEmpty(), "Originál: bez překladu");
        assertTrue(driver.findElement(pre).getText().startsWith(csFirst.substring(0, 10).toUpperCase())
                || driver.findElement(pre).getText().toLowerCase().startsWith(csFirst.substring(0, 10).toLowerCase()), "Originál je česky");

        jsClick(driver.findElement(By.cssSelector(".lyric-mode [data-mode=tr]")));
        assertTrue(driver.findElement(pre).getText().toLowerCase().startsWith(enFirst.substring(0, 10).toLowerCase()), "Překlad je anglicky");

        driver.navigate().refresh();
        assertEquals("true", driver.findElement(By.cssSelector(".lyric-mode [data-mode=tr]")).getAttribute("aria-pressed"), "volba se pamatuje");

        // česká stránka přepínač nemá
        driver.get(BASE_URL + "/cs/song/" + uuid);
        assertTrue(driver.findElements(By.cssSelector(".lyric-mode")).isEmpty());
    }
}
