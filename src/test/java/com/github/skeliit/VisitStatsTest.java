package com.github.skeliit;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class VisitStatsTest {

    @Test
    void crawlersAndScriptsAreBots() {
        assertTrue(VisitStats.isBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"));
        assertTrue(VisitStats.isBot("facebookexternalhit/1.1"));
        assertTrue(VisitStats.isBot("curl/8.4.0"));
        assertTrue(VisitStats.isBot(null));
        assertTrue(VisitStats.isBot(""));
        assertFalse(VisitStats.isBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36"));
        assertFalse(VisitStats.isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"));
    }

    @Test
    void theSameVisitorGetsTheSameIdOnlyWithTheSameDayKey() {
        byte[] monday = {1, 2, 3}, tuesday = {4, 5, 6};
        String a = VisitStats.hash(monday, "203.0.113.5|Firefox");
        assertEquals(32, a.length());
        assertEquals(a, VisitStats.hash(monday, "203.0.113.5|Firefox"));
        assertNotEquals(a, VisitStats.hash(monday, "203.0.113.6|Firefox"), "another visitor");
        assertNotEquals(a, VisitStats.hash(tuesday, "203.0.113.5|Firefox"), "another day can't be linked");
    }

    @Test
    void onlineMeansSeenWithinFiveMinutes() {
        long now = 10_000_000L;
        int before = VisitStats.online(now);
        VisitStats.touch("test-recent-" + now, now - 60_000);
        VisitStats.touch("test-old-" + now, now - VisitStats.ONLINE_WINDOW_MS - 1);
        assertEquals(before + 1, VisitStats.online(now));
    }
}
