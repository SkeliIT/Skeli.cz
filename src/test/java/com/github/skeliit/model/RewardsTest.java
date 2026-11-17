package com.github.skeliit.model;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/** Pravidla odemykání vzhledů (model/Rewards): server smí povolit jen to, co člověk splnil, získal dřív, nebo admin. */
class RewardsTest {

    private static Rewards.Have have(int days, Set<String> site, Set<String> stored, boolean admin) {
        return new Rewards.Have(days, site, Set.of(), stored, admin);
    }

    @Test
    void lyricVideoIsFreeForEveryone() {
        assertTrue(have(0, Set.of(), Set.of(), false).open(Rewards.find("kstyle", "l")));
    }

    @Test
    void daysAndBadgesUnlock() {
        Rewards.Item clean = Rewards.find("kstyle", "c"), smoke = Rewards.find("kstyle", "o");
        assertFalse(have(2, Set.of(), Set.of(), false).open(clean));
        assertTrue(have(3, Set.of(), Set.of(), false).open(clean));
        assertFalse(have(100, Set.of(), Set.of(), false).open(smoke));
        assertTrue(have(0, Set.of("s_karaoke"), Set.of(), false).open(smoke));
    }

    @Test
    void storedRewardNeverDisappearsAndAdminHasAll() {
        Rewards.Item tunnel = Rewards.find("kstyle", "t");
        assertTrue(have(0, Set.of(), Set.of(tunnel.key()), false).open(tunnel));
        assertTrue(have(0, Set.of(), Set.of(), true).open(tunnel));
    }

    @Test
    void unknownValuesAreRejected() {
        assertNull(Rewards.find("kstyle", "x"));
        assertNull(Rewards.find("kstyle", null));
        assertNull(Rewards.find(null, "l"));
    }
}
