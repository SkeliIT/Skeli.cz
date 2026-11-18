package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.UserTrack;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

/** „Moje tvorba“: skladby uživatele na profilu. Úpravy a mazání berou „já“ ze session, takže na cizí skladbu nejde sáhnout. */
public class UserTrackDao {
    public static final int MAX_PER_USER = 20;

    /** Nejnovější nahoře. Skryté adminem vidí jen majitel a admin (includeHidden). */
    public List<UserTrack> list(int userId, boolean includeHidden) throws SQLException {
        List<UserTrack> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT id, title, year, youtube_id, spotify, apple, soundcloud, hidden_at, hidden_reason FROM user_tracks WHERE user_id = ?"
                + (includeHidden ? "" : " AND hidden_at IS NULL") + " ORDER BY year IS NULL, year DESC, id DESC")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    UserTrack t = new UserTrack();
                    t.id = rs.getInt(1);
                    t.title = rs.getString(2);
                    t.year = (Integer) rs.getObject(3, Integer.class);
                    t.youtubeId = rs.getString(4);
                    t.spotify = rs.getString(5);
                    t.apple = rs.getString(6);
                    t.soundcloud = rs.getString(7);
                    t.hidden = rs.getTimestamp(8) != null;
                    t.hiddenReason = rs.getString(9);
                    out.add(t);
                }
            }
        }
        return out;
    }

    public int count(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT COUNT(*) FROM user_tracks WHERE user_id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getInt(1) : 0; }
        }
    }

    private static void fill(PreparedStatement ps, UserTrack t) throws SQLException {
        ps.setString(1, t.title);
        if (t.year == null) ps.setNull(2, Types.SMALLINT); else ps.setInt(2, t.year);
        ps.setString(3, t.youtubeId);
        ps.setString(4, t.spotify);
        ps.setString(5, t.apple);
        ps.setString(6, t.soundcloud);
    }

    public void add(int me, UserTrack t) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO user_tracks (title, year, youtube_id, spotify, apple, soundcloud, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)")) {
            fill(ps, t);
            ps.setInt(7, me);
            ps.executeUpdate();
        }
    }

    /** Úprava vlastní skladby. Skrytí adminem tím nezruší. */
    public boolean update(int me, int id, UserTrack t) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE user_tracks SET title = ?, year = ?, youtube_id = ?, spotify = ?, apple = ?, soundcloud = ?, rights_at = NOW() WHERE id = ? AND user_id = ?")) {
            fill(ps, t);
            ps.setInt(7, id);
            ps.setInt(8, me);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean delete(int me, int id) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("DELETE FROM user_tracks WHERE id = ? AND user_id = ?")) {
            ps.setInt(1, id);
            ps.setInt(2, me);
            return ps.executeUpdate() > 0;
        }
    }

    /** Moderace: reason = null skladbu zase ukáže. */
    public void setHidden(int id, String reason) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE user_tracks SET hidden_at = IF(? IS NULL, NULL, NOW()), hidden_reason = ? WHERE id = ?")) {
            ps.setString(1, reason);
            ps.setString(2, reason);
            ps.setInt(3, id);
            ps.executeUpdate();
        }
    }
}
