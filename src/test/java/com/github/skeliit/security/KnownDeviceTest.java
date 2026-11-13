package com.github.skeliit.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Známé zařízení (audit C8) a úklid paměti omezovače (audit D1). */
class KnownDeviceTest {
    static final byte[] SECRET = KnownDevice.derive("klic-jen-pro-test-aaaaaaaaaaaaaaaaaaaaaaaaaaaa=");

    @Test void aSignedCookieFitsOnlyItsAccount() {
        String v = KnownDevice.value(SECRET, 42);
        assertTrue(KnownDevice.matches(SECRET, v, 42));
        assertFalse(KnownDevice.matches(SECRET, v, 43), "cookie jednoho účtu neplatí pro jiný");
        assertFalse(KnownDevice.matches(SECRET, "43" + v.substring(2), 43), "přepsané číslo účtu podpis nesedí");
        assertFalse(KnownDevice.matches(KnownDevice.derive("jiny-klic"), v, 42), "jiný klíč serveru = neplatná cookie");
        assertFalse(KnownDevice.matches(SECRET, null, 42));
    }

    @Test void withoutAKeyNothingIsTrusted() {
        assertNull(KnownDevice.derive(null));
        assertNull(KnownDevice.value(null, 42));
        assertFalse(KnownDevice.matches(null, "42.cokoli", 42));
    }

    @Test void oldLimiterEntriesAreSweptAway() {
        RequestLimiter.clear();
        for (int i = 0; i < 50; i++) RequestLimiter.tryAcquire("test-sweep", "ip" + i, 5, RequestLimiter.MINUTE);
        assertEquals(50, RequestLimiter.size());
        long later = System.currentTimeMillis() + RequestLimiter.KEEP_MS + 1000;
        assertEquals(50, RequestLimiter.sweepNow(later, true), "po dni bez akce se klíče uklidí");
        assertEquals(0, RequestLimiter.size());
    }

    @Test void resetForgetsTheCount() {
        RequestLimiter.clear();
        for (int i = 0; i < 3; i++) RequestLimiter.tryAcquire("test-reset", "k", 3, RequestLimiter.MINUTE);
        assertTrue(RequestLimiter.isFull("test-reset", "k", 3, RequestLimiter.MINUTE));
        RequestLimiter.reset("test-reset", "k");
        assertFalse(RequestLimiter.isFull("test-reset", "k", 3, RequestLimiter.MINUTE));
    }
}
