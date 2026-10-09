package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.UserComment;
import com.github.skeliit.model.UserProfile;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/** A signed-in user's own data: the settings they filled in and their comments. */
public class UserDao {

    /** The user's settings, or null when they never saved any. */
    public UserProfile profile(int userId) throws SQLException {
        String sql = "SELECT display_name, age, city, bio, theme, lang FROM user_profiles WHERE user_id=?";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet r = ps.executeQuery()) {
                if (!r.next()) return null;
                return new UserProfile(r.getString("display_name"), (Integer) r.getObject("age"), r.getString("city"),
                        r.getString("bio"), r.getString("theme"), r.getString("lang"));
            }
        }
    }

    /** The user's comments on song lyrics, newest first (at most 50). */
    public List<UserComment> recentComments(int userId) throws SQLException {
        String sql = "SELECT c.id, c.content, c.created_at, c.lyric_id, s.name "
                + "FROM comments c JOIN lyrics l ON l.id=c.lyric_id JOIN songs s ON s.id=l.song_id "
                + "WHERE c.user_id=? ORDER BY c.created_at DESC LIMIT 50";
        List<UserComment> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    out.add(new UserComment(rs.getInt(1), rs.getString(2), rs.getTimestamp(3), rs.getInt(4), rs.getString(5)));
                }
            }
        }
        return out;
    }
}
