package com.github.skeliit;

import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/**
 * End-to-end check of register -> login -> logout against a running local instance
 * (start with: mvn org.eclipse.jetty:jetty-maven-plugin:11.0.15:run).
 */
public class AuthFlowIT {
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
        if (driver != null) driver.quit();
    }

    @Test
    @DisplayName("Register -> login -> logout flow works end to end")
    void registerLoginLogout() {
        String ts = String.valueOf(System.currentTimeMillis());
        String username = "it" + ts;
        String email = "it" + ts + "@example.com";
        String password = "Sel3nium#Test2026";

        // --- Register ---
        driver.get(BASE_URL + "/register");
        driver.findElement(By.name("username")).sendKeys(username);
        driver.findElement(By.name("email")).sendKeys(email);
        driver.findElement(By.name("password")).sendKeys(password);
        driver.findElement(By.name("password2")).sendKeys(password);
        jsClick(driver.findElement(By.name("consent")));

        String oldUrl = driver.getCurrentUrl();
        jsClick(driver.findElement(By.cssSelector("form button[type=submit]")));
        waitUrlChange(oldUrl);

        assertTrue(driver.getCurrentUrl().contains("registered=1"),
                "registration should redirect to login.jsp?registered=1, got: " + driver.getCurrentUrl());

        // --- Login ---
        driver.get(BASE_URL + "/login");
        driver.findElement(By.name("username")).sendKeys(username);
        driver.findElement(By.name("password")).sendKeys(password);

        oldUrl = driver.getCurrentUrl();
        jsClick(driver.findElement(By.cssSelector("form button[type=submit]")));
        waitUrlChange(oldUrl);

        String bodyAfterLogin = driver.findElement(By.tagName("body")).getText();
        assertTrue(bodyAfterLogin.contains(username), "username should be visible in nav after login");

        // --- Logout ---
        driver.get(BASE_URL + "/logout");
        waitReady();

        String bodyAfterLogout = driver.findElement(By.tagName("body")).getText();
        assertFalse(bodyAfterLogout.contains(username), "username should not be visible after logout");
    }

    private void jsClick(WebElement el) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", el);
    }

    private void waitReady() {
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> "complete".equals(((JavascriptExecutor) d).executeScript("return document.readyState")));
    }

    private void waitUrlChange(String oldUrl) {
        new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> !d.getCurrentUrl().equals(oldUrl));
        waitReady();
    }
}
