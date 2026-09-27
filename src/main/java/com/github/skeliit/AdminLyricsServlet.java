package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import com.github.skeliit.dao.LyricDao;

/**
 * Admin lyrics editor, /admin/lyrics (admins only via AdminFilter on /admin/*).
 *
 * GET  ?song={id}&lang={cs|en|de|uk}   list of songs + editor for the chosen one
 * POST action=save       song_id, lang, words   saves (empty text removes that language)
 * POST action=from_video youtube_id             turns a clip without a song into a song
 * POST action=new_song   name, year             adds a song (e.g. not on YouTube at all)
 */
@WebServlet(name = "AdminLyricsServlet", urlPatterns = {"/admin/lyrics"})
public class AdminLyricsServlet extends HttpServlet {
    static final Set<String> LANGS = Set.of("cs", "en", "de", "uk");
    private static final int MAX_WORDS = 20_000;
    private final LyricDao lyrics = new LyricDao();

    /** One row of the song list. */
    public static class SongRow {
        public int id;
        public String name;
        public Integer year;
        public String langs; // e.g. "cs, en" or "" when there are no lyrics
        public int getId() { return id; }
        public String getName() { return name; }
        public Integer getYear() { return year; }
        public String getLangs() { return langs; }
    }

    /** A clip that isn't linked to any song yet. */
    public static class VideoRow {
        public String youtubeId;
        public String title;
        public String getYoutubeId() { return youtubeId; }
        public String getTitle() { return title; }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String lang = langParam(req);
        Integer songId = parseId(req.getParameter("song"));
        try {
            List<SongRow> songs = listSongs();
            req.setAttribute("songs", songs);
            req.setAttribute("videos", listUnlinkedVideos());
            req.setAttribute("lang", lang);
            if (songId != null) {
                for (SongRow s : songs) {
                    if (s.id == songId) {
                        req.setAttribute("song", s);
                        String words = lyrics.getWords(songId, lang);
                        req.setAttribute("words", words == null ? "" : words);
                        req.setAttribute("lyricId", lyricId(songId, lang));
                    }
                }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        req.getRequestDispatcher("/WEB-INF/views/admin_lyrics.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        try {
            if ("save".equals(action)) {
                Integer songId = parseId(req.getParameter("song_id"));
                String lang = langParam(req);
                String words = cleanWords(req.getParameter("words"));
                if (songId == null || (words != null && words.length() > MAX_WORDS)) {
                    resp.sendRedirect("/admin/lyrics?error=1");
                    return;
                }
                lyrics.saveWords(songId, lang, words);
                resp.sendRedirect("/admin/lyrics?song=" + songId + "&lang=" + lang + "&saved=1");
            } else if ("from_video".equals(action)) {
                Integer songId = songFromVideo(req.getParameter("youtube_id"));
                resp.sendRedirect(songId == null ? "/admin/lyrics?error=1" : "/admin/lyrics?song=" + songId);
            } else if ("new_song".equals(action)) {
                String name = req.getParameter("name");
                Integer year = parseId(req.getParameter("year"));
                if (name == null || name.isBlank()) {
                    resp.sendRedirect("/admin/lyrics?error=1");
                    return;
                }
                try (Connection c = Db.get()) {
                    int songId = ensureSong(c, name.trim(), year);
                    resp.sendRedirect("/admin/lyrics?song=" + songId);
                }
            } else {
                resp.sendRedirect("/admin/lyrics");
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    /** Line breaks as \n, no trailing spaces, trimmed; null when empty. */
    static String cleanWords(String words) {
        if (words == null) return null;
        String w = words.replace("\r\n", "\n").replace('\r', '\n').replaceAll("[ \\t]+\\n", "\n").strip();
        return w.isEmpty() ? null : w;
    }

    /** The lang parameter if supported, else "cs". (Set.of(...).contains(null) would throw.) */
    private static String langParam(HttpServletRequest req) {
        String l = req.getParameter("lang");
        return l != null && LANGS.contains(l) ? l : "cs";
    }

    private static Integer parseId(String v) {
        if (v == null || !v.trim().matches("\\d{1,9}")) return null;
        return Integer.parseInt(v.trim());
    }

    /** Songs without lyrics first, then newest first. */
    private static List<SongRow> listSongs() throws SQLException {
        String sql = "SELECT s.id, s.name, s.year, " +
                "(SELECT GROUP_CONCAT(l.lang ORDER BY FIELD(l.lang,'cs','en','de','uk') SEPARATOR ', ') FROM lyrics l WHERE l.song_id = s.id) AS langs " +
                "FROM songs s ORDER BY (langs IS NULL) DESC, s.year DESC, s.name";
        List<SongRow> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                SongRow r = new SongRow();
                r.id = rs.getInt(1);
                r.name = rs.getString(2);
                int y = rs.getInt(3);
                r.year = rs.wasNull() ? null : y;
                String l = rs.getString(4);
                r.langs = l == null ? "" : l;
                out.add(r);
            }
        }
        return out;
    }

    private static List<VideoRow> listUnlinkedVideos() throws SQLException {
        List<VideoRow> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT youtube_id, title FROM videos WHERE song_id IS NULL ORDER BY published_at DESC, id DESC");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                VideoRow v = new VideoRow();
                v.youtubeId = rs.getString(1);
                String t = VideoTitles.display(rs.getString(2));
                v.title = t != null ? t : v.youtubeId;
                out.add(v);
            }
        }
        return out;
    }

    private static Integer lyricId(int songId, String lang) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT id FROM lyrics WHERE song_id=? AND lang=? ORDER BY id LIMIT 1")) {
            ps.setInt(1, songId);
            ps.setString(2, lang);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : null;
            }
        }
    }

    /** Creates a song named after the clip (cleaned title, year of publishing) and links the clip to it. */
    private static Integer songFromVideo(String youtubeId) throws SQLException {
        if (youtubeId == null || !youtubeId.matches("[A-Za-z0-9_-]{6,20}")) return null;
        try (Connection c = Db.get()) {
            String title = null;
            Integer year = null;
            try (PreparedStatement ps = c.prepareStatement("SELECT title, published_at FROM videos WHERE youtube_id=? AND song_id IS NULL")) {
                ps.setString(1, youtubeId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) return null;
                    title = VideoTitles.display(rs.getString(1));
                    Timestamp ts = rs.getTimestamp(2);
                    if (ts != null) year = ts.toLocalDateTime().getYear();
                }
            }
            if (title == null || title.isBlank()) title = youtubeId;
            int songId = ensureSong(c, title, year);
            try (PreparedStatement ps = c.prepareStatement("UPDATE videos SET song_id=? WHERE youtube_id=?")) {
                ps.setInt(1, songId);
                ps.setString(2, youtubeId);
                ps.executeUpdate();
            }
            return songId;
        }
    }

    /** Id of the song with this name and year, created if missing. */
    static int ensureSong(Connection c, String name, Integer year) throws SQLException {
        try (PreparedStatement sel = c.prepareStatement("SELECT id FROM songs WHERE name=? AND year <=> ?")) {
            sel.setString(1, name);
            if (year == null) sel.setNull(2, Types.INTEGER); else sel.setInt(2, year);
            try (ResultSet rs = sel.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        try (PreparedStatement ins = c.prepareStatement(
                "INSERT INTO songs (uuid, name, year) VALUES (UUID(), ?, ?)", Statement.RETURN_GENERATED_KEYS)) {
            ins.setString(1, name);
            if (year == null) ins.setNull(2, Types.INTEGER); else ins.setInt(2, year);
            ins.executeUpdate();
            try (ResultSet rs = ins.getGeneratedKeys()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }
}
