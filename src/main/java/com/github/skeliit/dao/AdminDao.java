package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.job.VideoTitles;
import com.github.skeliit.model.AdminComment;
import com.github.skeliit.model.AdminUser;
import com.github.skeliit.model.CommentReport;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Data for the admin pages: dashboard numbers, users, comments and the reported ones. */
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

    /**
     * Comment threads on lyrics and on clips together: each top-level comment with its replies under it
     * (oldest first), the thread with the newest activity first. Two queries merged here: the two tables
     * have different collations, so they are not joined in SQL. A reply whose comment is gone is shown alone.
     */
    public List<AdminComment> latestComments(int limit) throws SQLException {
        String lyricSql = "SELECT c.id, c.parent_id, c.content, c.created_at, c.updated_at, c.pinned_at, c.hearted_at, c.lyric_id, s.name, "
                + "CASE WHEN u.role = 'DELETED' THEN NULL ELSE u.username END AS author, "
                + "(SELECT COUNT(*) FROM comment_reports r WHERE r.kind = 'lyric' AND r.comment_id = c.id) AS reports "
                + "FROM comments c LEFT JOIN users u ON u.id = c.user_id "
                + "LEFT JOIN lyrics l ON l.id = c.lyric_id LEFT JOIN songs s ON s.id = l.song_id "
                + "ORDER BY c.created_at, c.id";
        String videoSql = "SELECT vc.id, vc.parent_id, vc.content, vc.created_at, vc.updated_at, vc.pinned_at, vc.hearted_at, vc.youtube_id, "
                // BINARY: videos and video_comments have different collations, IDs are plain ASCII
                + "(SELECT v.title FROM videos v WHERE BINARY v.youtube_id = BINARY vc.youtube_id LIMIT 1) AS title, "
                + "CASE WHEN u.role = 'DELETED' THEN NULL ELSE u.username END AS author, "
                + "(SELECT COUNT(*) FROM comment_reports r WHERE r.kind = 'video' AND r.comment_id = vc.id) AS reports "
                + "FROM video_comments vc LEFT JOIN users u ON u.id = vc.user_id "
                + "ORDER BY vc.created_at, vc.id";
        List<AdminComment> threads = new ArrayList<>();
        try (Connection conn = Db.get()) {
            for (String kind : new String[] { "lyric", "video" }) {
                boolean lyric = kind.equals("lyric");
                java.util.Map<Integer, AdminComment> top = new java.util.LinkedHashMap<>();
                List<AdminComment> orphans = new ArrayList<>();
                try (PreparedStatement ps = conn.prepareStatement(lyric ? lyricSql : videoSql);
                     ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        int p = rs.getInt("parent_id");
                        Integer parentId = rs.wasNull() ? null : p;
                        AdminComment c = new AdminComment(kind, rs.getInt("id"), parentId, rs.getString("author"),
                                rs.getString("content"), rs.getTimestamp("created_at"), rs.getTimestamp("updated_at") != null,
                                rs.getTimestamp("pinned_at") != null, rs.getTimestamp("hearted_at") != null,
                                lyric ? rs.getInt("lyric_id") : 0, lyric ? rs.getString("name") : null,
                                lyric ? null : rs.getString("youtube_id"),
                                lyric ? null : VideoTitles.display(rs.getString("title")), rs.getInt("reports"));
                        if (parentId == null) top.put(c.id, c);
                        else if (top.containsKey(parentId)) top.get(parentId).replies.add(c);
                        else orphans.add(c);
                    }
                }
                threads.addAll(top.values());
                threads.addAll(orphans);
            }
        }
        threads.sort(Comparator.comparing(AdminComment::lastActivity, Comparator.nullsLast(Comparator.reverseOrder())));
        return threads.size() > limit ? new ArrayList<>(threads.subList(0, limit)) : threads;
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
