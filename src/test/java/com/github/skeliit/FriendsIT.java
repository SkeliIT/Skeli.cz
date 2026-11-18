package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Přátelé: žádost, zvoneček, přijetí, odebrání, vypnuté žádosti a blokování. Profil po částech. */
class FriendsIT extends UiTestSupport {

    private WebElement friendForm(String action) {
        return driver.findElement(By.cssSelector("form[action='/profile/friends'] input[name=action][value=" + action + "]"))
                .findElement(By.xpath(".."));
    }

    private void submitForm(WebElement form) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].submit()", form);
        waitReady();
    }

    private void openPlayer(String name) {
        driver.get(BASE_URL + "/hrac/" + name);
        waitReady();
    }

    @Test
    @DisplayName("Žádost, zvoneček, přijetí a odebrání")
    void requestAcceptRemove() throws Exception {
        String a = "fa" + uniq(), b = "fb" + uniq();
        int bid = registerAndLogin(b);
        update("UPDATE users SET profile_public=1 WHERE id=?", bid);
        logout();
        int aid = registerAndLogin(a);
        update("UPDATE users SET profile_public=1 WHERE id=?", aid);

        openPlayer(b);
        submitForm(friendForm("request"));
        assertTrue(driver.getCurrentUrl().contains("/hrac/" + b), "návrat na profil: " + driver.getCurrentUrl());
        assertTrue(exists("SELECT 1 FROM friendships WHERE status='pending' AND requested_by=?", aid));
        assertTrue(exists("SELECT 1 FROM notifications WHERE user_id=? AND actor_id=? AND type='friend_request'", bid, aid));
        assertFalse(driver.findElement(By.cssSelector(".player-state")).getText().isBlank());

        logout();
        login(b, PASSWORD);
        driver.get(BASE_URL + "/uzivatel.jsp#pratele");
        waitReady();
        assertTrue(driver.findElement(By.id("pratele")).isDisplayed());
        assertFalse(driver.findElement(By.id("prehled")).isDisplayed(), "vidět je jen jedna část");
        assertTrue(driver.findElement(By.id("pratele")).getText().contains(a), "žádost je v seznamu");
        String json = (String) ((JavascriptExecutor) driver).executeAsyncScript(
                "var done = arguments[arguments.length - 1]; fetch('/api/notifications').then(function (r) { return r.text(); }).then(done);");
        assertTrue(json.contains("/uzivatel.jsp#pratele"), "zvoneček vede na Přátele: " + json);
        submitForm(friendForm("accept"));
        assertTrue(driver.getCurrentUrl().contains("#pratele"), driver.getCurrentUrl());
        assertTrue(exists("SELECT 1 FROM friendships WHERE status='accepted' AND requested_by=?", aid));
        assertTrue(exists("SELECT 1 FROM notifications WHERE user_id=? AND actor_id=? AND type='friend_accept'", aid, bid));
        assertTrue(driver.findElement(By.cssSelector("#pratele a.friend-who")).getText().contains(a));
        // u přítele je stav jako v chatu: tečka u fotky a slovo pod jménem (online, offline…)
        assertFalse(driver.findElement(By.cssSelector("#pratele .friend-state")).getText().isBlank(), "stav přítele");
        assertFalse(driver.findElements(By.cssSelector("#pratele .friend-av .chat-state-dot")).isEmpty(), "tečka u fotky");

        submitForm(friendForm("remove"));
        assertFalse(exists("SELECT 1 FROM friendships WHERE requested_by=?", aid));
    }

    @Test
    @DisplayName("Našeptávač: ukáže fotku a jméno, přidá přítele, soukromý profil jen podle celého jména")
    void suggestFindsPeople() throws Exception {
        String stem = "fs" + uniq();
        String pub = stem + "a", priv = stem + "b";
        int pubId = insertUser(pub, "USER");
        int privId = insertUser(priv, "USER");
        update("UPDATE users SET profile_public=1 WHERE id=?", pubId);
        update("UPDATE users SET profile_public=0 WHERE id=?", privId);
        int me = registerAndLogin("fm" + uniq());
        driver.get(BASE_URL + "/uzivatel.jsp#pratele");
        waitReady();
        driver.findElement(By.cssSelector(".friend-search input[name=fq]")).sendKeys(stem);
        new org.openqa.selenium.support.ui.WebDriverWait(driver, java.time.Duration.ofSeconds(10))
                .until(d -> !d.findElements(By.cssSelector(".friend-suggest-row")).isEmpty());
        assertEquals(1, driver.findElements(By.cssSelector(".friend-suggest-row")).size(), "soukromý se podle začátku neukáže");
        assertTrue(driver.findElement(By.cssSelector(".friend-suggest-row")).getText().contains(pub));
        assertFalse(driver.findElements(By.cssSelector(".friend-suggest-row img")).isEmpty(), "s fotkou");
        jsClick(driver.findElement(By.cssSelector(".friend-suggest-row button")));
        new org.openqa.selenium.support.ui.WebDriverWait(driver, java.time.Duration.ofSeconds(10))
                .until(d -> exists0(me));
        driver.findElement(By.cssSelector(".friend-search input[name=fq]")).sendKeys("b");
        new org.openqa.selenium.support.ui.WebDriverWait(driver, java.time.Duration.ofSeconds(10))
                .until(d -> d.findElement(By.cssSelector(".friend-suggest")).getText().contains(priv));
    }

    private static boolean exists0(int me) {
        try {
            return exists("SELECT 1 FROM friendships WHERE requested_by=? AND status='pending'", me);
        } catch (java.sql.SQLException e) {
            return false;
        }
    }

    @Test
    @DisplayName("Vypnuté žádosti: nová žádost neprojde")
    void requestsCanBeTurnedOff() throws Exception {
        String a = "fc" + uniq(), b = "fd" + uniq();
        int bid = insertUser(b, "USER");
        update("UPDATE users SET profile_public=1, friend_requests=0 WHERE id=?", bid);
        int aid = registerAndLogin(a);
        openPlayer(b);
        submitForm(friendForm("request"));
        assertTrue(driver.getCurrentUrl().contains("friend=closed"), driver.getCurrentUrl());
        assertFalse(exists("SELECT 1 FROM friendships WHERE requested_by=?", aid));
    }

    @Test
    @DisplayName("Soukromému profilu jde poslat žádost; odmítnutí, nová žádost a tiché zablokování")
    void privateProfileAndQuietBlock() throws Exception {
        String a = "fg" + uniq(), b = "fh" + uniq();
        int aid = registerAndLogin(a);
        logout();
        int bid = registerAndLogin(b);
        update("UPDATE users SET profile_public=0 WHERE id=?", bid);
        logout();
        login(a, PASSWORD);

        // soukromý profil se najde jen podle celého jména a žádost mu jde poslat
        driver.get(BASE_URL + "/uzivatel.jsp?fq=" + b.substring(0, b.length() - 2) + "#pratele");
        waitReady();
        assertTrue(driver.findElements(By.cssSelector("#pratele .friend-row input[name=name][value='" + b + "']")).isEmpty(), "podle začátku jména ne");
        driver.get(BASE_URL + "/uzivatel.jsp?fq=" + b + "#pratele");
        waitReady();
        submitForm(friendForm("request"));
        assertTrue(exists("SELECT 1 FROM friendships WHERE requested_by=? AND status='pending'", aid));
        assertTrue(exists("SELECT 1 FROM notifications WHERE user_id=? AND actor_id=? AND type='friend_request'", bid, aid));

        // odmítne: žádost i upozornění zmizí a jde poslat znovu
        logout();
        login(b, PASSWORD);
        driver.get(BASE_URL + "/uzivatel.jsp#pratele");
        waitReady();
        submitForm(friendForm("decline"));
        assertFalse(exists("SELECT 1 FROM friendships WHERE requested_by=?", aid));
        assertFalse(exists("SELECT 1 FROM notifications WHERE user_id=? AND actor_id=?", bid, aid));
        logout();
        login(a, PASSWORD);
        driver.get(BASE_URL + "/uzivatel.jsp?fq=" + b + "#pratele");
        waitReady();
        submitForm(friendForm("request"));

        // zablokuje: už ho to neotravuje
        logout();
        login(b, PASSWORD);
        driver.get(BASE_URL + "/uzivatel.jsp#pratele");
        waitReady();
        submitForm(friendForm("block"));
        driver.get(BASE_URL + "/uzivatel.jsp#pratele");
        waitReady();
        assertTrue(driver.findElements(By.cssSelector("input[name=action][value=decline]")).isEmpty(), "žádost se mu neukazuje");
        assertFalse(exists("SELECT 1 FROM notifications WHERE user_id=? AND actor_id=?", bid, aid));

        // ten druhý dál vidí nevyřízenou žádost, bez odkazu na profil, a další pokus nic neudělá
        logout();
        login(a, PASSWORD);
        driver.get(BASE_URL + "/uzivatel.jsp#pratele");
        waitReady();
        assertTrue(driver.findElements(By.cssSelector("input[name=action][value=cancel]")).size() == 1, "žádost dál čeká");
        assertTrue(driver.findElements(By.cssSelector("a.friend-who[href*='" + b + "']")).isEmpty(), "bez odkazu");
        assertFalse(exists("SELECT 1 FROM notifications WHERE user_id=? AND actor_id=?", bid, aid));

        // po odblokování žádost nevyskočí
        logout();
        login(b, PASSWORD);
        driver.get(BASE_URL + "/uzivatel.jsp#pratele");
        waitReady();
        submitForm(friendForm("unblock"));
        assertFalse(exists("SELECT 1 FROM friendships WHERE requested_by=?", aid));
    }

    @Test
    @DisplayName("Zablokovaný neuvidí můj profil, nenajde mě a nepošle žádost")
    void blockHidesProfile() throws Exception {
        String a = "fe" + uniq(), b = "ff" + uniq();
        int aid = registerAndLogin(a);
        update("UPDATE users SET profile_public=1 WHERE id=?", aid);
        logout();
        int bid = registerAndLogin(b);
        update("UPDATE users SET profile_public=1 WHERE id=?", bid);

        openPlayer(a);                       // b zablokuje a
        submitForm(friendForm("block"));
        assertTrue(exists("SELECT 1 FROM user_blocks WHERE blocker_id=? AND blocked_id=?", bid, aid));

        logout();
        login(a, PASSWORD);
        Long status = (Long) ((JavascriptExecutor) driver).executeAsyncScript(
                "var done = arguments[arguments.length - 1]; fetch(arguments[0]).then(function (r) { done(r.status); });", "/hrac/" + b);
        assertEquals(404L, status, "blokující není vidět");
        driver.get(BASE_URL + "/uzivatel.jsp?fq=" + b + "#pratele");
        waitReady();
        assertTrue(driver.findElements(By.cssSelector("#pratele a.friend-who")).isEmpty(), "hledání ho nenajde");

        logout();
        login(b, PASSWORD);
        driver.get(BASE_URL + "/uzivatel.jsp#pratele");
        waitReady();
        submitForm(friendForm("unblock"));
        assertFalse(exists("SELECT 1 FROM user_blocks WHERE blocker_id=?", bid));
    }

    @Test
    @DisplayName("Profil po částech: odkaz na #odznaky otevře Hry, bez cizích věcí v Přehledu")
    void tabsFollowTheAnchor() throws Exception {
        registerAndLogin("fg" + uniq());
        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        assertTrue(driver.findElement(By.id("prehled")).isDisplayed());
        assertFalse(driver.findElement(By.id("hry")).isDisplayed());
        jsClick(driver.findElement(By.cssSelector(".profile-tabs a[href='#hry']")));
        assertTrue(driver.findElement(By.id("pong")).isDisplayed(), "CatSmash je v Hrách");
        assertFalse(driver.findElement(By.id("prehled")).isDisplayed());
        driver.get(BASE_URL + "/uzivatel.jsp#odznaky");
        waitReady();
        assertTrue(driver.findElement(By.id("odznaky")).isDisplayed(), "kotva uvnitř části ji otevře");
    }
}
