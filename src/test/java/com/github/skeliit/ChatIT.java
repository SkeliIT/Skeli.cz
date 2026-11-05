package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Chat: jen přátelé, cizí zprávy nejdou číst ani měnit, blokování, nahlášení a admin vidí jen nahlášené. */
class ChatIT extends UiTestSupport {

    private static void befriend(int a, int b) throws Exception {
        update("INSERT INTO friendships (user_a, user_b, requested_by, status) VALUES (?, ?, ?, 'accepted')", Math.min(a, b), Math.max(a, b), a);
    }

    private long send(String to, String body) throws Exception {
        driver.get(BASE_URL + "/nastaveni.jsp");
        waitReady();
        return browserPost("/api/chat", Map.of("action", "send", "with", to, "body", body), true);
    }

    private String read(String with) {
        return (String) ((JavascriptExecutor) driver).executeAsyncScript(
                "var done = arguments[arguments.length - 1]; fetch('/api/chat?with=' + encodeURIComponent(arguments[0])).then(function (r) { return r.text(); }).then(done);", with);
    }

    @Test
    @DisplayName("Přátelé si píšou: zvoneček bez textu zprávy, po přečtení zmizí, HTML se nevykreslí")
    void friendsChat() throws Exception {
        String a = "ca" + uniq(), b = "cb" + uniq();
        int aid = registerAndLogin(a);
        logout();
        int bid = registerAndLogin(b);
        logout();
        login(a, PASSWORD);

        assertEquals(403, send(b, "ahoj"), "cizímu napsat nejde");
        befriend(aid, bid);
        assertEquals(200, send(b, "<img src=x onerror=alert(1)> Ahoj"));
        assertEquals(400, send(b, "   "), "prázdná zpráva");
        assertTrue(exists("SELECT 1 FROM notifications WHERE user_id=? AND actor_id=? AND type='message'", bid, aid));

        logout();
        login(b, PASSWORD);
        driver.get(BASE_URL + "/zpravy");
        waitReady();
        assertEquals("1", driver.findElement(By.cssSelector(".chat-person .acct-count")).getText(), "nepřečtená");
        driver.get(BASE_URL + "/zpravy?s=" + a);
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> !d.findElements(By.cssSelector(".chat-text")).isEmpty());
        assertEquals("<img src=x onerror=alert(1)> Ahoj", driver.findElement(By.cssSelector(".chat-text")).getText(), "jen text");
        assertTrue(driver.findElements(By.cssSelector(".chat-msgs img")).isEmpty());
        assertFalse(exists("SELECT 1 FROM notifications WHERE user_id=? AND actor_id=? AND type='message'", bid, aid), "přečteno");

