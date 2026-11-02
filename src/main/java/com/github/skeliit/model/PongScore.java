package com.github.skeliit.model;

/**
 * Skóre zápasu CatSmash. Počítá ho prohlížeč (pro rozpis po zápase) i server (ten je rozhodující) – stejný vzorec
 * je v js/catsmash/hra.js (scoreOf). Server navíc odmítne nemožné hodnoty (plausible).
 * <p>
 * Body: gól hráče 100, perfektní odstřel 20, SUPER rána 60, gól superútokem 150, série (10 × délka každé série
 * od 2×, počítá prohlížeč jako streakPts), nejdelší výměna 5 za odraz, chycená součástka 30, Kevinův gól −40,
 * výhra 500 + čas (2000 × normální čas ÷ můj čas; normální čas = 20 s na každý gól zápasu; nejvýš 8000).
 * Čím déle zápas trvá, tím méně bodů – plynule, nikdy pod nulu. Celek × obtížnost (1 / 1,5 / 2,5), nejméně 0.
 * Do tabulek se počítají jen výhry (prohra je prohra), skóre prohry se jen ukáže po zápase.
 */
public final class PongScore {
    public static final int[] LENGTHS = {10, 20, 30};

    /** Normální délka zápasu: 20 s na každý gól, který hráč musí dát; bonus za čas v normálním čase a nejvýš. */
    public static final int PAR_PER_GOAL_MS = 20_000, TIME_BONUS = 2000, TIME_BONUS_MAX = 8000;

    public int len, difficulty, you, kevin, ms, perfect, supers, stickGoals, streakPts, rally, screws;

    public boolean won() { return you == len; }

    public static boolean validLength(int len) {
        for (int l : LENGTHS) if (l == len) return true;
        return false;
    }

    public static double multiplier(int difficulty) {
        return difficulty == 3 ? 2.5 : difficulty == 2 ? 1.5 : 1;
    }

    public int score() {
        int raw = you * 100 + (perfect - supers) * 20 + supers * 60 + stickGoals * 150 + streakPts + rally * 5 + screws * 30 - kevin * 40;
        if (won()) {
            raw += 500 + timeBonus(len, ms);
        }
        return Math.max(0, (int) Math.round(raw * multiplier(difficulty)));
    }

    /** Bonus za čas výhry: v normálním čase 2000, za polovinu 4000, za dvojnásobek 1000 (nejvýš 8000). */
    public static int timeBonus(int len, int ms) {
        long par = (long) len * PAR_PER_GOAL_MS;
        return (int) Math.min(TIME_BONUS_MAX, Math.round(TIME_BONUS * par / (double) Math.max(1000, ms)));
    }

    /** Dá se takový zápas opravdu odehrát? (konec zápasu, rozumné počty vzhledem ke gólům a času) */
    public boolean plausible() {
        if (!validLength(len) || difficulty < 1 || difficulty > 3) return false;
        if (you < 0 || kevin < 0 || you > len || kevin > len || (you == len) == (kevin == len)) return false;
        int goals = you + kevin, minutes = ms / 60_000 + 1;
        if (ms < goals * 1500 || ms > 60 * 60_000) return false;
        if (perfect < 0 || supers < 0 || supers > perfect || perfect > goals * 40 + minutes * 30) return false;
        if (stickGoals < 0 || stickGoals > you || stickGoals > 1 + perfect / 10) return false;
        if (streakPts < 0 || streakPts > perfect * 10) return false;
        if (rally < 0 || rally > 400 || screws < 0 || screws > ms / 3000 + 5) return false;
        return true;
    }
}
