package com.github.skeliit.dao;

import com.github.skeliit.Db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Blokování na jednom místě: každá funkce, kde jeden člověk zasahuje do druhého (upozornění, odpovědi, žádosti,
 * zprávy, později Zeď), se ptá tady. Blokování je tiché – zablokovaný nesmí nic poznat, proto se jeho věci
 * jen nedoručí a neukážou tomu, kdo blokoval.
 */
public class BlockDao {
    /** Kousek SQL: „uživatel ? zablokoval autora ve sloupci col“ – pro NOT EXISTS ve výpisech. */
    public static String blockedBy(String col) {
        return "EXISTS (SELECT 1 FROM user_blocks bl WHERE bl.blocker_id = ? AND bl.blocked_id = " + col + ")";
    }

    /** Zablokoval jeden z těch dvou toho druhého (v kterémkoli směru)? */
    public boolean eitherWay(int a, int b) throws SQLException {
        if (a == b) return false;
        try (Connection c = Db.get()) { return eitherWay(c, a, b); }
    }

    public static boolean eitherWay(Connection c, int a, int b) throws SQLException {
        if (a == b) return false;
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT 1 FROM user_blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?) LIMIT 1")) {
            ps.setInt(1, a); ps.setInt(2, b); ps.setInt(3, b); ps.setInt(4, a);
            try (ResultSet rs = ps.executeQuery()) { return rs.next(); }
        }
    }
}
