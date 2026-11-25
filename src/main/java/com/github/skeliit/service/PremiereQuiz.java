package com.github.skeliit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicIntegerArray;

/**
 * Kvíz na plátně kinosálu premiéry (Skeli 25. 11. 2026). Obsah: {@code resources/premiera/kviz.json} (otázky, Kevinovy hlášky,
 * plány premiér). Všechno řídí hodiny serveru – žádné časovače, žádná tabulka:
 * <ul>
 *   <li>Plán premiéry = seznam otázek s časem „sekund před startem“. Otázka běží 12 s (hlasování), pak 14 s výsledek.
 *       Kdo přijde pozdě nebo obnoví stránku, dostane z GET /api/premiere/live rovnou aktuální fázi.</li>
 *   <li>Hlasy jen jako součty v paměti (kdo jak hlasoval, se nepamatuje); jeden hlas na prohlížeč (náhodný klíč k),
 *       nejvýš 5 na IP adresu a otázku. Po konci hlasování se další hlasy odmítnou.</li>
 *   <li>Správná odpověď a zajímavost se do prohlížeče pošlou až po konci hlasování.</li>
 *   <li>Výsledek se spočítá jednou (první dotaz po konci hlasování) a uloží – všichni vidí stejná procenta i stejnou
 *       Kevinovu hlášku. Kevin mluví zhruba po každé 2.–3. otázce (a vždy při 100 %), jen když hlasovalo aspoň 5 lidí,
 *       hlášku vybírá podle skutečné (nezaokrouhlené) úspěšnosti a během jedné premiéry ji neopakuje.</li>
 *   <li>Jednotlivé premiéry se nepletou: klíč = uuid písně + čas premiéry (simulace „sim@čas“).</li>
 * </ul>
 * Kvíz začíná 25 min před premiérou a poslední otázka skončí nejpozději 5 min před startem (hlídá PremiereQuizTest).
 * Po restartu serveru se rozpracované hlasy ztratí – přijatelné (jde o hru).
 */
public final class PremiereQuiz {
    private PremiereQuiz() {}

    public static final long HLASOVANI_MS = 12_000, VYSLEDEK_MS = 14_000;
    static final long KONEC_PRED_MS = 300_000;          // posledních 5 minut patří premiéře (Skeli 25. 11.)
    static final int MIN_HLASU_KEVIN = 5;
    private static final int MAX_NA_IP = 5;

    // ---------- obsah ----------
    /** vazne = vážné téma (domácí násilí): Kevin ho nikdy nekomentuje. */
    public record Otazka(String id, String premiera, int ok, boolean vazne, Map<String, Texty> texty) {
        public Texty v(String jazyk) { Texty t = texty.get(jazyk); return t != null ? t : texty.get("cs"); }
    }
    public record Texty(String q, List<String> a, String fakt) {}
    public record Bod(String id, int pred) {}
    public record Obsah(Map<String, Otazka> otazky, Map<String, List<List<String>>> kevin, Map<String, List<Bod>> plany) {}

    private static volatile Obsah obsah;

    public static Obsah obsah() {
        Obsah o = obsah;
        if (o == null) obsah = o = nacti();
        return o;
    }

