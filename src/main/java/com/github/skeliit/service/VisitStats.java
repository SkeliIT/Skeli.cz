package com.github.skeliit.service;

import com.github.skeliit.Db;
import com.github.skeliit.WebUtils;
import com.github.skeliit.security.RequestLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * Visit statistics without cookies: who is online right now, visitors and pages per day,
 * and lyric views counted once per visitor and day.
 *
 * A visitor is SHA-256(key of the day + user id, or IP + browser), cut to 32 hex characters.
 * The key of the day is random and replaced at midnight (Prague time), so the hashes of different
 * days can't be linked and, once the key is gone, can't be traced back to anybody.
 * Admins are not counted (Skeli's own visits would skew the numbers) but do show up as online.
 */
public final class VisitStats {

    static final ZoneId ZONE = ZoneId.of("Europe/Prague");
    /** "Online" = the page was open within this time. */
    static final long ONLINE_WINDOW_MS = 5 * 60_000L;

    private static final Pattern BOT = Pattern.compile(
            "(?i)bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|lighthouse|pingdom|monitor|curl|wget|python|java/|okhttp|go-http");

    /** visitor -> last time seen (ms) */
    private static final Map<String, Long> SEEN = new ConcurrentHashMap<>();

    private static volatile LocalDate saltDay;
    private static volatile byte[] salt;
    private static volatile LocalDate lastCleanup;

    private VisitStats() {}

    static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    /** Crawlers and scripts, by the User-Agent header (a missing header counts as a bot). */
    public static boolean isBot(String userAgent) {
        return userAgent == null || userAgent.isBlank() || BOT.matcher(userAgent).find();
    }

    /** The anonymous id of this visitor for today. */
    static String visitorId(HttpServletRequest req) {
        HttpSession s = req.getSession(false);
        Object uid = s == null ? null : s.getAttribute("userId");
        return uid != null ? hash(daySalt(), "u" + uid) : anonymousId(req);
    }

    /** The id of this browser without an account (its address and browser): what a visitor had before signing in. */
    static String anonymousId(HttpServletRequest req) {
        return hash(daySalt(), WebUtils.clientIp(req) + "|" + req.getHeader("User-Agent"));
    }

    /**
     * Someone who signs in during the visit was counted until then by the browser's id: from now on it is the
     * account's. So that they stay one person (online and today) and a lyric read before and after signing in
     * counts once, today's rows of the browser's id become the account's (once per session and day). An admin
     * isn't counted at all: their rows from before signing in are dropped.
     */
    private static void merge(String from, String to, boolean admin) throws SQLException {
        if (from.equals(to)) return;
        LocalDate day = today();
        try (Connection c = Db.get()) {
            for (String table : new String[]{"visit_days", "lyric_view_days", "play_seen"}) {
                if (!admin) {
                    try (PreparedStatement ps = c.prepareStatement("UPDATE IGNORE " + table + " SET visitor = ? WHERE day = ? AND visitor = ?")) {
                        ps.setString(1, to);
                        ps.setObject(2, day);
                        ps.setString(3, from);
                        ps.executeUpdate();
                    }
                }
                // what is left: rows the account already had (or an admin's)
                try (PreparedStatement ps = c.prepareStatement("DELETE FROM " + table + " WHERE day = ? AND visitor = ?")) {
                    ps.setObject(1, day);
                    ps.setString(2, from);
                    ps.executeUpdate();
                }
            }
        }
    }

    static String hash(byte[] key, String who) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(key);
            md.update(who.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(md.digest()).substring(0, 32);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    /** Today's random key: kept in app_settings so a restart during the day doesn't count everyone twice. */
    private static byte[] daySalt() {
        LocalDate day = today();
        if (day.equals(saltDay) && salt != null) return salt;
        synchronized (VisitStats.class) {
            if (day.equals(saltDay) && salt != null) return salt;
            byte[] key = null;
            try (Connection c = Db.get()) {
                try (PreparedStatement ps = c.prepareStatement("SELECT v FROM app_settings WHERE k='visit_salt'");
                     ResultSet rs = ps.executeQuery()) {
                    if (rs.next() && rs.getString(1) != null && rs.getString(1).startsWith(day + ":")) {
                        key = Base64.getDecoder().decode(rs.getString(1).substring(day.toString().length() + 1));
                    }
                }
                if (key == null) {
                    key = new byte[32];
                    new SecureRandom().nextBytes(key);
                    try (PreparedStatement ps = c.prepareStatement(
                            "INSERT INTO app_settings (k, v) VALUES ('visit_salt', ?) ON DUPLICATE KEY UPDATE v=VALUES(v)")) {
                        ps.setString(1, day + ":" + Base64.getEncoder().encodeToString(key));
                        ps.executeUpdate();
                    }
                }
            } catch (SQLException e) {
                // no database: a key for this run only
                key = new byte[32];
                new SecureRandom().nextBytes(key);
            }
            salt = key;
            saltDay = day;
            SEEN.clear(); // yesterday's ids mean nothing any more
            return key;
        }
    }

    // ---------- online ----------

    static void touch(String visitor, long now) {
        SEEN.put(visitor, now);
    }

    static int online(long now) {
        SEEN.values().removeIf(t -> t < now - ONLINE_WINDOW_MS);
        return SEEN.size();
    }

    public static int onlineNow() {
        return online(System.currentTimeMillis());
    }

    /**
     * One call from the page script: marks the visitor online and, for a newly shown page, counts it.
     * Returns the number of people online.
     */
    public static int ping(HttpServletRequest req, boolean newPage, Integer lyricId) {
        long now = System.currentTimeMillis();
        if (isBot(req.getHeader("User-Agent"))) return online(now);
        String visitor = visitorId(req);
        HttpSession s = req.getSession(false);
        boolean admin = s != null && "ADMIN".equals(s.getAttribute("role"));
        if (s != null && s.getAttribute("userId") != null) {
            // signed in: the same browser before signing in is not a second person online (nor today, merge)
            String before = anonymousId(req);
            SEEN.remove(before);
            String day = today().toString();
            if (!day.equals(s.getAttribute("visitMerged"))) {
                s.setAttribute("visitMerged", day);
                try {
                    merge(before, visitor, admin);
                } catch (SQLException e) {
                    req.getServletContext().log("Visit stats", e);
                }
            }
        }
        touch(visitor, now);
        // at most 300 counted pages an hour from one address: a script can't pump the numbers up
        // (direct local requests are the tests, see WebUtils)
        if (newPage && !admin && (WebUtils.isDirectLocalRequest(req)
                || RequestLimiter.tryAcquire("pageview", WebUtils.clientIp(req), 300, RequestLimiter.HOUR))) {
            try {
                record(visitor, lyricId);
            } catch (SQLException e) {
                req.getServletContext().log("Visit stats", e);
            }
        }
        return online(now);
    }

    private static void record(String visitor, Integer lyricId) throws SQLException {
        LocalDate day = today();
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement("INSERT IGNORE INTO visit_days (day, visitor) VALUES (?, ?)")) {
                ps.setObject(1, day);
                ps.setString(2, visitor);
                ps.executeUpdate();
            }
            try (PreparedStatement ps = c.prepareStatement(
                    "INSERT INTO site_stats_daily (day, pageviews) VALUES (?, 1) ON DUPLICATE KEY UPDATE pageviews = pageviews + 1")) {
                ps.setObject(1, day);
                ps.executeUpdate();
            }
            if (lyricId != null) {
                // the charts count the song (whatever the language of its text)
                try (PreparedStatement ps = c.prepareStatement(
                        "SELECT s.uuid FROM lyrics l JOIN songs s ON s.id = l.song_id WHERE l.id = ?")) {
                    ps.setInt(1, lyricId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next() && rs.getString(1) != null) recordPlay(c, day, "lyric", rs.getString(1), visitor);
                    }
                }
                int fresh;
                // only a lyric that exists, and only the first time today for this visitor
                try (PreparedStatement ps = c.prepareStatement(
                        "INSERT IGNORE INTO lyric_view_days (day, lyric_id, visitor) SELECT ?, id, ? FROM lyrics WHERE id = ?")) {
                    ps.setObject(1, day);
                    ps.setString(2, visitor);
                    ps.setInt(3, lyricId);
                    fresh = ps.executeUpdate();
                }
                if (fresh == 1) {
                    try (PreparedStatement ps = c.prepareStatement(
                            "INSERT INTO lyric_views (lyric_id, views) VALUES (?, 1) ON DUPLICATE KEY UPDATE views = views + 1")) {
                        ps.setInt(1, lyricId);
                        ps.executeUpdate();
                    }
                }
            }
            if (!day.equals(lastCleanup)) {
                // yesterday's rows are still needed until midnight has passed everywhere; older ones never
                for (String sql : new String[]{"DELETE FROM lyric_view_days WHERE day < ?", "DELETE FROM play_seen WHERE day < ?"}) {
                    try (PreparedStatement ps = c.prepareStatement(sql)) {
                        ps.setObject(1, day.minusDays(1));
                        ps.executeUpdate();
                    }
                }
                lastCleanup = day;
            }
        }
    }

    // ---------- what is played most ----------

    public static final List<String> PLAY_KINDS = List.of("lyric", "karaoke", "clip");

    /**
     * A song or a clip was played: lyric and karaoke by the song's uuid, clip by its YouTube id. Counted once
     * per visitor and day, never for robots or admins, at most 120 an hour from one address.
     */
    public static void countPlay(HttpServletRequest req, String kind, String item) {
        if (!PLAY_KINDS.contains(kind) || item == null || !item.matches("[A-Za-z0-9_-]{6,40}")) return;
        if (isBot(req.getHeader("User-Agent"))) return;
        HttpSession s = req.getSession(false);
        if (s != null && "ADMIN".equals(s.getAttribute("role"))) return;
        if (!WebUtils.isDirectLocalRequest(req) && !RequestLimiter.tryAcquire("play", WebUtils.clientIp(req), 120, RequestLimiter.HOUR)) return;
        try (Connection c = Db.get()) {
            recordPlay(c, today(), kind, item, visitorId(req));
        } catch (SQLException e) {
            req.getServletContext().log("Play stats", e);
        }
    }

    /** Only an item that exists, and only the first time today for this visitor. */
    static void recordPlay(Connection c, LocalDate day, String kind, String item, String visitor) throws SQLException {
        String exists = "clip".equals(kind) ? "SELECT 1 FROM videos WHERE youtube_id = ?" : "SELECT 1 FROM songs WHERE uuid = ?";
        int fresh;
        try (PreparedStatement ps = c.prepareStatement(
                "INSERT IGNORE INTO play_seen (day, kind, item, visitor) SELECT ?, ?, ?, ? FROM DUAL WHERE EXISTS (" + exists + ")")) {
            ps.setObject(1, day);
            ps.setString(2, kind);
            ps.setString(3, item);
            ps.setString(4, visitor);
            ps.setString(5, item);
            fresh = ps.executeUpdate();
        }
        if (fresh != 1) return;
        try (PreparedStatement ps = c.prepareStatement(
                "INSERT INTO play_daily (day, kind, item, plays) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE plays = plays + 1")) {
            ps.setObject(1, day);
            ps.setString(2, kind);
            ps.setString(3, item);
            ps.executeUpdate();
        }
    }

    /** The most played items of a kind over the last {@code days} days (0 = since counting began): {name, plays}. */
    public static List<String[]> topPlays(String kind, int days, int limit) throws SQLException {
        List<String[]> out = new ArrayList<>();
        if (!PLAY_KINDS.contains(kind)) return out;
        try (Connection c = Db.get()) {
            List<String[]> rows = new ArrayList<>();
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT item, SUM(plays) AS n FROM play_daily WHERE kind = ? AND day > ? GROUP BY item ORDER BY n DESC, item LIMIT ?")) {
                ps.setString(1, kind);
                ps.setObject(2, days > 0 ? today().minusDays(days) : LocalDate.of(2000, 1, 1));
                ps.setInt(3, limit);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) rows.add(new String[]{rs.getString(1), rs.getString(2)});
                }
            }
            String nameSql = "clip".equals(kind) ? "SELECT title FROM videos WHERE youtube_id = ?" : "SELECT name FROM songs WHERE uuid = ?";
            try (PreparedStatement ps = c.prepareStatement(nameSql)) {
                for (String[] r : rows) {
                    ps.setString(1, r[0]);
                    String name = null;
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) name = rs.getString(1);
                    }
                    if (name == null) continue;   // removed since
                    out.add(new String[]{"clip".equals(kind) ? com.github.skeliit.job.VideoTitles.display(name) : name, r[1]});
                }
            }
        }
        return out;
    }

    /** People (visitors) on each of the last {@code days} days, the oldest first (today last). */
    public static long[] dailyVisits(int days) throws SQLException {
        long[] out = new long[days];
        LocalDate first = today().minusDays(days - 1L);
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement("SELECT day, COUNT(*) FROM visit_days WHERE day >= ? GROUP BY day")) {
            ps.setObject(1, first);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int i = (int) java.time.temporal.ChronoUnit.DAYS.between(first, rs.getObject(1, LocalDate.class));
                    if (i >= 0 && i < days) out[i] = rs.getLong(2);
                }
            }
        }
        return out;
    }

    /** Plays of a kind on each of the last {@code days} days, the oldest first (today last). */
    public static long[] dailyPlays(String kind, int days) throws SQLException {
        long[] out = new long[days];
        if (!PLAY_KINDS.contains(kind)) return out;
        LocalDate first = today().minusDays(days - 1L);
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement(
                     "SELECT day, SUM(plays) FROM play_daily WHERE kind = ? AND day >= ? GROUP BY day")) {
            ps.setString(1, kind);
            ps.setObject(2, first);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int i = (int) java.time.temporal.ChronoUnit.DAYS.between(first, rs.getObject(1, LocalDate.class));
                    if (i >= 0 && i < days) out[i] = rs.getLong(2);
                }
            }
        }
        return out;
    }

    // ---------- admin ----------

    /** online, today, yesterday, days7, days30, all (visits = a visitor on a day), pagesToday, pages30, pagesAll, since */
    public static Map<String, Object> summary() throws SQLException {
        LocalDate day = today();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("online", onlineNow());
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement("SELECT "
                     + "(SELECT COUNT(*) FROM visit_days WHERE day = ?) AS today, "
                     + "(SELECT COUNT(*) FROM visit_days WHERE day = ?) AS yesterday, "
                     + "(SELECT COUNT(*) FROM visit_days WHERE day > ?) AS days7, "
                     + "(SELECT COUNT(*) FROM visit_days WHERE day > ?) AS days30, "
                     + "(SELECT COALESCE(SUM(pageviews), 0) FROM site_stats_daily WHERE day = ?) AS pagesToday, "
                     + "(SELECT COALESCE(SUM(pageviews), 0) FROM site_stats_daily WHERE day > ?) AS pages30, "
                     + "(SELECT COUNT(*) FROM visit_days) AS allVisits, "
                     + "(SELECT COALESCE(SUM(pageviews), 0) FROM site_stats_daily) AS pagesAll, "
                     + "(SELECT v FROM app_settings WHERE k = 'stats_since') AS since")) {
            ps.setObject(1, day);
            ps.setObject(2, day.minusDays(1));
            ps.setObject(3, day.minusDays(7));
            ps.setObject(4, day.minusDays(30));
            ps.setObject(5, day);
            ps.setObject(6, day.minusDays(30));
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    for (String k : new String[]{"today", "yesterday", "days7", "days30", "allVisits", "pagesToday", "pages30", "pagesAll"}) {
                        out.put(k, rs.getLong(k));
                    }
                    out.put("since", rs.getString("since"));
                }
            }
        }
        return out;
    }

    /** The most read lyrics: {name, lang, views}. */
    public static List<String[]> topLyrics(int limit) throws SQLException {
        List<String[]> out = new ArrayList<>();
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement(
                     "SELECT s.name, l.lang, v.views FROM lyric_views v JOIN lyrics l ON l.id = v.lyric_id "
                             + "JOIN songs s ON s.id = l.song_id WHERE v.views > 0 ORDER BY v.views DESC, s.name LIMIT ?")) {
            ps.setInt(1, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) out.add(new String[]{rs.getString(1), rs.getString(2), rs.getString(3)});
            }
        }
        return out;
    }

    /** Everything back to zero (before the launch); comments and votes stay. */
    public static void reset() throws SQLException {
        try (Connection c = Db.get()) {
            for (String sql : new String[]{"DELETE FROM lyric_views", "DELETE FROM lyric_view_days", "DELETE FROM visit_days",
                    "DELETE FROM site_stats_daily", "DELETE FROM play_daily", "DELETE FROM play_seen",
                    "INSERT INTO app_settings (k, v) VALUES ('stats_since', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i')) "
                            + "ON DUPLICATE KEY UPDATE v = VALUES(v)"}) {
                try (PreparedStatement ps = c.prepareStatement(sql)) {
                    ps.executeUpdate();
                }
            }
            MarketingStats.reset(c);   // i odkud lidi chodí, kliky ven a hledání
        }
    }
}
