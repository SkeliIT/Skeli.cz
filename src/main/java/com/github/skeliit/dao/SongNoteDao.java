package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.SongNote;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Poznámky u písní (tabulka song_notes): admin je píše, web je ukazuje na stránce písně, v Textech a na Hudbě. */
public class SongNoteDao {
    /** Kde se poznámka ukazuje: název je sloupec v tabulce, nikdy vstup od návštěvníka. */
    public enum Place {
        SONG("show_song"), LYRICS("show_lyrics"), MUSIC("show_music");
        final String column;
        Place(String column) { this.column = column; }
    }

    private static final Set<String> LANGS = Set.of("cs", "en", "de", "uk", "vi");

    /** Text v jazyce stránky; prázdný překlad = česky. Jazyk je jen z pevného seznamu, jde do názvu sloupce. */
    private static String textColumn(String lang) {
        String l = LANGS.contains(lang) ? lang : "cs";
        return "COALESCE(NULLIF(text_" + l + ", ''), text_cs)";
    }

    /** Platné poznámky pro jedno místo: číslo písně → text v daném jazyce. */
    public Map<Integer, String> active(Place place, String lang) throws SQLException {
        Map<Integer, String> out = new HashMap<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT song_id, " + textColumn(lang) + " FROM song_notes WHERE " + place.column
                + " = 1 AND (until_date IS NULL OR until_date >= CURDATE())");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) out.put(rs.getInt(1), rs.getString(2));
        }
        return out;
    }

    /** Všechny poznámky pro admin, naposledy upravené nahoře. */
    public List<SongNote> list() throws SQLException {
        List<SongNote> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT n.*, s.name AS song_name FROM song_notes n JOIN songs s ON s.id = n.song_id ORDER BY n.updated_at DESC");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) out.add(read(rs));
        }
        return out;
    }

    /** Poznámka jedné písně, null = žádná. */
    public SongNote find(int songId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT n.*, s.name AS song_name FROM song_notes n JOIN songs s ON s.id = n.song_id WHERE n.song_id = ?")) {
            ps.setInt(1, songId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? read(rs) : null; }
        }
    }

    private static SongNote read(ResultSet rs) throws SQLException {
        SongNote n = new SongNote();
        n.songId = rs.getInt("song_id");
        n.songName = rs.getString("song_name");
        n.textCs = rs.getString("text_cs");
        n.textEn = rs.getString("text_en");
        n.textDe = rs.getString("text_de");
        n.textUk = rs.getString("text_uk");
        n.textVi = rs.getString("text_vi");
        n.showSong = rs.getBoolean("show_song");
        n.showLyrics = rs.getBoolean("show_lyrics");
        n.showMusic = rs.getBoolean("show_music");
        n.until = rs.getDate("until_date");
        return n;
    }

    /** Uloží poznámku; píseň má jen jednu, takže nová přepíše starou. */
    public void save(SongNote n) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO song_notes (song_id, text_cs, text_en, text_de, text_uk, text_vi, show_song, show_lyrics, show_music, until_date) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE text_cs = VALUES(text_cs), text_en = VALUES(text_en), "
                + "text_de = VALUES(text_de), text_uk = VALUES(text_uk), text_vi = VALUES(text_vi), show_song = VALUES(show_song), "
                + "show_lyrics = VALUES(show_lyrics), show_music = VALUES(show_music), until_date = VALUES(until_date)")) {
            ps.setInt(1, n.songId);
            ps.setString(2, n.textCs);
            ps.setString(3, n.textEn);
            ps.setString(4, n.textDe);
            ps.setString(5, n.textUk);
            ps.setString(6, n.textVi);
            ps.setBoolean(7, n.showSong);
            ps.setBoolean(8, n.showLyrics);
            ps.setBoolean(9, n.showMusic);
            ps.setDate(10, n.until);
            ps.executeUpdate();
        }
    }

    public void delete(int songId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("DELETE FROM song_notes WHERE song_id = ?")) {
            ps.setInt(1, songId);
            ps.executeUpdate();
        }
    }
}
