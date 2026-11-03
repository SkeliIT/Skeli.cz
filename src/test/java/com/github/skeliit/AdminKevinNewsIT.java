package com.github.skeliit;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** Kevin v adminu hlásí, co je nového od minula: nový uživatel se jménem a cizí komentář, ne to, co udělal admin sám. */
class AdminKevinNewsIT extends UiTestSupport {
    @Test
    @SuppressWarnings("unchecked")
    void reportsNewUsersAndCommentsSinceLastTime() throws Exception {
        JavascriptExecutor js = (JavascriptExecutor) driver;
        long start = System.currentTimeMillis() - 2000;
        String newbie = "nov" + uniq();
        int someone = registerAndLogin(newbie);
        logout();
        int admin = registerAndLogin("adm" + uniq());
        String adminName = queryString("SELECT username FROM users WHERE id=?", admin);
        update("UPDATE users SET role='ADMIN' WHERE id=?", admin);
        logout();
        login(adminName, PASSWORD);
        update("INSERT INTO video_comments (user_id, youtube_id, content) VALUES (?, 'testklip123', 'cizí')", someone);
        update("INSERT INTO video_comments (user_id, youtube_id, content) VALUES (?, 'testklip123', 'můj')", admin);
        try {
            js.executeScript("localStorage.setItem('cookieConsent','true'); localStorage.setItem('sp_min','1');"
                    + "localStorage.setItem('kevinAdminSeen', '" + start + "'); sessionStorage.removeItem('kevinAdmin'); sessionStorage.removeItem('kevinAdminSince');");
            Map<String, Object> s = (Map<String, Object>) js.executeAsyncScript("var done = arguments[arguments.length - 1];"
                    + "fetch('/admin/kevin?since=" + start + "', {credentials: 'same-origin'}).then(function (r) { return r.json(); }).then(done);");
            Map<String, Object> fresh = (Map<String, Object>) s.get("fresh");
            assertEquals(1L, ((Number) fresh.get("users")).longValue(), "jeden cizí nový uživatel (admin sám se nepočítá), " + fresh);
            assertEquals(newbie, fresh.get("newUser"), "a jeho jméno");
            assertEquals(1L, ((Number) fresh.get("comments")).longValue(), "jen cizí komentář, " + fresh);
            assertFalse(s.toString().contains("@example.com"), "žádné e-maily");

            // sám po příchodu do adminu: hlášení ve stránce (v bublině, nebo čeká za zlatou tečkou na tlapce)
            driver.get(BASE_URL + "/admin.jsp");
            new WebDriverWait(driver, Duration.ofSeconds(15)).until(d -> Boolean.TRUE.equals(js.executeScript(
                    "var b = document.querySelector('.kevin-bubble'), p = document.querySelector('.kevin-paw');"
                            + "return !!(b && !b.hidden && b.textContent.indexOf(arguments[0]) >= 0) || !!(p && p.classList.contains('has-news'));", newbie)));
            System.out.println("KEVIN hlásí: " + js.executeScript("var b = document.querySelector('.kevin-bubble'); return b && !b.hidden ? b.textContent : 'zlatá tečka na tlapce'"));

            // neplatný čas nevadí a stránka bez přihlášení je dál zavřená
            assertEquals(200, httpStatus("/admin/kevin?since=nesmysl"));
            logout();
            assertEquals(403, httpStatus("/admin/kevin"));
        } finally {
            update("DELETE FROM video_comments WHERE youtube_id='testklip123'");
        }
    }
}
