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
        assertFalse(PremiereLive.react("<script>"));
        assertFalse(PremiereLive.react(null));
        assertEquals(PremiereLive.REACTIONS.length, PremiereLive.counts().size());
    }

    @Test
    void lidiVSale() {
        int pred = PremiereLive.people();
        PremiereLive.seen("testklic123456");
        PremiereLive.seen("testklic123456");   // stejný prohlížeč se počítá jednou
        assertEquals(pred + 1, PremiereLive.people());
    }
}
