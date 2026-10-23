package com.github.skeliit.model;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/** Premiéra písně nebo klipu (V95): kdy, co (klip / píseň) a kam vede. Pro úvod, stránku písně i admin. */
public class Premiere {
    private static final ZoneId PRAGUE = ZoneId.of("Europe/Prague");

    public final int songId;
    public final String uuid, name, kind, thumb;
    public final long at;   // epoch ms

    public Premiere(int songId, String uuid, String name, String kind, String thumb, long at) {
        this.songId = songId; this.uuid = uuid; this.name = name; this.kind = kind == null ? "clip" : kind;
        this.thumb = thumb; this.at = at;
    }

    public int getSongId() { return songId; }
    public String getUuid() { return uuid; }
    public String getName() { return name; }
    public String getKind() { return kind; }
    public String getThumb() { return thumb; }
    public long getAt() { return at; }
    /** Už je venku? */
    public boolean isOut() { return System.currentTimeMillis() >= at; }
    /** Datum a čas v pražském čase, např. „24. 10. 18:00“ (číslice jsou ve všech jazycích stejné). */
    public String getWhen() { return DateTimeFormatter.ofPattern("d. M. H:mm", Locale.ROOT).withZone(PRAGUE).format(Instant.ofEpochMilli(at)); }
    /** Hodnota pro pole datum a čas v adminu (pražský čas): „2026-10-24T18:00“. */
    public String getLocalInput() { return DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm", Locale.ROOT).withZone(PRAGUE).format(Instant.ofEpochMilli(at)); }
}
