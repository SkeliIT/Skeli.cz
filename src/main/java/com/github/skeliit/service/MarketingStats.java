package com.github.skeliit.service;

import com.github.skeliit.Db;
import com.github.skeliit.I18n;
import com.github.skeliit.WebUtils;
import com.github.skeliit.security.RequestLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Statistiky pro marketing (V93): odkud lidi chodí, z jakého zařízení a kdy, kam z webu klikají ven
 * a co hledají v Textech. Ukládají se jen počty za den – žádné cookies, IP ani nic, co by šlo spojit s člověkem.
 * Posílá je js/presence.js přes /api/hit (StatsHitServlet). Roboti a admin se nepočítají.
 */
public final class MarketingStats {
    private MarketingStats() {}

    private static final ZoneId PRAGUE = ZoneId.of("Europe/Prague");

    /** Kam se dá kliknout ven (odkaz na stránce → klíč). */
    public static final Set<String> TARGETS = Set.of("spotify", "apple", "youtube", "instagram", "facebook", "tiktok");
    /** Druhy stránek, na kterých se klikalo. */
    public static final Set<String> PAGE_KINDS = Set.of("song", "music", "home", "lyrics", "about", "news", "karaoke", "other");

    /** Webové adresy, které poznáme, a jak se jmenují v adminu. Ostatní weby se ukážou svou adresou. */
    private static final Map<String, String> KNOWN = new LinkedHashMap<>();
    static {
        KNOWN.put("instagram.com", "instagram");
        KNOWN.put("facebook.com", "facebook");
        KNOWN.put("fb.com", "facebook");
        KNOWN.put("messenger.com", "facebook");
        KNOWN.put("youtube.com", "youtube");
        KNOWN.put("youtu.be", "youtube");
        KNOWN.put("tiktok.com", "tiktok");
        KNOWN.put("spotify.com", "spotify");
        KNOWN.put("apple.com", "apple");
        KNOWN.put("google.", "google");
        KNOWN.put("seznam.cz", "seznam");
        KNOWN.put("bing.com", "bing");
        KNOWN.put("duckduckgo.com", "duckduckgo");
        KNOWN.put("t.co", "x");
        KNOWN.put("twitter.com", "x");
        KNOWN.put("x.com", "x");
        KNOWN.put("whatsapp.com", "whatsapp");
        KNOWN.put("discord.com", "discord");
    }

