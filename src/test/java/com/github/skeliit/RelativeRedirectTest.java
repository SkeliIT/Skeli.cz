package com.github.skeliit;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RelativeRedirectTest {

    @Test
    void redirectsInsideTheSiteBecomePaths() {
        assertEquals("/index.jsp", RelativeRedirectFilter.sitePath("/login", "index.jsp"));
        assertEquals("/login.jsp?reset=1", RelativeRedirectFilter.sitePath("/reset", "login.jsp?reset=1"));
        assertEquals("/admin/lyrics?saved=1", RelativeRedirectFilter.sitePath("/admin/lyrics", "lyrics?saved=1"));
        assertEquals("/newsletter.jsp?success=1", RelativeRedirectFilter.sitePath("/newsletter/subscribe", "/newsletter.jsp?success=1"));
        assertEquals("/admin/lyrics?x=1", RelativeRedirectFilter.sitePath("/admin/lyrics", "?x=1"));
    }

    @Test
    void otherSitesStayAsTheyAre() {
        assertNull(RelativeRedirectFilter.sitePath("/x", "https://www.youtube.com/watch?v=abc"));
        assertNull(RelativeRedirectFilter.sitePath("/x", "//evil.example/"));
        assertNull(RelativeRedirectFilter.sitePath("/x", "mailto:someone@example.com"));
        assertNull(RelativeRedirectFilter.sitePath("/x", null));
    }
}
