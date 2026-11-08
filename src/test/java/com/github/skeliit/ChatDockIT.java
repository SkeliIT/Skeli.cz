package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Lišta chatu na počítači, kolečko na telefonu, malé okno a vypínání zvuků. */
class ChatDockIT extends UiTestSupport {

    private Object js(String script) {
        return ((JavascriptExecutor) driver).executeScript(script);
    }

    @Test
    @DisplayName("Lišta: jen přihlášeným, otevře okno a není na stránce Zprávy")
    void dockOpensChatWindow() throws Exception {
        driver.get(BASE_URL + "/index.jsp");
        waitReady();
        assertTrue(driver.findElements(By.id("chatDock")).isEmpty(), "nepřihlášený lištu nemá");

        registerAndLogin("dk" + uniq());
        driver.get(BASE_URL + "/index.jsp");
        waitReady();
        WebElement button = driver.findElement(By.cssSelector(".chat-dock-btn"));
        assertTrue(button.isDisplayed());
        assertEquals(Boolean.FALSE, js("return document.querySelector('.chat-dock-panel iframe').hasAttribute('src')"), "okno se načte až po otevření");

        jsClick(button);
        assertTrue(driver.findElement(By.cssSelector(".chat-dock-panel")).isDisplayed());
        driver.switchTo().frame(driver.findElement(By.cssSelector(".chat-dock-panel iframe")));
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> !d.findElements(By.cssSelector("main.chat-page")).isEmpty());
        assertTrue(driver.findElements(By.cssSelector(".site-header, .site-footer, #chatDock")).isEmpty(), "v okně je jen chat");
        driver.switchTo().defaultContent();

        driver.get(BASE_URL + "/zpravy");
        waitReady();
        assertFalse(driver.findElement(By.cssSelector(".chat-dock-btn")).isDisplayed(), "na stránce Zprávy lišta nepřekáží");
    }

    @Test
    @DisplayName("Telefon: kolečko, okno přes celou obrazovku a stránka nepřetéká")
    void phoneBubble() throws Exception {
        driver.quit();
        ChromeOptions o = new ChromeOptions();
        o.addArguments("--headless=new");
        o.setExperimentalOption("mobileEmulation", Map.of("deviceMetrics", Map.of("width", 390, "height", 844, "pixelRatio", 2)));
        driver = new ChromeDriver(o);
        registerAndLogin("dp" + uniq());
        driver.get(BASE_URL + "/index.jsp");
        waitReady();
        assertEquals(Boolean.TRUE, js("return document.documentElement.scrollWidth <= window.innerWidth"), "nepřetéká");
        WebElement button = driver.findElement(By.cssSelector(".chat-dock-btn"));
        assertEquals(52, button.getSize().getWidth(), "kolečko");
        assertFalse(driver.findElement(By.cssSelector(".chat-dock-label")).isDisplayed());
        jsClick(button);
        assertEquals(390, driver.findElement(By.cssSelector(".chat-dock-panel")).getSize().getWidth(), "přes celou obrazovku");
        jsClick(driver.findElement(By.cssSelector(".chat-dock-close")));
        assertFalse(driver.findElement(By.cssSelector(".chat-dock-panel")).isDisplayed());
    }

    @Test
    @DisplayName("Zvuky: reproduktor vypne všechno, Kevin je výchozí vypnutý a počítadlo hlásí ztlumené zvlášť")
    void soundsAndCounts() throws Exception {
        int me = registerAndLogin("ds" + uniq());
        driver.get(BASE_URL + "/index.jsp");
        waitReady();
        js("localStorage.removeItem('soundMuted'); localStorage.removeItem('sound_kevin'); localStorage.removeItem('sound_message');");
        assertEquals(Boolean.TRUE, js("return SkeliSound.enabled('message')"));
        assertEquals(Boolean.FALSE, js("return SkeliSound.enabled('kevin')"), "Kevin je potichu, dokud si ho člověk nezapne");
        jsClick(driver.findElement(By.cssSelector("button[data-sound-toggle].view-row")));
        assertEquals("1", js("return localStorage.getItem('soundMuted')"));
        assertEquals(Boolean.FALSE, js("return SkeliSound.enabled('message')"), "reproduktor vypne všechno");
        assertEquals(Boolean.FALSE, js("return SkeliSound.play('message')"));
        jsClick(driver.findElement(By.cssSelector("button[data-sound-toggle].view-row")));
        assertEquals(Boolean.TRUE, js("return SkeliSound.enabled('message')"));

        int friend = insertUser("df" + uniq(), "USER");
        update("INSERT INTO chat_messages (user_a, user_b, sender_id, recipient_id, body) VALUES (?, ?, ?, ?, 'Ahoj')", Math.min(me, friend), Math.max(me, friend), friend, me);
        update("INSERT INTO chat_muted (user_id, other_id) VALUES (?, ?)", me, friend);
        String count = (String) ((JavascriptExecutor) driver).executeAsyncScript(
                "var done = arguments[arguments.length - 1]; fetch('/api/notifications?count=1').then(function (r) { return r.text(); }).then(done);");
        assertTrue(count.contains("\"chat\":1"), count);
        assertTrue(count.contains("\"chatSound\":0"), "ztlumený člověk nezazvoní: " + count);
    }

    @Test
    @DisplayName("Otevřený chat zazvoní na novou zprávu, ale ne při načtení, ne u ztlumeného a ne ve stavu Nerušit")
    void openChatRings() throws Exception {
        int me = registerAndLogin("dr" + uniq());
        String friendName = "dt" + uniq();
        int friend = insertUser(friendName, "USER");
        update("INSERT INTO friendships (user_a, user_b, requested_by, status) VALUES (?, ?, ?, 'accepted')", Math.min(me, friend), Math.max(me, friend), me);
        String add = "INSERT INTO chat_messages (user_a, user_b, sender_id, recipient_id, body) VALUES (?, ?, ?, ?, 'Ahoj')";
        update(add, Math.min(me, friend), Math.max(me, friend), friend, me);
        driver.get(BASE_URL + "/zpravy?s=" + friendName);
        waitReady();
        js("window.__plays = []; SkeliSound.play = function (k) { window.__plays.push(k); return true; };");
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        wait.until(d -> !d.findElements(By.cssSelector(".chat-room[data-with] .chat-msg")).isEmpty());
        Thread.sleep(5000);
        assertEquals(0L, js("return window.__plays.length"), "stará zpráva nezvoní");

        update(add, Math.min(me, friend), Math.max(me, friend), friend, me);
        wait.until(d -> ((Number) js("return window.__plays.length")).intValue() == 1);
        assertEquals("message", js("return window.__plays[0]"));

        update("INSERT INTO chat_muted (user_id, other_id) VALUES (?, ?)", me, friend);
        update(add, Math.min(me, friend), Math.max(me, friend), friend, me);
        wait.until(d -> ((Number) js("return document.querySelectorAll('.chat-room[data-with] .chat-msg').length")).intValue() == 3);
        assertEquals(1L, js("return window.__plays.length"), "ztlumený nezvoní");
        update("DELETE FROM chat_muted WHERE user_id=?", me);

        update("INSERT INTO user_chat_prefs (user_id, status) VALUES (?, 'dnd')", me);
        update(add, Math.min(me, friend), Math.max(me, friend), friend, me);
        wait.until(d -> ((Number) js("return document.querySelectorAll('.chat-room[data-with] .chat-msg').length")).intValue() == 4);
        assertEquals(1L, js("return window.__plays.length"), "Nerušit nezvoní");
    }
}
