package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.WebUtils;
import com.github.skeliit.job.VideoTitles;
import com.github.skeliit.model.Notification;
import com.github.skeliit.model.SongTitle;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/** The bell in the header: replies to your comments and hearts from Skeli. */
public class NotificationDao {
    static final int SNIPPET = 90;

    /** Remembers one notification; nothing when you answer yourself. */
    public void add(int userId, String type, CommentDao.Kind kind, int commentId, Integer actorId) throws SQLException {
        if (actorId != null && actorId == userId) return;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO notifications (user_id, type, comment_kind, comment_id, actor_id) VALUES (?, ?, ?, ?, ?)")) {
            ps.setInt(1, userId);
            ps.setString(2, type);
            ps.setString(3, kind.code);
            ps.setInt(4, commentId);
            if (actorId == null) ps.setNull(5, java.sql.Types.INTEGER); else ps.setInt(5, actorId);
            ps.executeUpdate();
        }
    }

    /** Takes back a heart's notification while it is still unread (Skeli changed his mind). */
    public void removeUnreadHeart(CommentDao.Kind kind, int commentId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "DELETE FROM notifications WHERE type = 'heart' AND comment_kind = ? AND comment_id = ? AND read_at IS NULL")) {
            ps.setString(1, kind.code);
            ps.setInt(2, commentId);
            ps.executeUpdate();
        }
    }

    public int unread(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read_at IS NULL")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getInt(1) : 0; }
        }
    }

    /** The newest ones; those whose comment was deleted in the meantime are left out. */
    public List<Notification> latest(int userId, int limit) throws SQLException {
        List<Notification> out = new ArrayList<>();
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT n.id, n.type, n.comment_kind, n.comment_id, n.created_at, n.read_at, "
                            + "CASE WHEN u.role = 'DELETED' THEN NULL ELSE u.username END, "
                            + "CASE WHEN u.role = 'DELETED' THEN NULL ELSE u.avatar_url END "
                            + "FROM notifications n LEFT JOIN users u ON u.id = n.actor_id "
                            + "WHERE n.user_id = ? ORDER BY n.created_at DESC, n.id DESC LIMIT ?")) {
                ps.setInt(1, userId);
                ps.setInt(2, limit);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        Notification n = new Notification();
                        n.id = rs.getInt(1);
                        n.type = rs.getString(2);
                        n.created = rs.getTimestamp(5).getTime();
                        n.read = rs.getTimestamp(6) != null;
                        n.actor = rs.getString(7);
                        n.actorAvatar = WebUtils.safeUrl(rs.getString(8), "");
                        if (where(c, n, rs.getString(3), rs.getInt(4))) out.add(n);
                    }
                }
            }
        }
        return out;
    }

    /** Fills in the comment's text and place; false when the comment is gone. */
    private static boolean where(Connection c, Notification n, String kind, int commentId) throws SQLException {
        boolean lyric = "lyric".equals(kind);
        String sql = lyric
                ? "SELECT cm.content, cm.lyric_id, s.name FROM comments cm JOIN lyrics l ON l.id = cm.lyric_id "
                        + "JOIN songs s ON s.id = l.song_id WHERE cm.id = ?"
                // BINARY: videos and video_comments have different collations, IDs are plain ASCII
                : "SELECT vc.content, vc.youtube_id, (SELECT v.title FROM videos v WHERE BINARY v.youtube_id = BINARY vc.youtube_id LIMIT 1) "
                        + "FROM video_comments vc WHERE vc.id = ?";
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, commentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return false;
                String text = rs.getString(1);
                n.snippet = text.length() > SNIPPET ? text.substring(0, SNIPPET - 1).strip() + "…" : text;
                n.place = lyric ? "song" : "clip";
                n.placeName = lyric ? SongTitle.of(rs.getString(3)).title : VideoTitles.display(rs.getString(3));
                n.link = (lyric ? "/lyrics/" + rs.getInt(2) : "/music.jsp?clip=" + rs.getString(2)) + "#comment-" + commentId;
                return true;
            }
        }
    }

    public void markAllRead(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL")) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        }
    }
}
