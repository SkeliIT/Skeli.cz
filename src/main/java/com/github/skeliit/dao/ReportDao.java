package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.SiteReport;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

/** Problems visitors report to MC Kevin (site_reports, V85); the admin deletes one once it is sorted out. */
public class ReportDao {

    public void add(String page, String message, Integer userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO site_reports (page, message, user_id) VALUES (?, ?, ?)")) {
            ps.setString(1, page);
            ps.setString(2, message);
            if (userId == null) ps.setNull(3, Types.INTEGER); else ps.setInt(3, userId);
            ps.executeUpdate();
        }
    }

    /** The newest first. */
    public List<SiteReport> all() throws SQLException {
        List<SiteReport> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT r.id, r.page, r.message, u.username, r.created_at FROM site_reports r "
                        + "LEFT JOIN users u ON u.id = r.user_id ORDER BY r.created_at DESC, r.id DESC");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.add(new SiteReport(rs.getInt(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getTimestamp(5)));
            }
        }
        return out;
    }

    /** Sorted out: gone from the database. */
    public void delete(int id) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("DELETE FROM site_reports WHERE id = ?")) {
            ps.setInt(1, id);
            ps.executeUpdate();
        }
    }
}
