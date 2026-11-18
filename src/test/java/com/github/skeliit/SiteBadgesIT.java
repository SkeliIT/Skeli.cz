package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Odznaky za život na webu a aktivita: získávají se samy, zůstávají, ostatní vidí aktivitu jen po zapnutí a bez komentářů. */
class SiteBadgesIT extends UiTestSupport {

    @Test
    @DisplayName("Odznak přijde sám a zůstane, i když to, za co ho člověk dostal, zmizí")
    void badgesAppearAndStay() throws Exception {
        int id = registerAndLogin("sb" + uniq());
        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        assertTrue(exists("SELECT 1 FROM site_badges WHERE user_id=? AND badge='s_early'", id), "účet z prvních měsíců");
        assertFalse(exists("SELECT 1 FROM site_badges WHERE user_id=? AND badge='s_voice'", id));

        String yt = queryString("SELECT youtube_id FROM videos LIMIT 1");
        update("INSERT INTO video_comments (user_id, youtube_id, content) VALUES (?, ?, 'Prvni')", id, yt);
        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        assertTrue(exists("SELECT 1 FROM site_badges WHERE user_id=? AND badge='s_voice'", id), "první komentář");
        assertEquals(2, driver.findElements(By.cssSelector(".pt-sitebadges .pt-show-item")).size());

        update("DELETE FROM video_comments WHERE user_id=?", id);
        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        assertEquals(2, driver.findElements(By.cssSelector(".pt-sitebadges .pt-show-item")).size(), "zůstává");
        assertFalse(driver.findElements(By.cssSelector(".pt-howto li")).isEmpty(), "jak získat další");
    }

    @Test
    @DisplayName("Karaoke kino dá odznak jen přihlášenému a vitrína bere i odznaky z webu")
    void karaokeAndShowcase() throws Exception {
        int id = registerAndLogin("sk" + uniq());
        String uuid = queryString("SELECT s.uuid FROM songs s JOIN videos v ON v.song_id = s.id WHERE v.youtube_id='auNofZzBIFA' LIMIT 1");
        driver.get(BASE_URL + "/karaoke-kino/" + uuid);
        waitReady();
        assertTrue(exists("SELECT 1 FROM site_badges WHERE user_id=? AND badge='s_karaoke'", id));

        driver.get(BASE_URL + "/nastaveni.jsp#soukromi");
        waitReady();
        assertEquals(302, browserPost("/profile/visibility", Map.of("pub", "1", "b1", "s_karaoke", "b2", "s_heart"), true));
        assertEquals("s_karaoke", queryString("SELECT showcase_badges FROM user_profiles WHERE user_id=?", id), "nezískaný neprojde");
        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        assertEquals(1, driver.findElements(By.cssSelector(".pt-hero .pt-show-item")).size());
    }

    @Test
    @DisplayName("Aktivita: já vidím všechno, ostatní jen po zapnutí a bez komentářů")
    void activityVisibility() throws Exception {
        String name = "sa" + uniq();
        int id = registerAndLogin(name);
        String yt = queryString("SELECT youtube_id FROM videos LIMIT 1");
        update("INSERT INTO video_comments (user_id, youtube_id, content) VALUES (?, ?, 'TajnyKomentar')", id, yt);
        update("INSERT INTO user_tracks (user_id, title, youtube_id) VALUES (?, 'VerejnaSkladba', 'dQw4w9WgXcQ')", id);
        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        String own = driver.findElement(By.cssSelector(".pt-activity")).getText();
        assertTrue(own.contains("TajnyKomentar"));
        assertTrue(own.contains("VerejnaSkladba"));
        logout();

        registerAndLogin("sv" + uniq());
        driver.get(BASE_URL + "/hrac/" + name);
        waitReady();
        assertTrue(driver.findElements(By.cssSelector(".pt-activity")).isEmpty(), "výchozí je vypnuto");

        update("UPDATE users SET activity_public=1 WHERE id=?", id);
        driver.get(BASE_URL + "/hrac/" + name);
        waitReady();
        String others = driver.findElement(By.cssSelector(".pt-activity")).getText();
        assertTrue(others.contains("VerejnaSkladba"));
        assertFalse(driver.getPageSource().contains("TajnyKomentar"), "komentáře jen pro majitele");
        update("DELETE FROM video_comments WHERE user_id=?", id);
    }
}
