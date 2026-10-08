package com.github.skeliit;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.util.zip.CRC32;

import static org.junit.jupiter.api.Assertions.*;

/** The small security and speed fixes from the 2026-10-08 audit. */
class HardeningTest {

    @Test
    void limiterCanBeCheckedWithoutCounting() {
        String key = "test-" + System.nanoTime();
        assertFalse(RequestLimiter.isFull("t", key, 2, 60_000));
        RequestLimiter.tryAcquire("t", key, 2, 60_000);
        assertFalse(RequestLimiter.isFull("t", key, 2, 60_000), "checking doesn't use up the limit");
        RequestLimiter.tryAcquire("t", key, 2, 60_000);
        assertTrue(RequestLimiter.isFull("t", key, 2, 60_000));
    }

    @Test
    void versionedFilesAreCachedForAYear() {
        assertEquals("public, max-age=31536000, immutable", StaticCacheFilter.cacheControl("v=3.7.5"));
        assertEquals("public, max-age=31536000, immutable", StaticCacheFilter.cacheControl("a=1&v=2"));
        assertEquals("public, max-age=86400", StaticCacheFilter.cacheControl(null));
        assertEquals("public, max-age=86400", StaticCacheFilter.cacheControl("lang=en"));
    }

    @Test
    void normalPicturesAreRead() throws Exception {
        ByteArrayOutputStream png = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(40, 30, BufferedImage.TYPE_INT_RGB), "png", png);
        BufferedImage img = WebUtils.readImage(new ByteArrayInputStream(png.toByteArray()));
        assertNotNull(img);
        assertEquals(40, img.getWidth());
    }

    @Test
    void notAPictureOrAHugeOneIsRefused() throws Exception {
        assertNull(WebUtils.readImage(new ByteArrayInputStream("hello".getBytes())));
        // a tiny PNG header that claims 50 000 × 50 000 pixels: refused before decoding
        assertNull(WebUtils.readImage(new ByteArrayInputStream(pngHeader(50_000, 50_000))));
    }

    @Test
    void signInsBeforeTheCutOffEnd() {
        assertFalse(SessionValidityFilter.isStale(1_000L, 0), "no cut-off yet");
        assertTrue(SessionValidityFilter.isStale(1_000L, 2_000L), "signed in before a password change");
        assertFalse(SessionValidityFilter.isStale(2_000L, 2_000L), "the device that changed it stays");
        assertFalse(SessionValidityFilter.isStale(3_000L, 2_000L), "signed in again afterwards");
        assertTrue(SessionValidityFilter.isStale(null, 2_000L), "an old session without the time");
    }

    private static byte[] pngHeader(int w, int h) {
        ByteBuffer ihdr = ByteBuffer.allocate(17);
        ihdr.put("IHDR".getBytes()).putInt(w).putInt(h).put((byte) 8).put((byte) 2).put((byte) 0).put((byte) 0).put((byte) 0);
        CRC32 crc = new CRC32();
        crc.update(ihdr.array());
        ByteBuffer out = ByteBuffer.allocate(8 + 4 + 17 + 4);
        out.put(new byte[]{(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'}).putInt(13).put(ihdr.array()).putInt((int) crc.getValue());
        return out.array();
    }
}
