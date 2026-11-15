package com.github.skeliit;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Soukromí v tabulkách CatSmash (V139 users.pong_public): kdo si jméno v tabulkách nezapne, je anonymní –
 * API nesmí poslat jeho jméno, fotku, rámeček, znak ani odkaz na profil, a to ani při přímém volání.
 * Výchozí stav i pro stávající účty = anonymně.
 */
class PongPrivacyIT extends UiTestSupport {
    /** Výsledky, které jistě budou v první desítce (obří skóre, nejkratší čas). */
    private void bestResults(int id, int score, int ms) throws Exception {
        update("INSERT INTO pong_scores (user_id, match_len, difficulty, score, you, kevin, duration_ms) VALUES (?, 10, 3, ?, 10, 0, ?)", id, score, ms);
        update("INSERT INTO pong_results (user_id, difficulty, duration_ms, kevin_goals, match_len) VALUES (?, 3, ?, 0, 10)", id, ms);
    }

    private static String anonymousGet(String path) throws Exception {
        HttpResponse<String> r = HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create(BASE_URL + path)).build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(200, r.statusCode(), path);
        return r.body();
    }

    private static String fetch(JavascriptExecutor js, String url) {
        return (String) js.executeAsyncScript("var done = arguments[arguments.length - 1];"
                + "fetch(arguments[0], {credentials: 'same-origin'}).then(function (r) { return r.text(); }).then(done).catch(function (e) { done('CHYBA ' + e); });", url);
    }

    private static final String[] BOARDS = {
            "/api/pong/top?len=10&d=3", "/api/pong/top?len=10&d=3&season=month",
            "/api/pong/top?kind=time&d=3&len=10", "/api/pong/top?kind=time&d=3&len=10&season=month" };

    @Test
    void anonymousPlayerNeverLeavesTheServer() throws Exception {
        String hidden = "pa" + uniq(), shown = "pb" + uniq();
        int h = insertUser(hidden, "USER"), s = insertUser(shown, "USER");
        String avatar = "/uploads/avatars/tajna" + uniq() + ".jpg";
        // skrytý hráč má všechno, co by ho mohlo prozradit: fotku, veřejný profil, rámeček i znak
        update("UPDATE users SET avatar_url=?, profile_public=1, pong_frame='champ', pong_mark='hsniper' WHERE id=?", avatar, h);
        update("INSERT INTO pong_badges (user_id, badge) VALUES (?, 'hsniper')", h);
        update("UPDATE users SET pong_public=1 WHERE id=?", s);
        assertEquals(0, queryInt("SELECT pong_public FROM users WHERE id=?", h), "výchozí stav = anonymně");
        bestResults(h, 99_999_999, 1);
        bestResults(s, 99_999_998, 2);
        try {
            for (String path : BOARDS) {
                String body = anonymousGet(path);
                assertFalse(body.contains(hidden), "jméno skrytého hráče v " + path);
                assertFalse(body.contains(avatar), "fotka skrytého hráče v " + path);
                assertTrue(body.contains("\"anon\":true"), "anonymní řádek v " + path);
                assertTrue(body.contains(shown), "veřejný hráč je vidět v " + path);
            }
            // přihlášený jiný hráč (i přes prohlížeč) skrytého taky nevidí
            int viewer = registerAndLogin("pv" + uniq());
            JavascriptExecutor js = (JavascriptExecutor) driver;
            for (String path : BOARDS) {
                String body = fetch(js, path);
                assertFalse(body.contains(hidden) || body.contains(avatar), "přihlášený vidí skrytého v " + path);
            }
            // upozornění „X tě předběhl“ jméno skrytého hráče neprozradí
            update("INSERT INTO notifications (user_id, type, actor_id, info) VALUES (?, 'passed', ?, 'score|3|10|1')", viewer, h);
            String bell = fetch(js, "/api/notifications");
            assertFalse(bell.contains(hidden) || bell.contains(avatar), "zvoneček prozradil skrytého hráče");
            assertTrue(bell.contains("\"anon\":true"), "zvoneček: anonymní upozornění");
            // cizí profil skrytého hráče neukazuje časy ani místa (šlo by je spárovat s anonymním řádkem)
            driver.get(BASE_URL + "/hrac/" + hidden);
            waitReady();
            assertEquals("–", driver.findElement(By.cssSelector(".pt-best .pt-big")).getAttribute("textContent").trim(), "profil bez nejlepšího času");   // záložka Hry je schovaná, getText by vrátil ""
        } finally {
            update("DELETE FROM notifications WHERE actor_id=?", h);
            for (int id : new int[] { h, s }) {
                update("DELETE FROM pong_scores WHERE user_id=?", id);
                update("DELETE FROM pong_results WHERE user_id=?", id);
                update("DELETE FROM pong_badges WHERE user_id=?", id);
            }
        }
    }

    @Test
    void switchInSettingsShowsTheName() throws Exception {
        String name = "ps" + uniq();
        int id = registerAndLogin(name);
        bestResults(id, 99_999_997, 3);
        try {
            assertFalse(anonymousGet(BOARDS[0]).contains(name), "nový účet je v tabulce anonymně");
            driver.get(BASE_URL + "/nastaveni.jsp#soukromi");
            waitReady();
            var box = driver.findElement(By.cssSelector(".vis-form input[name=pong]"));
            assertFalse(box.isSelected(), "vypínač je ve výchozím stavu vypnutý");
            jsClick(box);
            submit(By.cssSelector(".vis-form button[type=submit]"));
            assertTrue(driver.getCurrentUrl().contains("vis=1"), "uloženo: " + driver.getCurrentUrl());
            assertEquals(1, queryInt("SELECT pong_public FROM users WHERE id=?", id));
            assertTrue(anonymousGet(BOARDS[0]).contains(name), "po zapnutí je jméno v tabulce");
        } finally {
            update("DELETE FROM pong_scores WHERE user_id=?", id);
            update("DELETE FROM pong_results WHERE user_id=?", id);
        }
    }
}
