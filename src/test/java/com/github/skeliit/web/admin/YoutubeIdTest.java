package com.github.skeliit.web.admin;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class YoutubeIdTest {

    @Test
    void acceptsBareIdsAndLinks() {
        assertEquals("pZx0xa6MpbE", AdminVideoServlet.youtubeId("pZx0xa6MpbE"));
        assertEquals("pZx0xa6MpbE", AdminVideoServlet.youtubeId(" https://www.youtube.com/watch?v=pZx0xa6MpbE&t=42s "));
        assertEquals("pZx0xa6MpbE", AdminVideoServlet.youtubeId("https://youtu.be/pZx0xa6MpbE?si=abc"));
        assertEquals("pZx0xa6MpbE", AdminVideoServlet.youtubeId("https://www.youtube.com/shorts/pZx0xa6MpbE"));
        assertEquals("pZx0xa6MpbE", AdminVideoServlet.youtubeId("https://m.youtube.com/embed/pZx0xa6MpbE"));
    }

    @Test
    void rejectsEmptyAndGarbage() {
        assertNull(AdminVideoServlet.youtubeId(""));
        assertNull(AdminVideoServlet.youtubeId(null));
        assertNull(AdminVideoServlet.youtubeId("https://example.com/nothing here"));
    }
}
