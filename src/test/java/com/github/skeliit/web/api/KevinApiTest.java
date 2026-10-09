package com.github.skeliit.web.api;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class KevinApiTest {
    private static final long DAY = 24L * 3600 * 1000;

    @Test
    void lastVisitIsKeptWithinTheLastMonth() {
        long now = System.currentTimeMillis();
        long week = now - 7 * DAY;
        assertEquals(week, KevinApiServlet.since(String.valueOf(week)).getTime());
        // a year ago or a broken value: a month back at most
        assertTrue(KevinApiServlet.since(String.valueOf(now - 365 * DAY)).getTime() >= now - 32 * DAY);
        assertTrue(KevinApiServlet.since("nonsense").getTime() >= now - 32 * DAY);
        assertTrue(KevinApiServlet.since(null).getTime() >= now - 32 * DAY);
        // the future is now
        assertTrue(KevinApiServlet.since(String.valueOf(now + 10 * DAY)).getTime() <= System.currentTimeMillis());
    }
}
