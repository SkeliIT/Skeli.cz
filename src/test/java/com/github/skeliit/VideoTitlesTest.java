package com.github.skeliit;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

/** Real titles from the Skeli YouTube channel. */
class VideoTitlesTest {

    @Test
    void dropsArtistPrefixAndOfficialSuffix() {
        assertEquals("Tisíc kousků", VideoTitles.display("Skeli - Tisíc kousků [Official video]"));
        assertEquals("JDI", VideoTitles.display("SKELI - JDI ( OFFICIAL VIDEO )"));
        assertEquals("Ja už vím", VideoTitles.display("Skeli - Ja už vím OFFICIAL VIDEOKLIP"));
        assertEquals("FAJN", VideoTitles.display("SKELI - FAJN"));
    }

    @Test
    void keepsFeaturesInTheTitle() {
        assertEquals("Tik Tak ( feat.TAADA & Cheorchina )",
                VideoTitles.display("Skeli -  Tik Tak ( feat.TAADA & Cheorchina )"));
        assertEquals("TROSKY (ft. Babar)", VideoTitles.display("Skeli ft. Babar -TROSKY OFFICIAL VIDEOKLIP"));
    }

    @Test
    void dropsEmojiAndBubbleLetterTags() {
        assertEquals("SOLO", VideoTitles.display("🔊SKELI - SOLO ⓐⓤⓓⓘⓞ"));
        assertEquals("ÚPLNĚ VZADU", VideoTitles.display("☹ SKELI - ÚPLNĚ VZADU ⓁⓎⓇⒾⒸ"));
        assertEquals("MARIHUANAALAMADAMA (ft. Toxe Team)",
                VideoTitles.display("🔊SKELI ft. Toxe Team - MARIHUANAALAMADAMAⓕⓡⓔⓔⓢⓣⓨⓛⓔ"));
    }

    @Test
    void leavesOtherTitlesAlone() {
        assertEquals("Live v Plzni", VideoTitles.display("Live v Plzni"));
        assertNull(VideoTitles.display(null));
    }
}
