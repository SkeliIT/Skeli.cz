package com.github.skeliit.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Šifrování zpráv: tam a zpět, stará nezašifrovaná data a špatný klíč. */
class SecretBoxTest {
    private static SecretKeySpec key(int fill) {
        byte[] raw = new byte[32];
        java.util.Arrays.fill(raw, (byte) fill);
        return SecretBox.readKey(Base64.getEncoder().encodeToString(raw));
    }

    @Test
    @DisplayName("Tam a zpět, i s diakritikou a smajlíkem; pokaždé jiný výsledek")
    void roundTrip() {
        SecretKeySpec k = key(7);
        String text = "Čau, jdeš dneska na karaoke? 🔥";
        String one = SecretBox.seal(text, k), two = SecretBox.seal(text, k);
        assertTrue(SecretBox.isSealed(one));
        assertFalse(one.contains("karaoke"));
        assertNotEquals(one, two, "stejná zpráva nesmí dát stejný výsledek");
        assertEquals(text, SecretBox.open(one, k));
    }

    @Test
    @DisplayName("Delší zpráva se do sloupce TEXT vejde")
    void longestMessageFits() {
        String text = "😀".repeat(1000);
        assertTrue(SecretBox.seal(text, key(7)).length() < 65_535);
    }

    @Test
    @DisplayName("Starý nezašifrovaný text jde číst, prázdný zůstane prázdný, null zůstane null")
    void plainStaysReadable() {
        SecretKeySpec k = key(7);
        assertEquals("starý text", SecretBox.open("starý text", k));
        assertEquals("", SecretBox.seal("", k));
        assertNull(SecretBox.seal(null, k));
    }

    @Test
    @DisplayName("Bez klíče se neukládá nic zašifrovaného a cizí klíč zprávu nepřečte")
    void wrongOrMissingKey() {
        assertEquals("ahoj", SecretBox.seal("ahoj", null));
        String sealed = SecretBox.seal("ahoj", key(7));
        assertEquals("", SecretBox.open(sealed, key(8)));
        assertEquals("", SecretBox.open(sealed, null));
        assertEquals("", SecretBox.open("gcm1:tohle-neni-base64!", key(7)));
    }

    @Test
    @DisplayName("Špatně zadaný klíč je jako žádný")
    void badKeyIsIgnored() {
        assertNull(SecretBox.readKey(null));
        assertNull(SecretBox.readKey("  "));
        assertNull(SecretBox.readKey("krátký"));
        assertNull(SecretBox.readKey(Base64.getEncoder().encodeToString(new byte[16])));
    }
}
