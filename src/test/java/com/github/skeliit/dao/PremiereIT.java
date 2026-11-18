package com.github.skeliit.dao;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Premiéra (V143): neveřejné video nesmí před časem uniknout přes žádnou veřejnou stránku ani API, v čase premiéry se
 * zveřejní přesně jednou (i při souběžných požadavcích) a žádná jiná cesta ho nepřidá dřív. Běží proti lokální databázi
 * a běžícímu lokálnímu webu (mvn jetty:run): {@code mvn test -Dtest=PremiereIT}. Testovací píseň a videa po sobě smaže.
 * Používá vymyšlená ID videí, nikdy skutečné připravované video.
 */
class PremiereIT {
    static final String DB_URL = System.getProperty("it.dbUrl",
            "jdbc:mariadb://localhost:3306/skeliweb?useUnicode=true&characterEncoding=utf8mb4");
    static final String DB_USER = System.getProperty("it.dbUser", "Skeli");
    static final String DB_PASS = System.getProperty("it.dbPass", "skeli");
    static final String BASE = System.getProperty("it.baseUrl", "http://localhost:8080");
    static final String VIDEO = "PrmTest0001", OTHER = "PrmTest0002";   // vymyšlená ID (formát YouTube)

    private Connection c;
    private int songId;
    private String uuid;
    private final HttpClient http = HttpClient.newHttpClient();

    @BeforeEach void setUp() throws SQLException {
        c = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
        uuid = UUID.randomUUID().toString();
        try (PreparedStatement ps = c.prepareStatement("INSERT INTO songs (uuid, name, year) VALUES (?, 'Premierovy test', 2026)", Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, uuid);
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) { rs.next(); songId = rs.getInt(1); }
        }
        update("INSERT INTO lyrics (song_id, lang, words, score) VALUES (?, 'cs', 'Premierovy test\nradek dva', 0)", songId);
    }

    @AfterEach void cleanUp() throws SQLException {
        update("DELETE FROM videos WHERE youtube_id IN ('" + VIDEO + "', '" + OTHER + "')");
        update("DELETE FROM lyrics WHERE song_id = ?", songId);
        update("DELETE FROM songs WHERE id = ?", songId);
        c.close();
    }

    @Test void videoStaysSecretUntilThePremiere() throws Exception {
        premiere(System.currentTimeMillis() + 10 * 60_000L, VIDEO);
        new PremiereDao().publishDue();
        assertEquals(0, videoRows(VIDEO), "před časem se video nezveřejní");
        // žádná veřejná stránka ani API ho neprozradí (zdrojový kód stránek, JSON, mapa webu, RSS, hledání)
        for (String path : new String[] { "/", "/index.jsp", "/music.jsp", "/texty.jsp", "/aktuality.jsp", "/karaoke",
                "/cs/song/" + uuid, "/en/song/" + uuid, "/sitemap.xml", "/cs/feed/atom.xml", "/cs/feed/rss.xml",
                "/api/search?q=Premierovy", "/api/premiere?song=" + uuid, "/api/kevin/random", "/api/kevin/news?since=0" }) {
            HttpResponse<String> r = get(path);
            assertFalse(r.body().contains(VIDEO), "video uniklo přes " + path);
        }
        String api = get("/api/premiere?song=" + uuid).body();
        assertTrue(api.contains("\"out\":false") && api.contains("\"yt\":null"), api);
        assertEquals("no-store", get("/api/premiere?song=" + uuid).headers().firstValue("Cache-Control").orElse(""));
    }

    @Test void publishesExactlyOnceEvenWithManyRequestsAtOnce() throws Exception {
        premiere(System.currentTimeMillis() - 1000, VIDEO);
        int n = 12;
        ExecutorService pool = Executors.newFixedThreadPool(n);
        CountDownLatch go = new CountDownLatch(1);
        for (int i = 0; i < n; i++) pool.submit(() -> { go.await(); return new PremiereDao().publishDue(); });
        go.countDown();
        pool.shutdown();
        assertTrue(pool.awaitTermination(20, TimeUnit.SECONDS));
        assertEquals(1, videoRows(VIDEO), "video je v tabulce právě jednou");
        try (PreparedStatement ps = c.prepareStatement("SELECT song_id FROM videos WHERE youtube_id = ?")) {
            ps.setString(1, VIDEO);
            try (ResultSet rs = ps.executeQuery()) { rs.next(); assertEquals(songId, rs.getInt(1), "video patří k písni"); }
        }
        String api = get("/api/premiere?song=" + uuid).body();
        assertTrue(api.contains("\"out\":true") && api.contains("\"yt\":\"" + VIDEO + "\""), api);
    }

    @Test void otherPathsDoNotAddAPendingVideo() throws Exception {
        premiere(System.currentTimeMillis() + 10 * 60_000L, OTHER);
        new SongDao().linkVideo(OTHER, songId, "pokus");   // „píseň z videa“ v editoru textů
        assertEquals(0, videoRows(OTHER), "čekající video nesmí přidat ani admin jinou cestou");
        assertTrue(PremiereDao.isPendingVideo(OTHER));
        new PremiereDao().setVideo(songId, null);           // admin video odebere: už nečeká
        assertFalse(PremiereDao.isPendingVideo(OTHER));
    }

    @Test void apiRefusesBadInput() throws Exception {
        assertEquals(400, get("/api/premiere?song=%3Cscript%3E").statusCode());
        assertEquals(404, get("/api/premiere?song=" + UUID.randomUUID()).statusCode());
    }

    // --- pomocníci ---

    private void premiere(long at, String video) throws SQLException {
        update("UPDATE songs SET release_at = " + at + ", release_kind = 'clip' WHERE id = ?", songId);
        new PremiereDao().setVideo(songId, video);
    }

    private int videoRows(String yt) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("SELECT COUNT(*) FROM videos WHERE youtube_id = ?")) {
            ps.setString(1, yt);
            try (ResultSet rs = ps.executeQuery()) { rs.next(); return rs.getInt(1); }
        }
    }

    private HttpResponse<String> get(String path) throws Exception {
        return http.send(HttpRequest.newBuilder(URI.create(BASE + path)).GET().build(), HttpResponse.BodyHandlers.ofString());
    }

    private void update(String sql, Object... args) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            for (int i = 0; i < args.length; i++) ps.setObject(i + 1, args[i]);
            ps.executeUpdate();
        }
    }
}
