package com.github.skeliit;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.chrome.ChromeDriver;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Map;

/**
 * Snímky stránek pro kontrolu vzhledu (hlavně na GitHubu, .github/workflows/ui-testy.yml, ať se nezatěžuje Skeliho PC):
 * -Dpages=about.jsp,donate.jsp (bez úvodního lomítka) → target/shots/snimky/<stránka>-<tmavý|světlý>-<šířka>.png,
 * telefon 390 px a PC 1440 px, tmavý i světlý režim; -Dfull=true celá stránka; -Dslide=3 vynutí fotku pozadí
 * (1 skull, 2 mic, 3 square, 4 walker). Bez -Dpages se test přeskočí (při spuštění všech *IT nic nefotí).
 */
class SnimkyIT extends UiTestSupport {
    @Test
    void snimky() throws Exception {
        String pages = System.getProperty("pages", "").trim();
        Assumptions.assumeTrue(!pages.isEmpty(), "bez -Dpages se nefotí");
        Path out = Paths.get("target/shots/snimky");
        Files.createDirectories(out);
        String slide = System.getProperty("slide", "");
        boolean full = Boolean.getBoolean("full");
        JavascriptExecutor js = (JavascriptExecutor) driver;
        for (String raw : pages.split(",")) {
            String page = "/" + raw.trim().replaceAll("^/+", "");
            for (String theme : new String[]{"dark", "light"}) {
                for (int w : new int[]{390, 1440}) {
                    ((ChromeDriver) driver).executeCdpCommand("Emulation.setDeviceMetricsOverride",
                            Map.of("width", w, "height", w < 500 ? 844 : 900, "deviceScaleFactor", 1, "mobile", w < 500));
                    driver.get(BASE_URL + "/");
                    js.executeScript("localStorage.setItem('theme', arguments[0]); localStorage.setItem('cookieConsent','true');"
                            + " if (arguments[1]) sessionStorage.setItem('bgSlide', JSON.stringify({ step: +arguments[1], at: Date.now(), theme: arguments[0] }));",
                            theme, slide);
                    driver.get(BASE_URL + page);
                    Thread.sleep(3000);
                    Map<String, Object> s = ((ChromeDriver) driver).executeCdpCommand("Page.captureScreenshot",
                            Map.of("captureBeyondViewport", full, "fromSurface", true));
                    String name = page.replaceAll("^/", "").replaceAll("[^A-Za-z0-9]+", "-") + "-" + (theme.equals("dark") ? "tmavy" : "svetly") + "-" + w + ".png";
                    Files.write(out.resolve(name), Base64.getDecoder().decode((String) s.get("data")));
                }
            }
        }
    }
}
