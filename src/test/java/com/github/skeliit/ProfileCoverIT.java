package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.file.Files;
import java.time.Duration;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Záhlaví profilu: neutrální pozadí bez obrázku, nahrání v Nastavení, vypínač pro ostatní, odebrání. */
class ProfileCoverIT extends UiTestSupport {

    private static final By COVER_IMG = By.cssSelector(".pt-cover img");

    @Test
    @DisplayName("Bez záhlaví je neutrální pozadí, nahrané je 3:1, ostatním jde vypnout a jde ho odebrat")
    void wholeWay() throws Exception {
        String name = "co" + uniq();
        registerAndLogin(name);
        JavascriptExecutor js = (JavascriptExecutor) driver;
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));

        // nový účet: žádný obrázek a na stránce žádná cizí fotka
        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        assertTrue(driver.findElements(COVER_IMG).isEmpty(), "bez záhlaví není obrázek");
        assertFalse(driver.findElement(By.cssSelector(".pt-cover-add")).getText().isBlank(), "pobídka má popisek");

        // nahrání: fotka na výšku se ořízne na pruh 1500×500
        BufferedImage pic = new BufferedImage(2000, 2400, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < pic.getHeight(); y++) for (int x = 0; x < pic.getWidth(); x++) pic.setRGB(x, y, (x / 8) << 16 | (y / 12) << 8 | 0x40);
        File f = Files.createTempFile("cover", ".png").toFile();
        f.deleteOnExit();
        ImageIO.write(pic, "png", f);

        driver.get(BASE_URL + "/nastaveni.jsp#zahlavi");
        waitReady();
        assertTrue(driver.findElement(By.id("zahlavi")).isDisplayed(), "kotva otevře záložku Profil");
        assertFalse(driver.findElement(By.id("cover-remove")).isDisplayed(), "není co odebírat");
        driver.findElement(By.id("cover-input")).sendKeys(f.getAbsolutePath());
        wait.until(d -> d.findElements(By.cssSelector("#cover-crop-wrap .cropper-container")).stream().anyMatch(e -> e.getSize().getHeight() > 50));
        jsClick(driver.findElement(By.id("cover-save")));
        wait.until(d -> d.findElement(By.id("cover-remove")).isDisplayed());
        assertTrue(driver.findElement(By.id("cover-preview-img")).getAttribute("src").contains("/uploads/covers/"));

        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        wait.until(d -> Boolean.TRUE.equals(js.executeScript("var i=document.querySelector('.pt-cover img');return !!i&&i.complete&&i.naturalWidth>0")));
        assertEquals(1500L, js.executeScript("return document.querySelector('.pt-cover img').naturalWidth"));
        assertEquals(500L, js.executeScript("return document.querySelector('.pt-cover img').naturalHeight"));

        // ostatní ho vidí (?nahled = můj profil očima ostatních)…
        driver.get(BASE_URL + "/hrac/" + name + "?nahled=1");
        waitReady();
        assertFalse(driver.findElements(COVER_IMG).isEmpty(), "ostatní vidí záhlaví");

        // …dokud ho nevypnu
        driver.get(BASE_URL + "/nastaveni.jsp#soukromi");
        waitReady();
        jsClick(driver.findElement(By.cssSelector(".vis-form input[name=cover]")));
        jsClick(driver.findElement(By.cssSelector(".vis-form button[type=submit]")));
        wait.until(d -> d.getCurrentUrl().contains("vis=1"));
        driver.get(BASE_URL + "/hrac/" + name + "?nahled=1");
        waitReady();
        assertTrue(driver.findElements(COVER_IMG).isEmpty(), "vypnuté: ostatní vidí neutrální pozadí");
        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        assertFalse(driver.findElements(COVER_IMG).isEmpty(), "já ho vidím pořád");

        // odebrání
        driver.get(BASE_URL + "/nastaveni.jsp#zahlavi");
        waitReady();
        jsClick(driver.findElement(By.id("cover-remove")));
        wait.until(d -> !d.findElement(By.id("cover-remove")).isDisplayed());
        driver.get(BASE_URL + "/uzivatel.jsp");
        waitReady();
        assertTrue(driver.findElements(COVER_IMG).isEmpty(), "po odebrání zase neutrální pozadí");
    }

    @Test
    @DisplayName("Telefon: ořezávač se vejde na obrazovku i s fotkou na výšku a jde uložit")
    void phoneCropperFits() throws Exception {
        driver.quit();
        ChromeOptions o = new ChromeOptions();
        o.addArguments("--headless=new");
        o.setExperimentalOption("mobileEmulation", Map.of("deviceMetrics", Map.of("width", 390, "height", 844, "pixelRatio", 2.0, "touch", true)));
        driver = new ChromeDriver(o);
        registerAndLogin("cm" + uniq());
        JavascriptExecutor js = (JavascriptExecutor) driver;
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));

        BufferedImage pic = new BufferedImage(1200, 2000, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < pic.getHeight(); y++) for (int x = 0; x < pic.getWidth(); x++) pic.setRGB(x, y, (y / 8) << 8 | 0x30);
        File f = Files.createTempFile("cover-phone", ".png").toFile();
        f.deleteOnExit();
        ImageIO.write(pic, "png", f);

        driver.get(BASE_URL + "/nastaveni.jsp#zahlavi");
        waitReady();
        driver.findElement(By.id("cover-input")).sendKeys(f.getAbsolutePath());
        wait.until(d -> d.findElements(By.cssSelector("#cover-crop-wrap .cropper-container")).stream().anyMatch(e -> e.getSize().getHeight() > 50));
        assertEquals(Boolean.TRUE, js.executeScript("return document.documentElement.scrollWidth <= window.innerWidth"), "nic nepřetéká");
        Number boxH = (Number) js.executeScript("return document.querySelector('#cover-crop-wrap .cropper-container').getBoundingClientRect().height");
        assertTrue(boxH.doubleValue() <= 844 * 0.7, "fotka na výšku se vejde na obrazovku, výška " + boxH);
        Number ratio = (Number) js.executeScript("var r=document.querySelector('#cover-crop-wrap .cropper-crop-box').getBoundingClientRect();return r.width/r.height");
        assertEquals(3.0, ratio.doubleValue(), 0.05, "výřez má poměr 3:1");
        jsClick(driver.findElement(By.id("cover-save")));
        wait.until(d -> d.findElement(By.id("cover-remove")).isDisplayed());
    }
}
