package com.github.skeliit.filter;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

/** Přihlášení na testu se nikdy nesmí zapnout na www, ani kdyby se tam klíč dostal. */
class TestLoginFilterTest {
    private static final String KEY = "a".repeat(64);

    @Test
    void runsOnlyOnTheTestSite() {
        assertTrue(TestLoginFilter.allowed(KEY, "https://test.skeli.cz"));
        assertTrue(TestLoginFilter.allowed(KEY, "http://localhost:8080"));
        assertFalse(TestLoginFilter.allowed(KEY, "https://www.skeli.cz"));
        assertFalse(TestLoginFilter.allowed(KEY, "https://skeli.cz"));
        assertFalse(TestLoginFilter.allowed(KEY, "https://test.skeli.cz.evil.example"));
        assertFalse(TestLoginFilter.allowed(KEY, null));
        assertFalse(TestLoginFilter.allowed(KEY, "::neplatna adresa"));
    }

    @Test
    void needsALongKey() {
        assertFalse(TestLoginFilter.allowed(null, "https://test.skeli.cz"));
        assertFalse(TestLoginFilter.allowed("", "https://test.skeli.cz"));
        assertFalse(TestLoginFilter.allowed("kratky", "https://test.skeli.cz"));
    }

    @Test
    void comparesTheWholeValue() {
        byte[] ok = "otisk".getBytes(StandardCharsets.UTF_8);
        assertTrue(TestLoginFilter.same(ok, "otisk"));
        assertFalse(TestLoginFilter.same(ok, "otis"));
        assertFalse(TestLoginFilter.same(ok, ""));
        assertFalse(TestLoginFilter.same(ok, null));
    }
}
