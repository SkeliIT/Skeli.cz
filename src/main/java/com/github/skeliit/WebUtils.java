package com.github.skeliit;

import java.text.Normalizer;

public class WebUtils {
    public static String slugify(String s) {
        if (s == null) return "";
        // Normalize to NFD, remove diacritic marks, then ASCII-only slug
        String normalized = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        String slug = normalized.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return slug;
    }

    /** Escapes text for safe output into HTML element content and quoted attributes. */
    public static String escapeHtml(Object o) {
        if (o == null) return "";
        String s = o.toString();
        StringBuilder sb = new StringBuilder(s.length() + 16);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '&' -> sb.append("&amp;");
                case '<' -> sb.append("&lt;");
                case '>' -> sb.append("&gt;");
                case '"' -> sb.append("&quot;");
                case '\'' -> sb.append("&#39;");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * Escapes text for a JavaScript string literal. Quotes, &lt;, &gt; and &amp; become
     * \\uXXXX, so the result is also safe inside an HTML attribute (e.g. onclick).
     */
    public static String escapeJs(Object o) {
        if (o == null) return "";
        String s = o.toString();
        StringBuilder sb = new StringBuilder(s.length() + 16);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\'', '"', '<', '>', '&', '`' -> sb.append(String.format("\\u%04x", (int) c));
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }

    /** Returns the URL only if it is a site-relative path or http(s) URL, otherwise the fallback. */
    public static String safeUrl(String url, String fallback) {
        if (url == null || url.isBlank()) return fallback;
        String u = url.trim();
        if ((u.startsWith("/") && !u.startsWith("//")) || u.startsWith("https://") || u.startsWith("http://")) {
            return u;
        }
        return fallback;
    }

    /**
     * The one password rule for registration, password change and reset:
     * at least 12 characters with an upper- and lower-case letter, a digit and a special character.
     */
    public static boolean isPasswordStrong(String password) {
        if (password == null || password.length() < 12) {
            return false;
        }
        boolean hasUpper = false, hasLower = false, hasDigit = false, hasSpecial = false;
        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
            else if (!Character.isWhitespace(c)) hasSpecial = true;
        }
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }

    /**
     * The visitor's IP address. Behind the Apache reverse proxy every request comes
     * from 127.0.0.1, so then the address the proxy appended to X-Forwarded-For
     * (the last entry) is used. The header is only trusted from a local proxy.
     */
    public static String clientIp(jakarta.servlet.http.HttpServletRequest req) {
        String remote = req.getRemoteAddr();
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank() && isLocalAddress(remote)) {
            String[] parts = xff.split(",");
            return parts[parts.length - 1].trim();
        }
        return remote;
    }

    /**
     * A request made directly on the developer's machine (no proxy in between).
     * Spam limits per IP are skipped for these so local tests can register many accounts.
     */
    public static boolean isDirectLocalRequest(jakarta.servlet.http.HttpServletRequest req) {
        return isLocalAddress(req.getRemoteAddr()) && req.getHeader("X-Forwarded-For") == null;
    }

    /** Loopback address (127.x.x.x or ::1); Jetty may report IPv6 as "[0:0:0:0:0:0:0:1]". */
    static boolean isLocalAddress(String addr) {
        if (addr == null || addr.isBlank()) return false;
        String a = addr.trim();
        if (a.startsWith("[") && a.endsWith("]")) a = a.substring(1, a.length() - 1);
        // only literal IP addresses, never a host name lookup
        if (!a.matches("[0-9a-fA-F:.]+")) return false;
        try {
            return java.net.InetAddress.getByName(a).isLoopbackAddress();
        } catch (java.net.UnknownHostException e) {
            return false;
        }
    }

    /**
     * Honeypot: forms carry a hidden "website" field people never see. Bots that fill
     * in every field fill it too, and such a submission is quietly dropped.
     */
    public static boolean isBot(jakarta.servlet.http.HttpServletRequest req) {
        String trap = req.getParameter("website");
        return trap != null && !trap.isEmpty();
    }

    /** Longest comment we accept (lyric and video comments). */
    public static final int COMMENT_MAX_LENGTH = 1000;

    /** A comment as the user typed it, trimmed, with \n line breaks; null if empty or too long. */
    public static String cleanComment(String content) {
        if (content == null) return null;
        // browsers submit textarea line breaks as \r\n
        String c = content.replace("\r\n", "\n").replace('\r', '\n').strip();
        return c.isEmpty() || c.length() > COMMENT_MAX_LENGTH ? null : c;
    }

    /** Date and time for display, e.g. "26. 9. 2026 17:18" in Czech. */
    public static String formatDateTime(java.sql.Timestamp ts, String lang) {
        if (ts == null) return "";
        return java.time.format.DateTimeFormatter
                .ofLocalizedDateTime(java.time.format.FormatStyle.MEDIUM, java.time.format.FormatStyle.SHORT)
                .withLocale(java.util.Locale.forLanguageTag(lang == null ? "cs" : lang))
                .format(ts.toLocalDateTime());
    }

    /**
     * Base URL of the site used in e-mails. Taken from APP_BASE_URL so that links
     * cannot be poisoned through the Host header.
     */
    public static String baseUrl() {
        String v = Config.get("APP_BASE_URL", "https://www.skeli.cz");
        return v.endsWith("/") ? v.substring(0, v.length() - 1) : v;
    }
}
