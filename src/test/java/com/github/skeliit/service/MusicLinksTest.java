package com.github.skeliit.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/** Odkazy na hudbu od uživatelů: známé tvary projdou, cizí domény a vymyšlené adresy ne. */
class MusicLinksTest {
    private static final String ID22 = "4uLU6hMCjMI75M1A2tKUQC";

    @Test
    @DisplayName("YouTube")
    void youtube() {
        assertEquals("dQw4w9WgXcQ", MusicLinks.youtube("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s"));
        assertEquals("dQw4w9WgXcQ", MusicLinks.youtube("https://youtu.be/dQw4w9WgXcQ?si=abc"));
        assertEquals("dQw4w9WgXcQ", MusicLinks.youtube("https://m.youtube.com/shorts/dQw4w9WgXcQ"));
        assertEquals("dQw4w9WgXcQ", MusicLinks.youtube("music.youtube.com/watch?v=dQw4w9WgXcQ"));
        assertNull(MusicLinks.youtube("https://evil.com/watch?v=dQw4w9WgXcQ"));
        assertNull(MusicLinks.youtube("https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ"));
        assertNull(MusicLinks.youtube("https://www.youtube.com@evil.com/watch?v=dQw4w9WgXcQ"));
        assertNull(MusicLinks.youtube("javascript:alert(1)//youtu.be/dQw4w9WgXcQ"));
        assertNull(MusicLinks.youtube("https://www.youtube.com/watch?v=kratke"));
        assertNull(MusicLinks.youtube("dQw4w9WgXcQ"));
    }

    @Test
    @DisplayName("Spotify")
    void spotify() {
        assertEquals("track/" + ID22, MusicLinks.spotify("https://open.spotify.com/track/" + ID22 + "?si=x"));
        assertEquals("album/" + ID22, MusicLinks.spotify("https://open.spotify.com/intl-cs/album/" + ID22));
        assertNull(MusicLinks.spotify("https://open.spotify.com/artist/" + ID22));
        assertNull(MusicLinks.spotify("https://spotify.evil.com/track/" + ID22));
        assertNull(MusicLinks.spotify("https://open.spotify.com/track/<script>"));
    }

    @Test
    @DisplayName("Apple Music")
    void apple() {
        assertEquals("cz/song/123456", MusicLinks.apple("https://music.apple.com/cz/song/nazev/123456"));
        assertEquals("cz/song/789", MusicLinks.apple("https://music.apple.com/cz/album/deska/123456?i=789"));
        assertEquals("us/album/123456", MusicLinks.apple("https://music.apple.com/us/album/deska/123456"));
        assertNull(MusicLinks.apple("https://music.apple.com/cz/artist/skeli/1820513581"));
        assertNull(MusicLinks.apple("https://apple.com/cz/song/nazev/123456"));
    }

    @Test
    @DisplayName("SoundCloud")
    void soundcloud() {
        assertEquals("skeli/moje-skladba", MusicLinks.soundcloud("https://soundcloud.com/skeli/moje-skladba?si=abc"));
        assertEquals("skeli/sets/deska", MusicLinks.soundcloud("https://m.soundcloud.com/skeli/sets/deska"));
        assertNull(MusicLinks.soundcloud("https://soundcloud.com/skeli"));
        assertNull(MusicLinks.soundcloud("https://soundcloud.com.evil.com/skeli/skladba"));
        assertNull(MusicLinks.soundcloud("https://soundcloud.com/skeli/<img>"));
    }

    @Test
    @DisplayName("Cizí krátký odkaz se nikam nevolá a vrací se beze změny")
    void expandOnlyKnownShortHosts() {
        assertEquals("https://evil.com/x", MusicLinks.expandShort("https://evil.com/x"));
        assertEquals("", MusicLinks.expandShort(""));
        assertNull(MusicLinks.expandShort(null));
    }
}
