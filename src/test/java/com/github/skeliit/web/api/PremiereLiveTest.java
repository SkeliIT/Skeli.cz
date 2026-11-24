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
    void vlnaPriOsmiPotleskachProVsechnyNaraz() {
        long t = 5_000_000_000L;                                  // vlastní hodiny, ať se test nepotká s jinými
        for (int i = 0; i < PremiereLive.VLNA_PRAH - 1; i++) PremiereLive.tleskni(t + i * 100);
        assertTrue(PremiereLive.vlnaAt() < t, "7 potlesků ještě vlnu nespustí");
        assertEquals(PremiereLive.VLNA_PRAH - 1, PremiereLive.tleskPocet(t + 800));
        PremiereLive.tleskni(t + 900);
        assertEquals(t + 900 + PremiereLive.VLNA_ZPOZDENI_MS, PremiereLive.vlnaAt(), "8. potlesk = vlna o 3,5 s později pro všechny");
        assertEquals(0, PremiereLive.tleskPocet(t + 1000), "po spuštění se počítá znovu od nuly");
        for (int i = 0; i < 10; i++) PremiereLive.tleskni(t + 2000 + i);
        assertEquals(t + 900 + PremiereLive.VLNA_ZPOZDENI_MS, PremiereLive.vlnaAt(), "během pauzy další vlna nevznikne");
    }
}
