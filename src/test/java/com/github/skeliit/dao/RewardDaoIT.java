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

import static org.junit.jupiter.api.Assertions.*;

/**
 * Vzhled a odměny, krok 1 (V142): dny na webu, odemčené odměny a zvolené vzhledy. Běží jen proti lokální databázi
 * (bez prohlížeče): {@code mvn test -Dtest=RewardDaoIT}. Účet, který založí, po sobě smaže (tabulky se smažou s ním).
 */
class RewardDaoIT {
    static final String DB_URL = System.getProperty("it.dbUrl",
            "jdbc:mariadb://localhost:3306/skeliweb?useUnicode=true&characterEncoding=utf8mb4");
    static final String DB_USER = System.getProperty("it.dbUser", "Skeli");
    static final String DB_PASS = System.getProperty("it.dbPass", "skeli");

    private Connection c;
    private int user;
    private final RewardDao dao = new RewardDao();

    @BeforeEach void open() throws SQLException {
        c = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
        String name = "it_rw_" + UUID.randomUUID().toString().substring(0, 8);
        try (PreparedStatement ps = c.prepareStatement("INSERT INTO users (username, email, password_hash) VALUES (?, ?, '')",
                Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, name);
            ps.setString(2, name + "@example.invalid");
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) { rs.next(); user = rs.getInt(1); }
        }
    }

    @AfterEach void cleanUp() throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("DELETE FROM users WHERE id = ?")) { ps.setInt(1, user); ps.executeUpdate(); }
        c.close();
    }

    @Test void aDayCountsOnceAndMissedDaysStay() throws SQLException {
        dao.touchDay(user);
        dao.touchDay(user);   // podruhé ve stejný den nic nepřidá
        assertEquals(1, dao.days(user));
        try (PreparedStatement ps = c.prepareStatement("INSERT INTO user_days (user_id, day) VALUES (?, ?)")) {
            ps.setInt(1, user);
            ps.setObject(2, RewardDao.today().minusDays(30));   // den před měsícem (mezi tím vynecháno) se počítá dál
            ps.executeUpdate();
        }
        assertEquals(2, dao.days(user));
    }

    @Test void anUnlockedRewardStays() throws SQLException {
        assertTrue(dao.unlock(user, "test_reward"));
        assertFalse(dao.unlock(user, "test_reward"), "podruhé už není nová");
        assertTrue(dao.unlocked(user).contains("test_reward"));
    }

    @Test void looksAreSavedAndCleared() throws SQLException {
        dao.setLook(user, "kfont", "anton");
        dao.setLook(user, "kfont", "bebas");   // změna přepíše
        assertEquals("bebas", dao.looks(user).get("kfont"));
        dao.setLook(user, "kfont", "");        // prázdné = zpět na základní
        assertFalse(dao.looks(user).containsKey("kfont"));
        assertThrows(IllegalArgumentException.class, () -> dao.setLook(user, "neco", "x"), "neznámý slot server nepřijme");
    }
}
