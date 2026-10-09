package com.github.skeliit.web.site;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class LyricDescriptionTest {

    @Test
    void joinsLinesAndSkipsBlankOnes() {
        assertEquals("první řádek / druhý řádek / třetí",
                LyricRouterServlet.firstLines("první řádek\r\ndruhý řádek\n\n  třetí\n", 160));
    }

    @Test
    void cutsAtWordBoundaryWithEllipsis() {
        String out = LyricRouterServlet.firstLines("jedna dva tři čtyři pět šest", 16);
        assertEquals("jedna dva tři…", out);
        assertTrue(out.length() <= 17);
    }

    @Test
    void nullStaysNull() {
        assertNull(LyricRouterServlet.firstLines(null, 160));
    }
}
