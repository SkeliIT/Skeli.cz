package com.github.skeliit;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebElement;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** About page: the portrait heads the text panel and loads in a phone-sized variant on phones. */
class AboutPageIT extends UiTestSupport {

    @Test
    void portraitSitsAtTheTopOfTheTextPanel() throws Exception {
        driver.manage().window().setSize(new Dimension(1400, 1000));
        driver.get(BASE_URL + "/about.jsp");

        WebElement img = driver.findElement(By.cssSelector(".about-intro > .about-portrait img"));
        assertTrue(loaded(img), "portrait should load");
        WebElement lead = driver.findElement(By.cssSelector(".about-intro .about-lead"));
        int photoBottom = img.getRect().getY() + img.getRect().getHeight();
        assertTrue(lead.getRect().getY() < photoBottom && lead.getRect().getY() > photoBottom - 80,
                "the opening line starts where the photo has faded out");
        assertTrue(driver.findElements(By.cssSelector(".about-avatar-container")).isEmpty(), "old side photo is gone");
        shot("about-desktop-dark");

        driver.findElement(By.id("themeToggle")).click();
        Thread.sleep(800);
        String lightSrc = (String) ((JavascriptExecutor) driver).executeScript("return arguments[0].currentSrc", img);
        assertTrue(lightSrc.contains("skeli-portrait-light-"), "the light theme shows the photo without its black background, got " + lightSrc);
        assertTrue(loaded(img), "cut-out portrait should load");
        shot("about-desktop-light");
        driver.findElement(By.id("themeToggle")).click();
    }

    @Test
    void phoneGetsTheSmallPortrait() throws Exception {
        driver.manage().window().setSize(new Dimension(390, 900));
        driver.get(BASE_URL + "/about.jsp");
        WebElement img = driver.findElement(By.cssSelector(".about-portrait img"));
        assertTrue(loaded(img), "portrait should load");
        String src = (String) ((JavascriptExecutor) driver).executeScript("return arguments[0].currentSrc", img);
        assertTrue(src.endsWith("-760.webp"), "a phone should download the small file, got " + src);
        shot("about-phone");
    }

    private boolean loaded(WebElement img) {
        return (Boolean) ((JavascriptExecutor) driver).executeScript(
                "return arguments[0].complete && arguments[0].naturalWidth > 0", img);
    }

    private void shot(String name) throws Exception {
        String dir = System.getProperty("it.shots");
        if (dir == null) return;
        Files.write(Path.of(dir, name + ".png"), ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES));
    }
}
