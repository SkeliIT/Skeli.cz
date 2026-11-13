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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Přihlášení přes Google a propojení účtů (audit 13. 11. 2026, nález B1). Běží jen proti lokální databázi
 * (bez prohlížeče, bez Googlu): {@code mvn test -Dtest=GoogleAccountDaoIT}. Účty, které založí, po sobě smaže.
 */
class GoogleAccountDaoIT {
    static final String DB_URL = System.getProperty("it.dbUrl",
            "jdbc:mariadb://localhost:3306/skeliweb?useUnicode=true&characterEncoding=utf8mb4");
    static final String DB_USER = System.getProperty("it.dbUser", "Skeli");
    static final String DB_PASS = System.getProperty("it.dbPass", "skeli");
    /** bcrypt otisk nějakého hesla: na hodnotě nezáleží, test hlídá jen, jestli zůstane, nebo zmizí */
    static final String HASH = "$2a$12$abcdefghijklmnopqrstuuW7m1zYbqX9k3m2Qy8Vb0n5cE4dF6gH.";

    private Connection c;
    private final List<Integer> users = new ArrayList<>();
    private final GoogleAccountDao dao = new GoogleAccountDao();

    @BeforeEach void open() throws SQLException { c = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS); }

    @AfterEach void cleanUp() throws SQLException {
        for (int id : users) update("DELETE FROM users WHERE id = ?", id);
        c.close();
    }

    // --- bezpečné scénáře ---

    @Test void newGoogleUserGetsAVerifiedAccount() throws SQLException {
        String sub = sub(), email = email();
        var r = keep(dao.resolve(c, sub, email, true, "Nový Fanoušek", "https://lh3.googleusercontent.com/a/x"));
        assertTrue(r.fresh());
        assertFalse(r.secured());
        assertEquals(sub, col(r.account().id, "google_sub"));
        assertEquals(email, col(r.account().id, "email"));
        assertNotNull(col(r.account().id, "email_verified_at"));
    }

    @Test void theSameGoogleAccountSignsInToItsAccountAgain() throws SQLException {
        String sub = sub(), email = email();
        int first = keep(dao.resolve(c, sub, email, true, "Opakovany", "")).account().id;
        var again = dao.resolve(c, sub, email, true, "Opakovany", "");
        assertEquals(first, again.account().id);
        assertFalse(again.fresh());
    }

    @Test void aVerifiedAccountIsLinkedAndKeepsItsPassword() throws SQLException {
        String email = email();
        int id = user(email, true);
        var r = dao.resolve(c, sub(), email, true, "Overeny", "");
        assertEquals(id, r.account().id);
        assertFalse(r.secured(), "ověřený účet se nečistí");
        assertEquals(HASH, col(id, "password_hash"));
    }

    // --- nebezpečné scénáře (útok z auditu B1) ---

    @Test void anUnverifiedAccountLosesEverythingItsMakerControlled() throws SQLException {
        String email = email();
        int id = user(email, false);                       // útočník založil účet s cizím e-mailem a svým heslem
        update("UPDATE users SET totp_secret = 'JBSWY3DPEHPK3PXP', totp_enabled_at = NOW() WHERE id = ?", id);
        update("INSERT INTO user_recovery_codes (user_id, code_hash) VALUES (?, REPEAT('a', 64))", id);
        update("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, REPEAT('b', 64), DATE_ADD(NOW(), INTERVAL 30 MINUTE))", id);
        long before = System.currentTimeMillis();

        String sub = sub();
        var r = dao.resolve(c, sub, email, true, "Skutecny Majitel", "");   // skutečný majitel e-mailu přes Google

        assertEquals(id, r.account().id);
        assertTrue(r.secured());
        assertEquals("", col(id, "password_hash"), "útočníkovo heslo nesmí dál fungovat");
        assertNull(col(id, "totp_secret"), "útočníkovo 2FA pryč");
        assertNull(col(id, "totp_enabled_at"));
        assertEquals(0, count("SELECT COUNT(*) FROM user_recovery_codes WHERE user_id = ?", id));
        assertEquals(0, count("SELECT COUNT(*) FROM password_resets WHERE user_id = ?", id));
        assertTrue(Long.parseLong(col(id, "sessions_valid_after")) >= before, "útočníkova přihlášení končí");
        assertNotNull(col(id, "email_verified_at"));
        assertEquals(sub, col(id, "google_sub"));
    }

    @Test void googleWithoutAVerifiedEmailNeverLinks() throws SQLException {
        String email = email();
        int id = user(email, true);
        var r = keep(dao.resolve(c, sub(), email, false, "Neovereny Google", ""));
        assertNotEquals(id, r.account().id, "bez e-mailu ověřeného Googlem se nic nepropojí");
        assertTrue(r.fresh());
        assertNull(col(r.account().id, "email"));
        assertNull(col(id, "google_sub"));
        assertEquals(HASH, col(id, "password_hash"));
    }

    @Test void anAccountLinkedToAnotherGoogleIsNotTakenOver() throws SQLException {
        String email = email(), original = sub();
        int id = user(email, true);
        update("UPDATE users SET google_sub = '" + original + "' WHERE id = ?", id);
        var r = dao.resolve(c, sub(), email, true, "Jiny Google", "");
        assertNull(r.account(), "cizí propojení se nepřepíše, přihlášení se odmítne");
        assertEquals(original, col(id, "google_sub"));
    }

    @Test void aDeletedAccountDoesNotBlockSigningUpAgain() throws SQLException {
        String sub = sub();
        int deleted = user(null, false);
        update("UPDATE users SET role = 'DELETED', password_hash = '', google_sub = '" + sub + "' WHERE id = ?", deleted);
        var r = keep(dao.resolve(c, sub, email(), true, "Navrat", ""));
        assertNotEquals(deleted, r.account().id);
        assertTrue(r.fresh());
        assertNull(col(deleted, "google_sub"), "smazaný účet Google uvolnil");
    }

    // --- pomocné ---

    private GoogleAccountDao.Result keep(GoogleAccountDao.Result r) {
        if (r.account() != null) users.add(r.account().id);
        return r;
    }

    private static String sub() { return "it-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20); }

    private static String email() { return "glit-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com"; }

    private int user(String email, boolean verified) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(
                "INSERT INTO users (username, email, password_hash, role, created_at, email_verified_at) VALUES (?, ?, ?, 'USER', NOW(), "
                        + (verified ? "NOW()" : "NULL") + ")", Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, "glit_" + UUID.randomUUID().toString().substring(0, 8));
            ps.setString(2, email);
            ps.setString(3, HASH);
            ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) {
                k.next();
                users.add(k.getInt(1));
                return k.getInt(1);
            }
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
