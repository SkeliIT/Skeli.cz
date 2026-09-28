package com.github.skeliit;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.JavascriptExecutor;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The header must fit in every language: longer words (German "Neuigkeiten",
 * Ukrainian "Зареєструватися") used to push the register button off the right edge.
 */
class HeaderFitIT extends UiTestSupport {

    private static final int[] WIDTHS = {1600, 1440, 1366, 1320, 1280, 1200, 1160, 1100, 1040, 1025, 1024, 960, 800, 600, 420, 360};

    @Test
    void headerFitsInEveryLanguageAndWidth() {
        List<String> problems = new ArrayList<>();
        for (String lang : I18n.SUPPORTED_LANGS) {
            driver.get(BASE_URL + "/index.jsp?lang=" + lang);
            for (int w : WIDTHS) {
                driver.manage().window().setSize(new Dimension(w, 800));
                // how far the last visible control of the bar sticks out past the window
                Object over = ((JavascriptExecutor) driver).executeScript(
                        "const vw = document.documentElement.clientWidth;"
                                + "const els = [...document.querySelectorAll('#siteHeader .header-inner > *, #siteHeader .top-controls > *, #siteHeader .main-nav > a')]"
                                + "  .filter(e => e.offsetParent !== null && getComputedStyle(e).position !== 'absolute');"
                                + "let worst = 0;"
                                + "for (const e of els) { const r = e.getBoundingClientRect(); if (r.width && r.right - vw > worst) worst = r.right - vw; }"
                                + "const nav = document.getElementById('mainNav');"
                                + "const wraps = getComputedStyle(nav).position !== 'absolute' && nav.scrollWidth > nav.clientWidth + 1;"
                                + "return Math.round(worst) + (wraps ? 1000 : 0);");
                long px = ((Number) over).longValue();
                if (px > 0) problems.add(lang + " @" + w + "px: " + (px >= 1000 ? "menu clipped, " : "") + (px % 1000) + "px past the edge");
            }
        }
        driver.get(BASE_URL + "/index.jsp?lang=cs");
        assertTrue(problems.isEmpty(), "header does not fit: " + problems);
    }
}
