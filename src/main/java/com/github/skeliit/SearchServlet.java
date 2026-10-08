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
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Songs whose name or lyrics contain the query (the search on the Lyrics page and MC Kevin):
 * {@code [{"id": 3, "name": "...", "href": "/{lang}/song/<uuid>", "line": "the matching line or null"}]}.
 * The database compares without case and accents (utf8mb4_general_ci), so "telo" finds "tělo".
 */
@WebServlet(name = "SearchServlet", urlPatterns = {"/api/search"})
public class SearchServlet extends HttpServlet {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final int MAX_RESULTS = 20;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String q = req.getParameter("q");
        q = q == null ? "" : q.strip().replaceAll("\\s+", " ");
        if (q.length() > 60) q = q.substring(0, 60);
        List<Map<String, Object>> out = new ArrayList<>();
        if (q.length() >= 2) {
            String like = "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            // one row per song: the name matches, or one of its lyrics (any language) does
            String sql = "SELECT s.id, s.uuid, s.name, MIN(l.id) AS lyric_id, "
                    + "(SELECT l2.words FROM lyrics l2 WHERE l2.song_id = s.id AND l2.words LIKE ? ORDER BY l2.lang = 'cs' DESC LIMIT 1) AS words "
                    + "FROM songs s JOIN lyrics l ON l.song_id = s.id "
                    + "GROUP BY s.id, s.uuid, s.name "
                    + "HAVING s.name LIKE ? OR words IS NOT NULL "
                    + "ORDER BY s.name LIKE ? DESC, s.year DESC LIMIT " + MAX_RESULTS;
            try (Connection conn = Db.get(); PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, like);
                ps.setString(2, like);
                ps.setString(3, like);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        String uuid = rs.getString("uuid");
                        row.put("id", rs.getInt("id"));
                        row.put("name", rs.getString("name").replaceFirst("(?i)^\\s*skeli\\s*-\\s*", ""));
                        row.put("href", I18n.songPath(req, uuid, rs.getInt("lyric_id")));
                        row.put("line", matchingLine(rs.getString("words"), q));
                        out.add(row);
                    }
                }
            } catch (SQLException e) {
                getServletContext().log("Search", e);
                resp.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
                return;
            }
        }
        resp.setContentType("application/json;charset=UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        JSON.writeValue(resp.getOutputStream(), out);
    }

    /** The first line of the lyric that contains the query, ignoring case and accents; null if none. */
    static String matchingLine(String words, String q) {
        if (words == null || q == null || q.isBlank()) return null;
        String needle = fold(q.strip());
        for (String line : words.replace("\\n", "\n").split("\\r?\\n")) {
            if (fold(line).contains(needle)) return line.strip();
        }
        return null;
    }

    static String fold(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }
}
