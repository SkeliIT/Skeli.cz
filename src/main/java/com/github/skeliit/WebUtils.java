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

    public static final int PASSWORD_MIN = 8;
    /** bcrypt only uses the first 72 bytes, so longer passwords are refused rather than silently cut. */
    public static final int PASSWORD_MAX = 64;
    private static final int PASSWORD_MAX_BYTES = 72;

    /**
     * The one password rule for registration, password change and reset:
     * at least 8 characters with an upper- and lower-case letter, a digit and a special character.
     */
    public static boolean isPasswordStrong(String password) {
        return passwordProblems(password).isEmpty();
    }

    /**
     * What the password is missing, as rule codes also used by the form helper
     * ({@code js/password-helper.js}): length, lower, upper, digit, special, invalid
     * (spaces, invisible characters, emoji) and long. Empty = the password is fine.
     */
    public static java.util.Set<String> passwordProblems(String password) {
        java.util.Set<String> problems = new java.util.LinkedHashSet<>();
        if (password == null) password = "";
        boolean hasUpper = false, hasLower = false, hasDigit = false, hasSpecial = false;
        for (int i = 0; i < password.length(); ) {
            int cp = password.codePointAt(i);
            i += Character.charCount(cp);
            if (isForbiddenInPassword(cp)) problems.add("invalid");
            else if (Character.isUpperCase(cp)) hasUpper = true;
            else if (Character.isLowerCase(cp)) hasLower = true;
            else if (Character.isDigit(cp)) hasDigit = true;
            else hasSpecial = true;
        }
        int length = password.codePointCount(0, password.length());
        if (length < PASSWORD_MIN) problems.add("length");
        if (!hasLower) problems.add("lower");
        if (!hasUpper) problems.add("upper");
        if (!hasDigit) problems.add("digit");
        if (!hasSpecial) problems.add("special");
        if (length > PASSWORD_MAX
                || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > PASSWORD_MAX_BYTES) {
            problems.add("long");
        }
        return problems;
    }

    /** Spaces, control and invisible characters, and emoji (hard to type on another device). */
    static boolean isForbiddenInPassword(int cp) {
        return Character.isWhitespace(cp) || Character.isSpaceChar(cp) || Character.isISOControl(cp)
                || Character.getType(cp) == Character.FORMAT
                || (cp >= 0xFE00 && cp <= 0xFE0F) // emoji variation selectors
                || cp > 0xFFFF;                   // emoji and other characters outside the basic plane
    }

    /** i18n key of the error message for a password that failed {@link #passwordProblems}. */
    public static String passwordErrorKey(java.util.Set<String> problems) {
        if (problems.contains("invalid")) return "auth.error.passwordInvalidChars";
        if (problems.contains("long")) return "auth.error.passwordTooLong";
        return "auth.error.passwordStrength";
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
    public static boolean isLocalAddress(String addr) {
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
    /** Uploaded pictures larger than this (width × height) are refused before they are decoded. */
    static final long MAX_IMAGE_PIXELS = 40_000_000L; // e.g. 8000 × 5000

    /**
     * Reads an uploaded image, or returns null when it is not an image or is too big: the size is read
     * from the file header first, so a small file claiming 50 000 × 50 000 pixels never fills the memory.
     */
    public static java.awt.image.BufferedImage readImage(java.io.InputStream in) throws java.io.IOException {
        try (javax.imageio.stream.ImageInputStream iis = javax.imageio.ImageIO.createImageInputStream(in)) {
            if (iis == null) return null;
            java.util.Iterator<javax.imageio.ImageReader> readers = javax.imageio.ImageIO.getImageReaders(iis);
            if (!readers.hasNext()) return null;
            javax.imageio.ImageReader reader = readers.next();
            try {
                reader.setInput(iis, true, true);
                long w = reader.getWidth(0), h = reader.getHeight(0);
                if (w <= 0 || h <= 0 || w * h > MAX_IMAGE_PIXELS) return null;
                return reader.read(0);
            } catch (javax.imageio.IIOException e) {
                return null;
            } finally {
                reader.dispose();
            }
        }
    }

    public static String baseUrl() {
        String v = Config.get("APP_BASE_URL", "https://www.skeli.cz");
        return v.endsWith("/") ? v.substring(0, v.length() - 1) : v;
    }
}
