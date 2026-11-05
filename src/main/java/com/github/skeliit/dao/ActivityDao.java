package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.ActivityItem;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Aktivita na profilu: co se člověku poslední dobou povedlo. Každý druh zvlášť a spojení až v Javě: tabulky mají různé collation.
 * Ostatní (forOthers) vidí jen odznaky, výhry a skladby. Komentáře a přátelé jsou jen pro majitele.
 */
public class ActivityDao {
    private static final int EACH = 6;

    private static void read(Connection c, List<ActivityItem> out, String kind, String sql, int... args) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            for (int i = 0; i < args.length; i++) ps.setInt(i + 1, args[i]);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) out.add(new ActivityItem(kind, rs.getString(1), rs.getTimestamp(2)));
            }
        }
    }

    public List<ActivityItem> recent(int userId, boolean forOthers, int limit) throws SQLException {
        List<ActivityItem> out = new ArrayList<>();
        try (Connection c = Db.get()) {
            read(c, out, "badge", "SELECT badge, earned_at FROM site_badges WHERE user_id = ? ORDER BY earned_at DESC LIMIT " + EACH, userId);
            read(c, out, "badge", "SELECT badge, earned_at FROM pong_badges WHERE user_id = ? ORDER BY earned_at DESC LIMIT " + EACH, userId);
            read(c, out, "win", "SELECT difficulty, created_at FROM pong_results WHERE user_id = ? ORDER BY created_at DESC LIMIT " + EACH, userId);
            read(c, out, "track", "SELECT title, created_at FROM user_tracks WHERE user_id = ? AND hidden_at IS NULL ORDER BY created_at DESC LIMIT " + EACH, userId);
            if (!forOthers) {
                read(c, out, "comment", "SELECT LEFT(content, 60), created_at FROM comments WHERE user_id = ? ORDER BY created_at DESC LIMIT " + EACH, userId);
                read(c, out, "comment", "SELECT LEFT(content, 60), created_at FROM video_comments WHERE user_id = ? ORDER BY created_at DESC LIMIT " + EACH, userId);
                read(c, out, "friend", "SELECT u.username, f.accepted_at FROM friendships f JOIN users u ON u.id = IF(f.user_a = ?, f.user_b, f.user_a) "
                        + "WHERE (f.user_a = ? OR f.user_b = ?) AND f.status = 'accepted' AND f.accepted_at IS NOT NULL AND u.role <> 'DELETED' ORDER BY f.accepted_at DESC LIMIT " + EACH,
                        userId, userId, userId);
            }
        }
        out.removeIf(a -> a.at == null);
        out.sort(Comparator.comparing((ActivityItem a) -> a.at).reversed());
        return out.size() > limit ? new ArrayList<>(out.subList(0, limit)) : out;
    }
}
