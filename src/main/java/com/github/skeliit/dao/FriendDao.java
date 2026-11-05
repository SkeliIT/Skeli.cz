package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.WebUtils;
import com.github.skeliit.model.Friend;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/** Přátelé a blokování. Každá metoda bere „já“ ze session, nikdy z formuláře, takže nejde sahat na cizí vztahy. */
public class FriendDao {
    /** Jak jsem na tom s druhým člověkem. */
    public enum Rel { NONE, SENT, RECEIVED, FRIENDS, I_BLOCKED, BLOCKS_ME }

    private static final String PERSON = "u.id, u.username, u.avatar_url, u.profile_public";

    public Rel relation(int me, int other) throws SQLException {
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement("SELECT blocker_id FROM user_blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)")) {
                ps.setInt(1, me); ps.setInt(2, other); ps.setInt(3, other); ps.setInt(4, me);
                try (ResultSet rs = ps.executeQuery()) {
                    Rel out = null;
                    while (rs.next()) { if (rs.getInt(1) == me) return Rel.I_BLOCKED; out = Rel.BLOCKS_ME; }
                    if (out != null) return out;
                }
            }
            try (PreparedStatement ps = c.prepareStatement("SELECT status, requested_by FROM friendships WHERE user_a = ? AND user_b = ?")) {
                ps.setInt(1, Math.min(me, other)); ps.setInt(2, Math.max(me, other));
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) return Rel.NONE;
                    if ("accepted".equals(rs.getString(1))) return Rel.FRIENDS;
                    return rs.getInt(2) == me ? Rel.SENT : Rel.RECEIVED;
                }
            }
        }
    }

    /** Pošle žádost. Vrací false, když druhý žádosti vypnul. Soukromý profil žádosti nebrání. Vztah a blokování hlídá volající podle relation(). */
    public boolean request(int me, int other) throws SQLException {
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement("SELECT friend_requests FROM users WHERE id = ?")) {
                ps.setInt(1, other);
                try (ResultSet rs = ps.executeQuery()) { if (!rs.next() || !rs.getBoolean(1)) return false; }
            }
            try (PreparedStatement ps = c.prepareStatement("INSERT IGNORE INTO friendships (user_a, user_b, requested_by) VALUES (?, ?, ?)")) {
                ps.setInt(1, Math.min(me, other)); ps.setInt(2, Math.max(me, other)); ps.setInt(3, me);
                ps.executeUpdate();
            }
        }
        return true;
    }

    /** Přijme žádost, kterou poslal ten druhý; cizí ani vlastní žádost přijmout nejde. */
    public boolean accept(int me, int other) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE friendships SET status = 'accepted', accepted_at = NOW() WHERE user_a = ? AND user_b = ? AND status = 'pending' AND requested_by = ?")) {
            ps.setInt(1, Math.min(me, other)); ps.setInt(2, Math.max(me, other)); ps.setInt(3, other);
            return ps.executeUpdate() > 0;
        }
    }

    /** Zruší vztah s tím druhým: odebrání přítele, odmítnutí i zrušení mé žádosti. */
    public void remove(int me, int other) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("DELETE FROM friendships WHERE user_a = ? AND user_b = ?")) {
            ps.setInt(1, Math.min(me, other)); ps.setInt(2, Math.max(me, other));
            ps.executeUpdate();
        }
    }

    /**
     * Tiché zablokování: druhý se nic nedozví. Jeho čekající žádost zůstane, aby ji dál viděl jako nevyřízenou;
     * mně se už neukazuje (incoming ji přeskočí). Přátelství a moje vlastní žádost se zruší.
     */
    public void block(int me, int other) throws SQLException {
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement(
                    "DELETE FROM friendships WHERE user_a = ? AND user_b = ? AND NOT (status = 'pending' AND requested_by = ?)")) {
                ps.setInt(1, Math.min(me, other)); ps.setInt(2, Math.max(me, other)); ps.setInt(3, other);
                ps.executeUpdate();
            }
            try (PreparedStatement ps = c.prepareStatement("INSERT IGNORE INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)")) {
                ps.setInt(1, me); ps.setInt(2, other);
                ps.executeUpdate();
            }
        }
    }

    /** Odblokování: žádost z doby blokování se smaže, aby mi po odblokování najednou nevyskočila. Může poslat novou. */
    public void unblock(int me, int other) throws SQLException {
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement("DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?")) {
                ps.setInt(1, me); ps.setInt(2, other);
                ps.executeUpdate();
            }
            try (PreparedStatement ps = c.prepareStatement(
                    "DELETE FROM friendships WHERE user_a = ? AND user_b = ? AND status = 'pending' AND requested_by = ?")) {
                ps.setInt(1, Math.min(me, other)); ps.setInt(2, Math.max(me, other)); ps.setInt(3, other);
                ps.executeUpdate();
            }
        }
    }

    public List<Friend> friends(int me) throws SQLException {
        return list("SELECT " + PERSON + " FROM friendships f JOIN users u ON u.id = IF(f.user_a = ?, f.user_b, f.user_a) "
                + "WHERE (f.user_a = ? OR f.user_b = ?) AND f.status = 'accepted' AND u.role <> 'DELETED' AND u.blocked_at IS NULL ORDER BY u.username", me, me, me);
    }

    /** Žádosti, které čekají na mě. Od lidí, které jsem zablokoval, se neukazují. */
    public List<Friend> incoming(int me) throws SQLException {
        return list("SELECT " + PERSON + " FROM friendships f JOIN users u ON u.id = f.requested_by "
                + "WHERE (f.user_a = ? OR f.user_b = ?) AND f.status = 'pending' AND f.requested_by <> ? AND u.role <> 'DELETED' AND u.blocked_at IS NULL "
                + "AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE b.blocker_id = ? AND b.blocked_id = u.id) ORDER BY f.created_at DESC", me, me, me, me);
    }

    /** Moje žádosti, na které se čeká. Kdo mě zablokoval, tu zůstává jako nevyřízený, jen bez odkazu na profil (ten by vedl na 404 a prozradil to). */
    public List<Friend> outgoing(int me) throws SQLException {
        return list("SELECT u.id, u.username, u.avatar_url, u.profile_public AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE b.blocker_id = u.id AND b.blocked_id = ?) "
                + "FROM friendships f JOIN users u ON u.id = IF(f.user_a = ?, f.user_b, f.user_a) "
                + "WHERE (f.user_a = ? OR f.user_b = ?) AND f.status = 'pending' AND f.requested_by = ? AND u.role <> 'DELETED' ORDER BY f.created_at DESC", me, me, me, me, me);
    }

    public List<Friend> blocked(int me) throws SQLException {
        return list("SELECT " + PERSON + " FROM user_blocks b JOIN users u ON u.id = b.blocked_id WHERE b.blocker_id = ? AND u.role <> 'DELETED' ORDER BY u.username", me);
    }

    /**
     * Hledání: veřejné profily podle začátku jména, soukromé jen podle celého jména (kdo ho zná, může poslat žádost,
     * ale nejde jimi listovat). Kdo mě zablokoval nebo koho jsem zablokoval, se nenajde.
     * Hledá jen jméno, nikdy e-mail, ať se přes hledání nedají zjišťovat cizí adresy.
     */
    public List<Friend> search(int me, String q) throws SQLException {
        String like = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
        List<Friend> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT " + PERSON + " FROM users u WHERE (u.username = ? OR (u.username LIKE ? AND u.profile_public = 1)) AND u.id <> ? AND u.role <> 'DELETED' AND u.blocked_at IS NULL "
                + "AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE (b.blocker_id = ? AND b.blocked_id = u.id) OR (b.blocker_id = u.id AND b.blocked_id = ?)) "
                + "ORDER BY u.username LIMIT 8")) {
            ps.setString(1, q); ps.setString(2, like); ps.setInt(3, me); ps.setInt(4, me); ps.setInt(5, me);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) out.add(person(rs)); }
        }
        return out;
    }

    private static List<Friend> list(String sql, int... args) throws SQLException {
        List<Friend> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            for (int i = 0; i < args.length; i++) ps.setInt(i + 1, args[i]);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) out.add(person(rs)); }
        }
        return out;
    }

    private static Friend person(ResultSet rs) throws SQLException {
        return new Friend(rs.getInt(1), rs.getString(2), WebUtils.safeUrl(rs.getString(3), "/img/avatar-default.svg"), rs.getBoolean(4));
    }
}
