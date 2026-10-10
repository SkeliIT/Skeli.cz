package com.github.skeliit.web.site;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Old addresses keep landing on the page that replaced them. */
class LegacyRedirectTest {
    @Test
    void oldPagesMoveToTheirNewAddress() {
        assertEquals("/about.jsp", LegacyRedirectServlet.target("/bio.jsp", null));
        assertEquals("/privacy.jsp", LegacyRedirectServlet.target("/gdpr.jsp", null));
        assertEquals("/music.jsp", LegacyRedirectServlet.target("/music", null));
        assertEquals("/uzivatel.jsp", LegacyRedirectServlet.target("/profile/", null));
        assertEquals("/uzivatel.jsp", LegacyRedirectServlet.target("/profile.jsp", null));
    }

    @Test
    void oldLyricPageGoesToTheText() {
        assertEquals("/lyrics/12", LegacyRedirectServlet.target("/lyric.jsp", "12"));
        assertEquals("/texty.jsp", LegacyRedirectServlet.target("/lyric.jsp", null));
        assertEquals("/texty.jsp", LegacyRedirectServlet.target("/lyric.jsp", "12<script>"));
    }
}
