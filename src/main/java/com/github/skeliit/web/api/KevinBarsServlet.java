package com.github.skeliit.web.api;

import com.github.skeliit.Db;
import com.github.skeliit.I18n;
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
 * Two lines from one of Skeli's lyrics for Kevin to rap (js/kevin.js):
 * {@code {"lines": [..], "song": "...", "href": "/{lang}/song/<uuid>"}}, or 204 when there are none.
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
                out.put("href", I18n.songPath(req, uuid, rs.getInt("id")));
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

    /** At most this many lines in one go (a whole verse or chorus of that size, otherwise four lines of it). */
    static final int MAX_LINES = 6;

    /**
     * A part of a lyric that makes sense on its own: a whole verse or chorus (the blocks between empty lines), so
     * the rhymes and the thought are complete. A longer verse gives four of its lines, starting where a sentence
     * starts. Only real lines (no labels, not too short or long, no line twice). Empty list when the
     * text has no block of at least two such lines.
     */
    static List<String> pickBars(String words) {
        if (words == null) return List.of();
        List<List<String>> blocks = new ArrayList<>();
        List<String> cur = new ArrayList<>();
        for (String raw : words.replace("\\n", "\n").split("\\r?\\n")) {
            String l = raw.trim();
            if (l.isEmpty()) {
                if (!cur.isEmpty()) { blocks.add(cur); cur = new ArrayList<>(); }
                continue;
            }
            if (!good(l) || cur.stream().anyMatch(x -> x.equalsIgnoreCase(l))) continue;   // a chorus sung twice: once
            cur.add(l);
        }
        if (!cur.isEmpty()) blocks.add(cur);
        blocks.removeIf(b -> b.size() < 2);
        if (blocks.isEmpty()) return List.of();
        List<String> b = blocks.get(ThreadLocalRandom.current().nextInt(blocks.size()));
        if (b.size() <= MAX_LINES) return List.copyOf(b);
        // four lines starting where a sentence starts (the verse's start or after . ! ?), not mid-thought
        List<Integer> starts = new ArrayList<>();
        for (int i = 0; i + 4 <= b.size(); i++) if (i == 0 || b.get(i - 1).matches(".*[.!?…]$")) starts.add(i);
        int start = starts.get(ThreadLocalRandom.current().nextInt(starts.size()));
        return List.copyOf(b.subList(start, start + 4));
    }

    private static boolean good(String line) {
        int n = line.length();
        // section labels like "Refrén:" or "[Sloka 1]" are not bars
        return n >= 14 && n <= 80 && !line.startsWith("[") && !line.endsWith(":");
    }
}
