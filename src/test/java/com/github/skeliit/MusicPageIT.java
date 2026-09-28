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

        // Verify the image src points to YouTube thumbnail CDN
        String src = img.getAttribute("src");
        assertTrue(src != null && src.contains("img.youtube.com"),
                "Thumbnail image should load from img.youtube.com");

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
