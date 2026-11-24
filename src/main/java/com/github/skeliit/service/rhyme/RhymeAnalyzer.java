package com.github.skeliit.service.rhyme;

import com.github.skeliit.model.RhymeReport;
import com.github.skeliit.model.RhymeReport.Kind;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Rozbor kvality rýmů českého textu (básně i rapu). Verše se porovnávají podle výslovnosti od konce:
 * <ul>
 *   <li><b>hloubka</b> – kolik slabik od konce má stejnou samohlásku (zlato ~ mám to = 2, jezerem ~ večerem = 3),</li>
 *   <li><b>přesnost</b> – jak moc se shodují souhlásky mezi nimi a hlavně na samém konci (les ~ pes přesně, les ~ led ne),</li>
 *   <li><b>opěrná souhláska</b> – u jednoslabičných a otevřených konců rozhoduje i souhláska před samohláskou,</li>
 *   <li>srážky za <b>identický rým</b> (stejné slovo) a <b>gramatický rým</b> (shoduje se jen koncovka: dělal ~ volal).</li>
 * </ul>
 * Z párů se skládá skóre textu 0–100: kolik veršů se rýmuje, jak dobře, jak bohatě, vnitřní rýmy a pestrost.
 * Třída nemá stav ani databázi, je bezpečné ji volat z více vláken.
 */
public final class RhymeAnalyzer {

    /** Od této kvality páru se verš počítá jako zrýmovaný. */
    public static final double RHYME_MIN = 0.45;
    /** Kolik veršů dozadu i dopředu se hledá partner (pokryje AABB, ABAB, ABBA i AXXA). */
    static final int WINDOW = 4;
    /** Nejméně započtených veršů, aby šel získat odznak (dvojverší nestačí). */
    public static final int MIN_LINES_FOR_BADGE = 8;
    /** Prahy odznaků. Kalibrováno na ukázkách v RhymeAnalyzerTest. */
    public static final int BADGE_SCORE = 60;
    public static final int MASTER_SCORE = 80;

