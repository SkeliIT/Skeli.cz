package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Menu podle účelu: skupiny na počítači, dlaždice na telefonu, kolečko Vzhled a zvuk. */
class NavMenuIT extends UiTestSupport {

    private WebElement group(String id) {
        return driver.findElement(By.cssSelector("button[aria-controls=navSub" + id + "]"));
    }

    @Test
    @DisplayName("Počítač: CatSmash je přímý odkaz, nabídka se otevře kliknutím a zavře Esc; aktuální stránka svítí i na skupině")
    void desktopGroups() {
        driver.manage().window().setSize(new Dimension(1400, 900));
        driver.get(BASE_URL + "/texty.jsp?lang=cs");
        waitReady();
        new Actions(driver).moveToLocation(5, 700).perform();
        assertTrue(driver.findElement(By.cssSelector("#mainNav a.nav-top[data-play-game]")).isDisplayed(), "hra je přímo v menu (Squad má zatím jen ji)");
        assertTrue(driver.findElements(By.cssSelector("#navSubSquad")).isEmpty(), "prázdná skupina Squad není");
        WebElement about = driver.findElement(By.cssSelector("#navSubAbout a[href$='/about.jsp']"));
        assertFalse(about.isDisplayed(), "nabídka je zavřená");
        group("About").click();
        assertTrue(about.isDisplayed());
        assertEquals("true", group("About").getAttribute("aria-expanded"));
        new Actions(driver).sendKeys(Keys.ESCAPE).moveToLocation(5, 700).perform();
        assertFalse(about.isDisplayed(), "Esc nabídku zavře");
        assertTrue(driver.findElement(By.cssSelector("#navSubMusic")).findElement(By.xpath("..")).getAttribute("class").contains("has-active"), "Texty jsou v Hudbě");
        assertEquals("page", driver.findElement(By.cssSelector("#navSubMusic a[href$='/texty.jsp']")).getAttribute("aria-current"));
        group("About").click();
        assertTrue(driver.findElement(By.cssSelector("#navSubAbout")).isDisplayed());
        group("Music").click();
        assertFalse(driver.findElement(By.cssSelector("#navSubAbout")).isDisplayed(), "otevřená je vždy jen jedna");
        assertTrue(driver.findElements(By.cssSelector("#mainNav .nav-soon")).isEmpty(), "žádné položky „brzy“ (Shop)");
    }

    @Test
    @DisplayName("Počítač: téma je pod kolečkem a funguje, srdíčko v liště není")
    void viewMenu() {
        driver.manage().window().setSize(new Dimension(1400, 900));
        driver.get(BASE_URL + "/about.jsp");
        waitReady();
        assertTrue(driver.findElements(By.cssSelector(".top-controls .donate-link")).isEmpty());
        WebElement theme = driver.findElement(By.id("themeToggle"));
        assertFalse(theme.isDisplayed());
        driver.findElement(By.cssSelector(".view-btn")).click();
        assertTrue(theme.isDisplayed());
        String before = driver.findElement(By.tagName("body")).getAttribute("class");
        theme.click();
        assertFalse(before.equals(driver.findElement(By.tagName("body")).getAttribute("class")), "téma se přepnulo");
        assertTrue(theme.isDisplayed(), "nabídka zůstane otevřená");
    }

    @Test
    @DisplayName("Telefon a tablet: menu přes obrazovku, skupiny se rozbalují, Esc zavře a vrátí focus, nic nepřetéká")
    void phoneMenu() {
        JavascriptExecutor js = (JavascriptExecutor) driver;
        for (Dimension size : new Dimension[] { new Dimension(500, 844), new Dimension(844, 390), new Dimension(900, 1000) }) {
            driver.manage().window().setSize(size);
            driver.get(BASE_URL + "/texty.jsp?lang=de");
            waitReady();
            jsClick(driver.findElement(By.id("menuToggle")));
            assertEquals(Boolean.TRUE, js.executeScript("return document.documentElement.classList.contains('menu-open') && getComputedStyle(document.body).overflow === 'hidden';"), "stránka pod menu stojí");
            assertEquals(Boolean.TRUE, js.executeScript("return document.querySelector('main').inert === true;"), "stránka pod menu nejde ovládat");
            assertEquals("true", group("Music").getAttribute("aria-expanded"), "skupina s aktuální stránkou je rozbalená: " + size);
            WebElement donate = driver.findElement(By.cssSelector("#navSubAbout a[href$='/donate.jsp']"));
            assertFalse(donate.isDisplayed());
            jsClick(group("About"));
            assertTrue(donate.isDisplayed(), "skupina se rozbalí");
            assertEquals("true", group("Music").getAttribute("aria-expanded"), "ostatní skupiny zůstanou otevřené");
            assertEquals(Boolean.TRUE, js.executeScript(
                    "const n = document.getElementById('mainNav'); return n.scrollWidth <= n.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth;"), "nepřetéká: " + size);
            new Actions(driver).sendKeys(Keys.ESCAPE).perform();
            assertFalse(driver.findElement(By.id("mainNav")).isDisplayed(), "Esc menu zavře");
            assertEquals("menuToggle", js.executeScript("return document.activeElement && document.activeElement.id;"), "focus se vrátí na Menu");
            assertEquals(Boolean.FALSE, js.executeScript("return document.querySelector('main').inert === true;"));
        }
    }
}
