package com.github.skeliit.model;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
    void nextBadgeIsTheNearestWinsBadge() {
        PongProfile p = new PongProfile();
        p.findNextBadge(7);
        assertEquals("streak", p.nextBadge);
        assertEquals(7, p.nextHave);
        assertEquals(10, p.nextNeed);
        PongProfile done = new PongProfile();
        done.findNextBadge(100);
        assertEquals(null, done.nextBadge);
    }

    @Test
    void gameUsesTheSameRarity() throws Exception {
        String js = Files.readString(Path.of("src/main/webapp/js/catsmash/data.js"));
        Matcher block = Pattern.compile("var RARITY = \\{(.*?)\\};", Pattern.DOTALL).matcher(js);
        assertTrue(block.find(), "data.js nemá seznam RARITY");
        Map<String, String> game = new HashMap<>();
        Matcher pair = Pattern.compile("(\\w+): '(\\w)'").matcher(block.group(1));
        while (pair.find()) game.put(pair.group(1), pair.group(2));
        assertEquals(game, new HashMap<>(PongBadges.RARITY));
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
