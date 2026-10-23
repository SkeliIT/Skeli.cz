package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import static org.junit.jupiter.api.Assertions.*;

/** Premiéra s odpočtem: admin ji nastaví u písně, úvod a stránka písně odpočítávají, po premiéře „Venku!“. */
class PremiereIT extends UiTestSupport {

    private void setRelease(String uuid, LocalDateTime when) throws Exception {
        driver.get(BASE_URL + "/admin/song?uuid=" + uuid + "#premiere");
        WebElement input = driver.findElement(By.cssSelector("#premiere input[name=release_at]"));
        ((JavascriptExecutor) driver).executeScript("arguments[0].value = arguments[1];", input,
                when.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm")));
        clickAndWaitReload(driver.findElement(By.cssSelector("#premiere form button[type=submit]")), false);
    }

    @Test
    @DisplayName("Premiéra za 2 dny: odpočet na úvodu i u písně; po premiéře „Venku!“; zrušená zmizí")
    void odpocet() throws Exception {
        String uuid = queryString("SELECT uuid FROM songs WHERE name LIKE 'Musíš odejít%' OR name LIKE 'Mus%odej%' LIMIT 1");
        int admin = registerAndLogin("pr" + uniq());
        update("UPDATE users SET role='ADMIN' WHERE id=?", admin);
        logout();
        login(queryString("SELECT username FROM users WHERE id=?", admin), PASSWORD);
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Europe/Prague"));
        try {
            setRelease(uuid, now.plusDays(2).plusHours(3));
            assertNotNull(queryString("SELECT release_at FROM songs WHERE uuid=?", uuid));

            driver.get(BASE_URL + "/?lang=cs");
            WebElement card = driver.findElement(By.cssSelector(".hero-premiere"));
            assertFalse(card.getAttribute("class").contains("is-out"));
            assertEquals("2", card.findElement(By.cssSelector("[data-u=d]")).getText(), "za 2 dny");

            driver.get(BASE_URL + "/cs/song/" + uuid);
            assertFalse(driver.findElements(By.cssSelector(".lyric-premiere [data-u=h]")).isEmpty(), "odpočet u písně");

            // po premiéře: úvod hlásí „Venku!“, u písně už odpočet není
            setRelease(uuid, now.minusHours(1));
            driver.get(BASE_URL + "/?lang=cs");
            assertTrue(driver.findElement(By.cssSelector(".hero-premiere")).getAttribute("class").contains("is-out"));
            driver.get(BASE_URL + "/cs/song/" + uuid);
            assertTrue(driver.findElements(By.cssSelector(".lyric-premiere")).isEmpty());

            // zrušená premiéra zmizí
            driver.get(BASE_URL + "/admin/song?uuid=" + uuid + "#premiere");
            clickAndWaitReload(driver.findElement(By.cssSelector("#premiere input[value=clear_release] ~ button")), false);
            assertNull(queryString("SELECT release_at FROM songs WHERE uuid=?", uuid));
            driver.get(BASE_URL + "/?lang=cs");
            assertTrue(driver.findElements(By.cssSelector(".hero-premiere")).isEmpty());
        } finally {
            update("UPDATE songs SET release_at=NULL, release_kind=NULL WHERE uuid=?", uuid);
        }
    }
}
