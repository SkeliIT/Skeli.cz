package com.github.skeliit;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.JavascriptExecutor;

import static org.junit.jupiter.api.Assertions.*;

/**
 * „Někdo tě předběhl“: hráč A má v tabulce Skóre zápis, hráč B ho překoná → A dostane do zvonečku upozornění
 * (druh passed, od B, s tabulkou a novým místem). Skóre se posílá stejně jako ze hry (/api/pong/start, /api/pong/score).
 */
class PongPassedIT extends UiTestSupport {
    @Test
    void passingSomeoneSendsThemANotification() throws Exception {
        int a = registerAndLogin("pa" + uniq());
        update("INSERT INTO pong_scores (user_id, match_len, difficulty, score, you, kevin, duration_ms) VALUES (?, 10, 2, 1, 10, 9, 600000)", a);
        logout();
        int b = registerAndLogin("pb" + uniq());
        JavascriptExecutor js = (JavascriptExecutor) driver;
        String start = (String) js.executeAsyncScript("var done = arguments[arguments.length - 1];"
                + "fetch('/api/pong/me', {credentials: 'same-origin'}).then(function (r) { return r.json(); }).then(function (j) {"
                + "  window.__csrf = j.csrf; var body = new URLSearchParams({d: 2, len: 10});"
                + "  return fetch('/api/pong/start', {method: 'POST', credentials: 'same-origin', headers: {'X-CSRF-Token': j.csrf}, body: body}); })"
                + ".then(function (r) { return r.text(); }).then(done).catch(function (e) { done('CHYBA ' + e); });");
        assertTrue(start.contains("\"ok\":true"), "start: " + start);
        Thread.sleep(14_500);                      // zápas 10:0 nejde dát rychleji než za 15 s
        String res = (String) js.executeAsyncScript("var done = arguments[arguments.length - 1];"
                + "var body = new URLSearchParams({d: 2, len: 10, you: 10, kevin: 0, ms: 15000, perfect: 0, supers: 0, stickGoals: 0, streakPts: 0, rally: 0, screws: 0});"
                + "fetch('/api/pong/score', {method: 'POST', credentials: 'same-origin', headers: {'X-CSRF-Token': window.__csrf}, body: body})"
                + ".then(function (r) { return r.text(); }).then(done).catch(function (e) { done('CHYBA ' + e); });");
        assertTrue(res.contains("\"ok\":true"), "skóre: " + res);
        assertEquals("score|2|10|2", queryString("SELECT info FROM notifications WHERE user_id = ? AND type = 'passed' AND actor_id = ?", a, b),
                "A dostal upozornění: Skóre, Normální, 10 gólů, teď 2. místo");
        assertFalse(exists("SELECT 1 FROM notifications WHERE user_id = ? AND type = 'passed'", b), "B sám sebe nepředběhl");
    }
}
