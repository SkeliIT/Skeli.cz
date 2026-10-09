package com.github.skeliit;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Home page: the quote and the song's name are burnt in letter by letter and end up readable. */
class HomeQuoteIT extends UiTestSupport {

    @Test
    void quoteIsBurntInAndStaysReadable() {
        driver.get(BASE_URL + "/index.jsp");
        WebElement quote = driver.findElement(By.cssSelector(".hero-quote"));
        String text = driver.findElement(By.cssSelector(".hero-quote-text .sr-only")).getAttribute("textContent");
        assertTrue(text.startsWith("„") && text.endsWith("“"), "screen readers get the whole quote, got " + text);
        assertFalse(driver.findElements(By.cssSelector(".hero-quote-song .qc")).isEmpty(), "the song's name is burnt in too");

        // every letter is burnt, then the quote settles down
        new WebDriverWait(driver, Duration.ofSeconds(40)).until(d -> quote.getAttribute("class").contains("is-burnt"));
        assertEquals(0, driver.findElements(By.cssSelector(".hero-quote .qc:not(.burnt)")).size(), "no letter is left unburnt");
        assertTrue(driver.findElements(By.cssSelector(".hero-quote-fx")).isEmpty(), "the canvas for sparks and smoke goes away when done");
        assertTrue(quote.getAttribute("href").contains("/song/"), "the quote links to its song");
    }
}
