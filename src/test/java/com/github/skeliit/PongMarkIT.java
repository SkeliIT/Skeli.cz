package com.github.skeliit;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.support.ui.Select;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Legendární znak u jména (CatSmash, odznaky za nejtěžší obtížnost) je dobrovolný: výchozí „Neukazovat“,
 * zapnutý se ukáže v tabulce i u komentářů, vypnutý zase zmizí.
 */
class PongMarkIT extends UiTestSupport {
    @Test
    void markIsOptInAndShowsInBoardAndComments() throws Exception {
        String name = "mark" + uniq();
        int id = registerAndLogin(name);
        update("INSERT INTO pong_badges (user_id, badge) VALUES (?, 'hsniper')", id);
        update("INSERT INTO pong_scores (user_id, match_len, difficulty, score, you, kevin, duration_ms) VALUES (?, 10, 3, 1, 10, 9, 300000)", id);
        int lyric = queryInt("SELECT id FROM lyrics ORDER BY id LIMIT 1");
        update("INSERT INTO comments (lyric_id, user_id, content) VALUES (?, ?, 'znak test')", lyric, id);
        JavascriptExecutor js = (JavascriptExecutor) driver;

        // výchozí: neukazovat – ani v tabulce, ani u komentáře
        assertNull(queryString("SELECT pong_mark FROM users WHERE id=?", id));
        assertTrue(fetch(js, "/api/pong/top?len=10&d=3").contains("\"mark\":null"), "bez znaku v tabulce");

        // zapnout v Nastavení → Profil
        driver.get(BASE_URL + "/nastaveni.jsp");
        Select sel = new Select(driver.findElement(By.id("pongMark")));
        assertEquals("", sel.getFirstSelectedOption().getAttribute("value"), "výchozí volba = Neukazovat");
        sel.selectByValue("hsniper");
        submit(By.cssSelector(".pong-mark-form button[type=submit]"));
        assertTrue(driver.getCurrentUrl().contains("pongMark=1"), "uloženo: " + driver.getCurrentUrl());
        assertEquals("hsniper", queryString("SELECT pong_mark FROM users WHERE id=?", id));
        assertTrue(fetch(js, "/api/pong/top?len=10&d=3").contains("\"mark\":\"hsniper\""), "znak v tabulce");
        assertTrue(fetch(js, "/api/comments?kind=lyric&target=" + lyric).contains("\"mark\":\"hsniper\""), "znak u komentáře");

        // vypnout = zmizí
        driver.get(BASE_URL + "/nastaveni.jsp");
        new Select(driver.findElement(By.id("pongMark"))).selectByValue("");
        submit(By.cssSelector(".pong-mark-form button[type=submit]"));
        assertNull(queryString("SELECT pong_mark FROM users WHERE id=?", id));
        assertFalse(fetch(js, "/api/comments?kind=lyric&target=" + lyric).contains("\"mark\":\"hsniper\""), "vypnutý znak zmizel");
    }

    private static String fetch(JavascriptExecutor js, String url) {
        return (String) js.executeAsyncScript("var done = arguments[arguments.length - 1];"
                + "fetch(arguments[0], {credentials: 'same-origin'}).then(function (r) { return r.text(); }).then(done).catch(function (e) { done('CHYBA ' + e); });", url);
    }
}
