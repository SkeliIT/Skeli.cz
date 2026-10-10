package com.github.skeliit;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Song page: the clip stands on its own stage with water and fire round it; the effect can be switched off. */
class SongStageIT extends UiTestSupport {

    /** The first song in the lyrics list that has a clip. */
    private String songWithClip() {
        driver.get(BASE_URL + "/texty.jsp");
        List<String> links = driver.findElements(By.cssSelector("a[href*='/song/']")).stream()
                .map(a -> a.getAttribute("href")).distinct().limit(8).collect(Collectors.toList());
        for (String href : links) {
            driver.get(href);
            if (!driver.findElements(By.id("ytFacade")).isEmpty()) return href;
        }
        return null;
    }

    @Test
    void effectSurroundsTheClipAndCanBeSwitchedOff() {
        String song = songWithClip();
        assertNotNull(song, "some song has a clip");
        WebElement stage = driver.findElement(By.cssSelector(".lyric-stage.has-fx"));
        assertEquals(2, stage.findElements(By.tagName("canvas")).size(), "the liquid and the sparks have their canvases");
        assertFalse(stage.getAttribute("class").contains("no-fx"), "WebGL works in the test browser, so the effect runs");
        // the stage comes before the lyrics frame
        Number stageTop = (Number) ((JavascriptExecutor) driver).executeScript("return document.querySelector('.lyric-stage').getBoundingClientRect().top");
        Number lyricsTop = (Number) ((JavascriptExecutor) driver).executeScript("return document.querySelector('.lyric-main').getBoundingClientRect().top");
        assertTrue(stageTop.doubleValue() < lyricsTop.doubleValue(), "the clip is above the lyrics");

        // the switch is a small drop-down in the bar above the lyrics, outside the effect
        WebElement fxSwitch = driver.findElement(By.cssSelector(".lyric-toolbar .clip-fx-switch"));
        assertTrue(fxSwitch.isDisplayed());
        assertTrue(driver.findElements(By.cssSelector(".lyric-stage .clip-fx-switch")).isEmpty(), "nothing to click inside the water and fire");
        fxSwitch.findElement(By.tagName("summary")).click();
        fxSwitch.findElement(By.cssSelector("button[data-mode='off']")).click();
        assertTrue(stage.getAttribute("class").contains("fx-off"));
        assertNull(fxSwitch.getAttribute("open"), "the menu closes after a choice");
        driver.navigate().refresh();
        new WebDriverWait(driver, Duration.ofSeconds(5)).until(d ->
                "true".equals(d.findElement(By.cssSelector(".clip-fx-switch button[data-mode='off']")).getAttribute("aria-pressed")));
        jsClick(driver.findElement(By.cssSelector(".clip-fx-switch button[data-mode='on']")));   // leave it on for the next tests

        // playing the clip asks YouTube to report its time, so the effect stays in step
        driver.findElement(By.cssSelector("#ytFacade .yt-facade")).click();
        String src = driver.findElement(By.cssSelector("#ytFacade iframe")).getAttribute("src");
        assertTrue(src.contains("enablejsapi=1"), "the player reports where it is, got " + src);
    }

    @Test
    void musicPagePlayerHasTheEffectToo() {
        driver.get(BASE_URL + "/music.jsp");
        WebElement stage = driver.findElement(By.cssSelector(".ep-stage[data-clip-fx]"));
        assertEquals(2, stage.findElements(By.tagName("canvas")).size());
        new WebDriverWait(driver, Duration.ofSeconds(5)).until(d -> "1".equals(stage.getAttribute("data-fx")));
        assertFalse(stage.getAttribute("class").contains("no-fx"));
        String clip = driver.findElement(By.cssSelector(".ep-frame-wrap[data-clip-player]")).getAttribute("data-yt");
        assertTrue(clip != null && clip.matches("[A-Za-z0-9_-]{6,20}"), "the player tells the effect its clip, got " + clip);
        // the comments sit under the carousel now, not beside the video
        Number carouselBottom = (Number) ((JavascriptExecutor) driver).executeScript("return document.querySelector('.ep-carousel').getBoundingClientRect().bottom");
        Number commentsTop = (Number) ((JavascriptExecutor) driver).executeScript("return document.querySelector('.ep-comments-wrap').getBoundingClientRect().top");
        assertTrue(commentsTop.doubleValue() >= carouselBottom.doubleValue(), "comments come after the carousel");
    }
}
