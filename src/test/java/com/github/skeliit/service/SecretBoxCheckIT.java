package com.github.skeliit.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.spec.SecretKeySpec;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Kontrola klíče DATA_KEY (audit B2): první start klíč „zapamatuje“ a jiný klíč se pak pozná jako špatný.
 * Jen lokální databáze, vlastní řádek v app_settings (skutečná kontrola webu se nemění), po sobě ho smaže.
 */
class SecretBoxCheckIT {
    static final String NAME = "data_key_check_it";
    private Connection c;

    private static SecretKeySpec key(int fill) {
        byte[] raw = new byte[32];
        java.util.Arrays.fill(raw, (byte) fill);
        return SecretBox.readKey(Base64.getEncoder().encodeToString(raw));
    }

    @BeforeEach void open() throws SQLException {
        c = DriverManager.getConnection(System.getProperty("it.dbUrl", "jdbc:mariadb://localhost:3306/skeliweb"),
                System.getProperty("it.dbUser", "Skeli"), System.getProperty("it.dbPass", "skeli"));
        cleanUp0();
    }

    @AfterEach void cleanUp() throws SQLException {
        cleanUp0();
        c.close();
    }

    private void cleanUp0() throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("DELETE FROM app_settings WHERE k = ?")) {
            ps.setString(1, NAME);
            ps.executeUpdate();
        }
    }

    @Test void theSameKeyIsOkAndAnotherKeyIsCaught() throws SQLException {
        assertEquals("ok", SecretBox.check(c, key(1), NAME), "první start klíč zapamatuje");
        assertEquals("ok", SecretBox.check(c, key(1), NAME), "stejný klíč je v pořádku");
        assertEquals("mismatch", SecretBox.check(c, key(2), NAME), "jiný klíč by staré zprávy nepřečetl");
    }
}
