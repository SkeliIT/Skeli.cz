package com.github.skeliit;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class PasswordRulesTest {

    @Test
    void strongPasswordHasNoProblems() {
        assertEquals(Set.of(), WebUtils.passwordProblems("Silne-Heslo42"));
        assertTrue(WebUtils.isPasswordStrong("Žluťoučký-kůň7"));
    }

    @Test
    void eightCharactersAreEnough() {
        assertTrue(WebUtils.isPasswordStrong("Ab1!efgh"));
        assertEquals(Set.of("length"), WebUtils.passwordProblems("Ab1!efg"));
    }

    @Test
    void reportsEveryMissingRule() {
        assertEquals(Set.of("length", "upper", "digit", "special"), WebUtils.passwordProblems("abc"));
        assertEquals(Set.of("digit"), WebUtils.passwordProblems("Bez-cislovky!"));
        assertEquals(Set.of("special"), WebUtils.passwordProblems("BezZnaku12345"));
        assertEquals(Set.of("length", "lower", "upper", "digit", "special"), WebUtils.passwordProblems(null));
    }

    @Test
    void spacesInvisibleCharactersAndEmojiAreRefused() {
        assertTrue(WebUtils.passwordProblems("Silne Heslo42!").contains("invalid"));
        assertTrue(WebUtils.passwordProblems("Silne Heslo42!").contains("invalid"));
        assertTrue(WebUtils.passwordProblems("Silne​Heslo42!").contains("invalid"));
        assertTrue(WebUtils.passwordProblems("SilneHeslo42😀").contains("invalid"));
        assertEquals("auth.error.passwordInvalidChars",
                WebUtils.passwordErrorKey(WebUtils.passwordProblems("Silne Heslo42!")));
    }

    @Test
    void tooLongForBcryptIsRefused() {
        String ok64 = "Aa1!" + "x".repeat(60);
        assertEquals(Set.of(), WebUtils.passwordProblems(ok64));
        assertEquals(Set.of("long"), WebUtils.passwordProblems(ok64 + "y"));
        // 40 characters, but more than 72 bytes in UTF-8
        assertEquals(Set.of("long"), WebUtils.passwordProblems("Aa1!" + "ž".repeat(36)));
        assertEquals("auth.error.passwordTooLong", WebUtils.passwordErrorKey(Set.of("long")));
    }
}
