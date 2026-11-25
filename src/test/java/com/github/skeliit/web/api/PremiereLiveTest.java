package com.github.skeliit.web.api;

import com.github.skeliit.service.PremiereLive;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Živá místnost premiéry: chat nepustí odkazy (ale běžnou větu ano), smajlíci jen naše klíče. */
class PremiereLiveTest {

    @Test
    void chatPoznaOdkazy() {
        for (String s : new String[] {"mrkni na skeli.cz", "https://x.y/z", "www.neco", "free-stuff.com", "kup to na shop.online"}) {
            assertTrue(PremiereLiveServlet.LINK.matcher(s).find(), "odkaz neprošel: " + s);
        }
    }

    @Test
    void chatNechaBeznouVetu() {
        for (String s : new String[] {"Musíš odejít, to je síla!", "19:00 tu jsem 🔥", "Skeli je boss... fakt", "1.5 hodiny čekám", "díky.Tohle je pecka"}) {
            assertFalse(PremiereLiveServlet.LINK.matcher(s).find(), "zablokovaná normální věta: " + s);
        }
    }

    @Test
    void smajliciJenNasi() {
        long pred = PremiereLive.counts().get("f3");
        assertTrue(PremiereLive.react("f3"));
        assertEquals(pred + 1, PremiereLive.counts().get("f3"));
        assertTrue(PremiereLive.react("joint"));
        assertFalse(PremiereLive.react("<script>"));
        assertFalse(PremiereLive.react(null));
        assertEquals(PremiereLive.REACTIONS.length, PremiereLive.counts().size());
        assertTrue(PremiereLive.react("tlesk"));
        assertTrue(PremiereLive.react("smich"));
    }

    @Test
    void lidiVSale() {
        int pred = PremiereLive.people();
        PremiereLive.seen("testklic123456");
        PremiereLive.seen("testklic123456");   // stejný prohlížeč se počítá jednou
        assertEquals(pred + 1, PremiereLive.people());
    }

    @Test
    void naladomerJednaNaladaNaProhlizec() {
        assertTrue(PremiereLive.nalada("naladaprohlizec01", "f3"));
        assertTrue(PremiereLive.nalada("naladaprohlizec01", "f7"));          // změna nálady, ne druhý hlas
        assertFalse(PremiereLive.nalada("naladaprohlizec01", "f9"));
        assertFalse(PremiereLive.nalada("naladaprohlizec01", "<b>"));
        var n = PremiereLive.nalady("naladaprohlizec01");
        assertEquals("f7", n.get("moje"));
        assertTrue((Integer) n.get("f7") >= 1);
        assertEquals(8, n.size(), "7 obličejů + moje");
    }

    @Test
    void vlnuNerozjedeJedenClovek() {
        long t = 5_000_000_000L;                                  // vlastní hodiny, ať se test nepotká s jinými
        int prah = PremiereLive.vlnaPrah(45);
        assertEquals(30, prah, "plný sál: 30 potlesků");
        assertEquals(10, PremiereLive.vlnaPrah(2), "málo lidí: nejméně 10");
        assertEquals(16, PremiereLive.vlnaPrah(8));
        // jeden divák ťuká 10× za vteřinu po 10 s: počítá se jen 1 za 2 s → 5, vlna nevznikne
        for (int i = 0; i < 100; i++) PremiereLive.tleskni("jedenclovek01", t + i * 100, prah);
        assertTrue(PremiereLive.vlnaAt() < t, "jeden člověk vlnu nespustí");
        assertTrue(PremiereLive.tleskPocet(t + 9_950) <= 5);
        // 6 lidí, každý 5× (po 2 s) v 10 s = 30 → vlna o 3,5 s později pro všechny
        long t2 = t + 60_000;
        long posledni = 0;
        for (int kolo = 0; kolo < 5; kolo++)
            for (int c = 0; c < 6; c++) { posledni = t2 + kolo * 2_000 + c * 10; PremiereLive.tleskni("divak" + c + "xxxxxxxx", posledni, prah); }
        assertEquals(posledni + PremiereLive.VLNA_ZPOZDENI_MS, PremiereLive.vlnaAt(), "30. potlesk = vlna");
        assertEquals(0, PremiereLive.tleskPocet(posledni + 100), "po spuštění se počítá znovu od nuly");
        long vlna = PremiereLive.vlnaAt();
        for (int c = 0; c < 40; c++) PremiereLive.tleskni("pauza" + c + "xxxxxxxx", posledni + 1_000 + c, prah);
        assertEquals(vlna, PremiereLive.vlnaAt(), "během pauzy další vlna nevznikne");
    }
}
