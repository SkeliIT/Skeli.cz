package com.github.skeliit.dao;

import com.github.skeliit.Db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/**
 * Vzhled a odměny (V142): dny na webu, odemčené odměny a zvolené vzhledy. Kdo co smí zvolit, rozhoduje vždy
 * server (model/Rewards), nikdy prohlížeč. Plán: Skeli.cz-podklady/plany/vzhled-odmeny-plan.md
 */
public class RewardDao {
    /** Den počítáme podle Prahy (stejně jako statistiky návštěv). */
    public static final ZoneId ZONE = ZoneId.of("Europe/Prague");
    /** Sloty zvoleného vzhledu – jiné hodnoty server nepřijme. */
    public static final Set<String> SLOTS = Set.of("profile", "kfont", "kanim", "kstyle");

    public static LocalDate today() { return LocalDate.now(ZONE); }

    /** Zapíše, že přihlášený člověk byl dnes na webu (podruhé ve stejný den nic nezmění). */
    public void touchDay(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("INSERT IGNORE INTO user_days (user_id, day) VALUES (?, ?)")) {
            ps.setInt(1, userId);
            ps.setObject(2, today());
            ps.executeUpdate();
        }
    }

    /** Kolik dní celkem byl člověk na webu přihlášený (vynechané dny nic nesmažou). */
    public int days(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT COUNT(*) FROM user_days WHERE user_id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getInt(1) : 0; }
        }
    }

    /** Odemčené odměny (klíče z model/Rewards). */
    public Set<String> unlocked(int userId) throws SQLException {
        Set<String> out = new LinkedHashSet<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT reward FROM user_rewards WHERE user_id = ? ORDER BY got_at")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) out.add(rs.getString(1)); }
        }
        return out;
    }

    /** Odemkne odměnu natrvalo; vrátí true, když je nová. */
    public boolean unlock(int userId, String reward) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("INSERT IGNORE INTO user_rewards (user_id, reward) VALUES (?, ?)")) {
            ps.setInt(1, userId);
            ps.setString(2, reward);
            return ps.executeUpdate() > 0;
        }
    }

    /** Zvolené vzhledy: slot → hodnota (chybějící slot = základní vzhled). */
    public Map<String, String> looks(int userId) throws SQLException {
        Map<String, String> out = new LinkedHashMap<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT slot, value FROM user_looks WHERE user_id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) out.put(rs.getString(1), rs.getString(2)); }
        }
        return out;
    }

    /** Uloží zvolený vzhled; prázdná hodnota = zpět na základní. Jestli ho smí mít, musí ověřit volající (Rewards). */
    public void setLook(int userId, String slot, String value) throws SQLException {
        if (!SLOTS.contains(slot)) throw new IllegalArgumentException("neznámý slot " + slot);
        try (Connection c = Db.get()) {
            if (value == null || value.isBlank()) {
                try (PreparedStatement ps = c.prepareStatement("DELETE FROM user_looks WHERE user_id = ? AND slot = ?")) {
                    ps.setInt(1, userId);
                    ps.setString(2, slot);
                    ps.executeUpdate();
                }
                return;
            }
            try (PreparedStatement ps = c.prepareStatement(
                    "INSERT INTO user_looks (user_id, slot, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)")) {
                ps.setInt(1, userId);
                ps.setString(2, slot);
                ps.setString(3, value);
                ps.executeUpdate();
            }
        }
    }
}
