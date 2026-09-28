package com.github.skeliit;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.WebElement;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The language button is painted in the flag of the current language. */
class LanguageFlagsIT extends UiTestSupport {

    @Test
    void buttonShowsFlagOfCurrentLanguage() throws Exception {
        driver.manage().window().setSize(new Dimension(1400, 900));
        try {
            for (String lang : new String[]{"en", "de", "uk", "vi", "cs"}) {
                driver.get(BASE_URL + "/index.jsp?lang=" + lang);
                WebElement btn = driver.findElement(By.cssSelector(".lang-switch .lang-btn"));
                assertEquals(lang.toUpperCase(), btn.findElement(By.className("lang-code")).getText().trim());
                String bg = btn.getCssValue("background-image");
                assertTrue(bg.contains("/img/flags/" + lang + ".svg"), "button painted in the " + lang + " flag, got " + bg);
                shotOf(btn, "flag-btn-" + lang);
            }
            driver.findElement(By.cssSelector(".lang-switch .lang-btn")).click();
            WebElement menu = driver.findElement(By.cssSelector(".lang-switch .menu"));
            assertEquals(5, menu.findElements(By.className("flag")).size(), "every language in the list has its flag");
            shotOf(menu, "flag-menu");
            driver.findElement(By.id("themeToggle")).click();
            Thread.sleep(800);
            shotOf(driver.findElement(By.cssSelector(".top-controls")), "flag-btn-light");
            driver.findElement(By.id("themeToggle")).click();
        } finally {
            driver.get(BASE_URL + "/index.jsp?lang=cs"); // the language sticks in the session
        }
    }

    private void shotOf(WebElement el, String name) throws Exception {
        String dir = System.getProperty("it.shots");
        if (dir == null) return;
        Files.write(Path.of(dir, name + ".png"), el.getScreenshotAs(OutputType.BYTES));
    }
}