    /** Hlavičky částí textu, které nejsou verši: [Refrén], Sloka 2:, (Hook), Intro … */
    private static final Pattern LABEL = Pattern.compile(
            "^\\s*(\\[.*]|\\(.*\\)|(sloka|refrén|refren|hook|intro|outro|verse|chorus|bridge|předrefrén)\\b.*)\\s*$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    /** Značky opakování na konci verše: „2x“, „(x2)“. */
    private static final Pattern REPEAT_MARK = Pattern.compile("\\(?\\s*(\\d+\\s*[x×]|[x×]\\s*\\d+)\\s*\\)?\\s*$",
            Pattern.CASE_INSENSITIVE);

    /**
     * Koncovky, na které se v češtině „rýmuje samo“ (tvary slov). Rým jen v nich je slabší. Řazeno od nejdelších.
     */
    private static final List<String> GRAMMAR_SUFFIXES = List.of(
            "ováními", "ováním", "ování", "ovali", "ovala", "ovalo", "ovat", "ující", "ností", "nosti",
            "ního", "nímu", "ními", "ných", "nými", "ského", "ských", "skými",
            "ání", "ení", "ění", "ého", "ému", "ými", "ých", "ost", "ský", "ská", "ské",
            "ala", "ali", "alo", "ila", "ili", "ilo", "ela", "eli", "elo", "ěla", "ěli", "ělo",
            "ách", "ích", "ech", "ama", "ami", "ovi", "ová", "ové",
            "al", "il", "el", "ěl", "at", "it", "et", "ět", "ou", "ám", "ím", "em", "ěm");

    /** Krátká slova, která se do vnitřních rýmů nepočítají (spojky, předložky, zájmena). */
    private static final Set<String> SHORT_WORDS = Set.of(
            "a", "i", "o", "u", "v", "z", "k", "s", "na", "do", "za", "po", "od", "se", "si", "je", "to", "ta", "ten",
            "jak", "tak", "ale", "že", "co", "mi", "mě", "ti", "tě", "já", "ty", "on", "ona", "my", "vy", "oni", "už",
            "jen", "ne", "ani", "pro", "při", "ve", "ze", "ke", "bez", "nad", "pod", "před");

    // ---------------------------------------------------------------- data veršů

    /** Slabika čtená od konce: jádro + souhlásky za ním (do dalšího jádra nebo konce) + souhlásky před ním. */
    record Segment(String nucleus, List<String> after, List<String> before) { }

    /** Předzpracovaný verš (nebo jedno slovo při hledání vnitřních rýmů). */
    record Unit(String text, List<String> words, List<Segment> segs) {
        String lastWord() {
            return words.isEmpty() ? "" : words.get(words.size() - 1);
        }
    }

    /** Výsledek porovnání dvou konců. */
    record Pair(double quality, int depth, int matchedPhonemes, Kind kind) {
        static final Pair NONE = new Pair(0, 0, 0, Kind.ZADNY);
    }

    static Unit unit(String text, List<String> words) {
        List<String> ph = CzechPhonetics.linePhonemes(words);
        List<Integer> nuclei = new ArrayList<>();
        for (int i = 0; i < ph.size(); i++) if (CzechPhonetics.isVowel(ph.get(i))) nuclei.add(i);
        List<Segment> segs = new ArrayList<>();
        for (int k = nuclei.size() - 1; k >= 0; k--) {
            int pos = nuclei.get(k);
            int end = k + 1 < nuclei.size() ? nuclei.get(k + 1) : ph.size();
            int start = k > 0 ? nuclei.get(k - 1) + 1 : 0;
            segs.add(new Segment(ph.get(pos), List.copyOf(ph.subList(pos + 1, end)), List.copyOf(ph.subList(start, pos))));
        }
        return new Unit(text, words, segs);
    }

    static Unit unit(String text) {
        return unit(text, CzechPhonetics.words(text));
    }

    // ---------------------------------------------------------------- podobnost hlásek

    private static final Map<String, String> MANNER = new HashMap<>();
    private static final Map<String, String> PAIR = new HashMap<>();
    static {
        for (String p : List.of("p", "b", "t", "d", "ť", "ď", "k", "g")) MANNER.put(p, "stop");
        for (String p : List.of("c", "dz", "č", "dž")) MANNER.put(p, "affr");
        for (String p : List.of("f", "v", "s", "z", "š", "ž", "ch", "h", "ř")) MANNER.put(p, "fric");
        for (String p : List.of("m", "n", "ň")) MANNER.put(p, "nasal");
        for (String p : List.of("l", "r")) MANNER.put(p, "liquid");
        MANNER.put("j", "glide");
        String[][] pairs = { { "p", "b" }, { "t", "d" }, { "ť", "ď" }, { "k", "g" }, { "c", "dz" }, { "č", "dž" },
                { "f", "v" }, { "s", "z" }, { "š", "ž" }, { "ch", "h" }, { "s", "c" }, { "š", "č" }, { "z", "dz" }, { "ž", "dž" } };
        for (String[] p : pairs) { PAIR.put(p[0] + p[1], "y"); PAIR.put(p[1] + p[0], "y"); }
    }

    static double consonantSim(String a, String b) {
        if (a.equals(b)) return 1;
        if (PAIR.containsKey(a + b)) return 0.8;
        String ma = MANNER.get(a), mb = MANNER.get(b);
        if (ma != null && ma.equals(mb)) return ma.equals("nasal") ? 0.65 : 0.5;
        return 0.15;
    }

    private static String shortOf(String v) {
        return switch (v) {
            case "á" -> "a";
            case "é" -> "e";
            case "í" -> "i";
            case "ó" -> "o";
            case "ú" -> "u";
            default -> v;
        };
    }

    static double vowelSim(String a, String b) {
        if (a.equals(b)) return 1;
        if (shortOf(a).equals(shortOf(b))) return 0.85;   // délka: ráj ~ kraj
        if ((a.equals("ou") && shortOf(b).equals("u")) || (b.equals("ou") && shortOf(a).equals("u"))) return 0.5;
        return 0;
    }

    /** Podobnost shluků souhlásek 0–1: editační vzdálenost zarovnaná od konce, záměna podle consonantSim. */
    static double clusterSim(List<String> a, List<String> b) {
        if (a.isEmpty() && b.isEmpty()) return 1;
        int n = a.size(), m = b.size();
        double[][] d = new double[n + 1][m + 1];
        for (int i = 0; i <= n; i++) d[i][0] = i;
        for (int j = 0; j <= m; j++) d[0][j] = j;
        // zarovnáváme od konce: indexy čteme pozpátku
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= m; j++) {
                double sub = 1 - consonantSim(a.get(n - i), b.get(m - j));
                d[i][j] = Math.min(Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1), d[i - 1][j - 1] + sub);
            }
        }
        return 1 - d[n][m] / Math.max(n, m);
    }

    // ---------------------------------------------------------------- porovnání dvou konců

    /** Kvalita rýmu dvou veršů (pro testy a ladění). */
    public static double quality(String lineA, String lineB) {
        return compare(unit(lineA), unit(lineB)).quality();
    }

    static Pair compare(Unit a, Unit b) {
        List<Segment> sa = a.segs(), sb = b.segs();
        if (sa.isEmpty() || sb.isEmpty()) return Pair.NONE;
        boolean openEnd = sa.get(0).after().isEmpty() && sb.get(0).after().isEmpty();

        int depth = 0;          // kolik slabik od konce má shodnou samohlásku (asonance, v rapu „multi“)
        int matched = 0;        // kolik hlásek od konce sedí i souhláskami (bez přerušení)
        boolean exactRun = true;
        double exactSum = 0, weightSum = 0, codaSim = 0, bestQ = 0;
        int max = Math.min(Math.min(sa.size(), sb.size()), 6);
        for (int k = 0; k < max; k++) {
            Segment x = sa.get(k), y = sb.get(k);
            double vs = vowelSim(x.nucleus(), y.nucleus());
            if (vs < 0.75) break;
            double cs = clusterSim(x.after(), y.after());
            if (k == 0) codaSim = cs;
            // váha: u zavřeného konce rozhoduje koncová souhláska (les ~ pes), u otevřeného ta mezi samohláskami
            // (voda ~ škoda ano, přijela ~ sestra ne) – prázdný konec se shoduje vždy, takže skoro nic neříká
            double w = k == 0 ? (openEnd ? 0.5 : 2) : (k == 1 && openEnd ? 2 : 1);
            exactSum += w * vs * cs;
            weightSum += w;
            depth++;
            if (exactRun && cs >= 0.8) matched += 1 + Math.max(x.after().size(), y.after().size());
            else exactRun = false;

            // kvalita při rýmu do této hloubky; bereme nejlepší, aby hlubší nepřesná asonance nekazila čistý konec
            double support = x.before().isEmpty() && y.before().isEmpty() ? 0.5 : clusterSim(x.before(), y.before());
            double base;
            if (depth == 1 && openEnd) {
                // jen poslední samohláska (žena ~ ryba) rýmem není; pomůže stejná souhláska před ní (lesa ~ nesa)
                base = 0.25 + 0.45 * support;
            } else {
                base = switch (depth) {
                    case 1 -> 0.68 + 0.12 * support;
                    case 2 -> 0.84 + 0.06 * support;
                    case 3 -> 0.94;
                    default -> 1.0;
                };
            }
            double q = base * (0.35 + 0.65 * exactSum / weightSum);
            if (q > bestQ) bestQ = q;
        }
        if (depth == 0) return Pair.NONE;
        // opěrná souhláska před poslední přesně shodnou slabikou (láska ~ páska)
        if (exactRun) {
            Segment x = sa.get(depth - 1), y = sb.get(depth - 1);
            if (clusterSim(x.before(), y.before()) >= 0.8) matched += Math.max(x.before().size(), y.before().size());
        }
        double q = bestQ;
        if (codaSim < 0.35) q = Math.min(q, 0.42);   // konec nesedí: les ~ led je jen asonance

        Kind kind;
        String wa = a.lastWord(), wb = b.lastWord();
        if (!wa.isEmpty() && wa.equals(wb) && !prefixRhymes(a, b)) {
            kind = Kind.IDENTICKY;
            q = Math.min(q, 0.3);
        } else if (isGrammatical(wa, wb, matched)) {
            kind = Kind.GRAMATICKY;
            q *= 0.78;
        } else if (q >= 0.9) {
            kind = Kind.BOHATY;
        } else if (q >= 0.68) {
            kind = Kind.CISTY;
        } else if (q >= RHYME_MIN) {
            kind = Kind.PRIBLIZNY;
        } else if (q >= 0.25) {
            kind = Kind.ASONANCE;
        } else {
            kind = Kind.ZADNY;
        }
        return new Pair(Math.min(1, q), depth, matched, kind);
    }

    /**
     * Stejné poslední slovo je identický rým, pokud se nerýmuje i to, co je před ním: „nad cestou / svou cestou“ je
     * identický, „v hlavě mám to / dám to“ ne. Rapové opakování slova na konci (epifora) tak projde, jen když sedí i zbytek.
     */
    private static boolean prefixRhymes(Unit a, Unit b) {
        if (a.words().size() < 2 || b.words().size() < 2) return false;
        List<String> pa = a.words().subList(0, a.words().size() - 1), pb = b.words().subList(0, b.words().size() - 1);
        if (pa.get(pa.size() - 1).equals(pb.get(pb.size() - 1))) return false;
        return compare(unit("", pa), unit("", pb)).quality() >= RHYME_MIN;
    }

    /** Shoduje se jen stejná tvarová koncovka a kmeny jsou jiné (dělal ~ volal, kreslení ~ malování). */
    private static boolean isGrammatical(String wa, String wb, int matchedPhonemes) {
        for (String suf : GRAMMAR_SUFFIXES) {
            if (!wa.endsWith(suf) || !wb.endsWith(suf)) continue;
            int minLen = suf.length() + (suf.length() <= 2 ? 3 : 2);
            if (wa.length() < minLen || wb.length() < minLen) return false;
            int sufPh = CzechPhonetics.phonemes(suf).size();
            return matchedPhonemes <= sufPh + 1;
        }
        return false;
    }

    // ---------------------------------------------------------------- celý text

    /** Rozbor celého textu: verše = řádky. Prázdné řádky a nadpisy částí se přeskočí. */
    public static RhymeReport analyze(String text) {
        RhymeReport r = new RhymeReport();
        List<Unit> units = new ArrayList<>();
        List<RhymeReport.Line> lines = r.getLines();
        Set<String> seen = new HashSet<>();
        String[] raw = text == null ? new String[0] : text.split("\\R");
        for (String s : raw) {
            String t = REPEAT_MARK.matcher(s.strip()).replaceAll("").strip();
            if (t.isEmpty() || LABEL.matcher(t).matches()) continue;
            List<String> words = CzechPhonetics.words(t);
            if (words.isEmpty()) continue;
            Unit u = unit(t, words);
            if (u.segs().isEmpty()) continue;
            RhymeReport.Line line = new RhymeReport.Line(lines.size(), t);
            if (!seen.add(String.join(" ", words))) line.setRepeated(true);
            lines.add(line);
            units.add(u);
        }

        // nejlepší partner v okně ±WINDOW
        int n = lines.size();
        Pair[] best = new Pair[n];
        for (int i = 0; i < n; i++) {
            best[i] = Pair.NONE;
            if (lines.get(i).isRepeated()) continue;
            for (int j = Math.max(0, i - WINDOW); j <= Math.min(n - 1, i + WINDOW); j++) {
                if (j == i || lines.get(j).isRepeated()) continue;
                Pair p = compare(units.get(i), units.get(j));
                if (p.quality() > best[i].quality()) {
                    best[i] = p;
                    lines.get(i).setPartner(j);
                }
            }
            RhymeReport.Line l = lines.get(i);
            l.setQuality(round(best[i].quality()));
            l.setDepth(best[i].depth());
            l.setKind(best[i].kind());
            if (best[i].quality() < RHYME_MIN && best[i].kind() != Kind.IDENTICKY && best[i].kind() != Kind.ASONANCE) {
                l.setKind(Kind.ZADNY);
            }
        }

        assignScheme(lines, units);
        markInternalRhymes(lines, units);
        score(r, lines, units, best);
        return r;
    }

    /** Písmena schématu: verš dostane písmeno nejlepšího rýmujícího se předchůdce v okně, jinak nové. */
    private static void assignScheme(List<RhymeReport.Line> lines, List<Unit> units) {
        int next = 0;
        for (int i = 0; i < lines.size(); i++) {
            RhymeReport.Line l = lines.get(i);
            if (l.isRepeated()) continue;
            double bestQ = RHYME_MIN;
            String letter = null;
            for (int j = Math.max(0, i - WINDOW); j < i; j++) {
                if (lines.get(j).isRepeated()) continue;
                double q = compare(units.get(i), units.get(j)).quality();
                if (q >= bestQ) { bestQ = q; letter = lines.get(j).getLetter(); }
            }
            l.setLetter(letter != null ? letter : letterOf(next++));
        }
    }

    private static String letterOf(int i) {
        String abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return i < abc.length() ? String.valueOf(abc.charAt(i)) : abc.charAt(i % 26) + String.valueOf(i / 26);
    }

    /** Vnitřní rým = dvě různá plnovýznamová slova v jednom verši se kvalitně rýmují (včetně slova na konci). */
    private static void markInternalRhymes(List<RhymeReport.Line> lines, List<Unit> units) {
        for (int i = 0; i < lines.size(); i++) {
            List<String> words = units.get(i).words();
            List<Unit> ws = new ArrayList<>();
            for (String w : words) {
                if (w.length() < 3 || SHORT_WORDS.contains(w)) continue;
                ws.add(unit(w, List.of(w)));
            }
            outer:
            for (int a = 0; a < ws.size(); a++) {
                for (int b = a + 1; b < ws.size(); b++) {
                    if (ws.get(a).text().equals(ws.get(b).text())) continue;
                    Pair p = compare(ws.get(a), ws.get(b));
                    // tvarové koncovky (vstávám, makám, nečekám) v rapu drží flow, stačí jim nižší laťka
                    boolean ok = p.kind() == Kind.GRAMATICKY ? p.quality() >= 0.5 : p.quality() >= 0.68;
                    if (ok && p.kind() != Kind.IDENTICKY) {
                        lines.get(i).setInternalRhyme(true);
                        break outer;
                    }
                }
            }
        }
    }

    private static void score(RhymeReport r, List<RhymeReport.Line> lines, List<Unit> units, Pair[] best) {
        int counted = 0, rhymed = 0, internal = 0, grammatical = 0, identical = 0;
        double qSum = 0, richSum = 0;
        Map<String, Integer> endings = new HashMap<>();
        for (int i = 0; i < lines.size(); i++) {
            RhymeReport.Line l = lines.get(i);
            if (l.isRepeated()) continue;
            counted++;
            if (l.isInternalRhyme()) internal++;
            if (l.getKind() == Kind.IDENTICKY) identical++;
            if (!l.isRhymed()) continue;
            rhymed++;
            qSum += best[i].quality();
            // bohatost: půl za víceslabičnou asonanci (1 slabika = 0, 3 a víc = 1),
            // půl za přesně shodné hlásky (máj ~ háj = 2 → 0, jezerem ~ večerem = 6 a víc → 1)
            richSum += 0.5 * Math.min(1, (best[i].depth() - 1) / 2.0)
                    + 0.5 * Math.min(1, Math.max(0, (best[i].matchedPhonemes() - 2) / 4.0));
            if (l.getKind() == Kind.GRAMATICKY) grammatical++;
            Segment last = units.get(i).segs().get(0);
            endings.merge(shortOf(last.nucleus()) + String.join("", last.after()), 1, Integer::sum);
        }
        r.setCountedLines(counted);
        if (counted == 0) {
            r.getHints().add("rhyme.hint.empty");
            return;
        }
        double coverage = (double) rhymed / counted;
        double avgQ = rhymed > 0 ? qSum / rhymed : 0;
        double rich = rhymed > 0 ? richSum / rhymed : 0;
        double internalRate = (double) internal / counted;

        // pestrost: když se víc než 40 % rýmů opírá o stejný konec (-ání, -ou), srážka až na 0,65
        double variety = 1;
        if (rhymed >= 6) {
            int maxSame = endings.values().stream().max(Integer::compare).orElse(0);
            double share = (double) maxSame / rhymed;
            if (share > 0.4) variety = Math.max(0.65, 1 - (share - 0.4) * 0.6);
        }
        double grammarFactor = rhymed > 0 ? 1 - 0.25 * grammatical / rhymed : 1;

        double raw = 0.45 * coverage + 0.33 * avgQ + 0.14 * rich + 0.08 * Math.min(1, internalRate / 0.3);
        int score = (int) Math.round(100 * raw * variety * grammarFactor);
        r.setScore(score);
        r.setCoverage(round(coverage));
        r.setAvgQuality(round(avgQ));
        r.setRichness(round(rich));
        r.setInternalRate(round(internalRate));
        r.setVariety(round(variety));

        if (counted < MIN_LINES_FOR_BADGE) r.getHints().add("rhyme.hint.short");
        else if (score >= MASTER_SCORE) r.setBadge("s_rhyme_master");
        else if (score >= BADGE_SCORE) r.setBadge("s_rhyme");

        if (coverage < 0.75) r.getHints().add("rhyme.hint.coverage");
        if (rhymed > 0 && avgQ < 0.6) r.getHints().add("rhyme.hint.exact");
        if (rhymed > 0 && rich < 0.3) r.getHints().add("rhyme.hint.richer");
        if (identical > 0) r.getHints().add("rhyme.hint.identical");
        if (grammatical * 3 > rhymed && rhymed > 0) r.getHints().add("rhyme.hint.grammar");
        if (variety < 1) r.getHints().add("rhyme.hint.variety");
        if (internalRate < 0.1 && counted >= MIN_LINES_FOR_BADGE) r.getHints().add("rhyme.hint.internal");
    }

    private static double round(double v) {
        return Math.round(v * 100) / 100.0;
    }

    // ---------------------------------------------------------------- vývojářský výpis

    /** Ruční zkouška: {@code java … RhymeAnalyzer soubor.txt} (bez argumentu čte stdin). Výpis v češtině. */
    public static void main(String[] args) throws Exception {
        String text = args.length > 0 ? Files.readString(Path.of(args[0]), StandardCharsets.UTF_8)
                : new String(System.in.readAllBytes(), StandardCharsets.UTF_8);
        RhymeReport r = analyze(text);
        System.setOut(new java.io.PrintStream(new java.io.FileOutputStream(java.io.FileDescriptor.out), true, StandardCharsets.UTF_8));
        for (RhymeReport.Line l : r.getLines()) {
            String partner = l.getPartner() >= 0 ? String.format(Locale.ROOT, "↔ %2d", l.getPartner() + 1) : "    ";
            System.out.printf(Locale.ROOT, "%2d %-2s %s q=%.2f hl=%d %-10s %s %s%n", l.getIndex() + 1,
                    l.isRepeated() ? "=" : l.getLetter(), partner, l.getQuality(), l.getDepth(),
                    l.getKind().name().toLowerCase(Locale.ROOT), l.isInternalRhyme() ? "◆" : " ", l.getText());
        }
        System.out.printf(Locale.ROOT, "%nSchéma: %s%nSkóre: %d / 100  odznak: %s%n", r.getScheme(), r.getScore(),
                r.getBadge() == null ? "—" : r.getBadge());
        System.out.printf(Locale.ROOT, "pokrytí %.2f  kvalita %.2f  bohatost %.2f  vnitřní %.2f  pestrost %.2f%n",
                r.getCoverage(), r.getAvgQuality(), r.getRichness(), r.getInternalRate(), r.getVariety());
        System.out.println("rady: " + r.getHints());
    }
}
