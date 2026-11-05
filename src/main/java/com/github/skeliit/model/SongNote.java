package com.github.skeliit.model;

import java.sql.Date;

/** Poznámka u písně, řádek v adminu Hudba → Poznámky. Obyčejná třída, překladač JSP neumí record. */
public class SongNote {
    public int songId;
    public String songName;
    public String textCs = "", textEn = "", textDe = "", textUk = "", textVi = "";
    public boolean showSong = true, showLyrics = true, showMusic = true;
    public Date until;

    public int getSongId() { return songId; }
    public String getSongName() { return songName; }
    public String getTextCs() { return textCs; }
    public String getTextEn() { return textEn; }
    public String getTextDe() { return textDe; }
    public String getTextUk() { return textUk; }
    public String getTextVi() { return textVi; }
    public boolean isShowSong() { return showSong; }
    public boolean isShowLyrics() { return showLyrics; }
    public boolean isShowMusic() { return showMusic; }
    public Date getUntil() { return until; }
    /** Datum už uplynulo: na webu se neukazuje, v adminu zůstává. */
    public boolean isExpired() { return until != null && until.toLocalDate().isBefore(java.time.LocalDate.now()); }
    /** Kde všude se ukazuje, česky pro seznam v adminu. */
    public String getPlaces() {
        StringBuilder b = new StringBuilder();
        if (showSong) b.append("stránka písně");
        if (showLyrics) b.append(b.length() > 0 ? ", " : "").append("Texty");
        if (showMusic) b.append(b.length() > 0 ? ", " : "").append("Hudba");
        return b.length() == 0 ? "nikde" : b.toString();
    }
}
