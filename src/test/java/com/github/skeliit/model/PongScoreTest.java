package com.github.skeliit.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PongScoreTest {
    private static PongScore match(int len, int d, int you, int kevin, int ms) {
        PongScore p = new PongScore();
        p.len = len; p.difficulty = d; p.you = you; p.kevin = kevin; p.ms = ms;
        return p;
    }

    @Test
    void winWithGoodPlayBeatsPlainWin() {
        PongScore plain = match(10, 2, 10, 4, 180_000);
        PongScore good = match(10, 2, 10, 4, 180_000);
        good.perfect = 12; good.supers = 2; good.streakPts = 40;
        assertTrue(good.score() > plain.score());
        // 10×100 + 500 − 4×40 + rychlost (200 s − 180 s = 20 s × 5) = 1440, × 1,5
        assertEquals(2160, plain.score());
    }

    @Test
    void lossStillCountsButLessAndNeverNegative() {
        PongScore loss = match(10, 1, 8, 10, 200_000);
        assertEquals(800 - 400, loss.score());
        assertEquals(0, match(10, 1, 0, 10, 60_000).score());
    }

    @Test
    void impossibleMatchesAreRejected() {
        assertTrue(match(15, 3, 15, 9, 300_000).plausible());
        assertFalse(match(12, 2, 12, 3, 300_000).plausible(), "jen 10 / 15 / 20");
        assertFalse(match(10, 2, 9, 8, 300_000).plausible(), "zápas neskončil");
        assertFalse(match(10, 2, 10, 2, 5_000).plausible(), "moc rychle");
        PongScore cheat = match(10, 2, 10, 0, 120_000);
        cheat.perfect = 5000;
        assertFalse(cheat.plausible());
        PongScore stick = match(10, 2, 10, 0, 120_000);
        stick.stickGoals = 6;
        assertFalse(stick.plausible(), "superútok se nabíjí 10 perfektními");
    }
}
