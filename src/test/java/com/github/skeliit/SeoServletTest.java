package com.github.skeliit;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class SeoServletTest {

    @Test
    void testSubdomainIsNotIndexed() {
        assertTrue(SeoServlet.isTestInstance("https://test.skeli.cz"));
    }

    @Test
    void productionIsIndexed() {
        assertFalse(SeoServlet.isTestInstance("https://www.skeli.cz"));
        assertFalse(SeoServlet.isTestInstance("https://skeli.cz"));
        assertFalse(SeoServlet.isTestInstance("http://localhost:8080"));
    }
}
