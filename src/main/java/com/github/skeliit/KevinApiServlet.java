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
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * What MC Kevin (js/kevin.js) tells visitors:
 * <ul>
 *   <li>{@code /api/kevin/news?since=<epoch ms>} – clips and posts published since the visitor's last visit:
 *       {@code {"clips": [{"title", "href"}], "posts": 3}}</li>
 *   <li>{@code /api/kevin/random} – a random clip to play: {@code {"youtubeId", "title", "href"}}</li>
 * </ul>
 */
@WebServlet(name = "KevinApiServlet", urlPatterns = {"/api/kevin/news", "/api/kevin/random"})
public class KevinApiServlet extends HttpServlet {
    private static final ObjectMapper JSON = new ObjectMapper();
    /** never further back than this, whatever the browser says (a month of news is plenty) */
    private static final long MAX_AGE_MS = 31L * 24 * 3600 * 1000;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Object out;
        try (Connection conn = Db.get()) {
            out = req.getServletPath().endsWith("/random") ? randomClip(conn) : news(conn, since(req.getParameter("since")));
        } catch (SQLException e) {
            getServletContext().log("Kevin API", e);
            resp.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            return;
        }
        if (out == null) {
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
            return;
        }
        resp.setContentType("application/json;charset=UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        JSON.writeValue(resp.getOutputStream(), out);
    }

    /** The visitor's last visit, kept within the last month; a missing or broken value means "a month ago". */
    static Timestamp since(String param) {
        long now = System.currentTimeMillis(), floor = now - MAX_AGE_MS;
        long t;
        try {
            t = Long.parseLong(param);
        } catch (NumberFormatException | NullPointerException e) {
            t = floor;
        }
        return new Timestamp(Math.max(floor, Math.min(now, t)));
    }

    private Map<String, Object> news(Connection conn, Timestamp since) throws SQLException {
        List<Map<String, String>> clips = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT v.youtube_id, v.title, s.uuid, s.name, "
                + "(SELECT COUNT(*) FROM lyrics l WHERE l.song_id = s.id) AS texts "
                + "FROM videos v LEFT JOIN songs s ON s.id = v.song_id "
                + "WHERE v.published_at > ? ORDER BY v.published_at DESC LIMIT 3")) {
            ps.setTimestamp(1, since);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) clips.add(clip(rs));
            }
        }
        int posts = 0;
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT (SELECT COUNT(*) FROM social_posts WHERE created_at > ?) + (SELECT COUNT(*) FROM shorts WHERE published_at > ?)")) {
            ps.setTimestamp(1, since);
            ps.setTimestamp(2, since);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) posts = rs.getInt(1);
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("clips", clips);
        out.put("posts", posts);
        return out;
    }

    private Map<String, String> randomClip(Connection conn) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT v.youtube_id, v.title, s.uuid, s.name, "
                + "(SELECT COUNT(*) FROM lyrics l WHERE l.song_id = s.id) AS texts "
                + "FROM videos v LEFT JOIN songs s ON s.id = v.song_id ORDER BY RAND() LIMIT 1");
             ResultSet rs = ps.executeQuery()) {
            return rs.next() ? clip(rs) : null;
        }
    }

    /** A clip with a readable title; it links to its song's lyrics when there are some, else to YouTube. */
    private static Map<String, String> clip(ResultSet rs) throws SQLException {
        String id = rs.getString("youtube_id"), uuid = rs.getString("uuid"), song = rs.getString("name");
        String title = song != null ? song.replaceFirst("(?i)^\\s*skeli\\s*-\\s*", "") : VideoTitles.display(rs.getString("title"));
        Map<String, String> c = new LinkedHashMap<>();
        c.put("youtubeId", id);
        c.put("title", title == null || title.isBlank() ? "YouTube" : title);
        c.put("href", uuid != null && rs.getInt("texts") > 0 ? "/cs/song/" + uuid : "https://www.youtube.com/watch?v=" + id);
        return c;
    }
}
