package com.github.skeliit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.*;

@WebServlet(name = "YouTubeSyncServlet", urlPatterns = {"/admin/sync"})
public class YouTubeSyncServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // Simple admin check
        Object role = req.getSession().getAttribute("role");
        if (role == null || !"ADMIN".equals(role.toString())) {
            resp.setStatus(403);
            resp.getWriter().write("Forbidden");
            return;
        }
        String apiKey = System.getenv("YOUTUBE_API_KEY");
        String channelId = System.getenv("YOUTUBE_CHANNEL_ID");
        if (apiKey == null || channelId == null) {
            // fallback to WEB-INF/youtube.properties
            try (java.io.InputStream in = getServletContext().getResourceAsStream("/WEB-INF/youtube.properties")) {
                if (in != null) {
                    java.util.Properties p = new java.util.Properties();
                    p.load(new java.io.InputStreamReader(in, java.nio.charset.StandardCharsets.UTF_8));
                    if (apiKey == null) apiKey = p.getProperty("apiKey");
                    if (channelId == null) channelId = p.getProperty("channelId");
                }
            }
        }
        if (apiKey == null || channelId == null) {
            resp.setStatus(500);
            resp.getWriter().write("YouTube sync missing configuration (env or /WEB-INF/youtube.properties)");
            return;
        }
        try (Connection conn = Db.get()) {
            syncChannel(conn, apiKey, channelId);
            resp.getWriter().write("OK");
        } catch (Exception e) {
            throw new ServletException(e);
        }
    }

    private void syncChannel(Connection conn, String apiKey, String channelId) throws Exception {
        // Fetch all videos via search endpoint with pagination
        String nextPageToken = null;
        ObjectMapper mapper = new ObjectMapper();
        do {
            String url = "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=" +
                    URLEncoder.encode(channelId, StandardCharsets.UTF_8) +
                    "&type=video&maxResults=50&order=date&key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
            if (nextPageToken != null) {
                url += "&pageToken=" + URLEncoder.encode(nextPageToken, StandardCharsets.UTF_8);
            }
            String json = httpGet(url);
            JsonNode root = mapper.readTree(json);
            
            // Process videos
            for (JsonNode item : root.path("items")) {
                String videoId = item.path("id").path("videoId").asText(null);
                String title = item.path("snippet").path("title").asText("");
                String publishedAt = item.path("snippet").path("publishedAt").asText("");
                if (videoId == null || videoId.isEmpty()) continue;
                
                // Filter rules
                if (title.toLowerCase().contains("making of")) continue;
                if (title.contains("PROTOTYP") || title.contains("🔊")) continue;
                // Handle JDI duplicate - only accept OFFICIAL VIDEO version
                if (title.toUpperCase().contains("JDI") && !title.contains("OFFICIAL VIDEO")) continue;
                
                // Fetch video details to check if it's a short
                boolean isShort = isVideoShort(apiKey, videoId);
                
                if (isShort) {
                    upsertShort(conn, videoId, title, publishedAt);
                } else {
                    upsertVideo(conn, videoId, title, publishedAt);
                    // Parse song name and year
                    String songName = extractSongName(title);
                    Integer year = extractYear(title);
                    if (songName != null && !songName.isEmpty()) {
                        String uuid = java.util.UUID.randomUUID().toString();
                        Integer songId = ensureSong(conn, songName, year, uuid);
                        linkVideoToSong(conn, videoId, songId);
                    }
                }
            }
            
            nextPageToken = root.path("nextPageToken").asText(null);
        } while (nextPageToken != null);
    }
    
    private boolean isVideoShort(String apiKey, String videoId) throws IOException {
        String url = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=" +
                URLEncoder.encode(videoId, StandardCharsets.UTF_8) +
                "&key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
        String json = httpGet(url);
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(json);
        JsonNode items = root.path("items");
        if (items.size() > 0) {
            String duration = items.get(0).path("contentDetails").path("duration").asText("");
            // Parse ISO 8601 duration (PT1M30S format)
            // Shorts are typically under 60 seconds
            int seconds = parseDuration(duration);
            return seconds > 0 && seconds <= 60;
        }
        return false;
    }
    
    private int parseDuration(String isoDuration) {
        // Parse PT1M30S -> 90 seconds
        if (!isoDuration.startsWith("PT")) return 0;
        String time = isoDuration.substring(2);
        int hours = 0, minutes = 0, seconds = 0;
        try {
            if (time.contains("H")) {
                hours = Integer.parseInt(time.substring(0, time.indexOf("H")));
                time = time.substring(time.indexOf("H") + 1);
            }
            if (time.contains("M")) {
                minutes = Integer.parseInt(time.substring(0, time.indexOf("M")));
                time = time.substring(time.indexOf("M") + 1);
            }
            if (time.contains("S")) {
                seconds = Integer.parseInt(time.substring(0, time.indexOf("S")));
            }
        } catch (Exception e) { return 0; }
        return hours * 3600 + minutes * 60 + seconds;
    }
    
    private String extractSongName(String title) {
        // Remove year in parentheses
        int p = title.lastIndexOf('(');
        int q = title.lastIndexOf(')');
        if (p != -1 && q != -1 && q > p) {
            try {
                Integer.parseInt(title.substring(p+1, q).trim());
                return title.substring(0, p).trim();
            } catch (Exception ignore) {}
        }
        return title.trim();
    }
    
    private Integer extractYear(String title) {
        int p = title.lastIndexOf('(');
        int q = title.lastIndexOf(')');
        if (p != -1 && q != -1 && q > p) {
            try {
                return Integer.parseInt(title.substring(p+1, q).trim());
            } catch (Exception ignore) {}
        }
        return null;
    }

    private static String httpGet(String sUrl) throws IOException {
        URL url = new URL(sUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
            return sb.toString();
        }
    }

    private void upsertVideo(Connection conn, String videoId, String title, String publishedAt) throws SQLException {
        Timestamp ts = null;
        try {
            if (publishedAt != null && !publishedAt.isEmpty()) {
                ts = Timestamp.valueOf(publishedAt.replace("T"," ").replace("Z", ""));
            }
        } catch (Exception ignore) {}
        try (PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO videos (youtube_id, title, published_at) VALUES (?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE title = VALUES(title), published_at = COALESCE(VALUES(published_at), published_at)")) {
            ps.setString(1, videoId);
            ps.setString(2, title);
            if (ts == null) ps.setNull(3, Types.TIMESTAMP); else ps.setTimestamp(3, ts);
            ps.executeUpdate();
        }
    }

    private void upsertShort(Connection conn, String videoId, String title, String publishedAt) throws SQLException {
        Timestamp ts = null;
        try {
            if (publishedAt != null && !publishedAt.isEmpty()) {
                ts = Timestamp.valueOf(publishedAt.replace("T"," ").replace("Z", ""));
            }
        } catch (Exception ignore) {}
        try (PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO shorts (youtube_id, title, published_at) VALUES (?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE title = VALUES(title), published_at = COALESCE(VALUES(published_at), published_at)")) {
            ps.setString(1, videoId);
            ps.setString(2, title);
            if (ts == null) ps.setNull(3, Types.TIMESTAMP); else ps.setTimestamp(3, ts);
            ps.executeUpdate();
        }
    }
    
    private Integer ensureSong(Connection conn, String name, Integer year, String uuid) throws SQLException {
        // Try find existing
        try (PreparedStatement sel = conn.prepareStatement("SELECT id FROM songs WHERE name=? AND ((year IS NULL AND ? IS NULL) OR year=?)")) {
            sel.setString(1, name);
            if (year == null) { sel.setNull(2, Types.INTEGER); sel.setNull(3, Types.INTEGER);} else { sel.setInt(2, year); sel.setInt(3, year);} 
            try (ResultSet rs = sel.executeQuery()) { if (rs.next()) return rs.getInt(1); }
        }
        // Insert with UUID
        try (PreparedStatement ins = conn.prepareStatement("INSERT INTO songs (uuid, name, year) VALUES (?, ?, ?)", Statement.RETURN_GENERATED_KEYS)) {
            ins.setString(1, uuid);
            ins.setString(2, name);
            if (year == null) ins.setNull(3, Types.INTEGER); else ins.setInt(3, year);
            ins.executeUpdate();
            try (ResultSet rs = ins.getGeneratedKeys()) { if (rs.next()) return rs.getInt(1); }
        } catch (SQLException e) {
            // race: try select again
            try (PreparedStatement sel2 = conn.prepareStatement("SELECT id FROM songs WHERE name=? AND ((year IS NULL AND ? IS NULL) OR year=?)")) {
                sel2.setString(1, name);
                if (year == null) { sel2.setNull(2, Types.INTEGER); sel2.setNull(3, Types.INTEGER);} else { sel2.setInt(2, year); sel2.setInt(3, year);} 
                try (ResultSet rs = sel2.executeQuery()) { if (rs.next()) return rs.getInt(1); }
            }
            throw e;
        }
        return null;
    }

    private void linkVideoToSong(Connection conn, String videoId, Integer songId) throws SQLException {
        if (songId == null) return;
        try (PreparedStatement ps = conn.prepareStatement("UPDATE videos SET song_id=? WHERE youtube_id=?")) {
            ps.setInt(1, songId);
            ps.setString(2, videoId);
            ps.executeUpdate();
        }
    }
}
