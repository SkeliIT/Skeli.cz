package com.github.skeliit.dao;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** „Někdo tě předběhl“: kdo klesl v top 10 kvůli novému zápisu hráče me (a na jaké místo). */
class PongPassedTest {
    @Test
    void whoDroppedBecauseOfMe() {
        // před: 1. Andy (2), 2. Mates (3), 3. já (9); po: já jsem první → Andy a Mates klesli o místo
        List<int[]> p = PongDao.passed(List.of(2, 3, 9), List.of(9, 2, 3), 9);
        assertEquals(2, p.size());
        assertArrayEquals(new int[] {2, 2}, p.get(0));
        assertArrayEquals(new int[] {3, 3}, p.get(1));
    }

    @Test
    void newcomerPushesOthersAndSomeoneFallsOut() {
        List<Integer> before = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        List<Integer> after = List.of(1, 2, 99, 3, 4, 5, 6, 7, 8, 9);
        List<int[]> p = PongDao.passed(before, after, 99);
        assertEquals(8, p.size(), "3. až 10. místo kleslo");
        assertArrayEquals(new int[] {10, 11}, p.get(7), "desátý vypadl z top 10");
    }

    @Test
    void nobodyPassedWhenINoImprovement() {
        assertTrue(PongDao.passed(List.of(1, 2, 3), List.of(1, 2, 3), 3).isEmpty());
    }
}
