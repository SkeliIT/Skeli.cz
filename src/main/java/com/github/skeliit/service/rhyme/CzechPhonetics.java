package com.github.skeliit.service.rhyme;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Zjednodušený převod české psané podoby na výslovnost (hlásky), aby se rýmy porovnávaly podle zvuku, ne podle písmen:
 * „Bůh“ se rýmuje se „vzduch“, „byl“ s „pil“, „dítě“ s „tě“. Hláska je krátký řetězec: samohlásky „a“, „á“, …, dvojhlásky
 * „ou“/„au“/„eu“, slabikotvorné r/l jako „R“/„L“, souhlásky „ch“, „ď“, „ť“, „ň“, „dž“, … Pravidla pokrývají spisovnou
 * výslovnost bez výjimek z cizích slov (diktát se přečte jako „ďiktát“) – na rýmy to skoro nemá vliv.
 */
public final class CzechPhonetics {

    /** Krátké a dlouhé samohlásky, dvojhlásky a slabikotvorné R/L = jádra slabik. */
    static final Set<String> VOWELS = Set.of("a", "á", "e", "é", "i", "í", "o", "ó", "u", "ú", "ou", "au", "eu", "R", "L");

    /** Párové souhlásky znělá → neznělá (pro spodobu a konec slova). */
    private static final Map<String, String> DEVOICE = Map.ofEntries(
            Map.entry("b", "p"), Map.entry("d", "t"), Map.entry("ď", "ť"), Map.entry("g", "k"),
            Map.entry("dz", "c"), Map.entry("dž", "č"), Map.entry("z", "s"), Map.entry("ž", "š"),
            Map.entry("h", "ch"), Map.entry("v", "f"));
    private static final Map<String, String> VOICE = Map.ofEntries(
            Map.entry("p", "b"), Map.entry("t", "d"), Map.entry("ť", "ď"), Map.entry("k", "g"),
            Map.entry("c", "dz"), Map.entry("č", "dž"), Map.entry("s", "z"), Map.entry("š", "ž"),
            Map.entry("ch", "h"), Map.entry("f", "v"));

    private CzechPhonetics() { }

    public static boolean isVowel(String ph) {
        return VOWELS.contains(ph);
    }

    static boolean isObstruent(String ph) {
        return DEVOICE.containsKey(ph) || VOICE.containsKey(ph);
    }

    /** Rozdělí verš na slova (jen písmena, malými). Číslice a interpunkce zmizí, „to-je“ jsou dvě slova. */
    public static List<String> words(String line) {
        List<String> out = new ArrayList<>();
        String norm = Normalizer.normalize(line, Normalizer.Form.NFC).toLowerCase(Locale.ROOT);
        StringBuilder w = new StringBuilder();
        for (int i = 0; i < norm.length(); i++) {
            char ch = norm.charAt(i);
            if (Character.isLetter(ch)) {
                w.append(ch);
            } else if (ch == '\'' || ch == '’') {
                // „nemám‘s“, „von’s“ – apostrof ve slovech rapu ponecháme slovo vcelku
            } else if (w.length() > 0) {
                out.add(w.toString());
                w.setLength(0);
            }
        }
        if (w.length() > 0) out.add(w.toString());
        return out;
    }

