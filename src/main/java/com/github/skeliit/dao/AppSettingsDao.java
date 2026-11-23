package com.github.skeliit.dao;

import com.github.skeliit.Db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/** Malé nastavení webu, které mění admin nebo web sám (tabulka app_settings, V39): klíč → text. */
public class AppSettingsDao {

    /** Hodnota klíče, nebo null. */
    public String get(String key) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT v FROM app_settings WHERE k = ?")) {
            ps.setString(1, key);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getString(1) : null; }
        }
    }

    /** Uloží hodnotu; null klíč smaže. */
    public void set(String key, String value) throws SQLException {
        try (Connection c = Db.get()) {
            if (value == null) {
                try (PreparedStatement ps = c.prepareStatement("DELETE FROM app_settings WHERE k = ?")) { ps.setString(1, key); ps.executeUpdate(); }
                return;
            }
            try (PreparedStatement ps = c.prepareStatement("INSERT INTO app_settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)")) {
                ps.setString(1, key);
                ps.setString(2, value);
                ps.executeUpdate();
            }
        }
    }
}
