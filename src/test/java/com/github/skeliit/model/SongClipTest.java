package com.github.skeliit.model;

import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import org.junit.jupiter.api.Test;

class SongClipTest {

    private static SongClip clip(String title, int year) {
        SongClip c = new SongClip();
        c.title = title;
        c.year = year;
        return c;
    }

    @Test
    void remakeAndOriginal() {
        List<SongClip> clips = new ArrayList<>(List.of(
                clip("Skeli - Já už vím (2025 remake) Official video", 2025),
                clip("Skeli - Ja už vím OFFICIAL VIDEOKLIP", 2016)));
        SongClip.markKinds(clips);
        assertEquals("remake", clips.get(0).kind);
        assertEquals("original", clips.get(1).kind);
        Properties t = new Properties();
        assertEquals("Remake · 2025", clips.get(0).label(t));
        assertEquals("Originál · 2016", clips.get(1).label(t));
    }

    @Test
    void singleClipIsJustAVersion() {
        List<SongClip> clips = new ArrayList<>(List.of(clip("Skeli - Fajn", 2019)));
        SongClip.markKinds(clips);
        assertEquals("version", clips.get(0).kind);
    }
}
