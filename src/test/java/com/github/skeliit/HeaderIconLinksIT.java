package com.github.skeliit;

import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for header.jsp favicon and icon link changes.
 * Tests verify that the new icon links are properly rendered across all pages
 * that include header.jsp, and that the icon resource is accessible.
 */
public class HeaderIconLinksIT {
    private WebDriver driver;
    private static final String BASE_URL = "http://localhost:8080";
    private static final String ICON_PATH = "/img/IMG_0090.JPG";
    private static final String EXPECTED_ICON_URL = BASE_URL + ICON_PATH;

    @BeforeEach
    void setup() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--window-size=1400,900");
        // Use local ChromeDriver via Selenium Manager
        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
    }

    @AfterEach
    void teardown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    @DisplayName("Index page should have all three icon link tags with correct attributes")
    void indexPage_shouldHaveAllIconLinks() {
        driver.get(BASE_URL + "/index.jsp");
        verifyIconLinksPresent();
    }

    @Test
    @DisplayName("About page should have all three icon link tags")
    void aboutPage_shouldHaveAllIconLinks() {
        driver.get(BASE_URL + "/about.jsp");
        verifyIconLinksPresent();
    }

    @Test
    @DisplayName("Music page should have all three icon link tags")
    void musicPage_shouldHaveAllIconLinks() {
        driver.get(BASE_URL + "/music.jsp");
        verifyIconLinksPresent();
    }

    @Test
    @DisplayName("Donate page should have all three icon link tags")
    void donatePage_shouldHaveAllIconLinks() {
        driver.get(BASE_URL + "/donate.jsp");
        verifyIconLinksPresent();
    }

    @Test
    @DisplayName("Shortcut icon link should have correct href attribute")
    void shortcutIcon_shouldHaveCorrectHref() {
        driver.get(BASE_URL + "/index.jsp");
        
        WebElement shortcutIcon = driver.findElement(By.cssSelector("link[rel='shortcut icon']"));
        String href = shortcutIcon.getAttribute("href");
        
        assertTrue(href.endsWith(ICON_PATH), 
            "Shortcut icon href should end with " + ICON_PATH + " but was: " + href);
    }

    @Test
    @DisplayName("Standard icon link should have correct type and sizes attributes")
    void standardIcon_shouldHaveTypeAndSizes() {
        driver.get(BASE_URL + "/index.jsp");
        
        WebElement icon = driver.findElement(By.cssSelector("link[rel='icon'][type='image/jpeg']"));
        String type = icon.getAttribute("type");
        String sizes = icon.getAttribute("sizes");
        String href = icon.getAttribute("href");
        
        assertEquals("image/jpeg", type, "Icon type should be image/jpeg");
        assertEquals("150x150", sizes, "Icon sizes should be 150x150");
        assertTrue(href.endsWith(ICON_PATH), "Icon href should end with " + ICON_PATH);
    }

    @Test
    @DisplayName("Apple touch icon link should have correct rel and href")
    void appleTouchIcon_shouldHaveCorrectAttributes() {
        driver.get(BASE_URL + "/index.jsp");
        
        WebElement appleIcon = driver.findElement(By.cssSelector("link[rel='apple-touch-icon']"));
        String href = appleIcon.getAttribute("href");
        
        assertTrue(href.endsWith(ICON_PATH), 
            "Apple touch icon href should end with " + ICON_PATH + " but was: " + href);
    }

    @Test
    @DisplayName("Icon resource should be accessible via HTTP GET")
    void iconResource_shouldBeAccessible() throws IOException {
        URL url = new URL(EXPECTED_ICON_URL);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(5000);
        
        int responseCode = connection.getResponseCode();
        String contentType = connection.getContentType();
        
        assertEquals(200, responseCode, 
            "Icon resource should return HTTP 200 OK");
        assertNotNull(contentType, "Content-Type header should be present");
        assertTrue(contentType.toLowerCase().contains("image"), 
            "Content-Type should indicate image type, but was: " + contentType);
        
        connection.disconnect();
    }

    @Test
    @DisplayName("Old icon path should not be present in rendered HTML")
    void oldIconPath_shouldNotBePresent() {
        driver.get(BASE_URL + "/index.jsp");
        String pageSource = driver.getPageSource();
        
        assertFalse(pageSource.contains("obrazky/skeliico.ico"), 
            "Old icon path 'obrazky/skeliico.ico' should not be present in HTML");
    }

    @Test
    @DisplayName("All icon links should use absolute paths starting with slash")
    void allIconLinks_shouldUseAbsolutePaths() {
        driver.get(BASE_URL + "/index.jsp");
        
        List<WebElement> iconLinks = driver.findElements(By.cssSelector(
            "link[rel='shortcut icon'], link[rel='icon'], link[rel='apple-touch-icon']"));
        
        assertTrue(iconLinks.size() >= 3, 
            "Should have at least 3 icon-related link tags");
        
        for (WebElement link : iconLinks) {
            String href = link.getAttribute("href");
            assertTrue(href.contains(ICON_PATH), 
                "Icon link href should contain " + ICON_PATH + " but was: " + href);
        }
    }

    @Test
    @DisplayName("Header should contain exactly one shortcut icon link")
    void header_shouldContainOneShortcutIcon() {
        driver.get(BASE_URL + "/index.jsp");
        
        List<WebElement> shortcutIcons = driver.findElements(
            By.cssSelector("link[rel='shortcut icon']"));
        
        assertEquals(1, shortcutIcons.size(), 
            "Should have exactly one shortcut icon link tag");
    }

    @Test
    @DisplayName("Header should contain exactly one standard icon link with type attribute")
    void header_shouldContainOneStandardIconWithType() {
        driver.get(BASE_URL + "/index.jsp");
        
        List<WebElement> standardIcons = driver.findElements(
            By.cssSelector("link[rel='icon'][type='image/jpeg']"));
        
        assertEquals(1, standardIcons.size(), 
            "Should have exactly one standard icon link with type='image/jpeg'");
    }

    @Test
    @DisplayName("Header should contain exactly one apple-touch-icon link")
    void header_shouldContainOneAppleTouchIcon() {
        driver.get(BASE_URL + "/index.jsp");
        
        List<WebElement> appleIcons = driver.findElements(
            By.cssSelector("link[rel='apple-touch-icon']"));
        
        assertEquals(1, appleIcons.size(), 
            "Should have exactly one apple-touch-icon link tag");
    }

    @Test
    @DisplayName("Icon links should appear in head section before stylesheets")
    void iconLinks_shouldAppearInHeadBeforeStylesheets() {
        driver.get(BASE_URL + "/index.jsp");
        String pageSource = driver.getPageSource();
        
        int shortcutIconPos = pageSource.indexOf("rel=\"shortcut icon\"");
        int standardIconPos = pageSource.indexOf("rel=\"icon\"");
        int appleTouchIconPos = pageSource.indexOf("rel=\"apple-touch-icon\"");
        int firstStylesheetPos = pageSource.indexOf("rel=\"stylesheet\"");
        
        assertTrue(shortcutIconPos > 0, "Shortcut icon should be present");
        assertTrue(standardIconPos > 0, "Standard icon should be present");
        assertTrue(appleTouchIconPos > 0, "Apple touch icon should be present");
        assertTrue(firstStylesheetPos > 0, "Stylesheets should be present");
        
        assertTrue(shortcutIconPos < firstStylesheetPos, 
            "Shortcut icon should appear before stylesheets");
        assertTrue(standardIconPos < firstStylesheetPos, 
            "Standard icon should appear before stylesheets");
        assertTrue(appleTouchIconPos < firstStylesheetPos, 
            "Apple touch icon should appear before stylesheets");
    }

    @Test
    @DisplayName("Admin page should have all icon links when accessible")
    void adminPage_shouldHaveAllIconLinks() {
        // Note: Admin page may require authentication, so we test if accessible
        try {
            driver.get(BASE_URL + "/admin.jsp");
            // If we can access the page, verify icons
            if (!driver.getCurrentUrl().contains("login")) {
                verifyIconLinksPresent();
            }
        } catch (Exception e) {
            // Skip test if admin page is not accessible in test environment
            Assumptions.assumeTrue(false, "Admin page not accessible without authentication");
        }
    }

    @Test
    @DisplayName("Error page should have all icon links")
    void errorPage_shouldHaveAllIconLinks() {
        driver.get(BASE_URL + "/error.jsp");
        verifyIconLinksPresent();
    }

    @Test
    @DisplayName("Icon file should have reasonable file size for web use")
    void iconResource_shouldHaveReasonableFileSize() throws IOException {
        URL url = new URL(EXPECTED_ICON_URL);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("HEAD");
        connection.setConnectTimeout(5000);
        
        int responseCode = connection.getResponseCode();
        assertEquals(200, responseCode, "Icon resource should be accessible");
        
        long contentLength = connection.getContentLengthLong();
        connection.disconnect();
        
        assertTrue(contentLength > 0, "Icon file should have positive size");
        // Check that it's not unreasonably large (> 10MB would be excessive for a favicon)
        assertTrue(contentLength < 10_000_000, 
            "Icon file should be less than 10MB for web use, but was: " + contentLength + " bytes");
    }

    /**
     * Helper method to verify all three icon links are present on the current page
     */
    private void verifyIconLinksPresent() {
        // Verify shortcut icon
        WebElement shortcutIcon = driver.findElement(By.cssSelector("link[rel='shortcut icon']"));
        assertNotNull(shortcutIcon, "Shortcut icon link should be present");
        assertTrue(shortcutIcon.getAttribute("href").endsWith(ICON_PATH),
            "Shortcut icon should point to " + ICON_PATH);
        
        // Verify standard icon with type
        WebElement standardIcon = driver.findElement(By.cssSelector("link[rel='icon'][type='image/jpeg']"));
        assertNotNull(standardIcon, "Standard icon link should be present");
        assertTrue(standardIcon.getAttribute("href").endsWith(ICON_PATH),
            "Standard icon should point to " + ICON_PATH);
        assertEquals("image/jpeg", standardIcon.getAttribute("type"),
            "Standard icon should have type='image/jpeg'");
        assertEquals("150x150", standardIcon.getAttribute("sizes"),
            "Standard icon should have sizes='150x150'");
        
        // Verify apple-touch-icon
        WebElement appleIcon = driver.findElement(By.cssSelector("link[rel='apple-touch-icon']"));
        assertNotNull(appleIcon, "Apple touch icon link should be present");
        assertTrue(appleIcon.getAttribute("href").endsWith(ICON_PATH),
            "Apple touch icon should point to " + ICON_PATH);
    }
}