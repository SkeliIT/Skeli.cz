package com.github.skeliit.web.admin;

import com.github.skeliit.Db;
import com.github.skeliit.job.VideoTitles;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

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
 * Kevinovo hlášení pro admina (jen za AdminFilter, /admin/*): co je nového a co čeká na vyřízení:
 * {@code {"now": ms, "fresh": {"users": 1, "newUser": "jméno", "comments": 1, ...}, "reports": 2, "clipsWithoutSong": 4,
 * "newestClipWithoutSong": "název nebo null", "songsWithoutLyrics": 5}}.
 */
@WebServlet(name = "AdminKevinServlet", urlPatterns = {"/admin/kevin"})
public class AdminKevinServlet extends HttpServlet {
    private static final ObjectMapper JSON = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Map<String, Object> out = new LinkedHashMap<>();
        // Kevin greets the admin by name (Skeli and his brother are both admins)
        HttpSession session = req.getSession(false);
        out.put("name", session == null ? null : session.getAttribute("username"));
        // co je nového od poslední návštěvy (?since= čas v ms z prohlížeče), bez něj za poslední týden, nejvýš 60 dní zpět
        long now = System.currentTimeMillis();
        out.put("now", now);
        int self = session != null && session.getAttribute("userId") instanceof Integer id ? id : 0;
        try (Connection conn = Db.get()) {
            out.put("fresh", new com.github.skeliit.dao.AdminDao().freshSince(sinceMs(req.getParameter("since"), now), self));
            // one report per comment, however many people reported it
            out.put("reports", count(conn, "SELECT COUNT(*) FROM (SELECT DISTINCT kind, comment_id FROM comment_reports) r"));
            out.put("clipsWithoutSong", count(conn, "SELECT COUNT(*) FROM videos WHERE song_id IS NULL AND no_song_ok_at IS NULL"));
            List<String> newest = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT title FROM videos WHERE song_id IS NULL AND no_song_ok_at IS NULL ORDER BY published_at DESC, id DESC LIMIT 1");
                 ResultSet rs = ps.executeQuery()) {
                if (rs.next()) newest.add(VideoTitles.display(rs.getString(1)));
            }
            out.put("newestClipWithoutSong", newest.isEmpty() ? null : newest.get(0));
            out.put("songsWithoutLyrics", count(conn,
                    "SELECT COUNT(*) FROM songs s WHERE s.no_lyrics_ok_at IS NULL AND NOT EXISTS (SELECT 1 FROM lyrics l WHERE l.song_id = s.id)"));
        } catch (SQLException e) {
            getServletContext().log("Admin Kevin", e);
            resp.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            return;
        }
        resp.setContentType("application/json;charset=UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        JSON.writeValue(resp.getOutputStream(), out);
    }

    /** Čas z adresy; neplatný nebo žádný = týden zpět, nikdy víc než 60 dní zpět ani do budoucna. */
    static long sinceMs(String param, long now) {
        long day = 24 * 60 * 60 * 1000L, since = now - 7 * day;
        if (param != null) {
            try { since = Long.parseLong(param.trim()); } catch (NumberFormatException e) { /* zůstane týden */ }
        }
        return Math.max(now - 60 * day, Math.min(now, since));
    }

    private static int count(Connection conn, String sql) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            return rs.next() ? rs.getInt(1) : 0;
        }
    }
}
