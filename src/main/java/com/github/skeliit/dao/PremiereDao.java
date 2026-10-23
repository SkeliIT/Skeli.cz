package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.Premiere;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;

/** Premiéry písní a klipů (V95): nastavení v adminu a co ukázat na webu. */
public class PremiereDao {
    /** Jak dlouho po premiéře ještě úvod hlásí „Venku!“ (3 dny). */
    public static final long SHOW_AFTER_MS = 3L * 24 * 3600 * 1000;

    private static final String SELECT = "SELECT s.id, s.uuid, s.name, s.release_kind, "
            // obrázek: nejnovější klip, jinak vlastní obrázek písně
            + "COALESCE((SELECT CONCAT('/yt-thumb/', v.youtube_id, '/mqdefault.jpg') FROM videos v WHERE v.song_id = s.id "
            + "ORDER BY v.published_at DESC, v.id DESC LIMIT 1), s.preview_image_url), s.release_at FROM songs s ";

    /** Premiéra pro úvod: nejbližší budoucí, jinak ta, která vyšla v posledních 3 dnech; nebo null. */
    public Premiere forHome() throws SQLException {
        long now = System.currentTimeMillis();
        try (Connection c = Db.get()) {
            Premiere p = one(c, SELECT + "WHERE s.release_at >= ? ORDER BY s.release_at ASC LIMIT 1", now);
            return p != null ? p : one(c, SELECT + "WHERE s.release_at >= ? ORDER BY s.release_at DESC LIMIT 1", now - SHOW_AFTER_MS);
        }
    }

    /** Premiéra jedné písně (i už proběhlá), nebo null. */
    public Premiere forSong(int songId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(SELECT + "WHERE s.id = ? AND s.release_at IS NOT NULL")) {
            ps.setInt(1, songId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? map(rs) : null; }
        }
    }

    /** Admin: nastaví premiéru (at = epoch ms, kind clip|song), nebo ji zruší (at = null). */
    public void set(int songId, Long at, String kind) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE songs SET release_at = ?, release_kind = ? WHERE id = ?")) {
            if (at == null) { ps.setNull(1, Types.BIGINT); ps.setNull(2, Types.VARCHAR); }
            else { ps.setLong(1, at); ps.setString(2, "song".equals(kind) ? "song" : "clip"); }
            ps.setInt(3, songId);
            ps.executeUpdate();
        }
    }

    private static Premiere one(Connection c, String sql, long from) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, from);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? map(rs) : null; }
        }
    }

    private static Premiere map(ResultSet rs) throws SQLException {
        return new Premiere(rs.getInt(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getString(5), rs.getLong(6));
    }
}
