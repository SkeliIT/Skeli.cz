package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Moje tvorba: skladby odkazem, kontrola odkazů, cizí skladbu nejde změnit, vidět u ostatních, skrytí adminem. */
class UserTracksIT extends UiTestSupport {
    private static final String YT = "https://youtu.be/dQw4w9WgXcQ";

    private long save(Map<String, String> form) throws Exception {
        driver.get(BASE_URL + "/nastaveni.jsp#tvorba");
        waitReady();
        return browserPost("/profile/tracks", form, true);
    }

    @Test
    @DisplayName("Přidání, špatné odkazy neprojdou a skladba je na profilu i u ostatních")
    void addAndShow() throws Exception {
        String name = "ta" + uniq();
        int id = registerAndLogin(name);

        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        assertTrue(driver.findElement(By.cssSelector(".pt-tracks-invite")).isDisplayed(), "pozvánka, dokud nic nemá");

        assertEquals(302, save(Map.of("action", "save", "title", "Bez odkazu", "rights", "1")));
        assertEquals(0, queryInt("SELECT COUNT(*) FROM user_tracks WHERE user_id=?", id), "aspoň jeden odkaz");
        assertEquals(302, save(Map.of("action", "save", "title", "Cizi", "youtube", "https://evil.com/watch?v=dQw4w9WgXcQ", "rights", "1")));
        assertEquals(0, queryInt("SELECT COUNT(*) FROM user_tracks WHERE user_id=?", id), "cizí doména");
        assertEquals(302, save(Map.of("action", "save", "title", "Bez prav", "youtube", YT)));
        assertEquals(0, queryInt("SELECT COUNT(*) FROM user_tracks WHERE user_id=?", id), "bez potvrzení práv");

        assertEquals(302, save(Map.of("action", "save", "title", "<b>Moje</b>", "year", "2025", "youtube", YT,
                "soundcloud", "https://soundcloud.com/ja/skladba", "rights", "1")));
        assertEquals("dQw4w9WgXcQ", queryString("SELECT youtube_id FROM user_tracks WHERE user_id=?", id));

        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        assertEquals("<b>Moje</b>", driver.findElement(By.cssSelector(".pt-tracks .song-name")).getText(), "escapované");
        assertTrue(driver.findElements(By.cssSelector(".pt-tracks-invite")).isEmpty());
        assertEquals("https://soundcloud.com/ja/skladba", driver.findElement(By.cssSelector(".disco-soundcloud")).getAttribute("href"));

        logout();
        registerAndLogin("tb" + uniq());
        driver.get(BASE_URL + "/hrac/" + name);
        waitReady();
        assertEquals(1, driver.findElements(By.cssSelector(".pt-tracks .song-card")).size(), "ostatní ji vidí");
        update("UPDATE users SET tracks_public=0 WHERE id=?", id);
        driver.get(BASE_URL + "/hrac/" + name);
        waitReady();
        assertTrue(driver.findElements(By.cssSelector(".pt-tracks")).isEmpty(), "po vypnutí ne");
    }

    @Test
    @DisplayName("Cizí skladbu nejde upravit ani smazat")
    void cannotTouchForeignTrack() throws Exception {
        int owner = registerAndLogin("tc" + uniq());
        update("INSERT INTO user_tracks (user_id, title, youtube_id) VALUES (?, 'Puvodni', 'dQw4w9WgXcQ')", owner);
        int track = queryInt("SELECT id FROM user_tracks WHERE user_id=?", owner);
        logout();
        registerAndLogin("td" + uniq());
        save(Map.of("action", "save", "id", String.valueOf(track), "title", "Ukradeno", "youtube", YT, "rights", "1"));
        save(Map.of("action", "delete", "id", String.valueOf(track)));
        assertEquals("Puvodni", queryString("SELECT title FROM user_tracks WHERE id=?", track));
    }

    @Test
    @DisplayName("Admin skladbu skryje s důvodem: ostatní ji neuvidí, majitel ví proč")
    void adminHidesTrack() throws Exception {
        String ownerName = "te" + uniq();
        int owner = registerAndLogin(ownerName);
        update("INSERT INTO user_tracks (user_id, title, youtube_id) VALUES (?, 'Sporna', 'dQw4w9WgXcQ')", owner);
        int track = queryInt("SELECT id FROM user_tracks WHERE user_id=?", owner);
        logout();

        String adminName = "tf" + uniq();
        insertUser(adminName, "ADMIN");
        login(adminName, PASSWORD);
        driver.get(BASE_URL + "/hrac/" + ownerName);
        waitReady();
        assertEquals(302, browserPost("/admin/user-track", Map.of("action", "hide", "id", String.valueOf(track), "reason", "Cizi skladba"), true));
        assertTrue(exists("SELECT 1 FROM user_tracks WHERE id=? AND hidden_at IS NOT NULL", track));
        logout();

        registerAndLogin("tg" + uniq());
        driver.get(BASE_URL + "/hrac/" + ownerName);
        waitReady();
        assertTrue(driver.findElements(By.cssSelector(".pt-tracks")).isEmpty(), "ostatní ji nevidí");
        assertEquals(403, browserPost("/admin/user-track", Map.of("action", "show", "id", String.valueOf(track)), true), "běžný člověk nesmí");
        logout();

        login(ownerName, PASSWORD);
        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        assertTrue(driver.findElement(By.cssSelector(".pt-track-hidden")).getText().contains("Cizi skladba"), "majitel ví proč");
        assertFalse(driver.findElements(By.cssSelector(".pt-tracks .is-hidden")).isEmpty());
    }
}
