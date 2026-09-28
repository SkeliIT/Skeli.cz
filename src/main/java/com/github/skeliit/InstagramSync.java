package com.github.skeliit;

import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Pulls the latest Instagram posts of the account behind INSTAGRAM_ACCESS_TOKEN
 * (Instagram API with Instagram Login, read-only) into social_posts, so they show
 * up on the Aktuality page and on the home page.
 *
 * - runs shortly after startup and then every hour, in a background thread
 * - images are downloaded to UPLOAD_DIR/social: Instagram's own image URLs expire after a few days
 * - the token (valid 60 days) is refreshed once a week and kept in app_settings,
 *   so the one in .env is only needed for the very first start
 *
 * Without INSTAGRAM_ACCESS_TOKEN nothing happens.
 */
@WebListener
public class InstagramSync implements ServletContextListener {
    private static final String API = "https://graph.instagram.com/v21.0";
    private static final String TOKEN_KEY = "instagram_token";
    private static final String REFRESHED_KEY = "instagram_token_refreshed_at";
    private static final int POSTS = 25;
    private static final long MAX_IMAGE_BYTES = 10L * 1024 * 1024;
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private ScheduledExecutorService scheduler;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        ServletContext ctx = sce.getServletContext();
        if (currentToken(ctx) == null) {
            ctx.log("InstagramSync: INSTAGRAM_ACCESS_TOKEN not set, Instagram posts are not synced");
            return;
        }
        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "instagram-sync");
            t.setDaemon(true);
            return t;
        });
        scheduler.scheduleWithFixedDelay(() -> {
            try {
                int n = run(ctx);
                ctx.log("InstagramSync: " + n + " post(s) synced");
            } catch (Exception e) {
                ctx.log("InstagramSync failed", e);
            }
        }, 20, 3600, TimeUnit.SECONDS);
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        if (scheduler != null) scheduler.shutdownNow();
    }

    /** Folder for the downloaded images, served at /uploads/social/. */
    public static File imageDir(ServletContext ctx) {
        String uploadDir = Config.get("UPLOAD_DIR");
        if (uploadDir != null && !uploadDir.isBlank()) return new File(uploadDir, "social");
        String base = ctx.getRealPath("/uploads/social");
        if (base == null) base = System.getProperty("java.io.tmpdir") + File.separator + "skeli-social";
        return new File(base);
    }

    /** One sync: refresh the token if due, then store the newest posts. Returns how many were stored. */
    public static synchronized int run(ServletContext ctx) throws Exception {
        String token = currentToken(ctx);
        if (token == null) return 0;
        token = refreshIfDue(ctx, token);

        String url = API + "/me/media?limit=" + POSTS
                + "&fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"
                + "&access_token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        JsonNode body = getJson(url);
        if (body.has("error")) {
            throw new IOException("Instagram API: " + body.path("error").path("message").asText());
        }

        File dir = imageDir(ctx);
        Files.createDirectories(dir.toPath());
        int stored = 0;
        for (JsonNode p : body.path("data")) {
            String id = p.path("id").asText("");
            String permalink = p.path("permalink").asText(null);
            if (!id.matches("\\d{1,40}") || permalink == null) continue;
            // videos (reels) have a still in thumbnail_url; photos and albums in media_url
            String remoteImage = "VIDEO".equals(p.path("media_type").asText())
                    ? p.path("thumbnail_url").asText(null)
                    : p.path("media_url").asText(null);
            String localImage = download(remoteImage, dir, "ig_" + id + ".jpg");
            Timestamp created = parseTime(p.path("timestamp").asText(null));
            String caption = p.path("caption").asText("");
            save(id, permalink, localImage, caption, created);
            stored++;
        }
        return stored;
    }

    /** Token from app_settings (refreshed copy) or else from the INSTAGRAM_ACCESS_TOKEN setting. */
    static String currentToken(ServletContext ctx) {
        String t = null;
        try {
            t = setting(TOKEN_KEY);
        } catch (SQLException e) {
            // table may not exist before migrations ran; fall back to the configured token
        }
        if (t == null || t.isBlank()) t = Config.get("INSTAGRAM_ACCESS_TOKEN");
        return t == null || t.isBlank() ? null : t.trim();
    }

    /** Long-lived tokens last 60 days; renewing weekly keeps them alive indefinitely. */
    private static String refreshIfDue(ServletContext ctx, String token) {
        try {
            String last = setting(REFRESHED_KEY);
            if (last != null && Long.parseLong(last) > System.currentTimeMillis() - 7L * 24 * 3600 * 1000) {
                return token;
            }
            JsonNode r = getJson("https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token="
                    + URLEncoder.encode(token, StandardCharsets.UTF_8));
            String fresh = r.path("access_token").asText(null);
            if (fresh == null) {
                ctx.log("InstagramSync: token refresh refused: " + r.path("error").path("message").asText("?"));
                return token;
            }
            saveSetting(TOKEN_KEY, fresh);
            saveSetting(REFRESHED_KEY, String.valueOf(System.currentTimeMillis()));
            return fresh;
        } catch (Exception e) {
            ctx.log("InstagramSync: token refresh failed", e);
            return token;
        }
    }

    /** Downloads an image once; returns its site path (/uploads/social/…) or null. */
    private static String download(String remote, File dir, String name) {
        if (remote == null || !remote.startsWith("https://")) return null;
        Path target = dir.toPath().resolve(name);
        String sitePath = "/uploads/social/" + name;
        if (Files.isRegularFile(target)) return sitePath;
        try {
            HttpResponse<InputStream> r = HTTP.send(
                    HttpRequest.newBuilder(URI.create(remote)).timeout(Duration.ofSeconds(20)).GET().build(),
                    HttpResponse.BodyHandlers.ofInputStream());
            String type = r.headers().firstValue("Content-Type").orElse("");
            if (r.statusCode() != 200 || !type.startsWith("image/")) {
                r.body().close();
                return null;
            }
            Path tmp = Files.createTempFile(dir.toPath(), "ig", ".part");
            try (InputStream in = r.body()) {
                long n = Files.copy(in, tmp, StandardCopyOption.REPLACE_EXISTING);
                if (n == 0 || n > MAX_IMAGE_BYTES) {
                    Files.deleteIfExists(tmp);
                    return null;
                }
            }
            Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING);
            return sitePath;
        } catch (Exception e) {
            return null;
        }
    }

    private static void save(String id, String permalink, String image, String caption, Timestamp created) throws SQLException {
        // lang NULL = shown in every language; keep an already downloaded image if this run failed to get one
        String sql = "INSERT INTO social_posts (source, lang, post_id, permalink, image_url, caption, created_at) "
                + "VALUES ('instagram', NULL, ?, ?, ?, ?, ?) "
                + "ON DUPLICATE KEY UPDATE permalink=VALUES(permalink), caption=VALUES(caption), lang=NULL, "
                + "image_url=COALESCE(VALUES(image_url), image_url)";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, permalink);
            ps.setString(3, image);
            ps.setString(4, caption);
            ps.setTimestamp(5, created);
            ps.executeUpdate();
        }
    }

    /** Instagram sends "2026-06-21T18:02:11+0000". */
    static Timestamp parseTime(String s) {
        try {
            OffsetDateTime t = OffsetDateTime.parse(s, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssZ"));
            return Timestamp.from(t.toInstant());
        } catch (Exception e) {
            return new Timestamp(System.currentTimeMillis());
        }
    }

    private static JsonNode getJson(String url) throws IOException, InterruptedException {
        HttpResponse<String> r = HTTP.send(
                HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(20)).GET().build(),
                HttpResponse.BodyHandlers.ofString());
        return JSON.readTree(r.body());
    }

    private static String setting(String key) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT v FROM app_settings WHERE k=?")) {
            ps.setString(1, key);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    private static void saveSetting(String key, String value) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO app_settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v=VALUES(v)")) {
            ps.setString(1, key);
            ps.setString(2, value);
            ps.executeUpdate();
        }
    }
}