        // odpověď přes formulář, jak ji píše člověk
        driver.findElement(By.cssSelector(".chat-form textarea")).sendKeys("Čau 🐈");
        jsClick(driver.findElement(By.cssSelector(".chat-form button[type=submit]")));
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> !d.findElements(By.cssSelector(".chat-msg.mine")).isEmpty());
        assertEquals("Čau 🐈", driver.findElement(By.cssSelector(".chat-msg.mine .chat-text")).getText());
    }

    @Test
    @DisplayName("Známý odkaz má kartu a přehrávač až po kliknutí, cizí odkaz zůstane text. Smajlíky jdou vložit.")
    void linkCardsAndEmoji() throws Exception {
        String a = "ck" + uniq(), b = "cl" + uniq();
        int aid = registerAndLogin(a);
        logout();
        int bid = registerAndLogin(b);
        logout();
        befriend(aid, bid);
        login(a, PASSWORD);
        assertEquals(200, send(b, "https://youtu.be/dQw4w9WgXcQ"));
        assertEquals(200, send(b, "https://evil.com/watch?v=dQw4w9WgXcQ"));

        driver.get(BASE_URL + "/zpravy?s=" + b);
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> d.findElements(By.cssSelector(".chat-msg")).size() == 2);
        assertEquals(1, driver.findElements(By.cssSelector(".chat-embed")).size(), "jen známý odkaz");
        assertTrue(driver.findElements(By.cssSelector(".chat-embed iframe")).isEmpty(), "přehrávač ještě ne");
        assertTrue(driver.findElement(By.cssSelector(".chat-embed-play img")).getAttribute("src").contains("/yt-thumb/dQw4w9WgXcQ/"), "náhled přes náš server");
        jsClick(driver.findElement(By.cssSelector(".chat-embed-play")));
        assertTrue(driver.findElement(By.cssSelector(".chat-embed iframe")).getAttribute("src").startsWith("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"));

        jsClick(driver.findElement(By.cssSelector(".chat-emoji-btn")));
        jsClick(driver.findElement(By.cssSelector(".chat-emoji button")));
        assertEquals("🔥", driver.findElement(By.cssSelector(".chat-form textarea")).getAttribute("value"));
    }

    @Test
    @DisplayName("Nastavení: uloží jen povolené hodnoty, stav vidí jen přátelé, neviditelný je offline")
    void settingsAndStatus() throws Exception {
        String a = "cm" + uniq(), b = "cn" + uniq(), c = "co" + uniq();
        int aid = registerAndLogin(a);
        ((JavascriptExecutor) driver).executeAsyncScript("var done = arguments[arguments.length - 1]; fetch('/api/presence').then(function () { done(); });");
        driver.get(BASE_URL + "/nastaveni.jsp");
        waitReady();
        assertEquals(400, browserPost("/api/chat", Map.of("action", "prefs", "status", "online", "theme", "<script>", "font", "text", "size", "m"), true), "cizí hodnota neprojde");
        assertEquals(200, browserPost("/api/chat", Map.of("action", "prefs", "status", "busy", "theme", "blue", "font", "clean", "size", "l"), true));
        assertEquals("blue", queryString("SELECT theme FROM user_chat_prefs WHERE user_id=?", aid));
        driver.get(BASE_URL + "/zpravy");
        waitReady();
        assertEquals("blue", driver.findElement(By.cssSelector("main.chat-page")).getAttribute("data-chat-theme"));
        jsClick(driver.findElement(By.cssSelector(".chat-gear")));
        assertTrue(driver.findElement(By.cssSelector(".chat-settings")).isDisplayed(), "kolečko otevře nastavení");
        logout();

        int bid = registerAndLogin(b);
        befriend(aid, bid);
        driver.get(BASE_URL + "/nastaveni.jsp");
        waitReady();
        assertTrue(read(a).contains("\"state\":\"busy\""), "přítel vidí stav");
        update("UPDATE user_chat_prefs SET status='invisible' WHERE user_id=?", aid);
        assertTrue(read(a).contains("\"state\":\"offline\""), "neviditelný je offline");
        update("UPDATE user_chat_prefs SET status='busy' WHERE user_id=?", aid);
        logout();

        registerAndLogin(c);
        driver.get(BASE_URL + "/nastaveni.jsp");
        waitReady();
        assertTrue(read(a).contains("\"state\":null"), "cizí stav nevidí");
    }

    @Test
    @DisplayName("Cizí konverzaci nejde číst, cizí zprávu nejde smazat ani nahlásit")
    void foreignMessagesAreSafe() throws Exception {
        String a = "cc" + uniq(), b = "cd" + uniq(), c = "ce" + uniq();
        int aid = registerAndLogin(a);
        logout();
        int bid = registerAndLogin(b);
        logout();
        befriend(aid, bid);
        login(a, PASSWORD);
        assertEquals(200, send(b, "tajne"));
        long msg = queryInt("SELECT MAX(id) FROM chat_messages WHERE sender_id=?", aid);
        logout();

        registerAndLogin(c);
        driver.get(BASE_URL + "/nastaveni.jsp");
        waitReady();
        assertFalse(read(a).contains("tajne"), "třetí člověk nic nevidí");
        assertFalse(read(b).contains("tajne"));
        assertEquals(404, browserPost("/api/chat", Map.of("action", "delete", "id", String.valueOf(msg)), true));
        assertEquals(404, browserPost("/api/chat", Map.of("action", "report", "id", String.valueOf(msg), "reason", "spam"), true));
        assertEquals("tajne", queryString("SELECT body FROM chat_messages WHERE id=?", msg));
        logout();

        login(a, PASSWORD);
        driver.get(BASE_URL + "/nastaveni.jsp");
        waitReady();
        assertEquals(200, browserPost("/api/chat", Map.of("action", "delete", "id", String.valueOf(msg)), true), "vlastní jde");
        assertEquals("", queryString("SELECT body FROM chat_messages WHERE id=?", msg), "text se nikde nenechává");
    }

    @Test
    @DisplayName("Blokování a vypnuté zprávy: psát nejde a chyba neprozradí proč")
    void blockAndOptOut() throws Exception {
        String a = "cf" + uniq(), b = "cg" + uniq();
        int aid = registerAndLogin(a);
        logout();
        int bid = registerAndLogin(b);
        logout();
        befriend(aid, bid);
        login(a, PASSWORD);
        assertEquals(200, send(b, "prvni"));

        update("UPDATE users SET chat_open=0 WHERE id=?", bid);
        assertEquals(403, send(b, "druha"), "vypnuté zprávy");
        update("UPDATE users SET chat_open=1 WHERE id=?", bid);
        assertEquals(200, send(b, "treti"));

        logout();
        login(b, PASSWORD);
        driver.get(BASE_URL + "/nastaveni.jsp");
        waitReady();
        assertEquals(302, browserPost("/profile/friends", Map.of("action", "block", "name", a), true));
        driver.get(BASE_URL + "/zpravy");
        waitReady();
        assertTrue(driver.findElements(By.cssSelector(".chat-person[href*='" + a + "']")).isEmpty(), "koho zablokuju, toho v seznamu nemám");
        logout();

        login(a, PASSWORD);
        assertEquals(403, send(b, "ctvrta"), "zablokovaný nenapíše");
        driver.get(BASE_URL + "/nastaveni.jsp");
        waitReady();
        assertTrue(read(b).contains("treti"), "historii vidí dál, blok se tím neprozradí");
        assertTrue(read(b).contains("\"canSend\":false"));
    }

    @Test
    @DisplayName("Nahlášení: admin vidí jen nahlášenou zprávu, i kdyby ji odesílatel smazal, a může ji smazat")
    void reportGoesToAdmin() throws Exception {
        String a = "ch" + uniq(), b = "ci" + uniq(), admin = "cj" + uniq();
        int aid = registerAndLogin(a);
        logout();
        int bid = registerAndLogin(b);
        logout();
        befriend(aid, bid);
        login(a, PASSWORD);
        assertEquals(200, send(b, "ProKontrolu"));
        assertEquals(200, send(b, "Nenahlasena"));
        long msg = queryInt("SELECT MIN(id) FROM chat_messages WHERE sender_id=?", aid);
        logout();

        login(b, PASSWORD);
        driver.get(BASE_URL + "/nastaveni.jsp");
        waitReady();
        assertEquals(200, browserPost("/api/chat", Map.of("action", "report", "id", String.valueOf(msg), "reason", "abuse"), true));
        logout();

        login(a, PASSWORD);
        driver.get(BASE_URL + "/nastaveni.jsp");
        waitReady();
        browserPost("/api/chat", Map.of("action", "delete", "id", String.valueOf(msg)), true);
        logout();

        insertUser(admin, "ADMIN");
        login(admin, PASSWORD);
        driver.get(BASE_URL + "/admin_users.jsp");
        waitReady();
        String page = driver.getPageSource();
        assertTrue(page.contains("ProKontrolu"), "kopie zůstala");
        assertFalse(page.contains("Nenahlasena"), "nenahlášenou zprávu admin nevidí");
        int report = queryInt("SELECT id FROM chat_reports WHERE message_id=?", msg);
        assertEquals(302, browserPost("/admin/chat-report", Map.of("action", "dismiss", "id", String.valueOf(report)), true));
        assertTrue(exists("SELECT 1 FROM chat_reports WHERE id=? AND resolved_at IS NOT NULL", report));
    }
}
