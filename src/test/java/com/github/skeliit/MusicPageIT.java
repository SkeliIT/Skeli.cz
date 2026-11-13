package com.github.skeliit;

import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class MusicPageIT {
    private WebDriver driver;

    @BeforeEach
    void setup() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--window-size=1400,900");
        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
    }

    @AfterEach
    void teardown() { if (driver != null) driver.quit(); }

    @Test
    void homepageScreenshotIsTaken() throws Exception {
        driver.get("http://localhost:8080/");
        saveScreenshot("home-page-overview.png");
        assertTrue(driver.getTitle().toLowerCase().contains("skeli"), "Home page should render and have title containing Skeli");
    }

    @Test
    @DisplayName("Diskografie na PC: klik na kartu pustí její video přímo v přehrávači nahoře (nikam se neodchází)")
    void clickingACardPlaysItHere() {
        driver.get("http://localhost:8080/music.jsp");
        List<WebElement> plays = driver.findElements(By.cssSelector(".disco-card .flip-play"));
        assertFalse(plays.isEmpty(), "karty s videem mají ▶ Přehrát");
        WebElement last = plays.get(plays.size() - 1);
        String yt = last.getAttribute("data-play-yt");
        WebElement card = last.findElement(By.xpath("./ancestor::article[contains(@class,'flip-card')]"));
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'})", card);
        card.click();
        assertPlaying(yt);
        assertTrue(driver.getCurrentUrl().contains("/music.jsp"), "zůstali jsme na webu");
    }

    @Test
    @DisplayName("Diskografie na telefonu: ťuknutí kartu otočí, ▶ Přehrát pustí video nahoře")
    void phoneTapFlipsThenPlays() {
        driver.quit();
        ChromeOptions o = new ChromeOptions();
        o.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage");
        o.setExperimentalOption("mobileEmulation", java.util.Map.of("deviceMetrics", java.util.Map.of("width", 390, "height", 844, "pixelRatio", 2.0, "touch", true)));
        driver = new ChromeDriver(o);
        driver.get("http://localhost:8080/music.jsp");
        // nový návštěvník: nejdřív odpoví cookie liště (Odmítnout vše), jinak by překážela
        List<WebElement> none = driver.findElements(By.cssSelector("#cookieBar [data-consent=none]"));
        if (!none.isEmpty() && none.get(0).isDisplayed()) none.get(0).click();
        WebElement play = driver.findElements(By.cssSelector(".disco-card .flip-play")).get(1);
        WebElement card = play.findElement(By.xpath("./ancestor::article[contains(@class,'flip-card')]"));
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'})", card);
        card.findElement(By.cssSelector(".flip-front")).click();
        new WebDriverWait(driver, Duration.ofSeconds(3)).until(d -> card.getAttribute("class").contains("open"));
        // po otočení (animace) musí být tlačítko opravdu nahoře – to, co by prst trefil, je ono samo
        new WebDriverWait(driver, Duration.ofSeconds(4)).until(d -> (Boolean) ((JavascriptExecutor) d).executeScript(
                "var r = arguments[0].getBoundingClientRect(), el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);"
                + "return !!el && arguments[0].contains(el);", play));
        play.click();
        assertPlaying(play.getAttribute("data-play-yt"));
    }

    /** V přehrávači nahoře (EllipticPlayerServlet) hraje video s tímhle id. */
    private void assertPlaying(String yt) {
        new WebDriverWait(driver, Duration.ofSeconds(5)).until(d -> String.valueOf(((JavascriptExecutor) d).executeScript(
                "var f = document.querySelector('.ep-stage iframe'); return f ? f.getAttribute('src') : '';")).contains(yt));
    }

    @Test
    @DisplayName("Diskografie: odkazy jsou v liště se 4 místy, bez rozbalování, a mají popisek pro čtečky")
    void discographyDockShowsTheLinks() {
        driver.get("http://localhost:8080/music.jsp");
        List<WebElement> docks = driver.findElements(By.cssSelector(".disco-card .disco-dock"));
        assertFalse(docks.isEmpty(), "karty mají lištu");
        assertEquals(driver.findElements(By.cssSelector(".disco-card")).size(), docks.size(), "každá karta");
        for (WebElement dock : docks) assertEquals(4, dock.findElements(By.xpath("./*")).size(), "vždy čtyři místa");
        for (WebElement a : driver.findElements(By.cssSelector(".disco-dock a"))) {
            assertFalse(a.getAttribute("aria-label").isBlank(), "ikona má popisek");
        }
        assertTrue(driver.findElements(By.cssSelector(".disco-more")).isEmpty(), "staré rozbalování je pryč");
    }

    @Test
    void youtubePlayerIsInYoutubeSection() throws Exception {
        driver.get("http://localhost:8080/music.jsp");
        String src = driver.getPageSource();
        assertTrue(src.contains("ep-wrap") || src.contains("ep-carousel"), "Page should include EllipticPlayer carousel");
        assertTrue(src.contains("fab fa-youtube"), "Page should include YouTube section header");

        saveScreenshot("music-page-overview.png");
    }

    @Test
    void carouselThumbnailsAreVisible() throws Exception {
        driver.get("http://localhost:8080/music.jsp");
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".ep-item")));

        // Active item must have non-zero height (broken when height:0 + padding-top was used)
        WebElement active = driver.findElement(By.cssSelector(".ep-item.is-active"));
        assertTrue(active.getSize().getHeight() > 0,
                "Active carousel item must have non-zero height (aspect-ratio:16/9 required)");

        // The thumbnail image inside must also have non-zero height
        WebElement img = active.findElement(By.tagName("img"));
        assertTrue(img.getSize().getHeight() > 0,
                "Thumbnail image inside active carousel item must be visible (non-zero height)");

        // Thumbnails come through our own server (YoutubeThumbServlet): no visitor IP goes to Google
        String src = img.getAttribute("src");
        assertTrue(src != null && src.contains("/yt-thumb/"), "Thumbnail should load from /yt-thumb/, got: " + src);

        saveScreenshot("music-page-carousel.png");
    }

    @Test
    void carouselNavigationShowsAdjacentItems() throws Exception {
        driver.get("http://localhost:8080/music.jsp");
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".ep-item.is-active")));

        List<WebElement> items = driver.findElements(By.cssSelector(".ep-item"));
        if (items.size() < 2) return; // only one video in DB, skip

        // Prev/next buttons must be present and clickable
        WebElement nextBtn = driver.findElement(By.id("ep-next"));
        assertTrue(nextBtn.isDisplayed(), "Next arrow must be visible");
        nextBtn.click();

        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".ep-item.is-active")));
        WebElement newActive = driver.findElement(By.cssSelector(".ep-item.is-active"));
        assertTrue(newActive.getSize().getHeight() > 0,
                "After navigation, active item must still have non-zero height");

        saveScreenshot("music-page-navigation.png");
    }

    private void saveScreenshot(String fileName) throws Exception {
        Path outDir = Paths.get("target", "screenshots");
        Files.createDirectories(outDir);
        Path filePath = outDir.resolve(fileName);
        byte[] screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
        Files.write(filePath, screenshot);
    }
}
