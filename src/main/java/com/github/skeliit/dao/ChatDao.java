package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.WebUtils;
import com.github.skeliit.model.ChatConversation;
import com.github.skeliit.model.ChatMessage;
import com.github.skeliit.model.ChatPrefs;
import com.github.skeliit.model.ChatReport;
import com.github.skeliit.model.Friend;
import com.github.skeliit.service.SecretBox;
import com.github.skeliit.service.UrgentReports;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Soukromý chat mezi přáteli. „Já“ je vždy ze session a každý dotaz je omezený na mou dvojici, takže na cizí zprávy nejde sáhnout.
 * Admin zprávy nečte: vidí jen nahlášenou zprávu (kopie v chat_reports).
 * Text je v databázi zašifrovaný (service/SecretBox): sem šifruje send a edit, ven čtou messages, conversations a openReports.
 */
public class ChatDao {
    public static final int PAGE = 50;
    public static final int MAX_BODY = 1000;
    public static final Set<String> REASONS = Set.of("spam", "abuse", "other", "illegal", "child");
    public static final Set<String> REACTIONS = Set.of("❤️", "😂", "👍", "🔥", "😮", "😢");

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

    /** replyTo = zpráva, na kterou odpovídám; platí jen z téhle dvojice, jinak se tiše zahodí. */
    public long send(int me, int other, String body, long replyTo) throws SQLException {
        try (Connection c = Db.get()) {
            Long reply = null;
            if (replyTo > 0) {
                try (PreparedStatement ps = c.prepareStatement("SELECT id FROM chat_messages WHERE id = ? AND user_a = ? AND user_b = ?")) {
                    ps.setLong(1, replyTo);
                    ps.setInt(2, Math.min(me, other));
                    ps.setInt(3, Math.max(me, other));
                    try (ResultSet rs = ps.executeQuery()) { if (rs.next()) reply = rs.getLong(1); }
                }
            }
            try (PreparedStatement ps = c.prepareStatement(
                    "INSERT INTO chat_messages (user_a, user_b, sender_id, recipient_id, body, reply_to) VALUES (?, ?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS)) {
                ps.setInt(1, Math.min(me, other));
                ps.setInt(2, Math.max(me, other));
                ps.setInt(3, me);
                ps.setInt(4, other);
                ps.setString(5, SecretBox.seal(body));
                if (reply == null) ps.setNull(6, java.sql.Types.BIGINT); else ps.setLong(6, reply);
                ps.executeUpdate();
                try (ResultSet k = ps.getGeneratedKeys()) { return k.next() ? k.getLong(1) : 0; }
            }
        }
    }

    private static long hiddenUpTo(Connection c, int me, int other) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("SELECT up_to FROM chat_hidden WHERE user_id = ? AND other_id = ?")) {
            ps.setInt(1, me);
            ps.setInt(2, other);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getLong(1) : 0; }
        }
    }

    /** Zprávy mé dvojice od nejstarší: posledních limit, nebo starší před before. */
    public List<ChatMessage> messages(int me, int other, long before, int limit) throws SQLException {
        List<ChatMessage> out = new ArrayList<>();
        try (Connection c = Db.get()) {
            long from = hiddenUpTo(c, me, other);
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT m.id, m.sender_id, m.body, m.created_at, m.deleted_at, m.edited_at, m.reply_to, r.body, r.sender_id, r.deleted_at "
                    + "FROM chat_messages m LEFT JOIN chat_messages r ON r.id = m.reply_to WHERE m.user_a = ? AND m.user_b = ? AND m.id > ?"
                    + (before > 0 ? " AND m.id < ?" : "") + " ORDER BY m.id DESC LIMIT " + limit)) {
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
                        m.body = m.deleted ? "" : SecretBox.open(rs.getString(3));
                        m.at = rs.getTimestamp(4).getTime();
                        m.edited = rs.getTimestamp(6) != null;
                        long reply = rs.getLong(7);
                        if (!rs.wasNull() && !m.deleted) {
                            m.replyTo = reply;
                            String quoted = rs.getTimestamp(10) != null || rs.getString(8) == null ? "" : SecretBox.open(rs.getString(8));
                            m.replyBody = quoted.length() > 80 ? quoted.substring(0, 80) + "…" : quoted;
                            m.replyMine = rs.getInt(9) == me;
                        }
                        var embed = com.github.skeliit.service.MusicLinks.firstIn(m.body);
                        if (embed != null) { m.embedKind = embed.kind(); m.embedId = embed.id(); }
                        out.add(m);
                    }
                }
            }
            if (!out.isEmpty()) readReactions(c, out, me);
        }
        Collections.reverse(out);
        return out;
    }

    private static void readReactions(Connection c, List<ChatMessage> messages, int me) throws SQLException {
        Map<Long, ChatMessage> byId = new HashMap<>();
        StringBuilder marks = new StringBuilder();
        for (ChatMessage m : messages) {
            byId.put(m.id, m);
            marks.append(marks.length() == 0 ? "?" : ",?");
        }
        try (PreparedStatement ps = c.prepareStatement("SELECT message_id, emoji, COUNT(*), MAX(user_id = ?) FROM chat_reactions WHERE message_id IN (" + marks + ") GROUP BY message_id, emoji")) {
            int i = 1;
            ps.setInt(i++, me);
            for (ChatMessage m : messages) ps.setLong(i++, m.id);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ChatMessage m = byId.get(rs.getLong(1));
                    if (m == null || m.deleted) continue;
                    ChatMessage.Reaction r = new ChatMessage.Reaction();
                    r.e = rs.getString(2);
                    r.n = rs.getInt(3);
                    r.mine = rs.getBoolean(4);
                    m.reactions.add(r);
                }
            }
        }
    }

    /** Úprava vlastní zprávy do 15 minut od odeslání. */
    public boolean edit(int me, long id, String body) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE chat_messages SET body = ?, edited_at = NOW() WHERE id = ? AND sender_id = ? AND deleted_at IS NULL AND created_at > NOW() - INTERVAL 15 MINUTE")) {
            ps.setString(1, SecretBox.seal(body));
            ps.setLong(2, id);
            ps.setInt(3, me);
            return ps.executeUpdate() > 0;
        }
    }

    /** S kým je zpráva, jestli jsem v ní já; null = není moje konverzace. */
    public Integer otherIn(int me, long id) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT IF(user_a = ?, user_b, user_a) FROM chat_messages WHERE id = ? AND (user_a = ? OR user_b = ?) AND deleted_at IS NULL")) {
            ps.setInt(1, me);
            ps.setLong(2, id);
            ps.setInt(3, me);
            ps.setInt(4, me);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getInt(1) : null; }
        }
    }

    /** Stejná reakce znovu ji zruší, jiná ji vymění. */
    public void react(int me, long id, String emoji) throws SQLException {
        try (Connection c = Db.get()) {
            String current = null;
            try (PreparedStatement ps = c.prepareStatement("SELECT emoji FROM chat_reactions WHERE message_id = ? AND user_id = ?")) {
                ps.setLong(1, id);
                ps.setInt(2, me);
                try (ResultSet rs = ps.executeQuery()) { if (rs.next()) current = rs.getString(1); }
            }
            if (emoji.equals(current)) {
                try (PreparedStatement ps = c.prepareStatement("DELETE FROM chat_reactions WHERE message_id = ? AND user_id = ?")) {
                    ps.setLong(1, id);
                    ps.setInt(2, me);
                    ps.executeUpdate();
                }
            } else {
                try (PreparedStatement ps = c.prepareStatement(
                        "INSERT INTO chat_reactions (message_id, user_id, emoji) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE emoji = VALUES(emoji)")) {
                    ps.setLong(1, id);
                    ps.setInt(2, me);
                    ps.setString(3, emoji);
                    ps.executeUpdate();
                }
            }
        }
    }

    /** Moje poslední zpráva, kterou ten druhý viděl. 0 = nic, nebo má jeden z nás „Viděno“ vypnuté. */
    public long seenId(int me, int other) throws SQLException {
        if (!prefs(me).receipts || !prefs(other).receipts) return 0;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT COALESCE(MAX(id), 0) FROM chat_messages WHERE sender_id = ? AND recipient_id = ? AND read_at IS NOT NULL")) {
            ps.setInt(1, me);
            ps.setInt(2, other);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getLong(1) : 0; }
        }
    }

    public boolean isMuted(int user, int other) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT 1 FROM chat_muted WHERE user_id = ? AND other_id = ?")) {
            ps.setInt(1, user);
            ps.setInt(2, other);
            try (ResultSet rs = ps.executeQuery()) { return rs.next(); }
        }
    }

    public void setMuted(int me, int other, boolean muted) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(muted
                ? "INSERT IGNORE INTO chat_muted (user_id, other_id) VALUES (?, ?)" : "DELETE FROM chat_muted WHERE user_id = ? AND other_id = ?")) {
            ps.setInt(1, me);
            ps.setInt(2, other);
            ps.executeUpdate();
        }
    }

    /** Všechny nepřečtené zprávy (do menu a do názvu záložky). Od zablokovaných se nepočítají. */
    public int unreadTotal(int me) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT COUNT(*) FROM chat_messages m WHERE m.recipient_id = ? AND m.read_at IS NULL AND m.deleted_at IS NULL "
                + "AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE b.blocker_id = ? AND b.blocked_id = m.sender_id)")) {
            ps.setInt(1, me);
            ps.setInt(2, me);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getInt(1) : 0; }
        }
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

    /**
     * Smazat konverzaci u mě: tomu druhému zůstává, nová zpráva ji zase ukáže.
     * Co už mají smazané oba, zmizí i z databáze (kopie u otevřeného nahlášení zůstává, jinak by šlo důkaz smazat).
     */
    public void hide(int me, int other) throws SQLException {
        int a = Math.min(me, other), b = Math.max(me, other);
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement(
                    "INSERT INTO chat_hidden (user_id, other_id, up_to) "
                    + "SELECT ?, ?, MAX(id) FROM chat_messages WHERE user_a = ? AND user_b = ? HAVING MAX(id) IS NOT NULL "
                    + "ON DUPLICATE KEY UPDATE up_to = VALUES(up_to)")) {
                ps.setInt(1, me);
                ps.setInt(2, other);
                ps.setInt(3, a);
                ps.setInt(4, b);
                ps.executeUpdate();
            }
            try (PreparedStatement ps = c.prepareStatement(
                    "DELETE m FROM chat_messages m "
                    + "JOIN chat_hidden x ON x.user_id = m.user_a AND x.other_id = m.user_b "
                    + "JOIN chat_hidden y ON y.user_id = m.user_b AND y.other_id = m.user_a "
                    + "WHERE m.user_a = ? AND m.user_b = ? AND m.id <= x.up_to AND m.id <= y.up_to")) {
                ps.setInt(1, a);
                ps.setInt(2, b);
                ps.executeUpdate();
            }
        }
    }

    /** Dosud nezašifrované zprávy a kopie u nahlášení zašifruje; bez klíče nedělá nic. Vrací počet. */
    public int sealOldMessages() throws SQLException {
        if (!SecretBox.enabled()) return 0;
        return sealColumn("chat_messages", "body", "id") + sealColumn("chat_reports", "body_copy", "id");
    }

    private static int sealColumn(String table, String column, String key) throws SQLException {
        int total = 0;
        try (Connection c = Db.get()) {
            while (true) {
                Map<Long, String> batch = new HashMap<>();
                try (PreparedStatement ps = c.prepareStatement("SELECT " + key + ", " + column + " FROM " + table + " WHERE " + column + " <> '' AND " + column + " NOT LIKE 'gcm1:%' LIMIT 500");
                     ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) batch.put(rs.getLong(1), rs.getString(2));
                }
                if (batch.isEmpty()) return total;
                try (PreparedStatement ps = c.prepareStatement("UPDATE " + table + " SET " + column + " = ? WHERE " + key + " = ?")) {
                    for (Map.Entry<Long, String> e : batch.entrySet()) {
                        ps.setString(1, SecretBox.seal(e.getValue()));
                        ps.setLong(2, e.getKey());
                        ps.addBatch();
                    }
                    ps.executeBatch();
                }
                total += batch.size();
            }
        }
    }

    /** Zprávy starší než rok a vyřízená nahlášení starší než rok. Otevřené nahlášení zůstává, dokud ho admin nevyřídí. */
    public int deleteExpired() throws SQLException {
        try (Connection c = Db.get(); Statement st = c.createStatement()) {
            int removed = st.executeUpdate("DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL 1 YEAR");
            st.executeUpdate("DELETE FROM chat_reports WHERE resolved_at IS NOT NULL AND resolved_at < NOW() - INTERVAL 1 YEAR");
            return removed;
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
            boolean added = ps.executeUpdate() > 0;
            if (added) UrgentReports.tellAdmin(reason, "chat-reports");
            return added;
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
                    v.lastBody = v.lastDeleted ? "" : SecretBox.open(rs.getString(4));
                    v.lastAt = rs.getTimestamp(5).getTime();
                    v.unread = rs.getInt(7);
                    out.add(v);
                    seen.add(v.username);
                }
            }
        }
        // stav vidí jen přátelé
        Map<String, Integer> friendIds = new HashMap<>();
        for (Friend f : new FriendDao().friends(me)) {
            friendIds.put(f.username, f.id);
            if (seen.contains(f.username)) continue;
            ChatConversation v = new ChatConversation();
            v.username = f.username;
            v.avatarUrl = f.avatarUrl;
            out.add(v);
        }
        for (ChatConversation v : out) {
            Integer id = friendIds.get(v.username);
            if (id != null) v.state = shownState(id);
        }
        return out;
    }

    /** Nepřečtené od lidí, které nemám ztlumené: jen pro rozhodnutí, jestli zazvonit. */
    public int unreadNotMuted(int me) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT COUNT(*) FROM chat_messages m WHERE m.recipient_id = ? AND m.read_at IS NULL AND m.deleted_at IS NULL "
                + "AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE b.blocker_id = ? AND b.blocked_id = m.sender_id) "
                + "AND NOT EXISTS (SELECT 1 FROM chat_muted x WHERE x.user_id = ? AND x.other_id = m.sender_id)")) {
            ps.setInt(1, me);
            ps.setInt(2, me);
            ps.setInt(3, me);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getInt(1) : 0; }
        }
    }

    // ---------- nastavení a stav ----------

    public ChatPrefs prefs(int userId) throws SQLException {
        ChatPrefs p = new ChatPrefs();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT status, theme, font, size, receipts, look_dark, look_light FROM user_chat_prefs WHERE user_id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    p.status = rs.getString(1);
                    p.theme = rs.getString(2);
                    p.font = rs.getString(3);
                    p.size = rs.getString(4);
                    p.receipts = rs.getBoolean(5);
                    p.lookDark = rs.getString(6);
                    p.lookLight = rs.getString(7);
                }
            }
        }
        return p;
    }

    /** Uloží jen povolené hodnoty; false = něco nesedí a nic se nezměnilo. */
    public boolean savePrefs(int userId, ChatPrefs p) throws SQLException {
        if (!ChatPrefs.STATUSES.contains(p.status) || !ChatPrefs.THEMES.contains(p.theme) || !ChatPrefs.FONTS.contains(p.font) || !ChatPrefs.SIZES.contains(p.size)
                || !ChatPrefs.validLook(p.lookDark, ChatPrefs.LOOKS_DARK) || !ChatPrefs.validLook(p.lookLight, ChatPrefs.LOOKS_LIGHT)) return false;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO user_chat_prefs (user_id, status, theme, font, size, receipts, look_dark, look_light) VALUES (?, ?, ?, ?, ?, ?, ?, ?) "
                + "ON DUPLICATE KEY UPDATE status = VALUES(status), theme = VALUES(theme), font = VALUES(font), size = VALUES(size), receipts = VALUES(receipts), look_dark = VALUES(look_dark), look_light = VALUES(look_light)")) {
            ps.setInt(1, userId);
            ps.setString(2, p.status);
            ps.setString(3, p.theme);
            ps.setString(4, p.font);
            ps.setString(5, p.size);
            ps.setBoolean(6, p.receipts);
            ps.setString(7, p.lookDark);
            ps.setString(8, p.lookLight);
            ps.executeUpdate();
        }
        return true;
    }

    /** Stav, jak ho vidí ostatní: online, idle (online, ale 5 minut se nepohnul), busy, dnd, nebo offline (není tu, nebo je neviditelný). */
    public String shownState(int userId) throws SQLException {
        if (!com.github.skeliit.service.OnlineUsers.isOnline(userId)) return "offline";
        String status = prefs(userId).status;
        if ("invisible".equals(status)) return "offline";
        return "online".equals(status) && com.github.skeliit.service.OnlineUsers.isIdle(userId) ? "idle" : status;
    }

    // ---------- moderace ----------

    public List<ChatReport> openReports() throws SQLException {
        List<ChatReport> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT r.id, s.username, p.username, r.reason, r.note, r.body_copy, r.created_at FROM chat_reports r "
                + "JOIN users s ON s.id = r.sender_id JOIN users p ON p.id = r.reporter_id WHERE r.resolved_at IS NULL ORDER BY r.reason IN ('illegal', 'child') DESC, r.created_at");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                ChatReport r = new ChatReport();
                r.id = rs.getInt(1);
                r.sender = rs.getString(2);
                r.reporter = rs.getString(3);
                r.reason = rs.getString(4);
                r.note = rs.getString(5);
                r.body = SecretBox.open(rs.getString(6));
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
