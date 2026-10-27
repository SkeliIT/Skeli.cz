package com.github.skeliit.model;

import java.util.ArrayList;
import java.util.List;

/**
 * CatSmash na stránce Můj účet: nejlepší výhra a místo v tabulce na každé obtížnosti a odznaky.
 * Odznaky se počítají ze serverem uložených výher (pong_results), takže nejdou podvrhnout.
 */
public class PongProfile {
    /** Nejlepší (nejrychlejší) výhra na obtížnosti 1–3 (index 0–2) v ms; null = tam ještě nevyhrál. */
    public final Integer[] bestMs = new Integer[3];
    /** Místo v tabulce na obtížnosti 1–3; null = není v tabulce. */
    public final Integer[] place = new Integer[3];
    public int wins;
    /** Titul u jména (klíč získaného odznaku) nebo null. */
    public String title;
    public final List<Badge> badges = new ArrayList<>();

    /** Jeden odznak: klíč textů pong.badge.{key} a pong.badge.{key}.how, ikona Font Awesome, získaný? */
    public static class Badge {
        public final String key;
        public final String icon;
        public final boolean earned;

        public Badge(String key, String icon, boolean earned) {
            this.key = key;
            this.icon = icon;
            this.earned = earned;
        }
    }

    public void badge(String key, String icon, boolean earned) {
        badges.add(new Badge(key, icon, earned));
    }

    public boolean has(String key) {
        for (Badge b : badges) if (b.earned && b.key.equals(key)) return true;
        return false;
    }

    public int earnedCount() {
        int n = 0;
        for (Badge b : badges) if (b.earned) n++;
        return n;
    }

    /** Čas hry jako m:ss.d (např. 1:23.4). */
    public static String time(int ms) {
        int tenths = Math.max(0, ms) / 100;
        return (tenths / 600) + ":" + String.format("%02d", (tenths / 10) % 60) + "." + (tenths % 10);
    }
}
