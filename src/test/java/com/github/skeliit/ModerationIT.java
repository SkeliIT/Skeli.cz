package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Moderace: zablokovaný účet se nepřihlásí a jeho profil není vidět, nahlášený profil dorazí adminovi. */
class ModerationIT extends UiTestSupport {

    private void becomeAdmin(int id) throws Exception {
        update("UPDATE users SET role='ADMIN' WHERE id=?", id);
    }

    @Test
    @DisplayName("Admin zablokuje účet: nepřihlásí se a profil zmizí, po odblokování zase jde")
    void blockAndUnblock() throws Exception {
        String victim = "mb" + uniq();
        int vid = insertUser(victim, "USER");
        update("UPDATE users SET profile_public=1 WHERE id=?", vid);
        String adminName = "ma" + uniq();
        int aid = registerAndLogin(adminName);
        becomeAdmin(aid);
        logout();
        login(adminName, PASSWORD);

        driver.get(BASE_URL + "/admin_users.jsp");
        waitReady();
        JavascriptExecutor js = (JavascriptExecutor) driver;
        WebElement row = driver.findElement(By.xpath("//tr[td[contains(., '" + victim + "')]]"));
        js.executeScript("arguments[0].open = true", row.findElement(By.cssSelector("details.user-block")));
        WebElement form = row.findElement(By.cssSelector("details.user-block form"));
        form.findElement(By.name("reason")).sendKeys("zkouska <b>duvodu</b>");
        js.executeScript("arguments[0].submit()", form);
        waitReady();
        assertTrue(exists("SELECT 1 FROM users WHERE id=? AND blocked_at IS NOT NULL", vid));
        assertEquals(404, statusOf("/hrac/" + victim), "profil zablokovaného není vidět");

        logout();
        login(victim, PASSWORD);
        assertTrue(driver.getCurrentUrl().contains("blocked=1"), "zablokovaný se nepřihlásí: " + driver.getCurrentUrl());
        assertTrue(driver.findElements(By.cssSelector("form.logout-form")).isEmpty());

        update("UPDATE users SET blocked_at=NULL, blocked_reason=NULL WHERE id=?", vid);
        login(victim, PASSWORD);
        assertFalse(driver.getCurrentUrl().contains("blocked=1"), "po odblokování se přihlásí");
    }

    @Test
    @DisplayName("Nahlášení cizího profilu dorazí adminovi a jde vyřídit")
    void reportReachesAdmin() throws Exception {
        String target = "mt" + uniq();
        int tid = insertUser(target, "USER");
        update("UPDATE users SET profile_public=1 WHERE id=?", tid);
        String reporter = "mr" + uniq();
        int rid = registerAndLogin(reporter);

        driver.get(BASE_URL + "/hrac/" + target);
        waitReady();
        JavascriptExecutor js = (JavascriptExecutor) driver;
        js.executeScript("document.querySelector('details.player-more').open = true");
        WebElement form = driver.findElement(By.cssSelector("form.player-report"));
        form.findElement(By.name("note")).sendKeys("<script>poznamka</script>");
        js.executeScript("arguments[0].submit()", form);
        waitReady();
        assertTrue(driver.getCurrentUrl().contains("reported=1"), driver.getCurrentUrl());
        assertTrue(exists("SELECT 1 FROM user_reports WHERE reported_id=? AND reporter_id=? AND resolved_at IS NULL", tid, rid));

        becomeAdmin(rid);
        logout();
        login(reporter, PASSWORD);
        driver.get(BASE_URL + "/admin_users.jsp#reports");
        waitReady();
        WebElement card = driver.findElement(By.id("reports"));
        assertTrue(card.getText().contains(target), "admin vidí nahlášeného");
        assertTrue(card.getText().contains("<script>poznamka</script>"), "poznámka je escapovaná");
        WebElement resolve = card.findElements(By.cssSelector("form")).stream()
                .filter(f -> f.getAttribute("innerHTML").contains("resolve_report")).findFirst().orElseThrow();
        js.executeScript("arguments[0].submit()", resolve);
        waitReady();
        assertTrue(exists("SELECT 1 FROM user_reports WHERE reported_id=? AND resolved_at IS NOT NULL", tid));
    }

    /** Stav stránky v okně přihlášeného člověka (fetch má jeho cookie). */
    private long statusOf(String path) {
        return (Long) ((JavascriptExecutor) driver).executeAsyncScript(
                "var done = arguments[arguments.length - 1]; fetch(arguments[0], {redirect:'manual'}).then(function (r) { done(r.status); });", path);
    }
}
