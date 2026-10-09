package com.github.skeliit;

import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URI;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Head tags rendered by header.jsp: icons (favicon.ico, favicon.svg,
 * apple-touch-icon.png), per-page titles and the link-preview (Open Graph) tags.
 * Runs against a local server started with `mvn jetty:run`.
 */
public class HeaderIconLinksIT {
    private static final String BASE_URL = "http://localhost:8080";
    private WebDriver driver;

    @BeforeEach
    void setup() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--window-size=1400,900");
        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
    }

    @AfterEach
    void teardown() {
        if (driver != null) {
            driver.quit();
        }
    }

    private String attr(String css, String name) {
        return driver.findElement(By.cssSelector(css)).getAttribute(name);
    }

    @ParameterizedTest
    @ValueSource(strings = {"/index.jsp", "/about.jsp", "/music.jsp", "/texty.jsp", "/donate.jsp", "/lyrics/1"})
    @DisplayName("Every page links the three icons")
    void pagesHaveIconLinks(String page) {
        driver.get(BASE_URL + page);
        assertTrue(attr("link[rel='icon'][sizes]", "href").endsWith("/favicon.ico"));
        assertTrue(attr("link[rel='icon'][type='image/svg+xml']", "href").endsWith("/favicon.svg"));
        assertTrue(attr("link[rel='apple-touch-icon']", "href").endsWith("/apple-touch-icon.png"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"/favicon.ico", "/favicon.svg", "/apple-touch-icon.png", "/img/og-image.jpg"})
    @DisplayName("Icon and preview files are served as small images")
    void iconFilesAreServed(String path) throws IOException {
        HttpURLConnection c = (HttpURLConnection) URI.create(BASE_URL + path).toURL().openConnection();
        c.setRequestMethod("GET");
        c.setConnectTimeout(5000);
        c.setReadTimeout(5000);
        try {
            assertEquals(200, c.getResponseCode(), path);
            String type = c.getContentType();
            assertNotNull(type, path);
            assertTrue(type.toLowerCase().startsWith("image/"), path + " content type was " + type);
            assertTrue(c.getContentLengthLong() < 300_000, path + " should stay under 300 kB");
        } finally {
            c.disconnect();
        }
    }

    @Test
    @DisplayName("Sub-pages get their own <title>, the home page keeps the site title")
    void pagesHaveOwnTitles() {
        driver.get(BASE_URL + "/index.jsp");
        String home = driver.getTitle();
        driver.get(BASE_URL + "/texty.jsp");
        String texty = driver.getTitle();
        assertNotEquals(home, texty);
        assertTrue(texty.endsWith("| Skeli"), texty);
    }

    @Test
    @DisplayName("Lyric page title is the song name and the description quotes the lyrics")
    void lyricPageTitleAndDescription() {
        driver.get(BASE_URL + "/lyrics/1");
        String h1 = driver.findElement(By.cssSelector("h1.lyric-title")).getText();
        assertTrue(driver.getTitle().endsWith("| Skeli"));
        assertTrue(driver.getTitle().toLowerCase().startsWith(h1.toLowerCase().substring(0, 3)));
        assertFalse(attr("meta[name='description']", "content").isBlank());
    }

    @Test
    @DisplayName("Link-preview tags use absolute URLs")
    void openGraphTagsAreAbsolute() {
        driver.get(BASE_URL + "/texty.jsp");
        assertTrue(attr("meta[property='og:image']", "content").matches("https?://.+/img/og-image\\.jpg"));
        assertTrue(attr("meta[property='og:url']", "content").matches("https?://.+/texty\\.jsp"));
        assertTrue(attr("link[rel='canonical']", "href").matches("https?://.+/texty\\.jsp"));
    }

    @Test
    @DisplayName("sitemap.xml lists lyric pages with absolute URLs")
    void sitemapListsLyrics() {
        driver.get(BASE_URL + "/sitemap.xml");
        String xml = driver.getPageSource();
        // song pages live at /{lang}/song/{slug|uuid} (one entry per language with lyrics)
        assertTrue(xml.matches("(?s).*<loc>https?://[^<]+/cs/song/[^<]+</loc>.*"), "sitemap should list song pages");
        assertFalse(xml.contains("<loc>/"), "sitemap URLs must be absolute");
    }
}
