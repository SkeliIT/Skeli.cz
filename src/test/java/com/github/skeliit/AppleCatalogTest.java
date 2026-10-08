package com.github.skeliit;

import com.github.skeliit.service.AppleCatalog;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AppleCatalogTest {

    private static final List<AppleCatalog.Track> CATALOG = List.of(
            new AppleCatalog.Track("1825091799", "Tik Tak", "2025-07-06"),
            new AppleCatalog.Track("1821206311", "Ježíšku panáčku", "2025-06-17"),
            new AppleCatalog.Track("1857402284", "Já už vím (2025 remake)", "2025-12-08"),
            new AppleCatalog.Track("1824685866", "Trosky (feat. Babar)", "2025-07-02"));

    @Test
    void bareTitleDropsSkeliFeaturesAndDiacritics() {
        assertEquals("tik tak", AppleCatalog.baseName("Tik Tak ( feat.TAADA & Cheorchina )"));
        assertEquals("jezisku panacku", AppleCatalog.baseName("Skeli - Ježíšku panáčku"));
        assertEquals("ja uz vim", AppleCatalog.baseName("Já už vím (2025 remake)"));
        assertEquals("refew musime zit", AppleCatalog.baseName("Refew - Musíme žít ft. Fosco Alma, Skeli"));
        assertEquals("", AppleCatalog.baseName(null));
    }

    @Test
    void songsOnTheWebFindTheirAppleTrack() {
        assertEquals("1825091799", AppleCatalog.match("Tik Tak ( feat.TAADA & Cheorchina )", CATALOG).id());
        assertEquals("1821206311", AppleCatalog.match("Skeli - Ježíšku panáčku", CATALOG).id());
        assertEquals("1857402284", AppleCatalog.match("Já už vím", CATALOG).id());
        assertEquals("1824685866", AppleCatalog.match("Trosky", CATALOG).id());
    }

    @Test
    void otherArtistsSongsAndUnknownTitlesDoNotMatch() {
        assertNull(AppleCatalog.match("JML - No ty vole ft. Farri, Skeli, Babaraptor", CATALOG));
        assertNull(AppleCatalog.match("Tik", CATALOG));
        assertNull(AppleCatalog.match("", CATALOG));
    }
}
