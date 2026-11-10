package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;

import static org.junit.jupiter.api.Assertions.*;

/** Poznámka u písně z adminu a tlačítka Poslechni u písně bez videa. */
class SongNoteIT extends UiTestSupport {

    @Test
    @DisplayName("Admin napíše poznámku, web ji ukáže jen tam, kde má, a escapuje ji; vypršená a smazaná zmizí")
    void noteFromAdminShowsWhereItShould() throws Exception {
        String admin = "no" + uniq();
        int adminId = registerAndLogin(admin);
        update("UPDATE users SET role='ADMIN' WHERE id=?", adminId);
        logout();
        login(admin, PASSWORD);

        String name = "IT Poznámka " + uniq();
        update("INSERT INTO songs (uuid, name, year, spotify_id, apple_music_id) VALUES (UUID(), ?, 2026, '4uLU6hMCjMI75M1A2tKUQC', '123456')", name);
        int song = queryInt("SELECT id FROM songs WHERE name=?", name);
        String uuid = queryString("SELECT uuid FROM songs WHERE id=?", song);
        update("INSERT INTO lyrics (song_id, lang, words, score) VALUES (?, 'cs', 'řádek textu', 0)", song);
        String text = "Klip brzy <b>" + uniq() + "</b>";
        try {
            driver.get(BASE_URL + "/admin/notes");
            waitReady();
            new org.openqa.selenium.support.ui.Select(driver.findElement(By.name("song_id"))).selectByValue(String.valueOf(song));
            driver.findElement(By.name("text_cs")).sendKeys(text);
            jsClick(driver.findElement(By.name("show_music")));   // na Hudbě ne
            submit(By.cssSelector("form.note-form button[type=submit]"));
            assertTrue(driver.getCurrentUrl().contains("msg=saved"), driver.getCurrentUrl());
            assertTrue(bodyText().contains(name), "je v seznamu");

            driver.get(BASE_URL + "/cs/song/" + uuid);
            waitReady();
            assertEquals(text, driver.findElement(By.cssSelector(".song-note-big")).getText(), "text bez HTML");
            assertTrue(driver.findElements(By.cssSelector(".song-note b")).isEmpty(), "HTML se nevykreslí");
            assertTrue(driver.findElement(By.cssSelector(".listen-btn-spotify")).getAttribute("href").endsWith("/track/4uLU6hMCjMI75M1A2tKUQC"), "přímo na skladbu");
            assertFalse(driver.findElements(By.cssSelector(".listen-btn-apple")).isEmpty());
            assertTrue(driver.findElements(By.cssSelector(".listen-icons")).isEmpty(), "bez videa jen velká tlačítka");

            driver.get(BASE_URL + "/texty.jsp");
            waitReady();
            assertFalse(driver.findElements(By.cssSelector(".song-row[data-song='" + song + "'] .song-note")).isEmpty(), "v Textech je");

            driver.get(BASE_URL + "/music.jsp");
            waitReady();
            assertFalse(driver.getPageSource().contains(text.replace("<", "&lt;").replace(">", "&gt;")), "na Hudbě být nemá");

            update("UPDATE song_notes SET until_date = CURDATE() - INTERVAL 1 DAY WHERE song_id=?", song);
            driver.get(BASE_URL + "/cs/song/" + uuid);
            waitReady();
            assertTrue(driver.findElements(By.cssSelector(".song-note-big")).isEmpty(), "po datu zmizí");

            driver.get(BASE_URL + "/admin/notes");
            waitReady();
            clickAndWaitReload(driver.findElement(By.cssSelector("form input[name=action][value=delete]+input[value='" + song + "']"))
                    .findElement(By.xpath("./ancestor::form//button")), true);
            assertFalse(exists("SELECT 1 FROM song_notes WHERE song_id=?", song), "smazaná");
        } finally {
            update("DELETE FROM lyrics WHERE song_id=?", song);
            update("DELETE FROM songs WHERE id=?", song);
        }
    }
}
