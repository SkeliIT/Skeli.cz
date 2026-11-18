package com.github.skeliit.security;

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

import static org.junit.jupiter.api.Assertions.*;

/**
 * Smazání účtu (audit 13. 11. 2026, B3 + C4) proti lokální databázi, bez prohlížeče:
 * nahlášení NA smazaného zůstávají jako důkaz, Google a 2FA zmizí, hry a vzkazy taky.
 * {@code mvn test -Dtest=AccountDeletionIT}. Účty, které založí, po sobě smaže.
 */
class AccountDeletionIT {
    private Connection c;
    private int victim, harasser;

    @BeforeEach void setUp() throws SQLException {
        c = DriverManager.getConnection(System.getProperty("it.dbUrl", "jdbc:mariadb://localhost:3306/skeliweb"),
                System.getProperty("it.dbUser", "Skeli"), System.getProperty("it.dbPass", "skeli"));
        victim = user();
        harasser = user();
        // obtěžovatel: Google, 2FA, záložní kód, výhra ve hře, vzkaz webu
        update("UPDATE users SET google_sub = '" + "it-" + UUID.randomUUID().toString().substring(0, 18)
                + "', totp_secret = 'JBSWY3DPEHPK3PXP', totp_enabled_at = NOW() WHERE id = ?", harasser);
        update("INSERT INTO user_recovery_codes (user_id, code_hash) VALUES (?, REPEAT('c', 64))", harasser);
        update("INSERT INTO pong_results (user_id, difficulty, duration_ms, kevin_goals) VALUES (?, 3, 60000, 1)", harasser);
        update("INSERT INTO site_feedback (user_id, vote) VALUES (?, 1)", harasser);
        // oběť ho nahlásila: profil i zprávu
        try (PreparedStatement ps = c.prepareStatement("INSERT INTO user_reports (reported_id, reporter_id, reason) VALUES (?, ?, 'abuse')")) {
            ps.setInt(1, harasser); ps.setInt(2, victim); ps.executeUpdate();
        }
        long msg;
        try (PreparedStatement ps = c.prepareStatement(
                "INSERT INTO chat_messages (user_a, user_b, sender_id, recipient_id, body) VALUES (?, ?, ?, ?, 'zprava')", Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, Math.min(victim, harasser)); ps.setInt(2, Math.max(victim, harasser));
            ps.setInt(3, harasser); ps.setInt(4, victim); ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) { k.next(); msg = k.getLong(1); }
        }
        try (PreparedStatement ps = c.prepareStatement(
                "INSERT INTO chat_reports (message_id, reporter_id, sender_id, reason, body_copy) VALUES (?, ?, ?, 'abuse', 'zprava')")) {
            ps.setLong(1, msg); ps.setInt(2, victim); ps.setInt(3, harasser); ps.executeUpdate();
        }
    }

    @AfterEach void cleanUp() throws SQLException {
        update("DELETE FROM users WHERE id = ?", victim);
        update("DELETE FROM users WHERE id = ?", harasser);
        c.close();
    }

    @Test void reportsAboutADeletedUserStayAsEvidence() throws SQLException {
        assertTrue(AccountDeletion.delete(c, harasser, null));
        assertEquals(1, count("SELECT COUNT(*) FROM user_reports WHERE reported_id = ?", harasser), "nahlášený profil zůstal");
        assertEquals(1, count("SELECT COUNT(*) FROM chat_reports WHERE sender_id = ?", harasser), "nahlášená zpráva (kopie) zůstala");
        assertTrue(AccountDeletion.hasEvidence(c, harasser), "admin purge pak řádek nesmaže");
        assertFalse(AccountDeletion.hasEvidence(c, victim));
    }

    @Test void deletionClearsGoogleTwoFactorGamesAndFeedback() throws SQLException {
        assertTrue(AccountDeletion.delete(c, harasser, null));
        assertEquals("DELETED", col(harasser, "role"));
        assertNull(col(harasser, "google_sub"), "Google uvolněný – jde se znovu registrovat");
        assertNull(col(harasser, "totp_secret"));
        assertNull(col(harasser, "email"));
        assertEquals(0, count("SELECT COUNT(*) FROM user_recovery_codes WHERE user_id = ?", harasser));
        assertEquals(0, count("SELECT COUNT(*) FROM pong_results WHERE user_id = ?", harasser));
        assertEquals(0, count("SELECT COUNT(*) FROM site_feedback WHERE user_id = ?", harasser));
        assertEquals(0, count("SELECT COUNT(*) FROM chat_messages WHERE sender_id = ?", harasser), "jeho zprávy pryč (kopie jen v nahlášení)");
    }

    // --- pomocné ---

    private int user() throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(
                "INSERT INTO users (username, email, password_hash, role, created_at, email_verified_at) VALUES (?, ?, '$2a$12$x', 'USER', NOW(), NOW())",
                Statement.RETURN_GENERATED_KEYS)) {
            String u = "delit_" + UUID.randomUUID().toString().substring(0, 8);
            ps.setString(1, u);
            ps.setString(2, u + "@example.com");
            ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) { k.next(); return k.getInt(1); }
        }
    }

    private String col(int id, String column) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("SELECT " + column + " FROM users WHERE id = ?")) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getString(1) : null; }
        }
    }

    private int count(String sql, int id) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) { rs.next(); return rs.getInt(1); }
        }
    }

    private void update(String sql, int id) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        }
    }
}
