package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Lidé: v seznamu je jen ten, kdo si to zapnul; blokování a smazání člověka skryje; bez přihlášení nic. */
class PeopleIT extends UiTestSupport {

    private boolean listed(String name) {
        return !driver.findElements(By.xpath("//li[contains(@class,'people-card')]//*[text()='" + name + "']")).isEmpty();
    }

    @Test
    @DisplayName("Výchozí stav je mimo seznam, zapnutí jedním klikem, soukromý profil bez odkazu, žádost jde poslat")
    void optIn() throws Exception {
        String a = "pa" + uniq(), b = "pb" + uniq(), c = "pc" + uniq();
        int aid = registerAndLogin(a);
        int bid = insertUser(b, "USER");
        int cid = insertUser(c, "USER");
        update("UPDATE users SET email_verified_at = NOW() WHERE id=?", aid);

        driver.get(BASE_URL + "/lide");
        waitReady();
        assertFalse(listed(b), "kdo si to nezapnul, tu není");
        assertEquals(0, queryInt("SELECT community_public FROM users WHERE id=?", aid), "výchozí je vypnuto");

        update("UPDATE users SET community_public = 1, profile_public = 1 WHERE id=?", bid);
        update("UPDATE users SET community_public = 1, profile_public = 0 WHERE id=?", cid);
        driver.get(BASE_URL + "/lide");
        waitReady();
        assertTrue(listed(b));
        assertTrue(listed(c));
        assertFalse(driver.findElements(By.cssSelector("a.people-name[href*='" + b + "']")).isEmpty(), "veřejný profil má odkaz");
        assertTrue(driver.findElements(By.cssSelector("a.people-name[href*='" + c + "']")).isEmpty(), "soukromý profil odkaz nemá");
        assertFalse(listed(a), "sám sebe nevidím");

        // hledání podle začátku jména
        driver.get(BASE_URL + "/lide?q=" + b);
        waitReady();
        assertTrue(listed(b));
        assertFalse(listed(c));

        // žádost o přátelství přímo ze seznamu
        clickAndWaitReload(driver.findElement(By.cssSelector(".people-card form button")), false);
        assertTrue(exists("SELECT 1 FROM friendships WHERE requested_by=? AND status='pending'", aid), "žádost odešla");
        assertTrue(driver.getCurrentUrl().contains("/lide"), "zůstal jsem v seznamu: " + driver.getCurrentUrl());

        // zapnutí sebe sama
        driver.get(BASE_URL + "/lide");
        waitReady();
        clickAndWaitReload(driver.findElement(By.cssSelector(".people-me button")), false);
        assertEquals(1, queryInt("SELECT community_public FROM users WHERE id=?", aid));
    }

    @Test
    @DisplayName("Zablokovaný se v seznamu nevidí ani jedním směrem, zablokovaný adminem taky ne; nepřihlášený jde na přihlášení")
    void hiddenWhenBlocked() throws Exception {
        String a = "pd" + uniq(), b = "pe" + uniq(), c = "pf" + uniq();
        int aid = registerAndLogin(a);
        int bid = insertUser(b, "USER");
        int cid = insertUser(c, "USER");
        update("UPDATE users SET community_public = 1 WHERE id IN (?, ?)", bid, cid);
        update("INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)", bid, aid);
        update("UPDATE users SET blocked_at = NOW() WHERE id=?", cid);
        driver.get(BASE_URL + "/lide");
        waitReady();
        assertFalse(listed(b), "kdo mě zablokoval, toho nevidím");
        assertFalse(listed(c), "účet zablokovaný adminem tu není");
        driver.get(BASE_URL + "/lide?q=" + b);
        waitReady();
        assertFalse(listed(b), "ani hledáním");
        logout();
        driver.get(BASE_URL + "/lide");
        waitReady();
        assertTrue(driver.getCurrentUrl().contains("login.jsp"), driver.getCurrentUrl());
    }

    @Test
    @DisplayName("Telefon: stránka nepřetéká a odkaz je v menu")
    void phone() throws Exception {
        registerAndLogin("pg" + uniq());
        driver.manage().window().setSize(new org.openqa.selenium.Dimension(500, 844));
        driver.get(BASE_URL + "/lide");
        waitReady();
        assertEquals(Boolean.TRUE, ((JavascriptExecutor) driver).executeScript("return document.documentElement.scrollWidth <= innerWidth"));
        assertFalse(driver.findElements(By.cssSelector("#navSubCommunity a[href$='/lide']")).isEmpty(), "Lidé v menu");
    }
}
