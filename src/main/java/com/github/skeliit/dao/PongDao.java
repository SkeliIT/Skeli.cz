package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.PongBadges;
import com.github.skeliit.model.PongProfile;
import com.github.skeliit.model.PongRank;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/** CatSmash (pong_results, V98): wins of signed-in players; the leaderboard = each player's fastest win. */
public class PongDao {

    public void addWin(int userId, int difficulty, int durationMs, int kevinGoals) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO pong_results (user_id, difficulty, duration_ms, kevin_goals) VALUES (?, ?, ?, ?)")) {
            ps.setInt(1, userId);
            ps.setInt(2, difficulty);
            ps.setInt(3, durationMs);
            ps.setInt(4, kevinGoals);
            ps.executeUpdate();
        }
    }

    /** Top `limit` players on a difficulty (each once, by their fastest win; a tie goes to who did it first). */
    public List<PongRank> top(int difficulty, int limit, Integer meId) throws SQLException {
        List<PongRank> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT u.id, u.username, u.avatar_url, b.best, u.pong_title, "
                        + " (SELECT r2.kevin_goals FROM pong_results r2 WHERE r2.user_id = b.user_id AND r2.difficulty = ? AND r2.duration_ms = b.best ORDER BY r2.id LIMIT 1) "
                        + "FROM (SELECT user_id, MIN(duration_ms) AS best, MIN(created_at) AS first_at FROM pong_results WHERE difficulty = ? GROUP BY user_id) b "
                        + "JOIN users u ON u.id = b.user_id ORDER BY b.best, b.first_at LIMIT ?")) {
            ps.setInt(1, difficulty);
            ps.setInt(2, difficulty);
            ps.setInt(3, limit);
            try (ResultSet rs = ps.executeQuery()) {
                int place = 0;
                while (rs.next()) {
                    place++;
                    PongRank r = new PongRank(place, rs.getString(2), rs.getString(3), rs.getInt(4), rs.getInt(6), meId != null && meId == rs.getInt(1));
                    r.title = PongBadges.exists(rs.getString(5)) ? rs.getString(5) : null;
                    out.add(r);
                }
            }
        }
        return out;
    }

    /** The player's own best on a difficulty and their place (null when they have not beaten Kevin there yet). */
    public PongRank mine(int difficulty, int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT u.username, u.avatar_url, b.best, "
                        + " 1 + (SELECT COUNT(*) FROM (SELECT user_id, MIN(duration_ms) AS m FROM pong_results WHERE difficulty = ? GROUP BY user_id) o WHERE o.m < b.best) "
                        + "FROM (SELECT MIN(duration_ms) AS best FROM pong_results WHERE difficulty = ? AND user_id = ?) b "
                        + "JOIN users u ON u.id = ? WHERE b.best IS NOT NULL")) {
            ps.setInt(1, difficulty);
            ps.setInt(2, difficulty);
            ps.setInt(3, userId);
            ps.setInt(4, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                return new PongRank(rs.getInt(4), rs.getString(1), rs.getString(2), rs.getInt(3), 0, true);
            }
        }
    }

    /**
     * CatSmash na profilu: nejlepší časy, místa v tabulce a odznaky – vše ze serverem uložených výher.
     * Odznaky z výher počítá server (první výhra, každá obtížnost, 10:0, 10:9, pod 75 s, 10/50/100 výher),
     * odznaky ze zápasu hlásí prohlížeč (pong_badges), Šatník = odemčené všechny pálky a míčky.
     */
    public PongProfile profile(int userId) throws SQLException {
        PongProfile p = new PongProfile();
        // odznaky jen z výher na Normální a nejtěžší (na Lehké se nesbírají); celkový počet výher zůstává pro profil
        boolean clean = false, close = false, hardClean = false;
        int fastest = Integer.MAX_VALUE, hardFastest = Integer.MAX_VALUE, winsCounted = 0, winsHard = 0;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT difficulty, COUNT(*), MIN(duration_ms), MIN(kevin_goals), MAX(kevin_goals) "
                        + "FROM pong_results WHERE user_id = ? GROUP BY difficulty")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int d = rs.getInt(1);
                    if (d < 1 || d > 3) continue;
                    p.wins += rs.getInt(2);
                    p.bestMs[d - 1] = rs.getInt(3);
                    if (d < 2) continue;
                    winsCounted += rs.getInt(2);
                    fastest = Math.min(fastest, rs.getInt(3));
                    if (rs.getInt(4) == 0) clean = true;
                    if (rs.getInt(5) == 9) close = true;
                    if (d == 3) { winsHard = rs.getInt(2); hardFastest = rs.getInt(3); hardClean = rs.getInt(4) <= 3; }
                }
            }
        }
        Set<String> claimed = claimed(userId);
        p.title = title(userId);
        for (int d = 1; d <= 3; d++) {
            if (p.bestMs[d - 1] == null) continue;
            PongRank r = mine(d, userId);
            if (r != null) p.place[d - 1] = r.place;
        }
        p.badge("first", "fa-trophy", winsCounted > 0);
        p.badge("easy", "fa-mug-hot", winsCounted >= 3);
        p.badge("normal", "fa-scale-balanced", p.bestMs[1] != null);
        p.badge("angry", "fa-cat", p.bestMs[2] != null);
        p.badge("clean", "fa-shield-halved", clean);
        p.badge("close", "fa-heart-pulse", close);
        p.badge("fast", "fa-bolt", fastest < 75_000);
        p.badge("streak", "fa-medal", winsCounted >= 10);
        p.badge("wins50", "fa-medal", winsCounted >= 50);
        p.badge("wins100", "fa-medal", winsCounted >= 100);
        for (String k : PongBadges.ICONS.keySet()) {
            if (PongBadges.CLAIMABLE.contains(k) && !k.startsWith("h")) p.badge(k, PongBadges.icon(k), claimed.contains(k));
        }
        p.badge("hwins5", PongBadges.icon("hwins5"), winsHard >= 5);
        p.badge("hfast", PongBadges.icon("hfast"), hardFastest < 120_000);
        p.badge("hclean", PongBadges.icon("hclean"), winsHard > 0 && hardClean);
        for (String k : PongBadges.ICONS.keySet()) {
            if (PongBadges.CLAIMABLE.contains(k) && k.startsWith("h")) p.badge(k, PongBadges.icon(k), claimed.contains(k));
        }
        boolean all = true;
        for (String k : PongBadges.LOOKS) all &= p.has(k);
        p.badge("wardrobe", PongBadges.icon("wardrobe"), all);
        if (p.title != null && !p.has(p.title)) p.title = null;
        return p;
    }

    /** Klíče všech získaných odznaků (z výher i nahlášených) – pro hru a pro kontrolu titulu. */
    public Set<String> earned(int userId) throws SQLException {
        Set<String> out = new LinkedHashSet<>();
        for (PongProfile.Badge b : profile(userId).badges) if (b.earned) out.add(b.key);
        return out;
    }

    /** Odznaky ze zápasu, které nahlásil prohlížeč (jen ty z PongBadges.CLAIMABLE). */
    public Set<String> claimed(int userId) throws SQLException {
        Set<String> out = new HashSet<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT badge FROM pong_badges WHERE user_id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) out.add(rs.getString(1));
            }
        }
        return out;
    }

    /** Uloží nahlášené odznaky; neznámé a ty, které počítá server, přeskočí. Vrací počet nových. */
    public int claim(int userId, Collection<String> keys) throws SQLException {
        int added = 0;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT IGNORE INTO pong_badges (user_id, badge) VALUES (?, ?)")) {
            for (String k : keys) {
                if (!PongBadges.CLAIMABLE.contains(k)) continue;
                ps.setInt(1, userId);
                ps.setString(2, k);
                added += ps.executeUpdate();
            }
        }
        return added;
    }

    public String title(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT pong_title FROM users WHERE id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && PongBadges.exists(rs.getString(1)) ? rs.getString(1) : null;
            }
        }
    }

    /** Nastaví titul u jména; null = bez titulu. Volající ověří, že odznak hráč má. */
    public void setTitle(int userId, String key) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE users SET pong_title = ? WHERE id = ?")) {
            ps.setString(1, key);
            ps.setInt(2, userId);
            ps.executeUpdate();
        }
    }
}
