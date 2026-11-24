package com.github.skeliit.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/** Kvíz premiéry: obsah resources/premiera/kviz.json (délky pro plátno, plány) a pravidla hlasování a vyhodnocení. */
class PremiereQuizTest {
    static final int MAX_OTAZKA = 60, MAX_ODPOVED = 24, MAX_FAKT = 110, MAX_KEVIN = 110;
    static final String[] JAZYKY = {"cs", "en", "de", "uk", "vi"};

    @BeforeEach
    void cisto() { PremiereQuiz.vycisti(); }

    @Test
    void obsahSeVejdeNaPlatno() {
        var o = PremiereQuiz.obsah();
        assertTrue(o.otazky().size() >= 15, "málo otázek");
        for (var q : o.otazky().values()) {
            assertTrue(q.ok() >= 0 && q.ok() <= 2, q.id() + ": ok mimo 0–2");
            assertNotNull(q.texty().get("cs"), q.id() + ": chybí čeština");
            for (var e : q.texty().entrySet()) {
                var t = e.getValue();
                String kde = q.id() + " [" + e.getKey() + "]";
                assertTrue(t.q().length() <= MAX_OTAZKA, kde + ": otázka delší než " + MAX_OTAZKA + ": " + t.q());
                assertEquals(3, t.a().size(), kde + ": nejsou 3 odpovědi");
                assertEquals(3, new HashSet<>(t.a()).size(), kde + ": dvě stejné odpovědi");
                for (String a : t.a()) assertTrue(a.length() <= MAX_ODPOVED, kde + ": odpověď delší než " + MAX_ODPOVED + ": " + a);
                assertTrue(t.fakt().length() <= MAX_FAKT, kde + ": zajímavost delší než " + MAX_FAKT + ": " + t.fakt());
                assertFalse(t.fakt().startsWith("Věděli jste"), kde + ": zajímavost bez nadpisu");
            }
        }
        var kevin = o.kevin().get("cs");
        assertEquals(6, kevin.size(), "Kevin: 6 skupin podle úspěšnosti");
        for (var e : o.kevin().entrySet()) {
            assertEquals(6, e.getValue().size(), "Kevin [" + e.getKey() + "]: 6 skupin");
            for (int k = 0; k < 6; k++) {
                assertEquals(kevin.get(k).size(), e.getValue().get(k).size(), "Kevin [" + e.getKey() + "]: stejný počet hlášek jako čeština");
                for (String h : e.getValue().get(k)) assertTrue(h.length() <= MAX_KEVIN, "Kevin [" + e.getKey() + "] moc dlouhý: " + h);
            }
        }
    }

    @Test
    void planyKonciVcasAOtazkySeNeopakuji() {
        var o = PremiereQuiz.obsah();
        assertTrue(o.plany().containsKey("vychozi"));
        for (var e : o.plany().entrySet()) {
            List<PremiereQuiz.Bod> plan = e.getValue();
            Set<String> ids = new HashSet<>();
            int predchozi = Integer.MAX_VALUE;
            for (var b : plan) {
                var q = o.otazky().get(b.id());
                assertNotNull(q, e.getKey() + ": neznámá otázka " + b.id());
                assertTrue(ids.add(b.id()), e.getKey() + ": otázka dvakrát " + b.id());
                assertTrue(q.premiera() == null || q.premiera().equals(e.getKey()), e.getKey() + ": otázka jiné premiéry " + b.id());
                assertTrue(b.pred() <= 1800, e.getKey() + ": otázka před otevřením sálu " + b.id());
                assertTrue(predchozi - b.pred() >= 26, e.getKey() + ": otázky se překrývají u " + b.id());
                predchozi = b.pred();
            }
            long konecPosledni = plan.get(plan.size() - 1).pred() * 1000L - PremiereQuiz.HLASOVANI_MS - PremiereQuiz.VYSLEDEK_MS;
            assertTrue(konecPosledni >= PremiereQuiz.KONEC_PRED_MS, e.getKey() + ": poslední otázka nesmí zasahovat do posledních 2 min");
        }
    }

    @Test
    void behemHlasovaniSeSpravnaOdpovedNeprozradi() {
        long at = 10_000_000L;
        var plan = PremiereQuiz.plan("musis-odejit", "p1");
        long start = at - plan.get(0).pred() * 1000L;
        Map<String, Object> s = PremiereQuiz.stav("p1", "musis-odejit", at, start + 1000, "cs", "klicprohlizece1");
        assertEquals("otazka", s.get("faze"));
        assertFalse(s.containsKey("ok"));
        assertFalse(s.containsKey("fakt"));
        assertFalse(s.containsKey("pct"));
        assertNull(PremiereQuiz.stav("p1", "musis-odejit", at, at - 60_000, "cs", null), "poslední minuty bez kvízu");
        assertNull(PremiereQuiz.stav("p1", "musis-odejit", at, at - 280_000, "cs", null), "posledních 5 minut bez kvízu");
    }

