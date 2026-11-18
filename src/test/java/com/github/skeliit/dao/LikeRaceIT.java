package com.github.skeliit.dao;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

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
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.*;

/**
 * „Líbí se mi“ u písně při dvojkliku (audit 13. 11. 2026, D6): dva požadavky naráz nesmí skončit chybou
 * a srdíčko je po sudém počtu kliků zase pryč. Jen proti lokální databázi: {@code mvn test -Dtest=LikeRaceIT}.
 */
class LikeRaceIT {
    private Connection c;
    private int user, lyricId;

    @BeforeEach void setUp() throws SQLException {
        c = DriverManager.getConnection(System.getProperty("it.dbUrl", "jdbc:mariadb://localhost:3306/skeliweb"),
                System.getProperty("it.dbUser", "Skeli"), System.getProperty("it.dbPass", "skeli"));
        try (PreparedStatement ps = c.prepareStatement(
                "INSERT INTO users (username, email, password_hash, role, created_at, email_verified_at) VALUES (?, ?, '$2a$12$x', 'USER', NOW(), NOW())",
                Statement.RETURN_GENERATED_KEYS)) {
            String u = "srdce_" + UUID.randomUUID().toString().substring(0, 8);
            ps.setString(1, u);
            ps.setString(2, u + "@example.com");
            ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) { k.next(); user = k.getInt(1); }
        }
        try (Statement st = c.createStatement(); ResultSet rs = st.executeQuery("SELECT MIN(id) FROM lyrics")) {
            rs.next(); lyricId = rs.getInt(1);
        }
    }

    @AfterEach void cleanUp() throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("DELETE FROM lyrics_votes WHERE user_id = ?")) { ps.setInt(1, user); ps.executeUpdate(); }
        try (PreparedStatement ps = c.prepareStatement("DELETE FROM users WHERE id = ?")) { ps.setInt(1, user); ps.executeUpdate(); }
        c.close();
    }

    @Test void doubleClicksNeverFail() throws Exception {
        LyricDao dao = new LyricDao();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            for (int round = 0; round < 20; round++) {
                CountDownLatch go = new CountDownLatch(1);
                Future<int[]> a = pool.submit(() -> { go.await(); return dao.toggleLike(lyricId, user); });
                Future<int[]> b = pool.submit(() -> { go.await(); return dao.toggleLike(lyricId, user); });
                go.countDown();
                assertNotNull(a.get(), "první klik prošel");
                assertNotNull(b.get(), "druhý klik prošel");
                assertEquals(0, votes(), "po dvojkliku je srdíčko zase pryč (kolo " + round + ")");
            }
        } finally {
            pool.shutdownNow();
        }
    }

    private int votes() throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("SELECT COUNT(*) FROM lyrics_votes WHERE user_id = ?")) {
            ps.setInt(1, user);
            try (ResultSet rs = ps.executeQuery()) { rs.next(); return rs.getInt(1); }
        }
    }
}
