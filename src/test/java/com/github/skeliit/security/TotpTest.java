package com.github.skeliit.security;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

/** The two-factor codes match RFC 6238 (and so the authenticator apps), and a code works only once. */
class TotpTest {
    // RFC 6238, appendix B: the SHA-1 key "12345678901234567890"
    private static final String RFC_KEY = Totp.base32("12345678901234567890".getBytes(StandardCharsets.US_ASCII));

    @Test
    void codesOfTheRfc() {
        // 8-digit 94287082 at 59 s → its last 6 digits; 07081804 at 1111111109 s
        assertEquals("287082", Totp.code(RFC_KEY, Totp.step(59_000L)));
        assertEquals("081804", Totp.code(RFC_KEY, Totp.step(1_111_111_109_000L)));
    }

    @Test
    void acceptsNeighbourStepsButEachCodeOnlyOnce() {
        String key = Totp.newSecret();
        long now = 1_800_000_000_000L, step = Totp.step(now);
        assertEquals(step, Totp.verify(key, Totp.code(key, step), now, 0));
        assertEquals(step - 1, Totp.verify(key, Totp.code(key, step - 1), now, 0), "the clock a step behind");
        assertEquals(-1, Totp.verify(key, Totp.code(key, step - 2), now, 0), "too old");
        assertEquals(-1, Totp.verify(key, Totp.code(key, step), now, step), "already used");
        assertEquals(-1, Totp.verify(key, "12ab56", now, 0));
        assertEquals(step, Totp.verify(key, " " + Totp.code(key, step).substring(0, 3) + " " + Totp.code(key, step).substring(3), now, 0), "spaces are fine");
    }

    @Test
    void base32RoundTripAndTheAppLink() {
        String key = Totp.newSecret();
        assertEquals(32, key.length());
        assertEquals(key, Totp.base32(Totp.unbase32(key)));
        String uri = Totp.otpauthUri("Jan Novák", key);
        assertTrue(uri.startsWith("otpauth://totp/Skeli.cz%3AJan%20Nov%C3%A1k?secret=" + key + "&issuer=Skeli.cz"));
        assertTrue(Totp.qrSvg(uri).startsWith("<svg"));
        assertEquals("ABCD EFGH IJ", Totp.grouped("ABCDEFGHIJ"));
    }
}
