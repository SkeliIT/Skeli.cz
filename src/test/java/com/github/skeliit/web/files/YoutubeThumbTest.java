package com.github.skeliit.web.files;

import org.junit.jupiter.api.Test;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class YoutubeThumbTest {

    @Test
    void onlyRealThumbnailAddressesPass() {
        assertArrayEquals(new String[]{"pZx0xa6MpbE", "mqdefault"}, YoutubeThumbServlet.parse("/pZx0xa6MpbE/mqdefault.jpg"));
        assertArrayEquals(new String[]{"a-b_c12345", "hqdefault"}, YoutubeThumbServlet.parse("/a-b_c12345/hqdefault.jpg"));
        assertNull(YoutubeThumbServlet.parse("/pZx0xa6MpbE/other.jpg"), "unknown size");
        assertNull(YoutubeThumbServlet.parse("/../etc/passwd/hqdefault.jpg"));
        assertNull(YoutubeThumbServlet.parse("/abc/hqdefault.jpg"), "too short an id");
        assertNull(YoutubeThumbServlet.parse("/pZx0xa6MpbE/mqdefault.png"));
        assertNull(YoutubeThumbServlet.parse(null));
    }

    @Test
    void chybejiciVelkyObrazekMaMensiNahradu() {
        // starší klipy ve slabší kvalitě nemají maxres verze: musí existovat náhrada, jinak zůstane prázdný rámeček
        assertEquals(List.of("sddefault", "hqdefault"), YoutubeThumbServlet.smaller("maxresdefault"));
        assertEquals(List.of("sd2", "hq2"), YoutubeThumbServlet.smaller("maxres2"));
        assertEquals(List.of(), YoutubeThumbServlet.smaller("mqdefault"), "nejmenší verze už náhradu nemá");
    }

    @Test
    void cernePruhyNahoreADoleSeOriznou() {
        // 480×360 (4:3) s klipem 16:9 uprostřed: pruhy po 45 px nahoře i dole
        BufferedImage img = new BufferedImage(480, 360, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(200, 120, 40));
        g.fillRect(0, 45, 480, 270);
        g.dispose();
        BufferedImage cut = YoutubeThumbServlet.cropBars(img);
        assertEquals(480, cut.getWidth());
        assertEquals(270, cut.getHeight());
    }

    @Test
    void tmavaScenaJenNahoreSeNeorizne() {
        // tma jen nahoře (noční obloha), dole obraz: nic se neořízne
        BufferedImage img = new BufferedImage(480, 360, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(200, 120, 40));
        g.fillRect(0, 45, 480, 315);
        g.dispose();
        assertSame(img, YoutubeThumbServlet.cropBars(img));
    }
}
