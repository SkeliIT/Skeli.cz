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
import java.util.concurrent.ThreadLocalRandom;

/**
 * Two lines from one of Skeli's lyrics for MC Kevin to rap (js/kevin.js):
 * {@code {"lines": [..], "song": "...", "href": "/cs/song/<uuid>"}}, or 204 when there are none.
 */
@WebServlet(name = "KevinBarsServlet", urlPatterns = {"/api/kevin/bars"})
public class KevinBarsServlet extends HttpServlet {
    private static final ObjectMapper JSON = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Map<String, Object> out = null;
        try (Connection conn = Db.get();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT l.id, l.words, s.name, s.uuid FROM lyrics l JOIN songs s ON s.id = l.song_id "
                     + "WHERE l.lang = 'cs' AND l.words IS NOT NULL AND CHAR_LENGTH(l.words) > 80 ORDER BY RAND() LIMIT 3");
             ResultSet rs = ps.executeQuery()) {
            while (out == null && rs.next()) {
                List<String> lines = pickBars(rs.getString("words"));
                if (lines.isEmpty()) continue;
                String uuid = rs.getString("uuid");
                out = new LinkedHashMap<>();
                out.put("lines", lines);
                out.put("song", rs.getString("name").replaceFirst("(?i)^\\s*skeli\\s*-\\s*", ""));
                out.put("href", uuid != null && !uuid.isBlank() ? "/cs/song/" + uuid : "/lyrics/" + rs.getInt("id"));
            }
        } catch (SQLException e) {
            getServletContext().log("Kevin bars", e);
        }
        if (out == null) {
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
            return;
        }
        resp.setContentType("application/json;charset=UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        JSON.writeValue(resp.getOutputStream(), out);
    }

    /**
     * Two neighbouring lines of a lyric that rap well: not empty, not too short or long,
     * not a repeat of each other. Empty list when the text has no such pair.
     */
    static List<String> pickBars(String words) {
        if (words == null) return List.of();
        String[] raw = words.replace("\\n", "\n").split("\\r?\\n");
        List<String> lines = new ArrayList<>();
        for (String l : raw) lines.add(l.trim());
        List<Integer> starts = new ArrayList<>();
        for (int i = 0; i + 1 < lines.size(); i++) {
            String a = lines.get(i), b = lines.get(i + 1);
            if (good(a) && good(b) && !a.equalsIgnoreCase(b)) starts.add(i);
        }
        if (starts.isEmpty()) return List.of();
        int i = starts.get(ThreadLocalRandom.current().nextInt(starts.size()));
        return List.of(lines.get(i), lines.get(i + 1));
    }

    private static boolean good(String line) {
        int n = line.length();
        // section labels like "Refrén:" or "[Sloka 1]" are not bars
        return n >= 14 && n <= 80 && !line.startsWith("[") && !line.endsWith(":");
    }
}
