package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.CommentView;
import com.github.skeliit.model.LyricView;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class LyricDao {
    public LyricView getLyricView(int lyricId, String lang) throws SQLException {
        // Default to Czech if no lang specified
        if (lang == null || lang.isEmpty()) lang = "cs";
        
        // First try the same song in the requested language (the id may be another language's row)
        // Prefer lyric-level SEO; fall back to legacy songs.seo_slug for Czech
        String sql = "SELECT s.name AS song_name, s.year AS song_year, s.uuid AS song_uuid, " +
                "COALESCE(NULLIF(l.seo_slug,''), CASE WHEN l.lang='cs' THEN s.seo_slug END) AS song_seo_slug, " +
                "l.meta_description, l.lang AS lyric_lang, l.title AS lyric_title, " +
                "s.apple_music_id, s.preview_image_url, l.words, l.song_id, l.id, l.lang, " +
                "(SELECT v.youtube_id FROM videos v WHERE v.song_id = l.song_id ORDER BY v.published_at DESC, v.id DESC LIMIT 1) AS yt " +
                "FROM lyrics l JOIN songs s ON s.id = l.song_id " +
                "WHERE l.song_id = (SELECT x.song_id FROM lyrics x WHERE x.id = ?) AND l.lang = ? ORDER BY l.id LIMIT 1";
        
        LyricView v = null;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, lyricId);
            ps.setString(2, lang);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    // Fallback: load the requested lyric id as-is (language already baked into the row)
                    try (PreparedStatement ps2 = c.prepareStatement(
                            "SELECT s.name AS song_name, s.year AS song_year, s.uuid AS song_uuid, " +
                            "COALESCE(NULLIF(l.seo_slug,''), CASE WHEN l.lang='cs' THEN s.seo_slug END) AS song_seo_slug, " +
                            "l.meta_description, l.lang AS lyric_lang, l.title AS lyric_title, " +
                            "s.apple_music_id, s.preview_image_url, l.words, l.song_id, l.id, l.lang, " +
                            "(SELECT v.youtube_id FROM videos v WHERE v.song_id = l.song_id ORDER BY v.published_at DESC, v.id DESC LIMIT 1) AS yt " +
                            "FROM lyrics l JOIN songs s ON s.id = l.song_id WHERE l.id = ?")) {
                        ps2.setInt(1, lyricId);
                        try (ResultSet rs2 = ps2.executeQuery()) {
                            if (!rs2.next()) return null;
                            v = mapLyricView(rs2, c, lyricId);
                        }
                    }
                } else {
                    v = mapLyricView(rs, c, lyricId);
                }
            }
        }
        return v;
    }

    /**
     * Resolves the lyric row for a song UUID in the requested language (falls back to cs, then any).
     */
    public Integer findLyricIdBySongUuid(String uuid, String lang) throws SQLException {
        if (uuid == null || uuid.isBlank()) return null;
        if (lang == null || lang.isEmpty()) lang = "cs";
        String sql = "SELECT l.id FROM lyrics l JOIN songs s ON s.id = l.song_id WHERE s.uuid = ? ORDER BY " +
                "CASE WHEN l.lang = ? THEN 0 WHEN l.lang = 'cs' THEN 1 ELSE 2 END, l.id ASC LIMIT 1";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, uuid.trim());
            ps.setString(2, lang);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : null;
            }
        }
    }

    /** Resolve lyric by language-specific SEO slug. */
    public Integer findLyricIdBySeoSlug(String slug, String lang) throws SQLException {
        if (slug == null || slug.isBlank() || lang == null || lang.isBlank()) return null;
        String sql = "SELECT l.id FROM lyrics l WHERE l.seo_slug = ? AND l.lang = ? LIMIT 1";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, slug.trim().toLowerCase());
            ps.setString(2, lang);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        // Legacy: Czech slug still on songs.seo_slug
        if ("cs".equals(lang)) {
            String legacy = "SELECT l.id FROM lyrics l JOIN songs s ON s.id = l.song_id " +
                    "WHERE s.seo_slug = ? AND l.lang = 'cs' LIMIT 1";
            try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(legacy)) {
                ps.setString(1, slug.trim().toLowerCase());
                try (ResultSet rs = ps.executeQuery()) {
                    return rs.next() ? rs.getInt(1) : null;
                }
            }
        }
        return null;
    }

    public List<com.github.skeliit.model.SongLocale> listLocales(int songId) throws SQLException {
        String sql = "SELECT id, song_id, lang, words, seo_slug, meta_description, timed_lyrics " +
                "FROM lyrics WHERE song_id=? ORDER BY FIELD(lang,'cs','en','de','uk'), lang";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, songId);
            try (ResultSet rs = ps.executeQuery()) {
                List<com.github.skeliit.model.SongLocale> out = new ArrayList<>();
                while (rs.next()) out.add(mapLocale(rs));
                return out;
            }
        }
    }

    public com.github.skeliit.model.SongLocale findLocale(int songId, String lang) throws SQLException {
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement(
                     "SELECT id, song_id, lang, words, seo_slug, meta_description, timed_lyrics " +
                             "FROM lyrics WHERE song_id=? AND lang=? LIMIT 1")) {
            ps.setInt(1, songId);
            ps.setString(2, lang);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapLocale(rs) : null;
            }
        }
    }

    public boolean isSeoSlugTaken(String slug, String lang, int exceptLyricId) throws SQLException {
        if (slug == null || slug.isBlank()) return false;
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement(
                     "SELECT 1 FROM lyrics WHERE seo_slug=? AND lang=? AND id<>? LIMIT 1")) {
            ps.setString(1, slug.trim().toLowerCase());
            ps.setString(2, lang);
            ps.setInt(3, exceptLyricId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    /** Insert or update lyric text + SEO fields for a song language. Returns lyric id. */
    public int upsertLocale(int songId, String lang, String words, String seoSlug, String metaDescription)
            throws SQLException {
        try (Connection c = Db.get()) {
            Integer existingId = null;
            try (PreparedStatement sel = c.prepareStatement("SELECT id FROM lyrics WHERE song_id=? AND lang=?")) {
                sel.setInt(1, songId);
                sel.setString(2, lang);
                try (ResultSet rs = sel.executeQuery()) {
                    if (rs.next()) existingId = rs.getInt(1);
                }
            }
            if (existingId != null) {
                try (PreparedStatement upd = c.prepareStatement(
                        "UPDATE lyrics SET words=?, seo_slug=?, meta_description=? WHERE id=?")) {
                    upd.setString(1, words);
                    upd.setString(2, blankToNull(seoSlug));
                    upd.setString(3, blankToNull(metaDescription));
                    upd.setInt(4, existingId);
                    upd.executeUpdate();
                }
                return existingId;
            }
            try (PreparedStatement ins = c.prepareStatement(
                    "INSERT INTO lyrics (song_id, lang, words, seo_slug, meta_description, score) VALUES (?,?,?,?,?,0)",
                    Statement.RETURN_GENERATED_KEYS)) {
                ins.setInt(1, songId);
                ins.setString(2, lang);
                ins.setString(3, words);
                ins.setString(4, blankToNull(seoSlug));
                ins.setString(5, blankToNull(metaDescription));
                ins.executeUpdate();
                try (ResultSet keys = ins.getGeneratedKeys()) {
                    if (keys.next()) return keys.getInt(1);
                }
            }
            return 0;
        }
    }

    /** All public language variants for hreflang / sitemap for one song. */
    public List<com.github.skeliit.model.SongLocale> listLocalesWithWords(int songId) throws SQLException {
        List<com.github.skeliit.model.SongLocale> all = listLocales(songId);
        all.removeIf(l -> l.words == null || l.words.isBlank());
        return all;
    }

    private static com.github.skeliit.model.SongLocale mapLocale(ResultSet rs) throws SQLException {
        com.github.skeliit.model.SongLocale loc = new com.github.skeliit.model.SongLocale();
        loc.id = rs.getInt("id");
        loc.songId = rs.getInt("song_id");
        loc.lang = rs.getString("lang");
        loc.words = rs.getString("words");
        try { loc.seoSlug = rs.getString("seo_slug"); } catch (SQLException ignore) {}
        try { loc.metaDescription = rs.getString("meta_description"); } catch (SQLException ignore) {}
        try { loc.timedLyrics = rs.getString("timed_lyrics"); } catch (SQLException ignore) {}
        return loc;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private LyricView mapLyricView(ResultSet rs, Connection c, int lyricId) throws SQLException {
        LyricView v = new LyricView();
        v.id = rs.getInt("id");
        v.songId = rs.getInt("song_id");
        v.songName = rs.getString("song_name");
        try { v.translatedTitle = rs.getString("lyric_title"); } catch (SQLException ignore) {}
        int y = rs.getInt("song_year"); v.year = rs.wasNull()? null : y;
        v.words = rs.getString("words");
        v.youtubeId = rs.getString("yt");
        v.appleMusicId = rs.getString("apple_music_id");
        v.previewImageUrl = rs.getString("preview_image_url");
        try { v.songUuid = rs.getString("song_uuid"); } catch (SQLException ignore) {}
        try { v.songSeoSlug = rs.getString("song_seo_slug"); } catch (SQLException ignore) {}
        try { v.metaDescription = rs.getString("meta_description"); } catch (SQLException ignore) {}
        try { v.lang = rs.getString("lyric_lang"); } catch (SQLException ignore) {
            try { v.lang = rs.getString("lang"); } catch (SQLException ignore2) {}
        }
        if (v.lang == null || v.lang.isBlank()) v.lang = "cs";

        // No guessing by title: a wrong guess used to be saved for good (the JML clip
        // ended up on "Machine gun Skeli RMX"). Clips are linked in the admin instead.

        // views: counted by the page script once per visitor and day (VisitStats), not on every load
        try (PreparedStatement sel = c.prepareStatement("SELECT views FROM lyric_views WHERE lyric_id=?")) {
            sel.setInt(1, v.id);
            try (ResultSet rv = sel.executeQuery()) { if (rv.next()) v.views = rv.getLong(1); }
        }
        // votes
        try (PreparedStatement vv = c.prepareStatement("SELECT SUM(vote=1) AS up, SUM(vote=-1) AS down FROM lyrics_votes WHERE lyric_id=?")) {
            vv.setInt(1, v.id);
            try (ResultSet rv = vv.executeQuery()) { if (rv.next()) { v.votesUp = rv.getInt("up"); v.votesDown = rv.getInt("down"); } }
        }
        return v;
    }

    /** Top-level comments newest first, each with its replies oldest first. */
    public List<CommentView> listComments(int lyricId) throws SQLException {
        String sql = "SELECT c.id, c.user_id, c.parent_id, c.content, c.created_at, c.updated_at, CASE WHEN u.role = 'DELETED' THEN NULL ELSE u.username END AS username, CASE WHEN u.role = 'DELETED' THEN NULL ELSE u.avatar_url END AS avatar_url FROM comments c JOIN users u ON u.id=c.user_id WHERE c.lyric_id=? ORDER BY c.created_at DESC, c.id DESC";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, lyricId);
            try (ResultSet rs = ps.executeQuery()) {
                List<CommentView> out = new ArrayList<>();
                while (rs.next()) {
                    CommentView cv = new CommentView();
                    cv.id = rs.getInt("id");
                    cv.userId = rs.getInt("user_id");
                    int parent = rs.getInt("parent_id");
                    cv.parentId = rs.wasNull() ? null : parent;
                    cv.username = rs.getString("username");
                    cv.avatarUrl = rs.getString("avatar_url");
                    cv.createdAt = rs.getTimestamp("created_at");
                    cv.updatedAt = rs.getTimestamp("updated_at");
                    cv.content = rs.getString("content");
                    out.add(cv);
                }
                return threads(out);
            }
        }
    }

    /** Nests replies under their top-level comment; input is newest first. */
    static List<CommentView> threads(List<CommentView> newestFirst) {
        java.util.Map<Integer, CommentView> top = new java.util.LinkedHashMap<>();
        for (CommentView c : newestFirst) if (c.parentId == null) top.put(c.id, c);
        List<CommentView> reversed = new ArrayList<>(newestFirst);
        java.util.Collections.reverse(reversed);
        for (CommentView c : reversed) {
            if (c.parentId == null) continue;
            CommentView parent = top.get(c.parentId);
            if (parent != null) parent.replies.add(c); // oldest reply first
        }
        return new ArrayList<>(top.values());
    }

    public record LyricExportRow(int songId, String songName, Integer year, String lang, String words, String timedLyrics) {}

    public List<LyricExportRow> listForExport() throws SQLException {
        String sql = "SELECT s.id AS song_id, s.name AS song_name, s.year AS song_year, " +
                "l.lang, l.words, l.timed_lyrics " +
                "FROM lyrics l JOIN songs s ON s.id = l.song_id " +
                "ORDER BY s.name ASC, l.lang ASC";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            List<LyricExportRow> out = new ArrayList<>();
            while (rs.next()) {
                int y = rs.getInt("song_year");
                out.add(new LyricExportRow(
                        rs.getInt("song_id"),
                        rs.getString("song_name"),
                        rs.wasNull() ? null : y,
                        rs.getString("lang"),
                        rs.getString("words"),
                        rs.getString("timed_lyrics")
                ));
            }
            return out;
        }
    }

    /** Plain lyrics of a song in one language, or null. */
    public String getWords(int songId, String lang) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT words FROM lyrics WHERE song_id=? AND lang=? ORDER BY id LIMIT 1")) {
            ps.setInt(1, songId);
            ps.setString(2, lang);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    /**
     * Saves the plain lyrics of a song in one language (admin editor). Keeps any
     * timed lyrics from Apple Music. Empty text removes that language.
     */
    public void saveWords(int songId, String lang, String words) throws SQLException {
        try (Connection c = Db.get()) {
            if (words == null || words.isBlank()) {
                try (PreparedStatement del = c.prepareStatement("DELETE FROM lyrics WHERE song_id=? AND lang=?")) {
                    del.setInt(1, songId);
                    del.setString(2, lang);
                    del.executeUpdate();
                }
                return;
            }
            try (PreparedStatement upd = c.prepareStatement("UPDATE lyrics SET words=? WHERE song_id=? AND lang=?")) {
                upd.setString(1, words);
                upd.setInt(2, songId);
                upd.setString(3, lang);
                if (upd.executeUpdate() > 0) return;
            }
            try (PreparedStatement ins = c.prepareStatement(
                    "INSERT INTO lyrics (song_id, lang, words, score) VALUES (?, ?, ?, 0)")) {
                ins.setInt(1, songId);
                ins.setString(2, lang);
                ins.setString(3, words);
                ins.executeUpdate();
            }
        }
    }

    public void upsertAppleMusicLyrics(int songId, String plainText, String timedTtml, String lang) throws SQLException {
        try (Connection c = Db.get()) {
            try (PreparedStatement sel = c.prepareStatement("SELECT id FROM lyrics WHERE song_id=? AND lang=?")) {
                sel.setInt(1, songId);
                sel.setString(2, lang);
                try (ResultSet rs = sel.executeQuery()) {
                    if (rs.next()) {
                        int id = rs.getInt(1);
                        try (PreparedStatement upd = c.prepareStatement("UPDATE lyrics SET words=?, timed_lyrics=? WHERE id=?")) {
                            upd.setString(1, plainText);
                            upd.setString(2, timedTtml);
                            upd.setInt(3, id);
                            upd.executeUpdate();
                        }
                    } else {
                        try (PreparedStatement ins = c.prepareStatement("INSERT INTO lyrics (song_id, lang, words, timed_lyrics, score) VALUES (?,?,?,?,0)")) {
                            ins.setInt(1, songId);
                            ins.setString(2, lang);
                            ins.setString(3, plainText);
                            ins.setString(4, timedTtml);
                            ins.executeUpdate();
                        }
                    }
                }
            }
        }
    }
}
