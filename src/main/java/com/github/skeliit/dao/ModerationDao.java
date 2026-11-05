package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.UserReport;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/** Moderace účtů: zablokování a nahlášení profilu. Zásahy zapisuje záznam změn (filter/AdminAuditFilter). */
public class ModerationDao {
    public static final Set<String> REASONS = Set.of("spam", "abuse", "image", "fake", "music", "other", "illegal", "child");

    public boolean isBlocked(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT blocked_at IS NOT NULL FROM users WHERE id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() && rs.getBoolean(1); }
        }
    }

    public void block(int userId, String reason) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE users SET blocked_at = NOW(), blocked_reason = ? WHERE id = ? AND role <> 'DELETED'")) {
            ps.setString(1, reason == null || reason.isBlank() ? null : reason.strip());
            ps.setInt(2, userId);
            ps.executeUpdate();
        }
    }

    public void unblock(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE users SET blocked_at = NULL, blocked_reason = NULL WHERE id = ?")) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        }
    }

    /** Nahlášení od jednoho člověka je na jeden profil jen jedno; nové přepíše staré a znovu ho otevře. */
    public void report(int reportedId, int reporterId, String reason, String note) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO user_reports (reported_id, reporter_id, reason, note) VALUES (?, ?, ?, ?) "
                + "ON DUPLICATE KEY UPDATE reason = VALUES(reason), note = VALUES(note), created_at = NOW(), resolved_at = NULL")) {
            ps.setInt(1, reportedId);
            ps.setInt(2, reporterId);
            ps.setString(3, reason);
            ps.setString(4, note == null || note.isBlank() ? null : note.strip());
            ps.executeUpdate();
        }
    }

    /** Nevyřízená nahlášení pro admina, nejnovější nahoře. Kdo nahlásil, se nevypisuje: admin to k rozhodnutí nepotřebuje. */
    public List<UserReport> openReports() throws SQLException {
        List<UserReport> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT r.id, r.reported_id, u.username, r.reason, r.note, r.created_at, u.avatar_url, u.cover_url, u.blocked_at IS NOT NULL "
                + "FROM user_reports r JOIN users u ON u.id = r.reported_id WHERE r.resolved_at IS NULL ORDER BY r.reason IN ('illegal', 'child') DESC, r.created_at DESC");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.add(new UserReport(rs.getInt(1), rs.getInt(2), rs.getString(3), rs.getString(4), rs.getString(5),
                        rs.getTimestamp(6), rs.getString(7), rs.getString(8), rs.getBoolean(9)));
            }
        }
        return out;
    }

    public int openReportCount() throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT COUNT(*) FROM user_reports WHERE resolved_at IS NULL");
             ResultSet rs = ps.executeQuery()) {
            return rs.next() ? rs.getInt(1) : 0;
        }
    }

    public void resolveReport(int reportId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE user_reports SET resolved_at = NOW() WHERE id = ?")) {
            ps.setInt(1, reportId);
            ps.executeUpdate();
        }
    }
}
