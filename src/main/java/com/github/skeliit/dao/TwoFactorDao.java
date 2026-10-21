package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.security.Tokens;

import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

/**
 * Two-factor sign-in of an account (V89): the shared key of the authenticator app, the last step used (a code works
 * once) and the backup codes (only their SHA-256, each works once).
 */
public class TwoFactorDao {
    public static final int RECOVERY_CODES = 10;
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // no 0/O, 1/I
    private static final SecureRandom RANDOM = new SecureRandom();

    /** The account's two-factor state. */
    public static class State {
        public final String secret;
        public final Timestamp enabledAt;
        public final long lastStep;
        public final int codesLeft;
        State(String secret, Timestamp enabledAt, long lastStep, int codesLeft) {
            this.secret = secret; this.enabledAt = enabledAt; this.lastStep = lastStep; this.codesLeft = codesLeft;
        }
        public boolean isEnabled() { return enabledAt != null && secret != null; }
    }

    public State state(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT totp_secret, totp_enabled_at, totp_last_step, "
                        + "(SELECT COUNT(*) FROM user_recovery_codes r WHERE r.user_id = u.id AND r.used_at IS NULL) "
                        + "FROM users u WHERE id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return new State(null, null, 0, 0);
                return new State(rs.getString(1), rs.getTimestamp(2), rs.getLong(3), rs.getInt(4));
            }
        }
    }

    /** True when the account must enter a code after its password (or after Google). */
    public boolean isEnabled(int userId) throws SQLException {
        return state(userId).isEnabled();
    }

    /** Switched on with a key the app has just shown a right code for (that code's step counts as used). */
    public void enable(int userId, String secret, long step) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE users SET totp_secret = ?, totp_enabled_at = NOW(), totp_last_step = ? WHERE id = ?")) {
            ps.setString(1, secret);
            ps.setLong(2, step);
            ps.setInt(3, userId);
            ps.executeUpdate();
        }
    }

    /** Switched off: the key and the backup codes are deleted. */
    public void disable(int userId) throws SQLException {
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement(
                    "UPDATE users SET totp_secret = NULL, totp_enabled_at = NULL, totp_last_step = NULL WHERE id = ?")) {
                ps.setInt(1, userId);
                ps.executeUpdate();
            }
            try (PreparedStatement ps = c.prepareStatement("DELETE FROM user_recovery_codes WHERE user_id = ?")) {
                ps.setInt(1, userId);
                ps.executeUpdate();
            }
        }
    }

    /** A code was used: its step, so it can't be used again. */
    public void usedStep(int userId, long step) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE users SET totp_last_step = ? WHERE id = ? AND (totp_last_step IS NULL OR totp_last_step < ?)")) {
            ps.setLong(1, step);
            ps.setInt(2, userId);
            ps.setLong(3, step);
            ps.executeUpdate();
        }
    }

    /** New backup codes (the old ones stop working); returned once, in plain text, to be shown and written down. */
    public List<String> newRecoveryCodes(int userId) throws SQLException {
        List<String> codes = new ArrayList<>();
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement("DELETE FROM user_recovery_codes WHERE user_id = ?")) {
                ps.setInt(1, userId);
                ps.executeUpdate();
            }
            try (PreparedStatement ps = c.prepareStatement("INSERT INTO user_recovery_codes (user_id, code_hash) VALUES (?, ?)")) {
                for (int i = 0; i < RECOVERY_CODES; i++) {
                    String code = randomCode();
                    codes.add(code);
                    ps.setInt(1, userId);
                    ps.setString(2, Tokens.hash(normalise(code)));
                    ps.addBatch();
                }
                ps.executeBatch();
            }
        }
        return codes;
    }

    /** Uses up a backup code; false when it isn't one of the account's unused codes. */
    public boolean useRecoveryCode(int userId, String code) throws SQLException {
        if (code == null) return false;
        String n = normalise(code);
        if (n.length() != 10) return false;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE user_recovery_codes SET used_at = NOW() WHERE user_id = ? AND code_hash = ? AND used_at IS NULL LIMIT 1")) {
            ps.setInt(1, userId);
            ps.setString(2, Tokens.hash(n));
            return ps.executeUpdate() == 1;
        }
    }

    /** "ABCDE-FGHJK": ten characters, shown in two halves. */
    static String randomCode() {
        StringBuilder s = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            if (i == 5) s.append('-');
            s.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return s.toString();
    }

    /** As typed: without dashes and spaces, upper case. */
    static String normalise(String code) {
        return code.replaceAll("[\\s-]", "").toUpperCase(java.util.Locale.ROOT);
    }
}
