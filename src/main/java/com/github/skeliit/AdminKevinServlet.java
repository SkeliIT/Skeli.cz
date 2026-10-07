package com.github.skeliit;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * MC Kevin's to-do list for the admin (only behind AdminFilter, /admin/*):
 * {@code {"reports": 2, "clipsWithoutSong": 4, "newestClipWithoutSong": "title or null", "songsWithoutLyrics": 5}}.
 */
@WebServlet(name = "AdminKevinServlet", urlPatterns = {"/admin/kevin"})
public class AdminKevinServlet extends HttpServlet {
    private static final ObjectMapper JSON = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Map<String, Object> out = new LinkedHashMap<>();
        try (Connection conn = Db.get()) {
            // one report per comment, however many people reported it
            out.put("reports", count(conn, "SELECT COUNT(*) FROM (SELECT DISTINCT kind, comment_id FROM comment_reports) r"));
            out.put("clipsWithoutSong", count(conn, "SELECT COUNT(*) FROM videos WHERE song_id IS NULL"));
            List<String> newest = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT title FROM videos WHERE song_id IS NULL ORDER BY published_at DESC, id DESC LIMIT 1");
                 ResultSet rs = ps.executeQuery()) {
                if (rs.next()) newest.add(VideoTitles.display(rs.getString(1)));
            }
            out.put("newestClipWithoutSong", newest.isEmpty() ? null : newest.get(0));
            out.put("songsWithoutLyrics", count(conn,
                    "SELECT COUNT(*) FROM songs s WHERE NOT EXISTS (SELECT 1 FROM lyrics l WHERE l.song_id = s.id)"));
        } catch (SQLException e) {
            getServletContext().log("Admin Kevin", e);
            resp.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            return;
        }
        resp.setContentType("application/json;charset=UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        JSON.writeValue(resp.getOutputStream(), out);
    }

    private static int count(Connection conn, String sql) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            return rs.next() ? rs.getInt(1) : 0;
        }
    }
}
