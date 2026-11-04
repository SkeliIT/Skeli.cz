package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.PongBadges;
import com.github.skeliit.model.PongProfile;
import com.github.skeliit.model.PongRank;
import com.github.skeliit.model.PongScore;
import com.github.skeliit.model.PongScoreRank;
import com.github.skeliit.service.PongChampions;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/** CatSmash (pong_results, V98): wins of signed-in players; the leaderboard = each player's fastest win. */
public class PongDao {

    public void addWin(int userId, int difficulty, int durationMs, int kevinGoals, int matchLen) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO pong_results (user_id, difficulty, duration_ms, kevin_goals, match_len) VALUES (?, ?, ?, ?, ?)")) {
            ps.setInt(1, userId);
            ps.setInt(2, difficulty);
            ps.setInt(3, durationMs);
            ps.setInt(4, kevinGoals);
            ps.setInt(5, matchLen);
            ps.executeUpdate();
        }
    }

    /** Skóre zápasu (výhra i prohra), pro tabulky podle délky zápasu. */
    public void addScore(int userId, PongScore p, int score) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO pong_scores (user_id, match_len, difficulty, score, you, kevin, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?)")) {
            ps.setInt(1, userId); ps.setInt(2, p.len); ps.setInt(3, p.difficulty); ps.setInt(4, score);
            ps.setInt(5, p.you); ps.setInt(6, p.kevin); ps.setInt(7, p.ms);
            ps.executeUpdate();
        }
        PongChampions.invalidate();                      // pořadí šampionů se mohlo změnit
    }

    /** Tabulka podle délky zápasu: každý hráč jednou se svým nejlepším skóre (při shodě kdo dřív). */
    /** Tabulka skóre na délce zápasu a obtížnosti (každý hráč jednou se svým nejlepším; Lehká soupeří jen s Lehkou). */
    public List<PongScoreRank> topScores(int len, int difficulty, int limit, Integer meId) throws SQLException {
        return topScores(len, difficulty, limit, meId, null);
    }

    /** Sezóna: od kdy se počítá (začátek měsíce), null = věčná tabulka. */
    static Timestamp since(java.time.LocalDateTime from) {
        return Timestamp.valueOf(from == null ? java.time.LocalDateTime.of(1970, 1, 2, 0, 0) : from);
    }

    public List<PongScoreRank> topScores(int len, int difficulty, int limit, Integer meId, java.time.LocalDateTime from) throws SQLException {
        List<PongScoreRank> out = new ArrayList<>();
        Timestamp t = since(from);
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT u.id, u.username, u.avatar_url, u.pong_frame, s.score, s.difficulty, s.you, s.kevin, u.pong_mark, u.pong_champ, u.profile_public "
                        + "FROM pong_scores s JOIN users u ON u.id = s.user_id "
                        + "WHERE s.match_len = ? AND s.difficulty = ? AND s.created_at >= ? AND s.id = (SELECT s2.id FROM pong_scores s2 WHERE s2.user_id = s.user_id "
                        + "  AND s2.match_len = ? AND s2.difficulty = ? AND s2.created_at >= ? ORDER BY s2.score DESC, s2.id LIMIT 1) "
                        + "ORDER BY s.score DESC, s.id LIMIT ?")) {
            ps.setInt(1, len); ps.setInt(2, difficulty); ps.setTimestamp(3, t); ps.setInt(4, len); ps.setInt(5, difficulty); ps.setTimestamp(6, t); ps.setInt(7, limit);
            try (ResultSet rs = ps.executeQuery()) {
                int place = 0;
                while (rs.next()) {
                    PongScoreRank r = new PongScoreRank();
                    r.place = ++place; r.username = rs.getString(2); r.avatarUrl = rs.getString(3);
                    r.frame = PongChampions.frame(rs.getInt(1), rs.getString(4), rs.getBoolean(10));
                    r.pub = rs.getBoolean(11);
                    r.mark = PongBadges.isMark(rs.getString(9)) ? rs.getString(9) : null;
                    r.score = rs.getInt(5); r.difficulty = rs.getInt(6); r.you = rs.getInt(7); r.kevin = rs.getInt(8);
                    r.me = meId != null && meId == rs.getInt(1);
                    out.add(r);
                }
            }
        }
        return out;
    }

    /**
     * Šampioni na úvodní stránce: nejvyšší skóre každého hráče od from (null = navždy) napříč všemi tabulkami
     * (delší zápas a těžší obtížnost dávají víc bodů, takže je to férové), seřazené od nejlepšího. Smazané účty ne.
     */
    public List<PongScoreRank> champions(int limit, java.time.LocalDateTime from) throws SQLException {
        List<PongScoreRank> out = new ArrayList<>();
        Timestamp t = since(from);
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT u.username, u.avatar_url, u.pong_frame, u.pong_mark, s.score, s.difficulty, s.match_len, u.id, u.pong_champ, u.profile_public "
                        + "FROM pong_scores s JOIN users u ON u.id = s.user_id "
                        + "WHERE s.created_at >= ? AND u.role <> 'DELETED' AND s.id = (SELECT s2.id FROM pong_scores s2 "
                        + "  WHERE s2.user_id = s.user_id AND s2.created_at >= ? ORDER BY s2.score DESC, s2.id LIMIT 1) "
                        + "ORDER BY s.score DESC, s.id LIMIT ?")) {
            ps.setTimestamp(1, t); ps.setTimestamp(2, t); ps.setInt(3, limit);
            try (ResultSet rs = ps.executeQuery()) {
                int place = 0;
                while (rs.next()) {
                    PongScoreRank r = new PongScoreRank();
                    r.place = ++place; r.username = rs.getString(1); r.avatarUrl = rs.getString(2);
                    r.frame = PongChampions.frame(rs.getInt(8), rs.getString(3), rs.getBoolean(9));
                    r.pub = rs.getBoolean(10);
                    r.mark = PongBadges.isMark(rs.getString(4)) ? rs.getString(4) : null;
                    r.score = rs.getInt(5); r.difficulty = rs.getInt(6); r.len = rs.getInt(7);
                    out.add(r);
                }
            }
        }
        return out;
    }

    /** Id šampionů ve stejném pořadí jako champions() – pro rámeček šampiona (service/PongChampions). */
    public List<Integer> championIds(int limit, java.time.LocalDateTime from) throws SQLException {
        List<Integer> out = new ArrayList<>();
        Timestamp t = since(from);
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT s.user_id FROM pong_scores s JOIN users u ON u.id = s.user_id "
                        + "WHERE s.created_at >= ? AND u.role <> 'DELETED' AND s.id = (SELECT s2.id FROM pong_scores s2 "
                        + "  WHERE s2.user_id = s.user_id AND s2.created_at >= ? ORDER BY s2.score DESC, s2.id LIMIT 1) "
                        + "ORDER BY s.score DESC, s.id LIMIT ?")) {
            ps.setTimestamp(1, t); ps.setTimestamp(2, t); ps.setInt(3, limit);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) out.add(rs.getInt(1)); }
        }
        return out;
    }

    /** Pořadí hráčů (id) v tabulce Skóre – top 10, věčná (pro upozornění „předběhl tě“). */
    public List<Integer> scoreOrder(int len, int difficulty) throws SQLException {
        return ids("SELECT s.user_id FROM pong_scores s WHERE s.match_len = ? AND s.difficulty = ? AND s.id = (SELECT s2.id FROM pong_scores s2 "
                + "WHERE s2.user_id = s.user_id AND s2.match_len = ? AND s2.difficulty = ? ORDER BY s2.score DESC, s2.id LIMIT 1) "
                + "ORDER BY s.score DESC, s.id LIMIT 10", len, difficulty, len, difficulty);
    }

    /** Pořadí hráčů (id) v tabulce Čas – top 10, věčná. */
    public List<Integer> timeOrder(int difficulty, int len) throws SQLException {
        return ids("SELECT user_id FROM pong_results WHERE difficulty = ? AND match_len = ? GROUP BY user_id "
                + "ORDER BY MIN(duration_ms), MIN(created_at) LIMIT 10", difficulty, len);
    }

    private static List<Integer> ids(String sql, int... args) throws SQLException {
        List<Integer> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            for (int i = 0; i < args.length; i++) ps.setInt(i + 1, args[i]);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) out.add(rs.getInt(1)); }
        }
        return out;
    }

    /** Kdo klesl kvůli hráči me: {id, nové místo (11 = vypadl z top 10)} pro každého, kdo byl před zápisem výš. */
    public static List<int[]> passed(List<Integer> before, List<Integer> after, int me) {
        List<int[]> out = new ArrayList<>();
        for (int i = 0; i < before.size(); i++) {
            int u = before.get(i);
            if (u == me) continue;
            int ia = after.indexOf(u);
            if (ia == -1 || ia > i) out.add(new int[] { u, ia == -1 ? 11 : ia + 1 });
        }
        return out;
    }

    /** Hráčovo nejlepší skóre v dané délce zápasu a obtížnosti a místo v tabulce (null = tam ještě nevyhrál). */
    public PongScoreRank myScore(int len, int difficulty, int userId) throws SQLException {
        return myScore(len, difficulty, userId, null);
    }

    public PongScoreRank myScore(int len, int difficulty, int userId, java.time.LocalDateTime from) throws SQLException {
        Timestamp t = since(from);
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT b.best, 1 + (SELECT COUNT(*) FROM (SELECT user_id, MAX(score) AS m FROM pong_scores WHERE match_len = ? AND difficulty = ? AND created_at >= ? GROUP BY user_id) o WHERE o.m > b.best) "
                        + "FROM (SELECT MAX(score) AS best FROM pong_scores WHERE match_len = ? AND difficulty = ? AND created_at >= ? AND user_id = ?) b WHERE b.best IS NOT NULL")) {
            ps.setInt(1, len); ps.setInt(2, difficulty); ps.setTimestamp(3, t); ps.setInt(4, len); ps.setInt(5, difficulty); ps.setTimestamp(6, t); ps.setInt(7, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                PongScoreRank r = new PongScoreRank();
                r.score = rs.getInt(1); r.place = rs.getInt(2); r.me = true;
                return r;
            }
        }
    }

    /** Tabulka času: nejrychlejší výhry na obtížnosti a délce zápasu (každý hráč jednou; při shodě vede, kdo to dal dřív). */
    public List<PongRank> top(int difficulty, int matchLen, int limit, Integer meId) throws SQLException {
        return top(difficulty, matchLen, limit, meId, null);
    }

    public List<PongRank> top(int difficulty, int matchLen, int limit, Integer meId, java.time.LocalDateTime from) throws SQLException {
        List<PongRank> out = new ArrayList<>();
        Timestamp t = since(from);
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT u.id, u.username, u.avatar_url, b.best, u.pong_title, u.pong_frame, u.pong_mark, u.pong_champ, u.profile_public, "
                        + " (SELECT r2.kevin_goals FROM pong_results r2 WHERE r2.user_id = b.user_id AND r2.difficulty = ? AND r2.match_len = ? AND r2.created_at >= ? AND r2.duration_ms = b.best ORDER BY r2.id LIMIT 1) "
                        + "FROM (SELECT user_id, MIN(duration_ms) AS best, MIN(created_at) AS first_at FROM pong_results WHERE difficulty = ? AND match_len = ? AND created_at >= ? GROUP BY user_id) b "
                        + "JOIN users u ON u.id = b.user_id ORDER BY b.best, b.first_at LIMIT ?")) {
            ps.setInt(1, difficulty);
            ps.setInt(2, matchLen);
            ps.setTimestamp(3, t);
            ps.setInt(4, difficulty);
            ps.setInt(5, matchLen);
            ps.setTimestamp(6, t);
            ps.setInt(7, limit);
            try (ResultSet rs = ps.executeQuery()) {
                int place = 0;
                while (rs.next()) {
                    place++;
                    PongRank r = new PongRank(place, rs.getString(2), rs.getString(3), rs.getInt(4), rs.getInt(10), meId != null && meId == rs.getInt(1));
                    r.title = PongBadges.TITLES_ON && PongBadges.exists(rs.getString(5)) ? rs.getString(5) : null;
                    r.frame = PongChampions.frame(rs.getInt(1), rs.getString(6), rs.getBoolean(8));
                    r.pub = rs.getBoolean(9);
                    r.mark = PongBadges.isMark(rs.getString(7)) ? rs.getString(7) : null;
                    out.add(r);
                }
            }
        }
        return out;
    }

    /** Můj nejlepší čas na obtížnosti a délce zápasu a moje místo (null, dokud jsem tam Kevina neporazil). */
    public PongRank mine(int difficulty, int matchLen, int userId) throws SQLException {
        return mine(difficulty, matchLen, userId, null);
    }

    public PongRank mine(int difficulty, int matchLen, int userId, java.time.LocalDateTime from) throws SQLException {
        Timestamp t = since(from);
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT u.username, u.avatar_url, b.best, "
                        + " 1 + (SELECT COUNT(*) FROM (SELECT user_id, MIN(duration_ms) AS m FROM pong_results WHERE difficulty = ? AND match_len = ? AND created_at >= ? GROUP BY user_id) o WHERE o.m < b.best) "
                        + "FROM (SELECT MIN(duration_ms) AS best FROM pong_results WHERE difficulty = ? AND match_len = ? AND created_at >= ? AND user_id = ?) b "
                        + "JOIN users u ON u.id = ? WHERE b.best IS NOT NULL")) {
            ps.setInt(1, difficulty);
            ps.setInt(2, matchLen);
            ps.setTimestamp(3, t);
            ps.setInt(4, difficulty);
            ps.setInt(5, matchLen);
            ps.setTimestamp(6, t);
            ps.setInt(7, userId);
            ps.setInt(8, userId);
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
    /** Od kdy se počítají výhry do odznaků (odznaky všem vynulované při přeskládání odměn). */
    public static final String BADGES_FROM = "2026-11-03 00:00:00";

    public PongProfile profile(int userId) throws SQLException {
        PongProfile p = new PongProfile();
        // odznaky jen z výher na Normální a nejtěžší (na Lehké se nesbírají); celkový počet výher zůstává pro profil
        boolean clean = false, close = false, hardClean = false;
        int fastest = Integer.MAX_VALUE, hardFastest = Integer.MAX_VALUE, winsCounted = 0, winsHard = 0;
        // odznaky se počítají jen z výher od BADGES_FROM (2. 11. 2026 se odznaky všem vynulovaly); výhry a nejlepší časy navždy
        Timestamp from = Timestamp.valueOf(BADGES_FROM);
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT difficulty, COUNT(*), MIN(CASE WHEN match_len = 10 THEN duration_ms END), SUM(match_len = 10), "
                        + "SUM(created_at >= ?), MIN(CASE WHEN match_len = 10 AND created_at >= ? THEN duration_ms END), "
                        + "MIN(CASE WHEN match_len = 10 AND created_at >= ? THEN kevin_goals END), MAX(CASE WHEN match_len = 10 AND created_at >= ? THEN kevin_goals END), "
                        + "SUM(match_len = 10 AND created_at >= ?) "
                        + "FROM pong_results WHERE user_id = ? GROUP BY difficulty")) {
            for (int i = 1; i <= 5; i++) ps.setTimestamp(i, from);
            ps.setInt(6, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int d = rs.getInt(1);
                    if (d < 1 || d > 3) continue;
                    p.wins += rs.getInt(2);
                    if (rs.getInt(4) > 0) p.bestMs[d - 1] = rs.getInt(3);   // časy jen ze zápasů do 10 (delší zápasy mají skóre)
                    if (d < 2) continue;
                    winsCounted += rs.getInt(5);
                    if (d == 3) winsHard = rs.getInt(5);
                    if (rs.getInt(9) == 0) continue;
                    fastest = Math.min(fastest, rs.getInt(6));
                    if (rs.getInt(7) == 0) clean = true;
                    if (rs.getInt(8) == 9) close = true;
                    if (d == 3) { hardFastest = rs.getInt(6); hardClean = rs.getInt(7) <= 3; }
                }
            }
        }
        Set<String> claimed = claimed(userId);
        p.title = title(userId);
        for (int d = 1; d <= 3; d++) {
            if (p.bestMs[d - 1] == null) continue;
            PongRank r = mine(d, 10, userId);          // profil ukazuje časy ze zápasů do 10 gólů
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
        boolean legend = true;
        for (String k : PongBadges.HARD) legend &= p.has(k);
        p.badge("skelosquad", PongBadges.icon("skelosquad"), legend);
        boolean all = true;
        for (String k : PongBadges.LOOKS) all &= p.has(k);
        p.badge("wardrobe", PongBadges.icon("wardrobe"), all);
        p.sortBadges();
        p.findNextBadge(winsCounted);
        if (p.title != null && !p.has(p.title)) p.title = null;
        p.frame = frame(userId);
        if (p.frame != null && !p.has(p.frame)) p.frame = null;
        p.champPlace = PongChampions.place(userId);
        p.champOn = champOn(userId);
        p.shownFrame = p.champOn && p.champPlace != null ? "champ" + p.champPlace : p.frame;
        p.mark = mark(userId);
        if (p.mark != null && !p.has(p.mark)) p.mark = null;
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

    public String frame(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT pong_frame FROM users WHERE id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && PongBadges.isFrame(rs.getString(1)) ? rs.getString(1) : null;
            }
        }
    }

    public String mark(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT pong_mark FROM users WHERE id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && PongBadges.isMark(rs.getString(1)) ? rs.getString(1) : null;
            }
        }
    }

    /** Nastaví legendární znak u jména; null = neukazovat. Volající ověří, že odznak hráč má. */
    public void setMark(int userId, String key) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE users SET pong_mark = ? WHERE id = ?")) {
            ps.setString(1, key);
            ps.setInt(2, userId);
            ps.executeUpdate();
        }
    }

    /** Ukazovat rámeček šampiona (users.pong_champ)? */
    public boolean champOn(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT pong_champ FROM users WHERE id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) { return !rs.next() || rs.getBoolean(1); }
        }
    }

    public void setChampOn(int userId, boolean on) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE users SET pong_champ = ? WHERE id = ?")) {
            ps.setBoolean(1, on);
            ps.setInt(2, userId);
            ps.executeUpdate();
        }
    }

    /** Nastaví rámeček kolem fotky; null = bez rámečku. Volající ověří, že odznak hráč má. */
    public void setFrame(int userId, String key) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE users SET pong_frame = ? WHERE id = ?")) {
            ps.setString(1, key);
            ps.setInt(2, userId);
            ps.executeUpdate();
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
