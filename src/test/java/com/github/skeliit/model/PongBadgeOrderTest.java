package com.github.skeliit.model;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Pořadí odznaků: získané nahoře, v obou částech od nejběžnějšího; server a hra mají stejný seznam. */
class PongBadgeOrderTest {

    @Test
    void earnedGoFirstThenByRarity() {
        PongProfile p = new PongProfile();
        p.badge("skelosquad", "x", false);
        p.badge("wins100", "x", true);
        p.badge("first", "x", false);
        p.badge("hwins5", "x", true);
        p.badge("easy", "x", true);
        p.sortBadges();
        List<String> order = new ArrayList<>();
        for (PongProfile.Badge b : p.badges) order.add(b.key);
        assertEquals(List.of("easy", "wins100", "hwins5", "first", "skelosquad"), order);
    }

    @Test
    void everyBadgeHasARank() {
        assertEquals(new HashSet<>(PongBadges.ICONS.keySet()), new HashSet<>(PongBadges.RANK));
    }

    @Test
    void gameUsesTheSameOrder() throws Exception {
        String js = Files.readString(Path.of("src/main/webapp/js/catsmash/data.js"));
        Matcher list = Pattern.compile("var RANK = \\[(.*?)\\]").matcher(js);
        assertTrue(list.find(), "data.js nemá seznam RANK");
        List<String> keys = new ArrayList<>();
        Matcher key = Pattern.compile("'(\\w+)'").matcher(list.group(1));
        while (key.find()) keys.add(key.group(1));
        assertEquals(PongBadges.RANK, keys);
    }
}
