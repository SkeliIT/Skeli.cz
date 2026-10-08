package com.github.skeliit;

import com.github.skeliit.model.SongTitle;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SongTitleTest {

    private static void check(String name, String title, String credits) {
        SongTitle s = SongTitle.of(name);
        assertEquals(title, s.title, name);
        assertEquals(credits, s.credits, name);
    }

    @Test
    void splitsArtistTitleAndFeatures() {
        check("JML - No ty vole ft. Farri, Skeli, Babaraptor", "No ty vole", "JML · ft. Farri, Skeli, Babaraptor");
        check("Zoom - Drama ft. 3dem7, Skeli, D4niel (prod. LEXNOUR)", "Drama", "Zoom · ft. 3dem7, Skeli, D4niel");
        check("Babaraptor - Obyčejnej člověk ft. Skeli", "Obyčejnej člověk", "Babaraptor · ft. Skeli");
        check("Skeli a Babar - Divná planeta", "Divná planeta", "Skeli a Babar");
        check("Trosky (feat. Babar)", "Trosky", "ft. Babar");
        check("Tik Tak ( feat.TAADA & Cheorchina )", "Tik Tak", "ft. TAADA & Cheorchina");
        check("Featherweight", "Featherweight", "");
        check("Skeli - Ježíšku panáčku", "Ježíšku panáčku", "");
        check("Solo", "Solo", "");
        check("Já už vím", "Já už vím", "");
    }
}
