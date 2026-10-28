package com.github.skeliit.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;

/**
 * Kreslení grafů pro stránku Statistiky v adminu (/admin/stats): vrací hotové SVG nebo barvy, aby JSP jen skládalo.
 * Barvy jdou přes CSS proměnné z css/base.css a admin.css (fungují ve světlém i tmavém režimu).
 */
public final class StatsCharts {
    private StatsCharts() {}

    private static final ZoneId PRAGUE = ZoneId.of("Europe/Prague");

    /**
     * Křivka „lidé po dnech“: aktuální období zlatě s plochou, předchozí stejně dlouhé období čárkovaně.
     * series = 2 × days hodnot [předchozí…, aktuální…], dnes poslední.
     */
    public static String peopleLine(long[] series, int days) {
        int w = 640, h = 200, padL = 30, padR = 12, padT = 12, padB = 26;
        long max = 1;
        for (long v : series) max = Math.max(max, v);
        long top = niceTop(max);
        double stepX = days > 1 ? (w - padL - padR) / (double) (days - 1) : 0;
        StringBuilder cur = new StringBuilder(), prev = new StringBuilder(), svg = new StringBuilder();
        svg.append("<svg class=\"st-line\" viewBox=\"0 0 ").append(w).append(' ').append(h)
                .append("\" preserveAspectRatio=\"none\" role=\"img\" aria-label=\"Lidé po dnech\">");
        // vodorovné čáry a popisky osy Y
        for (int i = 0; i <= 3; i++) {
            long v = top * i / 3;
            double y = y(v, top, h, padT, padB);
            svg.append("<line class=\"st-grid\" x1=\"").append(padL).append("\" x2=\"").append(w - padR)
                    .append("\" y1=\"").append(fmt(y)).append("\" y2=\"").append(fmt(y)).append("\"/>")
                    .append("<text class=\"st-axis\" x=\"2\" y=\"").append(fmt(y + 4)).append("\">").append(v).append("</text>");
        }
        double lastX = padL, lastY = h - padB;
        for (int i = 0; i < days; i++) {
            double x = padL + i * stepX;
            double yc = y(series[days + i], top, h, padT, padB), yp = y(series[i], top, h, padT, padB);
            cur.append(i == 0 ? "" : " ").append(fmt(x)).append(',').append(fmt(yc));
            prev.append(i == 0 ? "" : " ").append(fmt(x)).append(',').append(fmt(yp));
            lastX = x; lastY = yc;
        }
        svg.append("<polygon class=\"st-area\" points=\"").append(padL).append(',').append(h - padB).append(' ')
                .append(cur).append(' ').append(fmt(lastX)).append(',').append(h - padB).append("\"/>")
                .append("<polyline class=\"st-prev\" points=\"").append(prev).append("\"/>")
                .append("<polyline class=\"st-cur\" points=\"").append(cur).append("\"/>")
                .append("<circle class=\"st-end\" cx=\"").append(fmt(lastX)).append("\" cy=\"").append(fmt(lastY)).append("\" r=\"4.5\"/>");
        // popisky dnů: první, prostřední a dnes
        LocalDate first = LocalDate.now(PRAGUE).minusDays(days - 1L);
        DateTimeFormatter dm = DateTimeFormatter.ofPattern("d. M.");
        int[] marks = days <= 1 ? new int[]{0} : new int[]{0, (days - 1) / 2, days - 1};
        for (int i : marks) {
            double x = padL + i * stepX;
            String label = i == days - 1 ? "dnes" : first.plusDays(i).format(dm);
            String anchor = i == 0 ? "start" : i == days - 1 ? "end" : "middle";
            svg.append("<text class=\"st-axis\" x=\"").append(fmt(x)).append("\" y=\"").append(h - 6)
                    .append("\" text-anchor=\"").append(anchor).append("\">").append(label).append("</text>");
        }
        return svg.append("</svg>").toString();
    }

