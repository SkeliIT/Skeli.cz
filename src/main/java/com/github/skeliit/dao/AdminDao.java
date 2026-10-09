package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.AdminUser;
import com.github.skeliit.model.CommentReport;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Data for the admin pages: dashboard numbers, users, reported comments. */
public class AdminDao {

    /** songs, clips, lyrics, comments, users, subscribers, reports, clipsWithoutSong, songsWithoutLyrics */
    public Map<String, Integer> stats() throws SQLException {
        String sql = "SELECT "
                + "(SELECT COUNT(*) FROM songs) AS songs, "
                + "(SELECT COUNT(*) FROM videos) AS clips, "
                + "(SELECT COUNT(DISTINCT song_id) FROM lyrics) AS lyrics, "
                + "(SELECT COUNT(*) FROM comments) + (SELECT COUNT(*) FROM video_comments) AS comments, "
                + "(SELECT COUNT(*) FROM users WHERE role <> 'DELETED') AS users, "
                + "(SELECT COUNT(*) FROM newsletter_emails WHERE confirmed_at IS NOT NULL) AS subscribers, "
                + "(SELECT COUNT(*) FROM (SELECT DISTINCT kind, comment_id FROM comment_reports) r) AS reports, "
                + "(SELECT COUNT(*) FROM videos WHERE song_id IS NULL) AS clipsWithoutSong, "
                + "(SELECT COUNT(*) FROM songs s WHERE NOT EXISTS (SELECT 1 FROM lyrics l WHERE l.song_id = s.id)) AS songsWithoutLyrics";
        Map<String, Integer> out = new LinkedHashMap<>();
        try (Connection conn = Db.get(); PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                for (int i = 1; i <= rs.getMetaData().getColumnCount(); i++) {
                    out.put(rs.getMetaData().getColumnLabel(i), rs.getInt(i));
                }
            }
        }
        return out;
    }

    /** Reported comments that still exist, the most reported first (at most 50). */
    public List<CommentReport> reportedComments() throws SQLException {
        String sql = "SELECT r.kind, r.comment_id, COUNT(*) AS n, MAX(r.created_at) AS last_at, "
                + "       MAX(c.content) AS lyric_content, MAX(vc.content) AS video_content, "
                + "       MAX(uc.username) AS lyric_author, MAX(uv.username) AS video_author, "
                + "       MAX(c.lyric_id) AS lyric_id "
                + "FROM comment_reports r "
                + "LEFT JOIN comments c ON r.kind = 'lyric' AND c.id = r.comment_id "
                + "LEFT JOIN users uc ON uc.id = c.user_id "
                + "LEFT JOIN video_comments vc ON r.kind = 'video' AND vc.id = r.comment_id "
                + "LEFT JOIN users uv ON uv.id = vc.user_id "
                + "GROUP BY r.kind, r.comment_id "
                + "HAVING lyric_content IS NOT NULL OR video_content IS NOT NULL "
                + "ORDER BY n DESC, last_at DESC LIMIT 50";
        List<CommentReport> out = new ArrayList<>();
        try (Connection conn = Db.get(); PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                boolean lyric = "lyric".equals(rs.getString("kind"));
                out.add(new CommentReport(rs.getString("kind"), rs.getInt("comment_id"), rs.getInt("n"),
                        rs.getString(lyric ? "lyric_author" : "video_author"),
                        rs.getString(lyric ? "lyric_content" : "video_content"),
                        rs.getInt("lyric_id")));
            }
        }
        return out;
    }

    /** Every account, newest first (deleted ones too: the page hides them unless asked). */
    public List<AdminUser> users() throws SQLException {
        String sql = "SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC";
        List<AdminUser> out = new ArrayList<>();
        try (Connection conn = Db.get(); PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.add(new AdminUser(rs.getInt("id"), rs.getString("username"), rs.getString("email"),
                        rs.getString("role"), rs.getTimestamp("created_at")));
            }
        }
        return out;
    }
}
