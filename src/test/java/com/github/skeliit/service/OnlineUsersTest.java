package com.github.skeliit.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Online, Nečinný a pryč: kdy se co ukáže. */
class OnlineUsersTest {
    private static final long MIN = 60_000L;

    @Test
    @DisplayName("Stránka je otevřená a člověk se 5 minut nepohnul: Nečinný")
    void idleAfterFiveMinutesWithoutInput() {
        int id = 910_001;
        long t = System.currentTimeMillis();
        OnlineUsers.touch(id, true, t);
        assertTrue(OnlineUsers.isOnline(id, t));
        assertFalse(OnlineUsers.isIdle(id, t + 4 * MIN), "4 minuty ještě ne");
        for (int i = 1; i <= 6; i++) OnlineUsers.touch(id, false, t + i * MIN);   // stránka se hlásí, člověk nic
        assertTrue(OnlineUsers.isOnline(id, t + 6 * MIN));
        assertTrue(OnlineUsers.isIdle(id, t + 6 * MIN));
        OnlineUsers.touch(id, true, t + 7 * MIN);
        assertFalse(OnlineUsers.isIdle(id, t + 7 * MIN), "pohnul se, je zase Online");
    }

    @Test
    @DisplayName("Zavřená záložka: do 5 minut pryč a není ani Nečinný")
    void goneAfterTheTabCloses() {
        int id = 910_002;
        long t = System.currentTimeMillis();
        OnlineUsers.touch(id, true, t);
        assertFalse(OnlineUsers.isOnline(id, t + 6 * MIN));
        assertFalse(OnlineUsers.isIdle(id, t + 6 * MIN));
    }
}
