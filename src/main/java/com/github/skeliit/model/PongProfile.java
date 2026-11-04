package com.github.skeliit.model;

import java.util.ArrayList;
import java.util.Comparator;
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
    /** Vybraný rámeček kolem fotky (klíč odznaku) nebo null. */
    public String frame;
    /** Rámeček, který vidí ostatní: šampion měsíce (champ1–3, když ho nevypnul), jinak vybraný. */
    public String shownFrame;
    /** Místo mezi šampiony (1–3) nebo null; champOn = rámeček šampiona zapnutý. */
    public Integer champPlace;
    public boolean champOn = true;
    public String mark;               // legendární znak u jména (jen když ho hráč zapnul a má odznak)
    public final List<Badge> badges = new ArrayList<>();
    /** Nejbližší odznak za počet výher (klíč, kolik výher má a kolik je potřeba); null = všechny za výhry získal. */
    public String nextBadge;
    public int nextHave;
    public int nextNeed;

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

    /** Seřadí odznaky pro výpis: získané nahoře, chybějící pod nimi, v obou částech od nejběžnějšího po nejvzácnější. */
    public void sortBadges() {
        badges.sort(Comparator.comparing((Badge b) -> !b.earned).thenComparingInt(b -> PongBadges.RANK.indexOf(b.key)));
    }

    /** Spočítá nejbližší odznak za výhry: první, 3, 10, 50 a 100 výher. */
    public void findNextBadge(int winsCounted) {
        String[] keys = { "first", "easy", "streak", "wins50", "wins100" };
        int[] need = { 1, 3, 10, 50, 100 };
        for (int i = 0; i < keys.length; i++) {
            if (winsCounted < need[i]) {
                nextBadge = keys[i];
                nextHave = winsCounted;
                nextNeed = need[i];
                return;
            }
        }
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
