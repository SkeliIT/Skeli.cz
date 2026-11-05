package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.WebUtils;
import com.github.skeliit.model.ChatConversation;
import com.github.skeliit.model.ChatMessage;
import com.github.skeliit.model.ChatReport;
import com.github.skeliit.model.Friend;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Soukromý chat mezi přáteli. „Já“ je vždy ze session a každý dotaz je omezený na mou dvojici, takže na cizí zprávy nejde sáhnout.
 * Admin zprávy nečte: vidí jen nahlášenou zprávu (kopie v chat_reports).
 */
public class ChatDao {
    public static final int PAGE = 50;
    public static final int MAX_BODY = 1000;
    public static final Set<String> REASONS = Set.of("spam", "abuse", "other");

    /** Účet podle jména; smazaný ani adminem zablokovaný se nepočítá. */
    public Integer userId(String name) throws SQLException {
        if (name == null || name.isBlank() || name.length() > 60) return null;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT id FROM users WHERE username = ? AND role <> 'DELETED' AND blocked_at IS NULL")) {
            ps.setString(1, name);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getInt(1) : null; }
        }
    }

    /** Psát smí jen přátelé a jen tomu, kdo zprávy nevypnul. Blokování přátelství ruší, takže je tu zahrnuté (a nic neprozradí). */
    public boolean canSend(int me, int other) throws SQLException {
        if (new FriendDao().relation(me, other) != FriendDao.Rel.FRIENDS) return false;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT chat_open FROM users WHERE id = ?")) {
            ps.setInt(1, other);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() && rs.getBoolean(1); }
        }
    }

    public long send(int me, int other, String body) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO chat_messages (user_a, user_b, sender_id, recipient_id, body) VALUES (?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, Math.min(me, other));
            ps.setInt(2, Math.max(me, other));
            ps.setInt(3, me);
            ps.setInt(4, other);
            ps.setString(5, body);
            ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) { return k.next() ? k.getLong(1) : 0; }
        }
    }

    private static long hiddenUpTo(Connection c, int me, int other) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("SELECT up_to FROM chat_hidden WHERE user_id = ? AND other_id = ?")) {
            ps.setInt(1, me);
            ps.setInt(2, other);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getLong(1) : 0; }
        }
    }

    /** Zprávy mé dvojice od nejstarší: nové po after, nebo starší před before, nejvýš PAGE. */
    public List<ChatMessage> messages(int me, int other, long after, long before) throws SQLException {
        List<ChatMessage> out = new ArrayList<>();
        try (Connection c = Db.get()) {
            long from = Math.max(after, hiddenUpTo(c, me, other));
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT id, sender_id, body, created_at, deleted_at FROM chat_messages WHERE user_a = ? AND user_b = ? AND id > ?"
                    + (before > 0 ? " AND id < ?" : "") + " ORDER BY id DESC LIMIT " + PAGE)) {
                ps.setInt(1, Math.min(me, other));
                ps.setInt(2, Math.max(me, other));
                ps.setLong(3, from);
                if (before > 0) ps.setLong(4, before);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        ChatMessage m = new ChatMessage();
                        m.id = rs.getLong(1);
                        m.mine = rs.getInt(2) == me;
                        m.deleted = rs.getTimestamp(5) != null;
                        m.body = m.deleted ? "" : rs.getString(3);
                        m.at = rs.getTimestamp(4).getTime();
                        var embed = com.github.skeliit.service.MusicLinks.firstIn(m.body);
                        if (embed != null) { m.embedKind = embed.kind(); m.embedId = embed.id(); }
                        out.add(m);
                    }
                }
            }
        }
        Collections.reverse(out);
        return out;
    }

    /** Zprávy smazané v posledních minutách: otevřený chat je podle toho schová i tomu druhému. */
    public List<Long> recentlyDeleted(int me, int other) throws SQLException {
        List<Long> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT id FROM chat_messages WHERE user_a = ? AND user_b = ? AND deleted_at > NOW() - INTERVAL 10 MINUTE")) {
            ps.setInt(1, Math.min(me, other));
            ps.setInt(2, Math.max(me, other));
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) out.add(rs.getLong(1)); }
        }
        return out;
    }

    public void markRead(int me, int other) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE chat_messages SET read_at = NOW() WHERE recipient_id = ? AND sender_id = ? AND read_at IS NULL")) {
            ps.setInt(1, me);
            ps.setInt(2, other);
            ps.executeUpdate();
        }
    }

    /** Smazat jde jen vlastní zprávu; zmizí oběma a text se nikde nenechává. */
    public boolean deleteOwn(int me, long id) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE chat_messages SET body = '', deleted_at = NOW() WHERE id = ? AND sender_id = ? AND deleted_at IS NULL")) {
            ps.setLong(1, id);
            ps.setInt(2, me);
            return ps.executeUpdate() > 0;
        }
    }

    /** Smazat konverzaci u mě: tomu druhému zůstává, nová zpráva ji zase ukáže. */
    public void hide(int me, int other) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO chat_hidden (user_id, other_id, up_to) "
                + "SELECT ?, ?, MAX(id) FROM chat_messages WHERE user_a = ? AND user_b = ? HAVING MAX(id) IS NOT NULL "
                + "ON DUPLICATE KEY UPDATE up_to = VALUES(up_to)")) {
            ps.setInt(1, me);
            ps.setInt(2, other);
            ps.setInt(3, Math.min(me, other));
            ps.setInt(4, Math.max(me, other));
            ps.executeUpdate();
        }
    }

    /** Nahlásit může jen ten, komu zpráva přišla. Ukládá se kopie, odesílatel by ji jinak mohl smazat. */
    public boolean report(int me, long id, String reason, String note) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT IGNORE INTO chat_reports (message_id, reporter_id, sender_id, reason, note, body_copy) "
                + "SELECT id, ?, sender_id, ?, ?, body FROM chat_messages WHERE id = ? AND recipient_id = ? AND deleted_at IS NULL")) {
            ps.setInt(1, me);
            ps.setString(2, reason);
            ps.setString(3, note == null || note.isBlank() ? null : note.strip());
            ps.setLong(4, id);
            ps.setInt(5, me);
            return ps.executeUpdate() > 0;
        }
    }

    /** Seznam konverzací: s kým jsem si psal, nejnovější nahoře, pak přátelé, se kterými ještě ne. Koho jsem zablokoval, ten tu není. */
    public List<ChatConversation> conversations(int me) throws SQLException {
        List<ChatConversation> out = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        String sql = "SELECT u.username, u.avatar_url, m.sender_id, m.body, m.created_at, m.deleted_at, "
                + "(SELECT COUNT(*) FROM chat_messages r WHERE r.recipient_id = ? AND r.sender_id = x.other AND r.read_at IS NULL AND r.deleted_at IS NULL AND r.id > COALESCE(h.up_to, 0)) "
                + "FROM (SELECT IF(user_a = ?, user_b, user_a) AS other, MAX(id) AS last_id FROM chat_messages WHERE user_a = ? OR user_b = ? GROUP BY other) x "
                + "JOIN chat_messages m ON m.id = x.last_id JOIN users u ON u.id = x.other "
                + "LEFT JOIN chat_hidden h ON h.user_id = ? AND h.other_id = x.other "
                + "WHERE x.last_id > COALESCE(h.up_to, 0) AND u.role <> 'DELETED' AND u.blocked_at IS NULL "
                + "AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE b.blocker_id = ? AND b.blocked_id = x.other) "
                + "ORDER BY x.last_id DESC LIMIT 50";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            for (int i = 1; i <= 6; i++) ps.setInt(i, me);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ChatConversation v = new ChatConversation();
                    v.username = rs.getString(1);
                    v.avatarUrl = WebUtils.safeUrl(rs.getString(2), "/img/avatar-default.svg");
                    v.lastMine = rs.getInt(3) == me;
                    v.lastDeleted = rs.getTimestamp(6) != null;
                    v.lastBody = v.lastDeleted ? "" : rs.getString(4);
                    v.lastAt = rs.getTimestamp(5).getTime();
                    v.unread = rs.getInt(7);
                    out.add(v);
                    seen.add(v.username);
                }
            }
        }
        for (Friend f : new FriendDao().friends(me)) {
            if (seen.contains(f.username)) continue;
            ChatConversation v = new ChatConversation();
            v.username = f.username;
            v.avatarUrl = f.avatarUrl;
            out.add(v);
        }
        return out;
    }

    // ---------- moderace ----------

    public List<ChatReport> openReports() throws SQLException {
        List<ChatReport> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT r.id, s.username, p.username, r.reason, r.note, r.body_copy, r.created_at FROM chat_reports r "
                + "JOIN users s ON s.id = r.sender_id JOIN users p ON p.id = r.reporter_id WHERE r.resolved_at IS NULL ORDER BY r.created_at");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                ChatReport r = new ChatReport();
                r.id = rs.getInt(1);
                r.sender = rs.getString(2);
                r.reporter = rs.getString(3);
                r.reason = rs.getString(4);
                r.note = rs.getString(5);
                r.body = rs.getString(6);
                r.createdAt = rs.getTimestamp(7);
                out.add(r);
            }
        }
        return out;
    }

    public int openReportCount() throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT COUNT(*) FROM chat_reports WHERE resolved_at IS NULL");
             ResultSet rs = ps.executeQuery()) {
            return rs.next() ? rs.getInt(1) : 0;
        }
    }

    /** Vyřízeno; deleteMessage = zpráva zmizí i z chatu. */
    public void resolveReport(int reportId, boolean deleteMessage) throws SQLException {
        try (Connection c = Db.get()) {
            if (deleteMessage) {
                try (PreparedStatement ps = c.prepareStatement(
                        "UPDATE chat_messages m JOIN chat_reports r ON r.message_id = m.id SET m.body = '', m.deleted_at = NOW() WHERE r.id = ?")) {
                    ps.setInt(1, reportId);
                    ps.executeUpdate();
                }
            }
            try (PreparedStatement ps = c.prepareStatement("UPDATE chat_reports SET resolved_at = NOW() WHERE id = ?")) {
                ps.setInt(1, reportId);
                ps.executeUpdate();
            }
        }
    }
}
