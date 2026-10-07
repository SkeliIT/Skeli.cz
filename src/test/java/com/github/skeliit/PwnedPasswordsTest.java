package com.github.skeliit;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PwnedPasswordsTest {

    @Test
    void readsTheCountForTheSuffix() {
        String body = "0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n00D4F6E8FA6EECAD2A3AA415EEC418D38EC:2\r\n"
                + "011053FD0102E94D6AE2F8B83D76FAF94F6:0\r\n";
        assertEquals(2, PwnedPasswords.countIn(body, "00D4F6E8FA6EECAD2A3AA415EEC418D38EC"));
        assertEquals(2, PwnedPasswords.countIn(body, "00d4f6e8fa6eecad2a3aa415eec418d38ec"));
        assertEquals(0, PwnedPasswords.countIn(body, "011053FD0102E94D6AE2F8B83D76FAF94F6"), "padding line");
        assertEquals(0, PwnedPasswords.countIn(body, "FFFFF"));
        assertEquals(0, PwnedPasswords.countIn(null, "X"));
    }
}
