package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.sql.SQLException;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/** Visit counting (VisitStats via js/presence.js). Requires a running local instance, see {@link UiTestSupport}. */
public class VisitStatsIT extends UiTestSupport {

    private static int views(int lyricId) throws SQLException {
        return queryInt("SELECT COALESCE((SELECT views FROM lyric_views WHERE lyric_id=?), 0)", lyricId);
    }

    @Test
    @DisplayName("A lyric counts once per visitor and day, however often it is opened")
    void lyricCountsOncePerVisitorAndDay() throws Exception {
        registerAndLogin("vs" + uniq()); // a new account = a visitor not seen today
        int lyricId = queryInt("SELECT MIN(id) FROM lyrics");
        int before = views(lyricId);

        driver.get(BASE_URL + "/lyrics/" + lyricId);
        new WebDriverWait(driver, Duration.ofSeconds(8)).until(d -> {
            try { return views(lyricId) == before + 1; } catch (SQLException e) { return false; }
        });

        driver.get(BASE_URL + "/lyrics/" + lyricId);
        driver.get(BASE_URL + "/texty.jsp");
        driver.get(BASE_URL + "/lyrics/" + lyricId);
        Thread.sleep(1500);
        assertEquals(before + 1, views(lyricId), "reloads and coming back don't count again");
    }

    @Test
    @DisplayName("The footer shows how many people are on the site")
    void footerShowsPeopleOnline() {
        driver.get(BASE_URL + "/index.jsp");
        WebElement box = new WebDriverWait(driver, Duration.ofSeconds(8))
                .until(d -> d.findElements(By.cssSelector("#onlineNow:not([hidden])")).stream().findFirst().orElse(null));
        int n = Integer.parseInt(box.findElement(By.tagName("b")).getText().trim());
        assertTrue(n >= 1, "at least this visitor: " + n);
    }
}
