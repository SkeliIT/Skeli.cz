package com.github.skeliit.web.files;

import org.junit.jupiter.api.Test;

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
}
