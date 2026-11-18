package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Vitrína odznaků, stav online a přátelé na cizím profilu: všechno jen po zapnutí. */
class ProfileShowcaseIT extends UiTestSupport {

    @Test
    @DisplayName("Vitrína: jen získané odznaky, nejvýš tři, vidí je i ostatní")
    void showcaseTakesOnlyEarnedBadges() throws Exception {
        String name = "sc" + uniq();
        int id = registerAndLogin(name);
        update("INSERT INTO pong_results (user_id, difficulty, duration_ms, kevin_goals, match_len) VALUES (?, 2, 90000, 2, 10)", id);
        driver.get(BASE_URL + "/nastaveni.jsp#soukromi");
        waitReady();
        assertEquals(302, browserPost("/profile/visibility", Map.of("pub", "1", "b1", "first", "b2", "skelosquad", "b3", "normal"), true));
        assertEquals("first,normal", queryString("SELECT showcase_badges FROM user_profiles WHERE user_id=?", id), "nezískaný odznak neprojde");

        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        assertEquals(2, driver.findElements(By.cssSelector(".pt-hero .pt-show-item")).size());

        logout();
        registerAndLogin("sd" + uniq());
        driver.get(BASE_URL + "/hrac/" + name);
        waitReady();
        assertEquals(2, driver.findElements(By.cssSelector(".pt-hero .pt-show-item")).size(), "vidí i ostatní");
        update("DELETE FROM pong_results WHERE user_id=?", id);
    }

    @Test
    @DisplayName("Stav online a přátelé se ukážou jen po zapnutí, soukromý přítel nikdy")
    void onlineAndFriendsOnlyWhenSwitchedOn() throws Exception {
        String name = "so" + uniq();
        int id = registerAndLogin(name);
        ((org.openqa.selenium.JavascriptExecutor) driver).executeAsyncScript(   // totéž, co dělá každá otevřená stránka
                "var done = arguments[arguments.length - 1]; fetch('/api/presence').then(function () { done(); });");
        logout();

        int pubFriend = insertUser("sp" + uniq(), "USER");
        int privFriend = insertUser("sq" + uniq(), "USER");
        update("UPDATE users SET profile_public=0 WHERE id=?", privFriend);
        for (int other : new int[] { pubFriend, privFriend }) {
            update("INSERT INTO friendships (user_a, user_b, requested_by, status) VALUES (?, ?, ?, 'accepted')", Math.min(id, other), Math.max(id, other), other);
        }
        String viewer = "sv" + uniq();
        registerAndLogin(viewer);
        driver.get(BASE_URL + "/hrac/" + name);
        waitReady();
        assertTrue(driver.findElements(By.cssSelector(".pt-online")).isEmpty(), "výchozí je vypnuto");
        assertTrue(driver.findElements(By.cssSelector(".pt-friends")).isEmpty(), "výchozí je vypnuto");

        update("UPDATE users SET online_public=1, friends_public=1 WHERE id=?", id);
        driver.get(BASE_URL + "/hrac/" + name);
        waitReady();
        assertFalse(driver.findElements(By.cssSelector(".pt-online")).isEmpty(), "je na webu");
        assertEquals(1, driver.findElements(By.cssSelector(".pt-friends .friend-row")).size(), "jen přítel s veřejným profilem");
    }
}
