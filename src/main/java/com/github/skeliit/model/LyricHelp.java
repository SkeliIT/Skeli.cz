package com.github.skeliit.model;

import java.sql.Timestamp;

/** Chybějící kus textu písně, který napsal návštěvník (tabulka lyric_help, V92) a který čeká na admina. */
public class LyricHelp {
    public final int id;
    public final int songId;
    public final String songName;
    public final String message;
    /** null, když návštěvník nebyl přihlášený */
    public final String username;
    public final Timestamp at;

    public LyricHelp(int id, int songId, String songName, String message, String username, Timestamp at) {
        this.id = id; this.songId = songId; this.songName = songName; this.message = message;
        this.username = username; this.at = at;
    }

    public int getId() { return id; }
    public int getSongId() { return songId; }
    public String getSongName() { return songName; }
    public String getMessage() { return message; }
    public String getUsername() { return username; }
    public Timestamp getAt() { return at; }
    /** Datum pro admina, např. „21. 10. 2026 18:05“ */
    public String getWhen() { return at == null ? "" : new java.text.SimpleDateFormat("d. M. yyyy HH:mm").format(at); }
}