    @Test
    void hlasovaniJednouAJenVcas() {
        long at = 10_000_000L;
        var plan = PremiereQuiz.plan("musis-odejit", "p2");
        long start = at - plan.get(0).pred() * 1000L;
        assertEquals(0, PremiereQuiz.hlasuj("p2", "musis-odejit", at, start + 500, 0, 1, "klicprohlizece1", "1.1.1.1"));
        assertEquals(409, PremiereQuiz.hlasuj("p2", "musis-odejit", at, start + 600, 0, 2, "klicprohlizece1", "1.1.1.1"), "dvakrát");
        assertEquals(409, PremiereQuiz.hlasuj("p2", "musis-odejit", at, start + 13_000, 0, 1, "klicprohlizece2", "1.1.1.2"), "pozdě");
        assertEquals(400, PremiereQuiz.hlasuj("p2", "musis-odejit", at, start + 700, 0, 3, "klicprohlizece3", "1.1.1.3"));
        assertEquals(409, PremiereQuiz.hlasuj("p2", "musis-odejit", at, start + 700, 5, 1, "klicprohlizece3", "1.1.1.3"), "jiná otázka");
        // výsledek: 1 hlas, správně → 100 %, ale Kevin mlčí (méně než 5 hlasujících)
        Map<String, Object> v = PremiereQuiz.stav("p2", "musis-odejit", at, start + 13_000, "cs", null);
        assertEquals("vysledek", v.get("faze"));
        assertEquals(1, v.get("hlasu"));
        assertNull(v.get("kevin"));
        assertNotNull(v.get("fakt"));
        // jiná premiéra má vlastní výsledky
        assertEquals(0, ((Integer) PremiereQuiz.stav("p3", "musis-odejit", at, start + 13_000, "cs", null).get("hlasu")));
    }

    @Test
    void kevinPodleSkutecneUspesnosti() {
        long at = 10_000_000L;
        var plan = PremiereQuiz.plan("musis-odejit", "p4");
        int i = -1;                                               // první otázka, kterou Kevin komentuje (2., 4., 7., …) a není vážná
        for (int n = 0; n < plan.size() && i < 0; n++)
            if ((n % 5 == 1 || n % 5 == 3) && !PremiereQuiz.obsah().otazky().get(plan.get(n).id()).vazne()) i = n;
        long start = at - plan.get(i).pred() * 1000L;
        int ok = PremiereQuiz.obsah().otazky().get(plan.get(i).id()).ok();
        for (int n = 0; n < 6; n++)
            assertEquals(0, PremiereQuiz.hlasuj("p4", "musis-odejit", at, start + 100, i, n < 5 ? ok : (ok + 1) % 3, "klicprohlizece" + n, "2.2.2." + n));
        Map<String, Object> v = PremiereQuiz.stav("p4", "musis-odejit", at, start + 12_500, "cs", null);
        assertEquals(6, v.get("hlasu"));
        String k = (String) v.get("kevin");
        assertNotNull(k, "6 hlasů → Kevin mluví");
        assertTrue(PremiereQuiz.obsah().kevin().get("cs").get(4).contains(k), "5/6 = 83 % → skupina nad 80 %");
        assertEquals(k, PremiereQuiz.stav("p4", "musis-odejit", at, start + 13_000, "cs", null).get("kevin"), "všichni vidí stejnou hlášku");
    }

    @Test
    void uVazneOtazkyKevinMlci() {
        long at = 10_000_000L;
        var plan = PremiereQuiz.plan("musis-odejit", "p5");
        int i = -1;
        for (int n = 0; n < plan.size(); n++) if (PremiereQuiz.obsah().otazky().get(plan.get(n).id()).vazne()) { i = n; break; }
        assertTrue(i >= 0, "plán má otázky o domácím násilí");
        var q = PremiereQuiz.obsah().otazky().get(plan.get(i).id());
        long start = at - plan.get(i).pred() * 1000L;
        for (int n = 0; n < 5; n++) assertEquals(0, PremiereQuiz.hlasuj("p5", "musis-odejit", at, start + 100, i, q.ok(), "vaznyprohlizec" + n, "3.3.3." + n));
        Map<String, Object> v = PremiereQuiz.stav("p5", "musis-odejit", at, start + 12_500, "cs", null);
        assertEquals(5, v.get("hlasu"));
        assertNull(v.get("kevin"), "100 % a 5 hlasů, ale vážné téma → Kevin mlčí");
    }

    @Test
    void poradiNahodneAleProVsechnyStejne() {
        var a = PremiereQuiz.plan("musis-odejit", "uuid@1");
        assertEquals(a, PremiereQuiz.plan("musis-odejit", "uuid@1"), "stejná premiéra = stejné pořadí pro všechny");
        assertNotEquals(a, PremiereQuiz.plan("musis-odejit", "uuid@2"), "jiná premiéra = jiné pořadí");
        assertEquals(new HashSet<>(PremiereQuiz.plan("musis-odejit").stream().map(PremiereQuiz.Bod::id).toList()),
                new HashSet<>(a.stream().map(PremiereQuiz.Bod::id).toList()), "stejné otázky, žádná navíc ani dvakrát");
        for (int i = 0; i < a.size(); i++) assertEquals(PremiereQuiz.plan("musis-odejit").get(i).pred(), a.get(i).pred(), "časy zůstávají");
    }

    @Test
    void vazneOtazkyNikdyZaSebou() {
        for (int p = 0; p < 300; p++) {
            var plan = PremiereQuiz.plan("musis-odejit", "premiera@" + p);
            for (int i = 1; i < plan.size(); i++)
                assertFalse(PremiereQuiz.obsah().otazky().get(plan.get(i).id()).vazne() && PremiereQuiz.obsah().otazky().get(plan.get(i - 1).id()).vazne(),
                        "dvě vážné otázky za sebou v premiéře " + p);
        }
    }

    @Test
    void procentaNikdyNeklamou() {
        assertArrayEquals(new int[] {99, 1, 0}, PremiereQuiz.procenta(new int[] {999, 1, 0}, 1000));
        assertEquals(5, PremiereQuiz.kategorie(7, 7));
        assertEquals(4, PremiereQuiz.kategorie(199, 200));
        assertEquals(0, PremiereQuiz.kategorie(1, 5));
        assertEquals(1, PremiereQuiz.kategorie(2, 5));
        assertEquals(3, PremiereQuiz.kategorie(4, 5));
    }
}
