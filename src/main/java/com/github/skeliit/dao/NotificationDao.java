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

/**
 * Zvoneček v hlavičce: odpovědi na komentáře, srdíčka od Skeliho, přátelé, zprávy, CatSmash.
 * Blokování: od člověka, se kterým je blokování v kterémkoli směru, se nic nezapíše, a co přišlo dřív,
 * se tomu, kdo blokoval, už neukáže (BlockDao).
 */
public class NotificationDao {
    static final int SNIPPET = 90;

    /** Zapíše jedno upozornění; nic, když odpovídáš sám sobě nebo je mezi vámi blokování. */
    public void add(int userId, String type, CommentDao.Kind kind, int commentId, Integer actorId) throws SQLException {
        if (actorId != null && actorId == userId) return;
        if (actorId != null && new BlockDao().eitherWay(userId, actorId)) return;
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

    /** Vezme zpět upozornění na srdíčko, dokud není přečtené (Skeli si to rozmyslel). */
    public void removeUnreadHeart(CommentDao.Kind kind, int commentId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "DELETE FROM notifications WHERE type = 'heart' AND comment_kind = ? AND comment_id = ? AND read_at IS NULL")) {
            ps.setString(1, kind.code);
            ps.setInt(2, commentId);
            ps.executeUpdate();
        }
    }

    /** Přečtený chat: upozornění na zprávy od toho člověka zmizí ze zvonečku. */
    public void removeMessages(int userId, int actorId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = 'message'")) {
            ps.setInt(1, userId); ps.setInt(2, actorId);
            ps.executeUpdate();
        }
    }

    /** Odmítnutí nebo zablokování: upozornění na žádost od toho člověka zmizí ze zvonečku. */
    public void removeFriendRequest(int userId, int actorId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = 'friend_request'")) {
            ps.setInt(1, userId); ps.setInt(2, actorId);
            ps.executeUpdate();
        }
    }

    /** Přátelé: žádost nebo přijetí; starší nepřečtené stejného druhu od téhož člověka nahradí, ať se nehromadí. */
    public void addFriend(int userId, int actorId, String type) throws SQLException {
        try (Connection c = Db.get()) {
            if (BlockDao.eitherWay(c, userId, actorId)) return;
            try (PreparedStatement ps = c.prepareStatement("DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = ? AND read_at IS NULL")) {
                ps.setInt(1, userId); ps.setInt(2, actorId); ps.setString(3, type);
                ps.executeUpdate();
            }
            try (PreparedStatement ps = c.prepareStatement("INSERT INTO notifications (user_id, type, actor_id) VALUES (?, ?, ?)")) {
                ps.setInt(1, userId); ps.setString(2, type); ps.setInt(3, actorId);
                ps.executeUpdate();
            }
        }
    }

    public int unread(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT COUNT(*) FROM notifications n WHERE n.user_id = ? AND n.read_at IS NULL AND NOT " + BlockDao.blockedBy("n.actor_id"))) {
            ps.setInt(1, userId);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getInt(1) : 0; }
        }
    }

    /** Nejnovější upozornění; ta, jejichž komentář mezitím zmizel, se vynechají. */
    /**
     * CatSmash: hráč actorId předběhl hráče userId v tabulce (info = druh|obtížnost|délka|nové místo).
     * Bez opakování: když už má od stejného hráče nepřečtené upozornění na stejnou tabulku, nové se nepřidá.
     */
    public void addPassed(int userId, int actorId, String info) throws SQLException {
        if (userId == actorId) return;
        String board = info.substring(0, info.lastIndexOf('|') + 1);
        try (Connection c = Db.get()) {
            if (BlockDao.eitherWay(c, userId, actorId)) return;
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT 1 FROM notifications WHERE user_id = ? AND actor_id = ? AND type = 'passed' AND read_at IS NULL AND info LIKE ? LIMIT 1")) {
                ps.setInt(1, userId); ps.setInt(2, actorId); ps.setString(3, board + "%");
                try (ResultSet rs = ps.executeQuery()) { if (rs.next()) return; }
            }
            try (PreparedStatement ps = c.prepareStatement(
                    "INSERT INTO notifications (user_id, type, actor_id, info) VALUES (?, 'passed', ?, ?)")) {
                ps.setInt(1, userId); ps.setInt(2, actorId); ps.setString(3, info);
                ps.executeUpdate();
            }
        }
    }

    public List<Notification> latest(int userId, int limit) throws SQLException {
        List<Notification> out = new ArrayList<>();
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT n.id, n.type, n.comment_kind, n.comment_id, n.created_at, n.read_at, n.info, "
                            + "CASE WHEN u.role = 'DELETED' THEN NULL ELSE u.username END, "
                            + "CASE WHEN u.role = 'DELETED' THEN NULL ELSE u.avatar_url END, u.pong_public "
                            + "FROM notifications n LEFT JOIN users u ON u.id = n.actor_id "
                            + "WHERE n.user_id = ? AND NOT " + BlockDao.blockedBy("n.actor_id") + " ORDER BY n.created_at DESC, n.id DESC LIMIT ?")) {
                ps.setInt(1, userId);
                ps.setInt(2, userId);
                ps.setInt(3, limit);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        Notification n = new Notification();
                        n.id = rs.getInt(1);
                        n.type = rs.getString(2);
                        n.created = rs.getTimestamp(5).getTime();
                        n.read = rs.getTimestamp(6) != null;
                        n.actor = rs.getString(8);
                        n.actorAvatar = WebUtils.safeUrl(rs.getString(9), "");
                        if ("message".equals(n.type)) {              // chat: jen kdo napsal, text zprávy do zvonečku nepatří
                            if (n.actor == null) continue;
                            n.place = "message"; n.placeName = ""; n.snippet = "";
                            n.link = "/zpravy?s=" + java.net.URLEncoder.encode(n.actor, java.nio.charset.StandardCharsets.UTF_8);
                            out.add(n);
                        } else if (n.type.startsWith("friend_")) {   // přátelé: vede na část Přátelé na mém profilu
                            n.place = "friend"; n.placeName = ""; n.snippet = ""; n.link = "/uzivatel.jsp#pratele";
                            out.add(n);
                        } else if ("passed".equals(n.type)) {                // CatSmash: tabulka a nové místo, odkaz otevře hru
                            n.place = "pong"; n.placeName = rs.getString(7); n.snippet = ""; n.link = "/?kevin=pong";
                            if (!rs.getBoolean(10)) { n.actor = null; n.actorAvatar = ""; n.anon = true; }   // jméno v tabulkách nechce ukazovat
                            out.add(n);
                        } else if (where(c, n, rs.getString(3), rs.getInt(4))) out.add(n);
                    }
                }
            }
        }
        return out;
    }

    /** Doplní text komentáře a místo, kde je; false, když komentář už neexistuje. */
    private static boolean where(Connection c, Notification n, String kind, int commentId) throws SQLException {
        boolean lyric = "lyric".equals(kind);
        String sql = lyric
                ? "SELECT cm.content, cm.lyric_id, s.name FROM comments cm JOIN lyrics l ON l.id = cm.lyric_id "
                        + "JOIN songs s ON s.id = l.song_id WHERE cm.id = ?"
                // BINARY: videos a video_comments mají různé řazení znaků (collation), ID jsou obyčejné ASCII
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
