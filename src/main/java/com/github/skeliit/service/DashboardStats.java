package com.github.skeliit.service;

import com.github.skeliit.Db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Nástěnka adminu: dlaždice s číslem za období (7 nebo 30 dní), malou křivkou po dnech a šipkou, o kolik je to
 * víc nebo míň než v předchozím stejně dlouhém období. Data bere z toho, co už web sbírá (návštěvy, stránky,
 * přehrání, kliky ven, komentáře, registrace, odběratelé).
 */
public final class DashboardStats {
    private DashboardStats() {}

    private static final ZoneId PRAGUE = ZoneId.of("Europe/Prague");

    /** Jedna dlaždice: název, ikona, hodnoty po dnech za obě období (nejdřív předchozí, pak aktuální). */
    public static class Tile {
        public final String key, label, icon, hint;
        public final long[] series;   // 2 × days: [předchozí období…, aktuální období…], dnes poslední
        public final int days;

        Tile(String key, String label, String icon, String hint, long[] series, int days) {
            this.key = key; this.label = label; this.icon = icon; this.hint = hint; this.series = series; this.days = days;
        }
        public String getKey() { return key; }
        public String getLabel() { return label; }
        public String getIcon() { return icon; }
        public String getHint() { return hint; }
        /** Součet za aktuální období. */
        public long getTotal() { long s = 0; for (int i = days; i < series.length; i++) s += series[i]; return s; }
        /** Součet za předchozí období. */
        public long getPrevious() { long s = 0; for (int i = 0; i < days; i++) s += series[i]; return s; }
        /** Změna v procentech (zaokrouhlená), nebo null, když předtím nebylo nic. */
        public Long getChange() {
            long p = getPrevious(), t = getTotal();
            return p == 0 ? null : Math.round((t - p) * 100.0 / p);
        }
        /** „up“, „down“ nebo „flat“ (pro barvu šipky). */
        public String getTrend() {
            Long c = getChange();
            if (c == null) return getTotal() > 0 ? "up" : "flat";
            return c > 2 ? "up" : c < -2 ? "down" : "flat";
        }
        /** Text pod číslem: „↑ 23 % proti minulým 7 dnům“, „nově“, „beze změny“. */
        public String getTrendText() {
            Long c = getChange();
            String period = days == 1 ? "včerejšku" : days >= 365 ? "předchozímu roku" : "minulým " + days + " dnům";
            if (c == null) return getTotal() > 0 ? "nově – předtím nic" : "zatím nic";
            if (Math.abs(c) <= 2) return "≈ stejně jako v " + (days == 7 ? "minulých 7 dnech" : "minulých 30 dnech");
            return (c > 0 ? "↑ " : "↓ ") + Math.abs(c) + " % proti " + period;
        }
        /** Malá křivka aktuálního období jako SVG (plocha se zlatým přechodem a čára). */
        public String getSpark() { return spark(java.util.Arrays.copyOfRange(series, days, series.length), key); }
    }

    /** Pás „Dnes“ nahoře na nástěnce: co se děje dnes, a příchody po hodinách dnes a včera. */
    public static class Today {
        public final int online, hourNow;
        public final long people, peopleYesterday, pages, plays;
        public final long[] hours, hoursYesterday;   // 24 hodin: začátky návštěv (kolikrát někdo přišel)
        Today(int online, int hourNow, long people, long peopleYesterday, long pages, long plays, long[] hours, long[] hoursYesterday) {
            this.online = online; this.hourNow = hourNow; this.people = people; this.peopleYesterday = peopleYesterday;
            this.pages = pages; this.plays = plays; this.hours = hours; this.hoursYesterday = hoursYesterday;
        }
        /** Nejvyšší hodnota z obou dnů (výška grafu), aspoň 1. */
        public long getMax() { long m = 1; for (int i = 0; i < 24; i++) m = Math.max(m, Math.max(hours[i], hoursYesterday[i])); return m; }
        /** Výška sloupce v procentech grafu. */
        public int pct(long v) { return (int) Math.round(v * 100.0 / getMax()); }
        /** Lidé dnes proti celému včerejšku. */
        public String getVersusYesterday() {
            long d = people - peopleYesterday;
            if (peopleYesterday == 0) return people > 0 ? "včera nikdo" : "zatím nikdo";
            return d > 0 ? "o " + d + " víc než celý včerejšek" : d == 0 ? "stejně jako včera" : "včera celkem " + peopleYesterday;
        }
    }

