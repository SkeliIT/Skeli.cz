package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Hledat přátele na profilu: je tam jen ten, kdo si to zapnul; blokování a smazání člověka skryje; v menu to není. */
class PeopleIT extends UiTestSupport {
    private static final String FIND = "/uzivatel.jsp?najit=1#pratele";

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

        driver.get(BASE_URL + FIND);
        waitReady();
        assertFalse(listed(b), "kdo si to nezapnul, tu není");
        assertEquals(0, queryInt("SELECT community_public FROM users WHERE id=?", aid), "výchozí je vypnuto");

        update("UPDATE users SET community_public = 1, profile_public = 1 WHERE id=?", bid);
        update("UPDATE users SET community_public = 1, profile_public = 0 WHERE id=?", cid);
        driver.navigate().refresh();
        waitReady();
        assertTrue(listed(b));
        assertTrue(listed(c));
        assertFalse(driver.findElements(By.cssSelector("a.people-name[href*='" + b + "']")).isEmpty(), "veřejný profil má odkaz");
        assertTrue(driver.findElements(By.cssSelector("a.people-name[href*='" + c + "']")).isEmpty(), "soukromý profil odkaz nemá");
        assertFalse(listed(a), "sám sebe nevidím");

        // žádost o přátelství přímo ze seznamu: panel zůstane otevřený
        clickAndWaitReload(driver.findElement(By.cssSelector(".people-card form button")), false);
        assertTrue(exists("SELECT 1 FROM friendships WHERE requested_by=? AND status='pending'", aid), "žádost odešla");
        assertTrue(driver.getCurrentUrl().contains("najit=1"), driver.getCurrentUrl());
        assertTrue(driver.findElement(By.cssSelector(".friend-find")).getAttribute("open") != null, "panel je pořád otevřený");

        // zapnutí a vypnutí sebe sama
        clickAndWaitReload(driver.findElement(By.cssSelector(".people-me button")), false);
        assertEquals(1, queryInt("SELECT community_public FROM users WHERE id=?", aid));
        clickAndWaitReload(driver.findElement(By.cssSelector(".people-me button")), false);
        assertEquals(0, queryInt("SELECT community_public FROM users WHERE id=?", aid));
    }

    @Test
    @DisplayName("Zablokovaný se v seznamu nevidí ani jedním směrem, zablokovaný adminem taky ne")
    void hiddenWhenBlocked() throws Exception {
        String a = "pd" + uniq(), b = "pe" + uniq(), c = "pf" + uniq();
        int aid = registerAndLogin(a);
        int bid = insertUser(b, "USER");
        int cid = insertUser(c, "USER");
        update("UPDATE users SET community_public = 1 WHERE id IN (?, ?)", bid, cid);
        update("INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)", bid, aid);
        update("UPDATE users SET blocked_at = NOW() WHERE id=?", cid);
        driver.get(BASE_URL + FIND);
        waitReady();
        assertFalse(listed(b), "kdo mě zablokoval, toho nevidím");
        assertFalse(listed(c), "účet zablokovaný adminem tu není");
    }

    @Test
    @DisplayName("Tlačítko: kdo má přátele, vidí panel zavřený a otevře ho kliknutím; bez přátel je otevřený sám")
    void buttonOpensThePanel() throws Exception {
        String a = "ph" + uniq(), b = "pi" + uniq();
        int aid = registerAndLogin(a);
        int bid = insertUser(b, "USER");
        driver.get(BASE_URL + "/uzivatel.jsp#pratele");
        waitReady();
        assertTrue(driver.findElement(By.cssSelector(".friend-find")).getAttribute("open") != null, "nikoho nemám: panel je otevřený");

        update("INSERT INTO friendships (user_a, user_b, requested_by, status) VALUES (?, ?, ?, 'accepted')", Math.min(aid, bid), Math.max(aid, bid), bid);
        driver.navigate().refresh();
        waitReady();
        assertTrue(driver.findElement(By.cssSelector(".friend-find")).getAttribute("open") == null, "mám přátele: panel je zavřený");
        assertFalse(driver.findElement(By.cssSelector(".friend-search input[name=fq]")).isDisplayed());
        jsClick(driver.findElement(By.cssSelector(".friend-find > summary")));
        assertTrue(driver.findElement(By.cssSelector(".friend-search input[name=fq]")).isDisplayed(), "kliknutí panel otevřelo");
    }

    @Test
    @DisplayName("Telefon: nic nepřetéká, v menu to není a stará adresa neexistuje")
    void phone() throws Exception {
        registerAndLogin("pg" + uniq());
        driver.manage().window().setSize(new org.openqa.selenium.Dimension(500, 844));
        driver.get(BASE_URL + FIND);
        waitReady();
        assertEquals(Boolean.TRUE, ((JavascriptExecutor) driver).executeScript("return document.documentElement.scrollWidth <= innerWidth"));
        assertTrue(driver.findElements(By.cssSelector("#navSubCommunity a[href$='/lide']")).isEmpty(), "v menu nesmí být");
        java.net.HttpURLConnection old = (java.net.HttpURLConnection) java.net.URI.create(BASE_URL + "/lide").toURL().openConnection();
        old.setInstanceFollowRedirects(false);
        assertEquals(404, old.getResponseCode());
        old.disconnect();
    }
}
