package com.github.skeliit.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Dlaždice nástěnky: součet za období, změna proti předchozímu období a křivka. */
class DashboardStatsTest {

    private static DashboardStats.Tile tile(long... series) {
        return new DashboardStats.Tile("t", "Test", "fa-x", "", series, series.length / 2);
    }

    @Test
    void soucetAZmena() {
        DashboardStats.Tile t = tile(10, 10, 10, 10, 15, 15, 15, 15);   // 4 dny předtím 40, teď 60
        assertEquals(60, t.getTotal());
        assertEquals(40, t.getPrevious());
        assertEquals(50L, t.getChange());
        assertEquals("up", t.getTrend());
    }

    @Test
    void poklesStejneANove() {
        assertEquals("down", tile(10, 10, 5, 5).getTrend());
        assertEquals("flat", tile(50, 50, 50, 51).getTrend(), "o 1 % je pořád „stejně“");
        DashboardStats.Tile nove = tile(0, 0, 3, 0);
        assertNull(nove.getChange());
        assertEquals("up", nove.getTrend());
        assertTrue(nove.getTrendText().startsWith("nově"));
        assertEquals("zatím nic", tile(0, 0, 0, 0).getTrendText());
    }

    @Test
    void krivka() {
        String svg = DashboardStats.spark(new long[] { 0, 5, 10 }, "x");
        assertTrue(svg.startsWith("<svg class=\"spark\""));
        assertTrue(svg.contains("M3.0 33.0") && svg.contains("L117.0 3.0"), svg);   // nula dole, maximum nahoře
    }
}