    /** Začátek návštěvy: odkud (adresa webu z document.referrer), štítek kampaně, zařízení, jazyk, hodina. */
    public static void visit(HttpServletRequest req, String refHost, String campaign) {
        if (skip(req) || !allowed(req, "hit-visit", 60)) return;
        ZonedDateTime now = ZonedDateTime.now(PRAGUE);
        String sql = "INSERT INTO visit_origins (day, hour, source, campaign, device, lang, visits) VALUES (?, ?, ?, ?, ?, ?, 1) "
                + "ON DUPLICATE KEY UPDATE visits = visits + 1";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setObject(1, now.toLocalDate());
            ps.setInt(2, now.getHour());
            ps.setString(3, source(refHost));
            ps.setString(4, campaign(campaign));
            ps.setString(5, device(req.getHeader("User-Agent")));
            ps.setString(6, I18n.current(req));
            ps.executeUpdate();
        } catch (SQLException e) {
            req.getServletContext().log("Marketing stats", e);
        }
    }

    /** Kliknutí ven (spotify, apple…) na určitém druhu stránky. */
    public static void out(HttpServletRequest req, String target, String pageKind) {
        if (target == null || !TARGETS.contains(target) || skip(req) || !allowed(req, "hit-out", 120)) return;
        String kind = pageKind != null && PAGE_KINDS.contains(pageKind) ? pageKind : "other";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO outbound_clicks (day, target, page_kind, clicks) VALUES (?, ?, ?, 1) "
                        + "ON DUPLICATE KEY UPDATE clicks = clicks + 1")) {
            ps.setObject(1, today());
            ps.setString(2, target);
            ps.setString(3, kind);
            ps.executeUpdate();
        } catch (SQLException e) {
            req.getServletContext().log("Marketing stats", e);
        }
    }

    private static LocalDate lastCleanup;

    /** Hledaný výraz v Textech (až když člověk dopíše) a jestli se něco našlo. Starší než 90 dní se maže. */
    public static void search(HttpServletRequest req, String term, boolean found) {
        String t = term(term);
        if (t == null || skip(req) || !allowed(req, "hit-search", 60)) return;
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement(
                    "INSERT INTO search_terms (day, term, found, n) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE n = n + 1")) {
                ps.setObject(1, today());
                ps.setString(2, t);
                ps.setBoolean(3, found);
                ps.executeUpdate();
            }
            // jednou za den úklid starých hledání
            if (!today().equals(lastCleanup)) {
                lastCleanup = today();
                try (PreparedStatement ps = c.prepareStatement("DELETE FROM search_terms WHERE day < ?")) {
                    ps.setObject(1, today().minusDays(90));
                    ps.executeUpdate();
                }
            }
        } catch (SQLException e) {
            req.getServletContext().log("Marketing stats", e);
        }
    }

    // ---------- pro admin (posledních N dní) ----------

    /** Počty návštěv podle jednoho sloupce (source, campaign, device, lang), od největšího: {hodnota, počet}. */
    public static List<String[]> visitsBy(String column, int days) throws SQLException {
        if (!Set.of("source", "campaign", "device", "lang").contains(column)) throw new IllegalArgumentException(column);
        String where = "campaign".equals(column) ? " AND campaign <> ''" : "";
        return rows("SELECT " + column + ", SUM(visits) n FROM visit_origins WHERE day >= ?" + where
                + " GROUP BY " + column + " ORDER BY n DESC LIMIT 20", days);
    }

    /** Návštěvy podle dne v týdnu (0 = pondělí) a hodiny: tabulka 7 × 24. */
    public static long[][] weekHours(int days) throws SQLException {
        long[][] out = new long[7][24];
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT WEEKDAY(day), hour, SUM(visits) FROM visit_origins WHERE day >= ? GROUP BY WEEKDAY(day), hour")) {
            ps.setObject(1, today().minusDays(days - 1));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) out[rs.getInt(1)][rs.getInt(2)] = rs.getLong(3);
            }
        }
        return out;
    }

    /** Kliknutí ven podle cíle: {cíl, počet}. */
    public static List<String[]> clicksByTarget(int days) throws SQLException {
        return rows("SELECT target, SUM(clicks) n FROM outbound_clicks WHERE day >= ? GROUP BY target ORDER BY n DESC", days);
    }

    /** Kliknutí ven podle druhu stránky: {druh, počet}. */
    public static List<String[]> clicksByPage(int days) throws SQLException {
        return rows("SELECT page_kind, SUM(clicks) n FROM outbound_clicks WHERE day >= ? GROUP BY page_kind ORDER BY n DESC", days);
    }

    /** Nejhledanější výrazy: {výraz, počet, "0" když se nic nenašlo / "1"}. */
    public static List<String[]> topSearches(int days, int limit) throws SQLException {
        List<String[]> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT term, SUM(n) total, MAX(found) FROM search_terms WHERE day >= ? GROUP BY term ORDER BY total DESC LIMIT ?")) {
            ps.setObject(1, today().minusDays(days - 1));
            ps.setInt(2, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) out.add(new String[] { rs.getString(1), String.valueOf(rs.getLong(2)), String.valueOf(rs.getInt(3)) });
            }
        }
        return out;
    }

    /** Vynulování spolu s ostatními statistikami (VisitStats.reset). */
    public static void reset(Connection c) throws SQLException {
        for (String sql : new String[] { "DELETE FROM visit_origins", "DELETE FROM outbound_clicks", "DELETE FROM search_terms" }) {
            try (PreparedStatement ps = c.prepareStatement(sql)) {
                ps.executeUpdate();
            }
        }
    }

    // ---------- pomocné ----------

    private static List<String[]> rows(String sql, int days) throws SQLException {
        List<String[]> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setObject(1, today().minusDays(days - 1));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) out.add(new String[] { rs.getString(1), String.valueOf(rs.getLong(2)) });
            }
        }
        return out;
    }

    private static LocalDate today() { return LocalDate.now(PRAGUE); }

    /** Roboti a admin se nepočítají. */
    private static boolean skip(HttpServletRequest req) {
        if (VisitStats.isBot(req.getHeader("User-Agent"))) return true;
        HttpSession s = req.getSession(false);
        return s != null && "ADMIN".equals(s.getAttribute("role"));
    }

    /** Ochrana proti nafukování čísel: nejvýš `perHour` z jedné adresy (přímé lokální požadavky = testy). */
    private static boolean allowed(HttpServletRequest req, String key, int perHour) {
        return WebUtils.isDirectLocalRequest(req) || RequestLimiter.tryAcquire(key, WebUtils.clientIp(req), perHour, RequestLimiter.HOUR);
    }

    /** Adresa webu, odkud člověk přišel → „instagram“, „google“…, jiný web jeho adresou, nic → „primo“. */
    static String source(String host) {
        if (host == null) return "primo";
        String h = host.trim().toLowerCase(Locale.ROOT);
        if (h.startsWith("www.")) h = h.substring(4);
        if (h.startsWith("m.") || h.startsWith("l.") || h.startsWith("lm.")) h = h.substring(h.indexOf('.') + 1);
        if (h.isEmpty() || !h.matches("[a-z0-9.-]{1,60}")) return "primo";
        if (h.endsWith("skeli.cz")) return "primo";   // z vlastního webu (třeba z testu) se nepočítá jako cizí
        for (Map.Entry<String, String> e : KNOWN.entrySet()) {
            String k = e.getKey();
            if (k.endsWith(".") ? h.startsWith(k) || h.contains("." + k) : h.equals(k) || h.endsWith("." + k)) return e.getValue();
        }
        return h;
    }

    /** Štítek kampaně z odkazu (?z=ig-bio): malá písmena, číslice, pomlčka, podtržítko, max 32 znaků. */
    static String campaign(String v) {
        if (v == null) return "";
        String z = v.trim().toLowerCase(Locale.ROOT);
        return z.matches("[a-z0-9_-]{1,32}") ? z : "";
    }

    /** Hrubý druh zařízení z hlavičky prohlížeče (nic přesnějšího). */
    static String device(String ua) {
        if (ua == null) return "pc";
        String u = ua.toLowerCase(Locale.ROOT);
        if (u.contains("ipad") || u.contains("tablet") || (u.contains("android") && !u.contains("mobile"))) return "tablet";
        if (u.contains("mobi") || u.contains("iphone") || u.contains("android")) return "mobil";
        return "pc";
    }

    /** Hledaný výraz: malými písmeny, mezery sloučené, 2–40 znaků; jinak null. */
    static String term(String v) {
        if (v == null) return null;
        String t = v.strip().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
        if (t.length() < 2) return null;
        return t.length() > 40 ? t.substring(0, 40) : t;
    }
}
