package com.github.skeliit.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Jak MarketingStats pozná, odkud kdo přišel, z čeho a co hledal. */
class MarketingStatsTest {

    @Test
    void zdrojPodleAdresyWebu() {
        assertEquals("instagram", MarketingStats.source("l.instagram.com"));
        assertEquals("instagram", MarketingStats.source("www.instagram.com"));
        assertEquals("facebook", MarketingStats.source("m.facebook.com"));
        assertEquals("google", MarketingStats.source("www.google.cz"));
        assertEquals("google", MarketingStats.source("news.google.com"));
        assertEquals("youtube", MarketingStats.source("youtu.be"));
        assertEquals("seznam", MarketingStats.source("search.seznam.cz"));
        assertEquals("x", MarketingStats.source("t.co"));
        assertEquals("primo", MarketingStats.source(""));
        assertEquals("primo", MarketingStats.source(null));
        assertEquals("primo", MarketingStats.source("test.skeli.cz"), "vlastní web není cizí zdroj");
        assertEquals("kamarad.cz", MarketingStats.source("www.kamarad.cz"), "jiný web svou adresou");
        assertEquals("primo", MarketingStats.source("<script>"), "nesmysl se neuloží");
    }

    @Test
    void stitekKampane() {
        assertEquals("ig-bio", MarketingStats.campaign(" IG-bio "));
        assertEquals("", MarketingStats.campaign("ig bio"));
        assertEquals("", MarketingStats.campaign("a".repeat(33)));
        assertEquals("", MarketingStats.campaign(null));
    }

    @Test
    void zarizeni() {
        assertEquals("mobil", MarketingStats.device("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148"));
        assertEquals("mobil", MarketingStats.device("Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36"));
        assertEquals("tablet", MarketingStats.device("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"));
        assertEquals("tablet", MarketingStats.device("Mozilla/5.0 (Linux; Android 14; SM-X710) Safari/537.36"));
        assertEquals("pc", MarketingStats.device("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0"));
    }

    @Test
    void hledanyVyraz() {
        assertEquals("tisíc kousků", MarketingStats.term("  Tisíc   KOUSKŮ "));
        assertNull(MarketingStats.term("a"));
        assertEquals(40, MarketingStats.term("x".repeat(60)).length());
    }
}