    /** Kolečko s podíly (zařízení): části = {klíč, počet}; barva z CSS třídy st-seg-klíč. */
    public static String donut(java.util.List<String[]> parts, String centerBig, String centerSmall) {
        long total = 0;
        for (String[] p : parts) total += Long.parseLong(p[1]);
        double r = 44, c = 2 * Math.PI * r, offset = 0;
        StringBuilder svg = new StringBuilder("<svg class=\"st-donut\" viewBox=\"0 0 120 120\" role=\"img\" aria-label=\"Podíl zařízení\">")
                .append("<circle class=\"st-donut-bg\" cx=\"60\" cy=\"60\" r=\"44\"/>");
        for (String[] p : parts) {
            double len = total == 0 ? 0 : Long.parseLong(p[1]) * c / total;
            svg.append("<circle class=\"st-seg st-seg-").append(safe(p[0])).append("\" cx=\"60\" cy=\"60\" r=\"44\" stroke-dasharray=\"")
                    .append(fmt(Math.max(0, len - 2))).append(' ').append(fmt(c)).append("\" stroke-dashoffset=\"").append(fmt(-offset))
                    .append("\" transform=\"rotate(-90 60 60)\"/>");
            offset += len;
        }
        svg.append("<text class=\"st-donut-big\" x=\"60\" y=\"60\" text-anchor=\"middle\">").append(centerBig).append("</text>")
                .append("<text class=\"st-axis\" x=\"60\" y=\"78\" text-anchor=\"middle\">").append(centerSmall).append("</text>");
        return svg.append("</svg>").toString();
    }

    /**
     * Barva políčka heatmapy „Kdy lidi chodí“: škála tmavě fialová → červená → oranžová → žlutá (jasně odlišené
     * stupně místo odstínů jedné barvy); 0 = prázdné políčko (vrací null, řeší CSS).
     */
    public static String heatColor(long n, long max) {
        if (n <= 0 || max <= 0) return null;
        double v = Math.sqrt(n / (double) max);           // odmocnina: i malé počty jsou vidět
        double hue = (275 + 135 * v) % 360;               // 275 fialová → 360 červená → 50 žlutá
        double light = 28 + 40 * v, sat = 72 + 18 * v;
        return String.format(Locale.ROOT, "hsl(%.0f %.0f%% %.0f%%)", hue, sat, light);
    }

    /** Legenda heatmapy: stejné barvy od málo po nejvíc. */
    public static String heatLegend() {
        StringBuilder sb = new StringBuilder("linear-gradient(90deg");
        for (int i = 1; i <= 5; i++) sb.append(", ").append(heatColor(i * i, 25));
        return sb.append(")").toString();
    }

    /** Barvy zdrojů návštěv a služeb (značky), ostatní zlatě. */
    public static final Map<String, String> BRAND = Map.ofEntries(
            Map.entry("primo", "#9aa0a8"), Map.entry("instagram", "#e1306c"), Map.entry("facebook", "#1877f2"),
            Map.entry("youtube", "#ff3b30"), Map.entry("tiktok", "#25d4e8"), Map.entry("google", "#4285f4"),
            Map.entry("seznam", "#e0302f"), Map.entry("bing", "#00a4ef"), Map.entry("duckduckgo", "#de5833"),
            Map.entry("x", "#c9ccd1"), Map.entry("whatsapp", "#25d366"), Map.entry("discord", "#5865f2"),
            Map.entry("spotify", "#1ed760"), Map.entry("apple", "#fa57c1"));

    public static String brand(String key) { return BRAND.getOrDefault(key, "#e6b730"); }

    // ---------- pomocné ----------
    private static long niceTop(long max) {
        long[] steps = {3, 6, 9, 15, 30, 60, 90, 150, 300, 600, 900, 1500, 3000, 6000, 9000, 15000, 30000};
        for (long s : steps) if (max <= s) return s;
        return (max / 3000 + 1) * 3000;
    }
    private static double y(long v, long top, int h, int padT, int padB) { return h - padB - v * (h - padT - padB) / (double) top; }
    private static String fmt(double d) { return String.format(Locale.ROOT, "%.1f", d); }
    private static String safe(String s) { return s == null ? "" : s.replaceAll("[^a-z0-9-]", ""); }
}
