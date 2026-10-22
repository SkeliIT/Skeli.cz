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
            String period = days == 7 ? "minulým 7 dnům" : "minulým 30 dnům";
            if (c == null) return getTotal() > 0 ? "nově – předtím nic" : "zatím nic";
            if (Math.abs(c) <= 2) return "≈ stejně jako v " + (days == 7 ? "minulých 7 dnech" : "minulých 30 dnech");
            return (c > 0 ? "↑ " : "↓ ") + Math.abs(c) + " % proti " + period;
        }
        /** Malá křivka aktuálního období jako SVG (plocha se zlatým přechodem a čára). */
        public String getSpark() { return spark(java.util.Arrays.copyOfRange(series, days, series.length), key); }
    }

    /** Všechny dlaždice nástěnky za období 7 nebo 30 dní. */
    public static List<Tile> tiles(int days) throws SQLException {
        int n = days * 2;
        List<Tile> out = new ArrayList<>();
        out.add(new Tile("people", "Lidí na webu", "fa-user-group", "každý se počítá jednou za den", VisitStats.dailyVisits(n), days));
        out.add(new Tile("pages", "Zobrazených stránek", "fa-file-lines", "", daily("SELECT day, pageviews FROM site_stats_daily WHERE day >= ?", n), days));
        long[] plays = sum(VisitStats.dailyPlays("lyric", n), VisitStats.dailyPlays("karaoke", n), VisitStats.dailyPlays("clip", n));
        out.add(new Tile("plays", "Přehrání", "fa-play", "texty, klipy a karaoke", plays, days));
        out.add(new Tile("out", "Kliků na Spotify, YouTube…", "fa-arrow-up-right-from-square", "kolik lidí z webu šlo poslouchat",
                daily("SELECT day, SUM(clicks) FROM outbound_clicks WHERE day >= ? GROUP BY day", n), days));
        out.add(new Tile("comments", "Nových komentářů", "fa-comments", "",
                sum(daily("SELECT DATE(created_at), COUNT(*) FROM comments WHERE created_at >= ? GROUP BY DATE(created_at)", n),
                    daily("SELECT DATE(created_at), COUNT(*) FROM video_comments WHERE created_at >= ? GROUP BY DATE(created_at)", n)), days));
        out.add(new Tile("users", "Nových účtů", "fa-user-plus", "",
                daily("SELECT DATE(created_at), COUNT(*) FROM users WHERE created_at >= ? AND role <> 'DELETED' GROUP BY DATE(created_at)", n), days));
        return out;
    }

    // ---------- pomocné ----------

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
