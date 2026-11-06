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
    @DisplayName("Počítač: CatSmash je ve Squadu, nabídka se otevře kliknutím a zavře Esc; aktuální stránka svítí i na skupině")
    void desktopGroups() {
        driver.manage().window().setSize(new Dimension(1400, 900));
        driver.get(BASE_URL + "/texty.jsp?lang=cs");
        waitReady();
        new Actions(driver).moveToLocation(5, 700).perform();
        assertTrue(driver.findElements(By.cssSelector("#mainNav > a[data-play-game]")).isEmpty(), "hra není přímo v menu");
        WebElement game = driver.findElement(By.cssSelector("#navSubSquad a[data-play-game]"));
        assertFalse(game.isDisplayed(), "nabídka je zavřená");
        group("Squad").click();
        assertTrue(game.isDisplayed());
        assertEquals("true", group("Squad").getAttribute("aria-expanded"));
        new Actions(driver).sendKeys(Keys.ESCAPE).moveToLocation(5, 700).perform();
        assertFalse(game.isDisplayed(), "Esc nabídku zavře");
        assertTrue(driver.findElement(By.cssSelector("#navSubMusic")).findElement(By.xpath("..")).getAttribute("class").contains("has-active"), "Texty jsou v Hudbě");
        group("Squad").click();
        assertTrue(driver.findElement(By.cssSelector("#navSubSquad")).isDisplayed());
        group("Music").click();
        assertFalse(driver.findElement(By.cssSelector("#navSubSquad")).isDisplayed(), "otevřená je vždy jen jedna");
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
    @DisplayName("Telefon: všechny skupiny jsou vidět jako dlaždice bez přetékání, i na šířku")
    void phoneTiles() {
        for (Dimension size : new Dimension[] { new Dimension(500, 844), new Dimension(844, 390) }) {
            driver.manage().window().setSize(size);
            driver.get(BASE_URL + "/index.jsp?lang=de");
            waitReady();
            jsClick(driver.findElement(By.id("menuToggle")));
            WebElement game = driver.findElement(By.cssSelector("#navSubSquad a[data-play-game]"));
            assertTrue(game.isDisplayed(), "hra je vidět i bez rozbalování");
            assertFalse(group("Squad").isDisplayed(), "na telefonu jsou nadpisy, ne tlačítka");
            assertEquals(Boolean.TRUE, ((JavascriptExecutor) driver).executeScript(
                    "const n = document.getElementById('mainNav'); return n.scrollWidth <= n.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth;"), "nepřetéká: " + size);
        }
    }
}
