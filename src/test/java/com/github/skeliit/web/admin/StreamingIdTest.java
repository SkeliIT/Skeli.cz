package com.github.skeliit.web.admin;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** The admin's Spotify / Apple Music fields take the ID itself or a share link. */
class StreamingIdTest {
    @Test
    void spotifyIdFromLinkOrId() {
        assertEquals("01wNVzySGEMcHVzaY6EFAA", AdminSongDetailServlet.spotifyId("01wNVzySGEMcHVzaY6EFAA"));
        assertEquals("01wNVzySGEMcHVzaY6EFAA", AdminSongDetailServlet.spotifyId(
                " https://open.spotify.com/intl-cs/track/01wNVzySGEMcHVzaY6EFAA?si=a1b2c3d4e5f60718 "));
        assertEquals("01wNVzySGEMcHVzaY6EFAA", AdminSongDetailServlet.spotifyId("spotify:track:01wNVzySGEMcHVzaY6EFAA"));
        assertEquals("", AdminSongDetailServlet.spotifyId("  "));
    }

    @Test
    void appleMusicIdFromLinkOrId() {
        assertEquals("1821215635", AdminSongDetailServlet.appleMusicId("1821215635"));
        assertEquals("1821215635", AdminSongDetailServlet.appleMusicId("https://music.apple.com/cz/song/jdi/1821215635"));
        assertEquals("1821215635", AdminSongDetailServlet.appleMusicId(
                "https://music.apple.com/cz/album/jdi-single/1821215634?i=1821215635"));
    }
}
