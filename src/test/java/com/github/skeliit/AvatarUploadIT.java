package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.file.Files;
import java.time.Duration;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

/** Profile photo in the settings (js/avatar-editor.js). Requires a running local instance, see {@link UiTestSupport}. */
public class AvatarUploadIT extends UiTestSupport {

    @Test
    @DisplayName("A photo over 15 MB shows up in the crop box and is saved as the avatar")
    void bigPhotoCanBeCroppedAndSaved() throws Exception {
        registerAndLogin("av" + uniq());
        driver.get(BASE_URL + "/uzivatel.jsp");

        // random noise does not compress: about 17 MB as PNG
        BufferedImage pic = new BufferedImage(2700, 2100, BufferedImage.TYPE_INT_RGB);
        Random r = new Random(1);
        for (int y = 0; y < pic.getHeight(); y++) for (int x = 0; x < pic.getWidth(); x++) pic.setRGB(x, y, r.nextInt());
        File f = Files.createTempFile("big-avatar", ".png").toFile();
        f.deleteOnExit();
        ImageIO.write(pic, "png", f);
        assertTrue(f.length() > 15L * 1024 * 1024, "test photo is " + f.length() + " bytes");

        driver.findElement(By.id("avatar-input")).sendKeys(f.getAbsolutePath());
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));
        WebElement box = wait.until(d -> d.findElements(By.cssSelector("#cropper-wrap .cropper-container")).stream()
                .filter(e -> e.getSize().getHeight() > 50).findFirst().orElse(null));
        assertTrue(box.isDisplayed(), "the photo is visible in the crop box");
        assertTrue(driver.findElement(By.id("avatar-msg")).getText().isEmpty() || !driver.findElement(By.id("avatar-msg")).isDisplayed());

        String before = driver.findElement(By.id("avatar-preview-img")).getAttribute("src");
        jsClick(driver.findElement(By.id("btn-crop-save")));
        wait.until(d -> !d.findElement(By.id("avatar-preview-img")).getAttribute("src").equals(before));
        assertTrue(driver.findElement(By.id("avatar-preview-img")).getAttribute("src").contains("/uploads/avatars/"));
        assertTrue(driver.findElement(By.id("avatar-msg")).isDisplayed(), "\"Photo saved.\"");
    }

    @Test
    @DisplayName("A file the browser can't open gets a message on the page, not a pop-up")
    void notAPhotoGetsAMessage() throws Exception {
        registerAndLogin("av" + uniq());
        driver.get(BASE_URL + "/uzivatel.jsp");
        File f = Files.createTempFile("not-a-photo", ".jpg").toFile();
        f.deleteOnExit();
        Files.writeString(f.toPath(), "this is not a picture");
        driver.findElement(By.id("avatar-input")).sendKeys(f.getAbsolutePath());
        WebElement msg = new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> { WebElement m = d.findElement(By.id("avatar-msg")); return m.isDisplayed() && m.getAttribute("class").contains("warn") ? m : null; });
        assertTrue(msg.getText().contains("JPG"), msg.getText());
    }
}
