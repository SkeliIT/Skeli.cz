package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.LyricHelp;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

/**
 * „Pomoz nám dopsat text“ (V92): které písně žádají o pomoc (sloupce songs.help_*) a co návštěvníci poslali
 * (tabulka lyric_help). Nic z toho nejde na web samo – admin to přečte a po zpracování smaže.
 */
public class LyricHelpDao {

    /** O co píseň žádá: {kód jazyka, od které vteřiny (nebo -1)}, nebo null, když o nic. */
    public String[] wanted(int songId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT help_lang, help_from_sec FROM songs WHERE id = ? AND help_wanted_at IS NOT NULL")) {
            ps.setInt(1, songId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                int from = rs.getInt(2);
                return new String[] { rs.getString(1), rs.wasNull() ? "-1" : String.valueOf(from) };
            }
        }
    }

    /** Admin výzvu zapne (kód jazyka, od které vteřiny nebo null) nebo vypne (jazyk se pak nepoužije). */
    public void setWanted(int songId, boolean on, String lang, Integer fromSec) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(on
                ? "UPDATE songs SET help_wanted_at = COALESCE(help_wanted_at, NOW()), help_lang = ?, help_from_sec = ? WHERE id = ?"
                : "UPDATE songs SET help_wanted_at = NULL WHERE id = ?")) {
            if (on) {
                ps.setString(1, lang);
                if (fromSec == null) ps.setNull(2, Types.INTEGER); else ps.setInt(2, fromSec);
                ps.setInt(3, songId);
            } else {
                ps.setInt(1, songId);
            }
            ps.executeUpdate();
        }
    }

    /** Žádá píseň právě teď o pomoc? (Jen tehdy může návštěvník něco poslat.) */
    public boolean isWanted(int songId) throws SQLException {
        return wanted(songId) != null;
    }

    public void add(int songId, String message, Integer userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO lyric_help (song_id, message, user_id) VALUES (?, ?, ?)")) {
            ps.setInt(1, songId);
            ps.setString(2, message);
            if (userId == null) ps.setNull(3, Types.INTEGER); else ps.setInt(3, userId);
            ps.executeUpdate();
        }
    }

    /** Co návštěvníci poslali k jedné písni (songId > 0) nebo ke všem (0), nejnovější první. */
    public List<LyricHelp> sent(int songId) throws SQLException {
        List<LyricHelp> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT h.id, h.song_id, s.name, h.message, u.username, h.created_at FROM lyric_help h "
                        + "JOIN songs s ON s.id = h.song_id LEFT JOIN users u ON u.id = h.user_id "
                        + (songId > 0 ? "WHERE h.song_id = ? " : "")
                        + "ORDER BY h.created_at DESC, h.id DESC")) {
            if (songId > 0) ps.setInt(1, songId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    out.add(new LyricHelp(rs.getInt(1), rs.getInt(2), rs.getString(3), rs.getString(4),
                            rs.getString(5), rs.getTimestamp(6)));
                }
            }
        }
        return out;
    }

    /** Přečteno a hotovo: smaže se z databáze. */
    public void delete(int id) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("DELETE FROM lyric_help WHERE id = ?")) {
            ps.setInt(1, id);
            ps.executeUpdate();
        }
    }
}