    public static Today today() throws SQLException {
        java.time.ZonedDateTime now = java.time.ZonedDateTime.now(PRAGUE);
        LocalDate day = now.toLocalDate();
        long[] h = new long[24], y = new long[24];
        long people = 0, peopleY = 0, pages = 0, plays = 0;
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT day, hour, SUM(visits) FROM visit_origins WHERE day >= ? GROUP BY day, hour")) {
                ps.setObject(1, day.minusDays(1));
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        int hr = rs.getInt(2);
                        if (hr < 0 || hr > 23) continue;
                        if (day.equals(rs.getObject(1, LocalDate.class))) h[hr] += rs.getLong(3); else y[hr] += rs.getLong(3);
                    }
                }
            }
            try (PreparedStatement ps = c.prepareStatement("SELECT "
                    + "(SELECT COUNT(*) FROM visit_days WHERE day = ?), (SELECT COUNT(*) FROM visit_days WHERE day = ?), "
                    + "(SELECT COALESCE(SUM(pageviews), 0) FROM site_stats_daily WHERE day = ?), "
                    + "(SELECT COALESCE(SUM(plays), 0) FROM play_daily WHERE day = ?)")) {
                ps.setObject(1, day); ps.setObject(2, day.minusDays(1)); ps.setObject(3, day); ps.setObject(4, day);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) { people = rs.getLong(1); peopleY = rs.getLong(2); pages = rs.getLong(3); plays = rs.getLong(4); }
                }
            }
        }
        return new Today(VisitStats.onlineNow(), now.getHour(), people, peopleY, pages, plays, h, y);
    }

    /** Kolik dní už se počítá (od prvního dne s návštěvou, včetně dneška) – „Celkem“ na stránce Statistiky. */
    public static int daysSinceStart() throws SQLException {
        LocalDate today = LocalDate.now(PRAGUE), first = today;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT MIN(day) FROM visit_days");
             ResultSet rs = ps.executeQuery()) {
            if (rs.next() && rs.getObject(1, LocalDate.class) != null) first = rs.getObject(1, LocalDate.class);
        }
        return (int) Math.max(1, Math.min(3650, ChronoUnit.DAYS.between(first, today) + 1));
    }

    /** Všechny dlaždice nástěnky za období 7 nebo 30 dní. */
    public static List<Tile> tiles(int days) throws SQLException {
        int n = days * 2;
        List<Tile> out = new ArrayList<>();
        out.add(new Tile("people", "Lidí na webu", "fa-user-group", "každý se počítá jednou za den", VisitStats.dailyVisits(n), days));
        out.add(new Tile("pages", "Zobrazených stránek", "fa-file-lines", "", daily("SELECT day, pageviews FROM site_stats_daily WHERE day >= ?", n), days));
        long[] plays = sum(VisitStats.dailyPlays("lyric", n), VisitStats.dailyPlays("karaoke", n), VisitStats.dailyPlays("clip", n));
        out.add(new Tile("plays", "Přehrání", "fa-play", "texty, klipy a karaoke", plays, days));
        // prokliky z webu na hudební služby – každá zvlášť (kam lidi chodí poslouchat; Spotify vydělává)
        out.add(new Tile("spotify", "Kliků na Spotify", "fa-brands fa-spotify", "kolik lidí z webu šlo poslouchat na Spotify", outbound("spotify", n), days));
        out.add(new Tile("youtube", "Kliků na YouTube", "fa-brands fa-youtube", "kolik lidí z webu šlo na YouTube", outbound("youtube", n), days));
        out.add(new Tile("apple", "Kliků na Apple Music", "fa-brands fa-apple", "kolik lidí z webu šlo na Apple Music", outbound("apple", n), days));
        out.add(new Tile("comments", "Nových komentářů", "fa-comments", "",
                sum(daily("SELECT DATE(created_at), COUNT(*) FROM comments WHERE created_at >= ? GROUP BY DATE(created_at)", n),
                    daily("SELECT DATE(created_at), COUNT(*) FROM video_comments WHERE created_at >= ? GROUP BY DATE(created_at)", n)), days));
        out.add(new Tile("users", "Nových účtů", "fa-user-plus", "",
                daily("SELECT DATE(created_at), COUNT(*) FROM users WHERE created_at >= ? AND role <> 'DELETED' GROUP BY DATE(created_at)", n), days));
        return out;
    }

    // ---------- pomocné ----------

    /** Prokliky na jednu službu po dnech (target je pevný název z MarketingStats.TARGETS). */
    private static long[] outbound(String target, int n) throws SQLException {
        long[] out = new long[n];
        LocalDate first = LocalDate.now(PRAGUE).minusDays(n - 1L);
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT day, SUM(clicks) FROM outbound_clicks WHERE day >= ? AND target = ? GROUP BY day")) {
            ps.setObject(1, first);
            ps.setString(2, target);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    LocalDate d = rs.getObject(1, LocalDate.class);
                    int i = d == null ? -1 : (int) ChronoUnit.DAYS.between(first, d);
                    if (i >= 0 && i < n) out[i] += rs.getLong(2);
                }
            }
        }
        return out;
    }

    /** Počty po dnech z dotazu, který vrací (den, počet) a má jeden parametr = první den. Nejstarší první. */
    private static long[] daily(String sql, int n) throws SQLException {
        long[] out = new long[n];
        LocalDate first = LocalDate.now(PRAGUE).minusDays(n - 1L);
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setObject(1, first);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    LocalDate d = rs.getObject(1, LocalDate.class);
                    if (d == null) continue;
                    int i = (int) ChronoUnit.DAYS.between(first, d);
                    if (i >= 0 && i < n) out[i] += rs.getLong(2);
                }
            }
        }
        return out;
    }

    private static long[] sum(long[]... arrays) {
        long[] out = new long[arrays[0].length];
        for (long[] a : arrays) for (int i = 0; i < out.length && i < a.length; i++) out[i] += a[i];
        return out;
    }

    /** Křivka jako SVG 120 × 36: plocha s přechodem a čára, poslední bod (dnes) jako tečka. */
    static String spark(long[] v, String id) {
        int w = 120, h = 36, pad = 3;
        long max = 1;
        for (long x : v) max = Math.max(max, x);
        StringBuilder line = new StringBuilder();
        double lastX = 0, lastY = h - pad;
        for (int i = 0; i < v.length; i++) {
            double x = v.length == 1 ? w / 2.0 : pad + i * (w - 2.0 * pad) / (v.length - 1);
            double y = h - pad - v[i] * (h - 2.0 * pad) / max;
            line.append(i == 0 ? "M" : "L").append(fmt(x)).append(' ').append(fmt(y)).append(' ');
            lastX = x; lastY = y;
        }
        String area = line + "L" + fmt(lastX) + " " + h + " L" + pad + " " + h + " Z";
        String gid = "sg-" + id;
        return "<svg class=\"spark\" viewBox=\"0 0 " + w + " " + h + "\" preserveAspectRatio=\"none\" aria-hidden=\"true\">"
                + "<defs><linearGradient id=\"" + gid + "\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">"
                + "<stop offset=\"0\" stop-color=\"currentColor\" stop-opacity=\".35\"/><stop offset=\"1\" stop-color=\"currentColor\" stop-opacity=\"0\"/>"
                + "</linearGradient></defs>"
                + "<path d=\"" + area + "\" fill=\"url(#" + gid + ")\"/>"
                + "<path d=\"" + line.toString().trim() + "\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\" vector-effect=\"non-scaling-stroke\"/>"
                + "<circle cx=\"" + fmt(lastX) + "\" cy=\"" + fmt(lastY) + "\" r=\"2.6\" fill=\"currentColor\"/>"
                + "</svg>";
    }

    private static String fmt(double d) { return String.format(Locale.ROOT, "%.1f", d); }
}
