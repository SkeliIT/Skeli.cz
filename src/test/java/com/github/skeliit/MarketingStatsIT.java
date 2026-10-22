package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;

import static org.junit.jupiter.api.Assertions.*;

/** Statistiky pro marketing: návštěva odkud, klik na Spotify, hledání – a jak to vidí admin. */
class MarketingStatsIT extends UiTestSupport {

    @Test
    @DisplayName("Návštěva z Instagramu s kampaní, klik na Spotify a hledání se sečtou a admin je uvidí ve Statistikách")
    void sbiraAZobrazuje() throws Exception {
        String campaign = "it-" + uniq().toLowerCase();
        String term = "it hledani " + uniq().toLowerCase();
        try {
            // začátek návštěvy, jak ho pošle js/presence.js
            assertEquals(204, httpStatus("/api/hit?k=visit&ref=l.instagram.com&z=" + campaign));
            assertTrue(exists("SELECT 1 FROM visit_origins WHERE source='instagram' AND campaign=?", campaign));

            // klik na Spotify na stránce Hudba (odkaz se neotevře, jen se pošle počítadlo)
            driver.get(BASE_URL + "/music.jsp");
            long before = queryInt("SELECT COALESCE(SUM(clicks),0) FROM outbound_clicks WHERE target='spotify' AND page_kind='music'");
            ((JavascriptExecutor) driver).executeScript(
                    "var a = document.createElement('a'); a.href = 'https://open.spotify.com/artist/x'; document.querySelector('main').appendChild(a);"
                            + "a.addEventListener('click', function (e) { e.preventDefault(); });"
                            + "a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));");
            long after = before;
            for (int i = 0; i < 20 && after == before; i++) {
                Thread.sleep(250);
                after = queryInt("SELECT COALESCE(SUM(clicks),0) FROM outbound_clicks WHERE target='spotify' AND page_kind='music'");
            }
            assertEquals(before + 1, after, "klik na Spotify sečtený");

            // hledání (texty.jsp pošle událost, až člověk dopíše)
            assertEquals(204, httpStatus("/api/hit?k=search&f=0&q=" + java.net.URLEncoder.encode(term, "UTF-8")));

            // admin vidí Instagram, kampaň a hledaný výraz s „nic nenašlo“
            int admin = registerAndLogin("mk" + uniq());
            update("UPDATE users SET role='ADMIN' WHERE id=?", admin);
            logout();
            login(queryString("SELECT username FROM users WHERE id=?", admin), PASSWORD);
            driver.get(BASE_URL + "/admin/stats#marketing");
            String page = driver.findElement(By.id("marketing")).findElement(By.xpath("following-sibling::div[contains(@class,'mk-grid')]")).getText();
            assertTrue(page.contains("Instagram"), page);
            assertTrue(page.contains(campaign), "kampaň v seznamu");
            assertTrue(page.contains(term) && page.contains("nic nenašlo"), "hledání bez výsledku");
        } finally {
            update("DELETE FROM visit_origins WHERE campaign=?", campaign);
            update("DELETE FROM search_terms WHERE term=?", term);
        }
    }
}
