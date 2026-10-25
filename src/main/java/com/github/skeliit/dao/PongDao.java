package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.PongRank;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/** Kevin Pong (pong_results, V98): wins of signed-in players; the leaderboard = each player's fastest win. */
public class PongDao {

    public void addWin(int userId, int difficulty, int durationMs, int kevinGoals) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO pong_results (user_id, difficulty, duration_ms, kevin_goals) VALUES (?, ?, ?, ?)")) {
            ps.setInt(1, userId);
            ps.setInt(2, difficulty);
            ps.setInt(3, durationMs);
            ps.setInt(4, kevinGoals);
            ps.executeUpdate();
        }
    }

    /** Top `limit` players on a difficulty (each once, by their fastest win; a tie goes to who did it first). */
    public List<PongRank> top(int difficulty, int limit, Integer meId) throws SQLException {
        List<PongRank> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT u.id, u.username, u.avatar_url, b.best, "
                        + " (SELECT r2.kevin_goals FROM pong_results r2 WHERE r2.user_id = b.user_id AND r2.difficulty = ? AND r2.duration_ms = b.best ORDER BY r2.id LIMIT 1) "
                        + "FROM (SELECT user_id, MIN(duration_ms) AS best, MIN(created_at) AS first_at FROM pong_results WHERE difficulty = ? GROUP BY user_id) b "
                        + "JOIN users u ON u.id = b.user_id ORDER BY b.best, b.first_at LIMIT ?")) {
            ps.setInt(1, difficulty);
            ps.setInt(2, difficulty);
            ps.setInt(3, limit);
            try (ResultSet rs = ps.executeQuery()) {
                int place = 0;
                while (rs.next()) {
                    place++;
                    out.add(new PongRank(place, rs.getString(2), rs.getString(3), rs.getInt(4), rs.getInt(5), meId != null && meId == rs.getInt(1)));
                }
            }
        }
        return out;
    }

    /** The player's own best on a difficulty and their place (null when they have not beaten Kevin there yet). */
    public PongRank mine(int difficulty, int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT u.username, u.avatar_url, b.best, "
                        + " 1 + (SELECT COUNT(*) FROM (SELECT user_id, MIN(duration_ms) AS m FROM pong_results WHERE difficulty = ? GROUP BY user_id) o WHERE o.m < b.best) "
                        + "FROM (SELECT MIN(duration_ms) AS best FROM pong_results WHERE difficulty = ? AND user_id = ?) b "
                        + "JOIN users u ON u.id = ? WHERE b.best IS NOT NULL")) {
            ps.setInt(1, difficulty);
            ps.setInt(2, difficulty);
            ps.setInt(3, userId);
            ps.setInt(4, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                return new PongRank(rs.getInt(4), rs.getString(1), rs.getString(2), rs.getInt(3), 0, true);
            }
        }
    }
}
