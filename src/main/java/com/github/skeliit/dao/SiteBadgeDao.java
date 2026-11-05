package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.SiteBadges;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/** Odznaky za život na webu. Počítají se z toho, co na webu je; kdo odznak jednou získá, tomu zůstane (site_badges). */
public class SiteBadgeDao {
    /** Účty založené do tohohle data mají odznak „Od začátku“. */
    private static final Timestamp EARLY_UNTIL = Timestamp.valueOf("2027-01-01 00:00:00");
    private static final long YEAR_MS = 365L * 24 * 3600 * 1000;

    /** Přidá odznak, na který se počet nedá spočítat (karaoke kino). */
    public void award(int userId, String key) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("INSERT IGNORE INTO site_badges (user_id, badge) VALUES (?, ?)")) {
            ps.setInt(1, userId);
            ps.setString(2, key);
            ps.executeUpdate();
        }
    }

    /** Dopočítá nově splněné odznaky, uloží je a vrátí všechny získané klíče v pořadí jako SiteBadges.ALL. */
    public Set<String> sync(int userId) throws SQLException {
        List<String> met = new ArrayList<>();
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement("SELECT u.created_at, "
                    + "(SELECT COUNT(*) FROM comments x WHERE x.user_id = u.id) + (SELECT COUNT(*) FROM video_comments x WHERE x.user_id = u.id), "
                    + "(SELECT COUNT(*) FROM comments x WHERE x.user_id = u.id AND x.hearted_at IS NOT NULL) + (SELECT COUNT(*) FROM video_comments x WHERE x.user_id = u.id AND x.hearted_at IS NOT NULL), "
                    + "(SELECT COUNT(DISTINCT l.song_id) FROM lyrics_votes v JOIN lyrics l ON l.id = v.lyric_id WHERE v.user_id = u.id AND v.vote = 1), "
                    + "(SELECT COUNT(*) FROM friendships f WHERE (f.user_a = u.id OR f.user_b = u.id) AND f.status = 'accepted'), "
                    + "(SELECT COUNT(*) FROM user_tracks t WHERE t.user_id = u.id AND t.hidden_at IS NULL), "
                    + "(SELECT COUNT(*) FROM site_reports r WHERE r.user_id = u.id) + (SELECT COUNT(*) FROM lyric_help h WHERE h.user_id = u.id) "
                    + "FROM users u WHERE u.id = ?")) {
                ps.setInt(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        Timestamp created = rs.getTimestamp(1);
                        int comments = rs.getInt(2);
                        if (comments >= 1) met.add("s_voice");
                        if (comments >= 25) met.add("s_talk");
                        if (rs.getInt(3) >= 1) met.add("s_heart");
                        if (rs.getInt(4) >= 5) met.add("s_fan");
                        if (rs.getInt(5) >= 1) met.add("s_friend");
                        if (rs.getInt(6) >= 1) met.add("s_artist");
                        if (rs.getInt(7) >= 1) met.add("s_helper");
                        if (created != null && created.before(EARLY_UNTIL)) met.add("s_early");
                        if (created != null && System.currentTimeMillis() - created.getTime() >= YEAR_MS) met.add("s_year");
                    }
                }
            }
            if (!met.isEmpty()) {
                try (PreparedStatement ps = c.prepareStatement("INSERT IGNORE INTO site_badges (user_id, badge) VALUES (?, ?)")) {
                    for (String key : met) {
                        ps.setInt(1, userId);
                        ps.setString(2, key);
                        ps.addBatch();
                    }
                    ps.executeBatch();
                }
            }
            Set<String> stored = new LinkedHashSet<>();
            try (PreparedStatement ps = c.prepareStatement("SELECT badge FROM site_badges WHERE user_id = ?")) {
                ps.setInt(1, userId);
                try (ResultSet rs = ps.executeQuery()) { while (rs.next()) stored.add(rs.getString(1)); }
            }
            Set<String> ordered = new LinkedHashSet<>();
            for (String key : SiteBadges.ALL.keySet()) if (stored.contains(key)) ordered.add(key);
            return ordered;
        }
    }
}
