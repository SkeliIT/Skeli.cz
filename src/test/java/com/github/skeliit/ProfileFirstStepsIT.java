package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Profil nováčka: první kroky místo nul, písně se srdcem, co vidí ostatní (jen po zapnutí), jméno u komentáře jako odkaz. */
class ProfileFirstStepsIT extends UiTestSupport {

    private void waitForComments() {
        new org.openqa.selenium.support.ui.WebDriverWait(driver, java.time.Duration.ofSeconds(10))
                .until(d -> !d.findElements(By.cssSelector("#comments .cmt-name")).isEmpty());
    }

    private boolean visible(String css) {
        return driver.findElements(By.cssSelector(css)).stream().anyMatch(e -> e.isDisplayed());
    }

    @Test
    @DisplayName("Nováček vidí první kroky a žádné nuly, seznam jde schovat")
    void newcomerSeesFirstSteps() throws Exception {
        registerAndLogin("fs" + uniq());
        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        assertTrue(visible(".pt-start"), "seznam prvních kroků");
        assertEquals(5, driver.findElements(By.cssSelector(".pt-steps li")).size());
        assertEquals(0, driver.findElements(By.cssSelector("#prehled .pt-stat")).size(), "žádné dlaždice s nulou");
        assertFalse(visible(".pt-song.pt-empty"), "výběr songu je jeden z kroků");
        assertTrue(visible(".pt-likes .pt-likes-go"), "prázdné oblíbené vedou na texty");

        driver.findElement(By.cssSelector(".pt-start-hide")).click();
        assertFalse(visible(".pt-start"));
        assertTrue(visible(".pt-song.pt-empty"), "po schování se výběr songu vrátí");
        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        assertFalse(visible(".pt-start"), "schování si prohlížeč pamatuje");
        ((JavascriptExecutor) driver).executeScript("localStorage.removeItem('profileStartHidden')");
    }

    @Test
    @DisplayName("Všechny kroky splněné: seznam zmizí")
    void stepsDisappearWhenDone() throws Exception {
        String name = "fd" + uniq();
        int id = registerAndLogin(name);
        String yt = queryString("SELECT youtube_id FROM videos LIMIT 1");
        String song = queryString("SELECT uuid FROM songs WHERE uuid IS NOT NULL LIMIT 1");
        update("UPDATE users SET avatar_url='/img/logo-skelosquad.svg' WHERE id=?", id);
        update("INSERT INTO user_profiles (user_id, fav_song_uuid, motto) VALUES (?, ?, 'moto') ON DUPLICATE KEY UPDATE fav_song_uuid=VALUES(fav_song_uuid), motto=VALUES(motto)", id, song);
        update("INSERT INTO video_comments (user_id, youtube_id, content) VALUES (?, ?, 'ahoj')", id, yt);
        update("INSERT INTO pong_results (user_id, difficulty, duration_ms, kevin_goals, match_len) VALUES (?, 1, 90000, 2, 10)", id);
        logout();
        login(name, PASSWORD);
        try {
            driver.get(BASE_URL + "/uzivatel.jsp");
            waitReady();
            assertFalse(visible(".pt-start"), "hotovo");
            assertTrue(visible("#prehled .pt-comments"), "čísla jsou zpět");
        } finally {
            update("DELETE FROM video_comments WHERE user_id=?", id);
            update("DELETE FROM pong_results WHERE user_id=?", id);
        }
    }

    @Test
    @DisplayName("Ostatní vidí město, pár slov o sobě a oblíbené písně až po zapnutí")
    void othersSeeOnlyWhatIsSwitchedOn() throws Exception {
        String name = "fp" + uniq();
        int id = registerAndLogin(name);
        update("INSERT INTO user_profiles (user_id, city, bio) VALUES (?, 'Mestecko', 'Moje slova') ON DUPLICATE KEY UPDATE city=VALUES(city), bio=VALUES(bio)", id);
        int lyric = queryInt("SELECT MIN(l.id) FROM lyrics l JOIN songs s ON s.id = l.song_id WHERE s.uuid IS NOT NULL");
        update("INSERT INTO lyrics_votes (lyric_id, user_id, vote) VALUES (?, ?, 1)", lyric, id);
        try {
            driver.get(BASE_URL + "/uzivatel.jsp");
            waitReady();
            assertEquals(1, driver.findElements(By.cssSelector(".pt-like")).size(), "sám si je vidím vždycky");
            logout();

            registerAndLogin("fv" + uniq());
            driver.get(BASE_URL + "/hrac/" + name);
            waitReady();
            String page = driver.findElement(By.tagName("main")).getText();
            assertFalse(page.contains("Mestecko"), "výchozí je vypnuto");
            assertFalse(page.contains("Moje slova"));
            assertEquals(0, driver.findElements(By.cssSelector(".pt-likes")).size());

            update("UPDATE users SET about_public=1, city_public=1, likes_public=1 WHERE id=?", id);
            driver.get(BASE_URL + "/hrac/" + name);
            waitReady();
            page = driver.findElement(By.tagName("main")).getText();
            assertTrue(page.contains("Mestecko"));
            assertTrue(page.contains("Moje slova"));
            assertEquals(1, driver.findElements(By.cssSelector(".pt-like")).size());
        } finally {
            update("DELETE FROM lyrics_votes WHERE user_id=?", id);
        }
    }

    @Test
    @DisplayName("Jméno u komentáře vede na profil, jen když ho autor má zapnutý a čtenář je přihlášený")
    void commentNameLinksToProfile() throws Exception {
        String name = "fc" + uniq();
        int id = registerAndLogin(name);
        int lyric = queryInt("SELECT MIN(l.id) FROM lyrics l JOIN songs s ON s.id = l.song_id WHERE l.lang='cs'");
        update("INSERT INTO comments (lyric_id, user_id, content) VALUES (?, ?, 'odkaz')", lyric, id);
        String page = "/lyrics/" + lyric;
        By link = By.cssSelector("#comments a.cmt-name");
        try {
            driver.get(BASE_URL + page);
            waitForComments();
            assertTrue(driver.findElements(link).stream().anyMatch(a -> a.getAttribute("href").endsWith("/hrac/" + name)), "přihlášený vidí odkaz");

            update("UPDATE users SET profile_public=0 WHERE id=?", id);
            driver.get(BASE_URL + page);
            waitForComments();
            assertFalse(driver.findElements(link).stream().anyMatch(a -> a.getAttribute("href").endsWith("/hrac/" + name)), "skrytý profil odkaz nemá");

            update("UPDATE users SET profile_public=1 WHERE id=?", id);
            logout();
            driver.get(BASE_URL + page);
            waitForComments();
            assertEquals(0, driver.findElements(link).size(), "nepřihlášený odkazy nevidí");
        } finally {
            update("DELETE FROM comments WHERE user_id=?", id);
        }
    }
}
