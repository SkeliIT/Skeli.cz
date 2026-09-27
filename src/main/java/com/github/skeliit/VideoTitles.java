package com.github.skeliit;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Video titles from YouTube's public oEmbed endpoint (no API key needed).
 * On startup a background thread fills in titles missing in the videos table,
 * so pages never wait for YouTube.
 */
@WebListener
public class VideoTitles implements ServletContextListener {
    private static final ObjectMapper JSON = new ObjectMapper();

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        Thread t = new Thread(() -> {
            try {
                int n = fillMissing();
                if (n > 0) sce.getServletContext().log("VideoTitles: filled " + n + " video title(s)/date(s) from YouTube");
            } catch (Exception e) {
                sce.getServletContext().log("VideoTitles: could not fill titles", e);
            }
        }, "video-titles");
        t.setDaemon(true);
        t.start();
    }

    /** The video's title on YouTube, or null if the video is private/removed or YouTube is unreachable. */
    public static String fetch(String youtubeId) {
        try {
            String url = "https://www.youtube.com/oembed?format=json&url="
                    + URLEncoder.encode("https://www.youtube.com/watch?v=" + youtubeId, StandardCharsets.UTF_8);
            HttpURLConnection c = (HttpURLConnection) URI.create(url).toURL().openConnection();
            c.setConnectTimeout(3000);
            c.setReadTimeout(3000);
            if (c.getResponseCode() != 200) return null;
            try (InputStream in = c.getInputStream()) {
                String title = JSON.readTree(in).path("title").asText(null);
                return title == null || title.isBlank() ? null : title.trim();
            }
        } catch (Exception e) {
            return null;
        }
    }

    /** Stores YouTube titles for videos that have none. Returns how many were filled. */
    public static int fillMissing() throws Exception {
        List<String> ids = new ArrayList<>();
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement("SELECT youtube_id FROM videos WHERE title IS NULL OR title = ''");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) ids.add(rs.getString(1));
        }
        int filled = 0;
        for (String id : ids) {
            String title = fetch(id);
            if (title == null) continue;
            try (Connection c = Db.get();
                 PreparedStatement up = c.prepareStatement("UPDATE videos SET title=? WHERE youtube_id=? AND (title IS NULL OR title = '')")) {
                up.setString(1, title);
                up.setString(2, id);
                filled += up.executeUpdate();
            }
        }
        filled += fillMissingDates();
        return filled;
    }

    private static final java.util.regex.Pattern UPLOAD_DATE =
            java.util.regex.Pattern.compile("itemprop=\"uploadDate\" content=\"([^\"]+)\"");

    /** Upload date from the public video page (no API key), or null. */
    static java.sql.Timestamp fetchUploadDate(String youtubeId) {
        try {
            HttpURLConnection c = (HttpURLConnection) URI.create(
                    "https://www.youtube.com/watch?v=" + URLEncoder.encode(youtubeId, StandardCharsets.UTF_8)).toURL().openConnection();
            c.setConnectTimeout(3000);
            c.setReadTimeout(5000);
            c.setRequestProperty("Accept-Language", "en");
            if (c.getResponseCode() != 200) return null;
            String html;
            try (InputStream in = c.getInputStream()) {
                html = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            }
            java.util.regex.Matcher m = UPLOAD_DATE.matcher(html);
            if (!m.find()) return null;
            return java.sql.Timestamp.from(java.time.OffsetDateTime.parse(m.group(1)).toInstant());
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Release dates for clips that have none, so the home page "news" (newest clips
     * first) isn't outranked by old clips that happen to carry a date.
     */
    static int fillMissingDates() throws Exception {
        List<String> ids = new ArrayList<>();
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement("SELECT youtube_id FROM videos WHERE published_at IS NULL");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) ids.add(rs.getString(1));
        }
        int filled = 0;
        for (String id : ids) {
            java.sql.Timestamp date = fetchUploadDate(id);
            if (date == null) continue;
            try (Connection c = Db.get();
                 PreparedStatement up = c.prepareStatement("UPDATE videos SET published_at=? WHERE youtube_id=? AND published_at IS NULL")) {
                up.setTimestamp(1, date);
                up.setString(2, id);
                filled += up.executeUpdate();
            }
        }
        return filled;
    }

    /**
     * A shorter title for cards: drops the leading "Skeli -" and trailing
     * "[Official video]" / "OFFICIAL VIDEOKLIP" style suffixes.
     * "Skeli - Tisíc kousků [Official video]" becomes "Tisíc kousků".
     */
    public static String display(String title) {
        if (title == null) return null;
        // decorations used on the channel: leading emoji (🔊 ☹) and trailing
        // "bubble letter" tags like ⓐⓤⓓⓘⓞ / ⓁⓎⓇⒾⒸ (Unicode enclosed alphanumerics)
        String t = title.replaceFirst("^[^\\p{L}\\p{N}]+", "")
                .replaceAll("[\\u24B6-\\u24E9\\s]+$", "");
        String feat = null;
        java.util.regex.Matcher m = LEADING_ARTIST.matcher(t);
        if (m.find()) {
            feat = m.group(1);
            t = t.substring(m.end());
        }
        t = t.replaceAll("(?i)[\\[(]?\\s*official\\s+video(klip)?\\s*[\\])]?\\s*$", "");
        t = t.replaceAll("\\s+", " ").trim();
        if (t.isEmpty()) return title.trim();
        return feat == null ? t : t + " (ft. " + feat.trim() + ")";
    }

    /** "Skeli - " or "Skeli ft. Babar - " at the start; group 1 = the featured artist. */
    private static final java.util.regex.Pattern LEADING_ARTIST =
            java.util.regex.Pattern.compile("(?i)^\\s*skeli(?:\\s+(?:ft|feat)\\.?\\s+([^-]+?))?\\s*-\\s*");
}
