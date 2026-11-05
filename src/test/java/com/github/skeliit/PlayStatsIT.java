package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;

import static org.junit.jupiter.api.Assertions.*;

/** "Co se nejvíc pouští": a started clip counts once a day per visitor and shows in the admin's chart. */
class PlayStatsIT extends UiTestSupport {

    @Test
    @DisplayName("A started clip is counted once a day and shows among the most played in the admin")
    void startedClipIsCountedOnceAndCharted() throws Exception {
        String yt = queryString("SELECT youtube_id FROM videos WHERE title IS NOT NULL AND title <> '' ORDER BY id LIMIT 1");
        assertNotNull(yt, "the local DB needs a clip");
        update("DELETE FROM play_daily WHERE kind='clip' AND item=?", yt);
        update("DELETE FROM play_seen WHERE kind='clip' AND item=?", yt);
        try {
            // a visitor (not signed in) starts the clip twice, another page in between
            driver.get(BASE_URL + "/");
            JavascriptExecutor js = (JavascriptExecutor) driver;
            String fire = "window.dispatchEvent(new CustomEvent('skeli:play', { detail: { yt: arguments[0] } }))";
            js.executeScript(fire, yt);
            waitUntil(() -> playsOf(yt) == 1);
            driver.get(BASE_URL + "/music.jsp");
            js.executeScript(fire, yt);
            Thread.sleep(800);
            assertEquals(1, playsOf(yt), "the same visitor counts once a day");
            // a made-up clip is not counted at all
            js.executeScript(fire, "nonexistent1");
            Thread.sleep(500);
            assertEquals(0, queryInt("SELECT COUNT(*) FROM play_daily WHERE item='nonexistent1'"));

            // the admin sees it under "Hudba (klipy)"
            String admin = "pl" + uniq();
            int id = registerAndLogin(admin);
            update("UPDATE users SET role='ADMIN' WHERE id=?", id);
            logout();
            login(admin, PASSWORD);
            driver.get(BASE_URL + "/admin/stats?plays=clip&period=7#plays");
            String card = driver.findElement(By.cssSelector("[data-w=plays]")).getText();
            assertTrue(card.contains("1×"), "the clip is in the top list: " + card);
            // the admin's own plays are not counted
            js.executeScript(fire, yt);
            Thread.sleep(800);
            assertEquals(1, playsOf(yt));
        } finally {
            update("DELETE FROM play_daily WHERE kind='clip' AND item=?", yt);
            update("DELETE FROM play_seen WHERE kind='clip' AND item=?", yt);
        }
    }

    private static int playsOf(String yt) {
        try {
            return queryInt("SELECT COALESCE(SUM(plays), 0) FROM play_daily WHERE kind='clip' AND item=?", yt);
        } catch (Exception e) {
            return -1;
        }
    }

    private void waitUntil(java.util.function.BooleanSupplier ok) throws InterruptedException {
        for (int i = 0; i < 40 && !ok.getAsBoolean(); i++) Thread.sleep(250);
        assertTrue(ok.getAsBoolean(), "timed out");
    }
}