    /** Výslovnost jednoho slova jako seznam hlásek (koncová souhláska už ztratila znělost). */
    public static List<String> phonemes(String word) {
        List<String> ph = new ArrayList<>();
        String s = word.toLowerCase(Locale.ROOT);
        int n = s.length();
        for (int i = 0; i < n; i++) {
            char c = s.charAt(i);
            char next = i + 1 < n ? s.charAt(i + 1) : 0;
            switch (c) {
                case 'c' -> {
                    if (next == 'h') { ph.add("ch"); i++; } else ph.add("c");
                }
                case 'd' -> {
                    if (next == 'ž') { ph.add("dž"); i++; }
                    else if (next == 'i' || next == 'í' || next == 'ě') ph.add("ď");
                    else ph.add("d");
                }
                case 't' -> ph.add(next == 'i' || next == 'í' || next == 'ě' ? "ť" : "t");
                case 'n' -> ph.add(next == 'i' || next == 'í' || next == 'ě' ? "ň" : "n");
                case 'm' -> {
                    ph.add("m");
                    if (next == 'ě') { ph.add("ň"); ph.add("e"); i++; }
                }
                case 'b', 'p', 'v', 'f' -> {
                    ph.add(String.valueOf(c));
                    if (next == 'ě') { ph.add("j"); ph.add("e"); i++; }
                }
                case 'o' -> {
                    if (next == 'u') { ph.add("ou"); i++; } else ph.add("o");
                }
                case 'a' -> {
                    if (next == 'u') { ph.add("au"); i++; } else ph.add("a");
                }
                case 'e' -> {
                    if (next == 'u') { ph.add("eu"); i++; } else ph.add("e");
                }
                case 'ě' -> ph.add("e");
                case 'y' -> ph.add("i");
                case 'ý' -> ph.add("í");
                case 'ů' -> ph.add("ú");
                case 'x' -> { ph.add("k"); ph.add("s"); }
                case 'q' -> { ph.add("k"); ph.add("v"); }
                case 'w' -> ph.add("v");
                case 'ä' -> ph.add("e");
                case 'ö', 'ü' -> ph.add(c == 'ö' ? "e" : "i");
                default -> {
                    if (Character.isLetter(c)) ph.add(String.valueOf(c));
                }
            }
        }
        markSyllabicLiquids(ph);
        assimilate(ph);
        return ph;
    }

    /** r/l mezi souhláskami nebo na konci po souhlásce tvoří slabiku: vlk, smrt, krk, nesl, Petr. */
    private static void markSyllabicLiquids(List<String> ph) {
        for (int i = 1; i < ph.size(); i++) {
            String p = ph.get(i);
            if (!p.equals("r") && !p.equals("l")) continue;
            boolean prevCons = !isVowel(ph.get(i - 1));
            boolean nextCons = i + 1 >= ph.size() || !isVowel(ph.get(i + 1));
            if (prevCons && nextCons) ph.set(i, p.toUpperCase(Locale.ROOT));
        }
    }

    /** Spodoba znělosti zprava doleva a ztráta znělosti na konci slova. „v“ znělost nepředává (svět, tvůj). */
    private static void assimilate(List<String> ph) {
        boolean voicelessContext = true; // konec slova se chová jako neznělé okolí
        boolean contextFromObstruent = true;
        for (int i = ph.size() - 1; i >= 0; i--) {
            String p = ph.get(i);
            if (!isObstruent(p)) {
                contextFromObstruent = false;
                continue;
            }
            if (contextFromObstruent) {
                String changed = voicelessContext ? DEVOICE.getOrDefault(p, p) : VOICE.getOrDefault(p, p);
                // „ch“ před znělou se mění v „h“ jen výjimečně (abych byl), nechme ji neznělou
                if (!voicelessContext && p.equals("ch")) changed = p;
                ph.set(i, changed);
                p = changed;
            }
            if (p.equals("v")) {
                // v se samo přizpůsobí, ale dál nepůsobí – před ním se rozhoduje podle toho, co je za ním
                continue;
            }
            voicelessContext = VOICE.containsKey(p); // neznělá ⇒ další doleva také neznělá
            contextFromObstruent = true;
        }
    }

    /** Výslovnost celého verše (slova za sebou, hranice slov se při rýmu nepočítají: „mám to“ ~ „zlato“). */
    public static List<String> linePhonemes(List<String> words) {
        List<String> out = new ArrayList<>();
        for (String w : words) out.addAll(phonemes(w));
        return out;
    }

    /** Počet slabik slova či verše = počet jader. */
    public static int syllables(List<String> phonemes) {
        int n = 0;
        for (String p : phonemes) if (isVowel(p)) n++;
        return n;
    }
}
