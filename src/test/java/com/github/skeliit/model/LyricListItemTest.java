package com.github.skeliit.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Obrázek řádku v Textech: hlavní obrázek z adminu má přednost před náhledem klipu i náhledovou fotkou. */
class LyricListItemTest {

    private static LyricListItem row(String yt, String photo) {
        return new LyricListItem(1, "u", "Píseň", 2025, 7, yt, photo, null, "");
    }

    @Test
    void hlavniObrazekMaPrednost() {
        LyricListItem r = row("pZx0xa6MpbE", "/uploads/foto.webp");
        r.mainImage = "/yt-thumb/pZx0xa6MpbE/maxres1.jpg";
        assertEquals("/yt-thumb/pZx0xa6MpbE/maxres1.jpg", r.artUrl());
    }

    @Test
    void bezHlavnihoObrazkuKlipPakFotka() {
        assertEquals("/yt-thumb/pZx0xa6MpbE/hqdefault.jpg", row("pZx0xa6MpbE", "/uploads/foto.webp").artUrl());
        assertEquals("/uploads/foto.webp", row(null, "/uploads/foto.webp").artUrl());
        assertNull(row(null, null).artUrl());
    }

    @Test
    void nebezpecnaAdresaHlavnihoObrazkuSeIgnoruje() {
        LyricListItem r = row("pZx0xa6MpbE", null);
        r.mainImage = "javascript:alert(1)";
        assertEquals("/yt-thumb/pZx0xa6MpbE/hqdefault.jpg", r.artUrl(), "jen adresy z našeho webu nebo https");
    }
}
