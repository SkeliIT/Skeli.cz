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
        
        // First try to find lyric in requested language
        String sql = "SELECT s.name AS song_name, s.year AS song_year, s.apple_music_id, s.preview_image_url, l.words, l.song_id, l.id, l.lang, " +
                "(SELECT v.youtube_id FROM videos v WHERE v.song_id = l.song_id ORDER BY v.published_at DESC, v.id DESC LIMIT 1) AS yt " +
                "FROM lyrics l JOIN songs s ON s.id = l.song_id WHERE l.id = ? AND l.lang = ?";
        
        LyricView v = null;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, lyricId);
            ps.setString(2, lang);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    // Fallback to Czech version if translation not found
                    try (PreparedStatement ps2 = c.prepareStatement(
                            "SELECT s.name AS song_name, s.year AS song_year, s.apple_music_id, s.preview_image_url, l.words, l.song_id, l.id, l.lang, " +
                            "(SELECT v.youtube_id FROM videos v WHERE v.song_id = l.song_id ORDER BY v.published_at DESC, v.id DESC LIMIT 1) AS yt " +
                            "FROM lyrics l JOIN songs s ON s.id = l.song_id WHERE l.id = ? AND l.lang = 'cs'")) {
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
    
    private LyricView mapLyricView(ResultSet rs, Connection c, int lyricId) throws SQLException {
        LyricView v = new LyricView();
        v.id = rs.getInt("id");
        v.songId = rs.getInt("song_id");
        v.songName = rs.getString("song_name");
        int y = rs.getInt("song_year"); v.year = rs.wasNull()? null : y;
        v.words = rs.getString("words");
        v.youtubeId = rs.getString("yt");
        v.appleMusicId = rs.getString("apple_music_id");
        v.previewImageUrl = rs.getString("preview_image_url");
        
        // No guessing by title: a wrong guess used to be saved for good (the JML clip
        // ended up on "Machine gun Skeli RMX"). Clips are linked in the admin instead.
        // views
        try (PreparedStatement inc = c.prepareStatement("INSERT INTO lyric_views (lyric_id, views) VALUES (?,1) ON DUPLICATE KEY UPDATE views=views+1")) {
            inc.setInt(1, lyricId); inc.executeUpdate();
        }
        try (PreparedStatement sel = c.prepareStatement("SELECT views FROM lyric_views WHERE lyric_id=?")) {
            sel.setInt(1, lyricId);
            try (ResultSet rv = sel.executeQuery()) { if (rv.next()) v.views = rv.getLong(1); }
        }
        // votes
        try (PreparedStatement vv = c.prepareStatement("SELECT SUM(vote=1) AS up, SUM(vote=-1) AS down FROM lyrics_votes WHERE lyric_id=?")) {
            vv.setInt(1, lyricId);
            try (ResultSet rv = vv.executeQuery()) { if (rv.next()) { v.votesUp = rv.getInt("up"); v.votesDown = rv.getInt("down"); } }
        }
        return v;
    }

    /** Top-level comments newest first, each with its replies oldest first. */
    public List<CommentView> listComments(int lyricId) throws SQLException {
        String sql = "SELECT c.id, c.user_id, c.parent_id, c.content, c.created_at, c.updated_at, u.username, u.avatar_url FROM comments c JOIN users u ON u.id=c.user_id WHERE c.lyric_id=? ORDER BY c.created_at DESC, c.id DESC";
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
