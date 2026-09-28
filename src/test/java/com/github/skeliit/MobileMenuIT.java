package com.github.skeliit;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** On a narrow window the main menu hides behind a labelled Menu button and opens on click. */
class MobileMenuIT extends UiTestSupport {

    @Test
    void menuButtonOpensMainMenu() throws Exception {
        driver.manage().window().setSize(new Dimension(420, 900));
        driver.get(BASE_URL + "/texty.jsp");

        WebElement toggle = driver.findElement(By.id("menuToggle"));
        WebElement nav = driver.findElement(By.id("mainNav"));
        assertTrue(toggle.isDisplayed(), "Menu button should be visible on a phone");
        assertEquals("Menu", toggle.getText().trim(), "the button carries a label, not just an icon");
        assertFalse(nav.isDisplayed(), "menu starts closed");

        toggle.click();
        shot("mobile-menu-open");
        assertTrue(nav.isDisplayed(), "menu should open after clicking the Menu button");
        assertEquals("true", toggle.getAttribute("aria-expanded"));

        WebElement home = nav.findElement(By.cssSelector("a[href$='/index.jsp']"));
        home.click();
        new WebDriverWait(driver, Duration.ofSeconds(5))
                .until(ExpectedConditions.not(ExpectedConditions.urlContains("texty.jsp")));
    }

    @Test
    void phoneMenuHoldsThemeAndLanguage() throws Exception {
        driver.manage().window().setSize(new Dimension(390, 844));
        driver.get(BASE_URL + "/texty.jsp");

        assertFalse(driver.findElement(By.id("themeToggle")).isDisplayed(), "theme button moves out of the bar");
        shot("mobile-bar-closed");
        driver.findElement(By.id("menuToggle")).click();

        WebElement theme = driver.findElement(By.cssSelector("#mainNav [data-proxy=themeToggle]"));
        assertTrue(theme.isDisplayed(), "theme switch is inside the open menu");
        String before = driver.findElement(By.tagName("body")).getAttribute("class");
        theme.click();
        assertNotEquals(before, driver.findElement(By.tagName("body")).getAttribute("class"), "theme switched");
        assertTrue(driver.findElement(By.id("mainNav")).isDisplayed(), "menu stays open after switching the theme");
        Thread.sleep(800); // let the colour transition finish before the screenshot
        shot("mobile-menu-light");
        theme.click(); // back to what it was (stored in localStorage)

        List<WebElement> langs = driver.findElements(By.cssSelector("#mainNav .nav-langs a"));
        assertEquals(5, langs.size());
        assertTrue(langs.get(0).getAttribute("class").contains("active"), "current language is marked");
    }

    private void shot(String name) throws Exception {
        String dir = System.getProperty("it.shots");
        if (dir == null) return;
        Files.write(Path.of(dir, name + ".png"), ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES));
    }
}