    static Obsah nacti() {
        try (InputStream in = PremiereQuiz.class.getResourceAsStream("/premiera/kviz.json")) {
            JsonNode j = new ObjectMapper().readTree(in);
            Map<String, Otazka> otazky = new LinkedHashMap<>();
            for (JsonNode q : j.get("otazky")) {
                Map<String, Texty> texty = new LinkedHashMap<>();
                q.fields().forEachRemaining(e -> {
                    if (e.getValue().isObject()) {
                        JsonNode t = e.getValue();
                        List<String> a = new ArrayList<>();
                        t.get("a").forEach(x -> a.add(x.asText()));
                        texty.put(e.getKey(), new Texty(t.get("q").asText(), List.copyOf(a), t.get("fakt").asText()));
                    }
                });
                otazky.put(q.get("id").asText(), new Otazka(q.get("id").asText(), q.hasNonNull("premiera") ? q.get("premiera").asText() : null,
                        q.get("ok").asInt(), q.path("vazne").asBoolean(false), texty));
            }
            Map<String, List<List<String>>> kevin = new LinkedHashMap<>();
            j.get("kevin").fields().forEachRemaining(e -> {
                List<List<String>> kat = new ArrayList<>();
                e.getValue().forEach(sk -> { List<String> h = new ArrayList<>(); sk.forEach(x -> h.add(x.asText())); kat.add(List.copyOf(h)); });
                kevin.put(e.getKey(), List.copyOf(kat));
            });
            Map<String, List<Bod>> plany = new LinkedHashMap<>();
            j.get("plany").fields().forEachRemaining(e -> {
                List<Bod> b = new ArrayList<>();
                e.getValue().forEach(x -> b.add(new Bod(x.get("id").asText(), x.get("pred").asInt())));
                plany.put(e.getKey(), List.copyOf(b));
            });
            return new Obsah(otazky, kevin, plany);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Plán pro premiéru podle slugu názvu písně („musis-odejit“), jinak výchozí – v pořadí, jak je v kviz.json. */
    static List<Bod> plan(String slug) {
        Obsah o = obsah();
        List<Bod> p = slug == null ? null : o.plany().get(slug);
        return p != null ? p : o.plany().get("vychozi");
    }

    /**
     * Plán konkrétní premiéry: běžné otázky náhodně na přeskáčku, časy zůstávají. Zamíchá se podle klíče premiéry, takže
     * všichni diváci (i po obnovení stránky) mají stejné pořadí a žádná otázka se neopakuje; jiná premiéra = jiné pořadí.
     * Vážné otázky (domácí násilí) jsou JEDEN BLOK NA KONCI kvízu v pořadí z kviz.json (formy → vykázání → linky) –
     * Skeli 24. 11. podle auditu: po vážném tématu už se nevracet k zábavě.
     */
    static List<Bod> plan(String slug, String premiera) {
        List<Bod> zaklad = plan(slug);
        java.util.Random nahoda = new java.util.Random(premiera.hashCode());
        List<String> vazne = new ArrayList<>(), ostatni = new ArrayList<>();
        for (Bod b : zaklad) (obsah().otazky().get(b.id()).vazne() ? vazne : ostatni).add(b.id());
        java.util.Collections.shuffle(ostatni, nahoda);
        int n = zaklad.size();
        String[] ids = new String[n];
        int j = 0;
        for (String id : ostatni) ids[j++] = id;                   // napřed zábava v náhodném pořadí…
        for (String id : vazne) ids[j++] = id;                     // …na konci vážný blok v pořadí z plánu
        List<Bod> out = new ArrayList<>();
        for (int i = 0; i < n; i++) out.add(new Bod(ids[i], zaklad.get(i).pred()));
        return out;
    }

    // ---------- stav (jen v paměti) ----------
    private static final class Kolo {
        final AtomicIntegerArray hlasy = new AtomicIntegerArray(3);
        final Set<String> kdo = ConcurrentHashMap.newKeySet();      // náhodné klíče prohlížečů, ne účty
        volatile Map<String, Object> vysledek;                      // spočítá se jednou, pak stejný pro všechny (bez textů)
    }
    private static final Map<String, Kolo> KOLA = new ConcurrentHashMap<>();
    private static final Map<String, Set<String>> POUZITE_HLASKY = new ConcurrentHashMap<>();

    /** Index otázky v plánu, která právě běží (hlasování nebo výsledek), jinak -1. */
    static int aktualni(List<Bod> plan, long at, long now) {
        long zbyva = at - now;
        if (zbyva <= KONEC_PRED_MS || zbyva > 30 * 60_000L) return -1;
        for (int i = 0; i < plan.size(); i++) {
            long start = at - plan.get(i).pred() * 1000L;
            if (now >= start && now < start + HLASOVANI_MS + VYSLEDEK_MS) return i;
        }
        return -1;
    }

    /**
     * Stav kvízu pro prohlížeč, nebo null (mimo otázku). {@code dalsi} = kdy začne další otázka (prohlížeč se zeptá přesně
     * tehdy). Během hlasování NIKDY neobsahuje správnou odpověď ani zajímavost.
     */
    public static Map<String, Object> stav(String premiera, String slug, long at, long now, String jazyk, String klic) {
        List<Bod> plan = plan(slug, premiera);
        Map<String, Object> out = new LinkedHashMap<>();
        Long dalsi = null;
        for (Bod b : plan) {
            long start = at - b.pred() * 1000L;
            if (start > now && at - start > KONEC_PRED_MS) { dalsi = start; break; }
        }
        int i = aktualni(plan, at, now);
        if (i < 0) {
            if (dalsi == null || at - now > 30 * 60_000L + 60_000) return null;
            out.put("dalsi", dalsi);
            return out;
        }
        Otazka o = obsah().otazky().get(plan.get(i).id());
        Texty t = o.v(jazyk);
        long start = at - plan.get(i).pred() * 1000L;
        out.put("i", i);
        out.put("q", t.q());
        out.put("a", t.a());
        if (dalsi != null) out.put("dalsi", dalsi);
        Kolo kolo = KOLA.computeIfAbsent(premiera + "#" + i, x -> new Kolo());
        if (now < start + HLASOVANI_MS) {
            out.put("faze", "otazka");
            out.put("do", start + HLASOVANI_MS);
            out.put("hlasoval", klic != null && kolo.kdo.contains(klic));
            return out;
        }
        Map<String, Object> v = vysledek(kolo, premiera, i, o, jazyk);
        out.put("faze", "vysledek");
        out.put("do", start + HLASOVANI_MS + VYSLEDEK_MS);
        out.put("ok", o.ok());
        out.put("fakt", t.fakt());
        out.putAll(v);
        // Kevinova hláška v jazyce stránky (vybraná jednou pro všechny – jen kategorie a pořadí)
        Object k = v.get("kevinKat");
        if (k != null) {
            List<List<String>> h = obsah().kevin().getOrDefault(jazyk, obsah().kevin().get("cs"));
            out.put("kevin", h.get((Integer) k).get((Integer) v.get("kevinIdx")));
        }
        out.remove("kevinKat");
        out.remove("kevinIdx");
        return out;
    }

    private static Map<String, Object> vysledek(Kolo kolo, String premiera, int i, Otazka o, String jazyk) {
        Map<String, Object> v = kolo.vysledek;
        if (v != null) return v;
        synchronized (kolo) {
            if (kolo.vysledek != null) return kolo.vysledek;
            int[] h = {kolo.hlasy.get(0), kolo.hlasy.get(1), kolo.hlasy.get(2)};
            int celkem = h[0] + h[1] + h[2];
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("hlasu", celkem);
            if (celkem > 0) m.put("pct", procenta(h, celkem));
            boolean vsichni = celkem > 0 && h[o.ok()] == celkem;
            if (!o.vazne() && celkem >= MIN_HLASU_KEVIN && (i % 5 == 1 || i % 5 == 3 || vsichni)) {   // u vážného tématu Kevin mlčí
                int kat = kategorie(h[o.ok()], celkem);
                int idx = vyberHlasku(premiera, kat);
                if (idx >= 0) { m.put("kevinKat", kat); m.put("kevinIdx", idx); }
            }
            kolo.vysledek = m;
            return m;
        }
    }

    /** Procenta odpovědí; když nehlasovali správně všichni, nikdy neukáže 100 % (a nenulový počet nikdy 0 %). */
    static int[] procenta(int[] h, int celkem) {
        int[] p = new int[3];
        for (int k = 0; k < 3; k++) {
            p[k] = Math.round(h[k] * 100f / celkem);
            if (h[k] < celkem && p[k] == 100) p[k] = 99;
            if (h[k] > 0 && p[k] == 0) p[k] = 1;
        }
        return p;
    }

    /** Kategorie Kevinovy hlášky podle skutečné úspěšnosti: 0–20 %, do 40, do 60, do 80, pod 100, přesně 100 %. */
    static int kategorie(int spravne, int celkem) {
        if (spravne == celkem) return 5;
        double u = (double) spravne / celkem;
        if (u <= 0.2) return 0;
        if (u <= 0.4) return 1;
        if (u <= 0.6) return 2;
        if (u <= 0.8) return 3;
        return 4;
    }

    private static int vyberHlasku(String premiera, int kat) {
        int pocet = obsah().kevin().get("cs").get(kat).size();
        Set<String> pouzite = POUZITE_HLASKY.computeIfAbsent(premiera, x -> ConcurrentHashMap.newKeySet());
        for (int k = 0; k < pocet; k++) if (pouzite.add(kat + "-" + k)) return k;
        return (int) (Math.random() * pocet);     // všechny už zazněly: aspoň náhodně
    }

    /** Hlas: 0 = přijat; 409 = mimo hlasování / už hlasoval; 400 = špatná odpověď; 429 = moc hlasů z jedné adresy. */
    public static int hlasuj(String premiera, String slug, long at, long now, int index, int odpoved, String klic, String ip) {
        if (odpoved < 0 || odpoved > 2) return 400;
        List<Bod> plan = plan(slug, premiera);
        int i = aktualni(plan, at, now);
        if (i < 0 || i != index) return 409;
        long start = at - plan.get(i).pred() * 1000L;
        if (now >= start + HLASOVANI_MS) return 409;                  // opožděný hlas
        Kolo kolo = KOLA.computeIfAbsent(premiera + "#" + i, x -> new Kolo());
        if (kolo.vysledek != null) return 409;
        if (!com.github.skeliit.security.RequestLimiter.tryAcquire("pmkviz", ip + "#" + premiera + "#" + i, MAX_NA_IP, 60_000)) return 429;
        if (!kolo.kdo.add(klic)) return 409;
        kolo.hlasy.incrementAndGet(odpoved);
        return 0;
    }

    /**
     * Jen simulace na testu (?pmSim, klíč „sim@…“): {@code n} smyšlených diváků hlasuje postupně během prvních 9 s otázky,
     * asi 60 % správně – jako skutečný sál, ať jde vyzkoušet procenta i Kevinovy hlášky. Každý smyšlený divák hlasuje jednou.
     */
    public static void simHlasy(String premiera, String slug, long at, long now, int n) {
        if (!premiera.startsWith("sim@") || n <= 0) return;
        List<Bod> plan = plan(slug, premiera);
        int i = aktualni(plan, at, now);
        if (i < 0) return;
        long start = at - plan.get(i).pred() * 1000L;
        if (now >= start + HLASOVANI_MS) return;
        Kolo kolo = KOLA.computeIfAbsent(premiera + "#" + i, x -> new Kolo());
        if (kolo.vysledek != null) return;
        int ok = obsah().otazky().get(plan.get(i).id()).ok();
        int kolik = (int) Math.min(n, Math.ceil(n * (now - start) / 9000.0));
        for (int j = 0; j < kolik; j++) {
            java.util.Random r = new java.util.Random(premiera.hashCode() * 31L + i * 1000L + j);
            int odp = r.nextDouble() < 0.6 ? ok : (ok + 1 + r.nextInt(2)) % 3;
            if (kolo.kdo.add("sim-" + j)) kolo.hlasy.incrementAndGet(odp);
        }
    }

    /** Jen pro testy: zapomenout stav. */
    static void vycisti() { KOLA.clear(); POUZITE_HLASKY.clear(); }
}
