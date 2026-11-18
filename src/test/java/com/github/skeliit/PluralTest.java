package com.github.skeliit;

import org.junit.jupiter.api.Test;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Tvary slov podle čísla (I18n.plural) – poučení ze Skeli.cz: „0 Komentáře“, „1 Přátelé“.
 * Hlídá čísla 0, 1, 2, 4, 5, 11, 21, 22, 100, 102 v každém jazyce webu.
 */
class PluralTest {
    private static final long[] N = { 0, 1, 2, 4, 5, 11, 21, 22, 100, 102 };

    private static void check(String lang, String... expected) {
        for (int i = 0; i < N.length; i++) assertEquals(expected[i], I18n.plural(lang, N[i]), lang + " " + N[i]);
    }

    @Test void czech() {
        // 22 = „22 komentářů“, ne jako v polštině
        check("cs", "other", "one", "few", "few", "other", "other", "other", "other", "other", "other");
    }

    @Test void englishAndGerman() {
        check("en", "other", "one", "other", "other", "other", "other", "other", "other", "other", "other");
        check("de", "other", "one", "other", "other", "other", "other", "other", "other", "other", "other");
    }

    @Test void ukrainian() {
        check("uk", "many", "one", "few", "few", "many", "many", "one", "few", "many", "few");
    }

    @Test void vietnamese() {
        check("vi", "other", "other", "other", "other", "other", "other", "other", "other", "other", "other");
    }

    @Test void wordFollowsTheNumber() {
        Properties t = new Properties();
        t.setProperty("x.one", "komentář");
        t.setProperty("x.few", "komentáře");
        t.setProperty("x.many", "komentáře");
        t.setProperty("x.other", "komentářů");
        assertEquals("komentářů", I18n.countWord(t, "cs", "x", 0));
        assertEquals("komentář", I18n.countWord(t, "cs", "x", 1));
        assertEquals("komentáře", I18n.countWord(t, "cs", "x", 4));
        assertEquals("komentářů", I18n.countWord(t, "cs", "x", 22));
    }

    @Test void thousandsFollowTheLanguage() {
        assertEquals("1 250", I18n.number("cs", 1250));
        assertEquals("1,250", I18n.number("en", 1250));
    }
}
