package com.github.skeliit.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.Normalizer;

/**
 * Komu patří přihlášení přes Google. Pravidlo: e-mail patří tomu, kdo ho prokáže.
 * <ul>
 *   <li>Google účet už propojený → jeho účet (propojení se smazaným účtem se uvolní).</li>
 *   <li>Účet se stejným e-mailem, který majitel <b>ověřil</b> → propojí se.</li>
 *   <li>Účet se stejným e-mailem, který nikdo <b>neověřil</b> → propojí se, ale všechno, co měl v rukou ten, kdo ho
 *       založil (heslo, přihlášení, odkazy na obnovu hesla, 2FA a záložní kódy), se zruší. Kdo zná jen cizí e-mail,
 *       tak nemůže založit účet předem a pak číst, co do něj skutečný majitel e-mailu napíše.</li>
 *   <li>Účet se stejným e-mailem, ale připojený k jinému Google účtu → nic, přihlášení se odmítne.</li>
 *   <li>Jinak nový účet (e-mail jen když ho Google ověřil).</li>
 * </ul>
 * Odhlášení všech zařízení v paměti serveru udělá servlet ({@code SessionRegistry.signOut}), když je {@link Result#secured}.
 */
public class GoogleAccountDao {

    /** Účet, jak ho potřebuje přihlášení. */
    public static final class Account {
        public int id;
        public String username, role, avatar, googleSub;
        public boolean verified;
    }

    /**
     * account = komu přihlášení patří (null = odmítnout), fresh = právě založený,
     * secured = byl to neověřený účet a jeho heslo, přihlášení a 2FA se právě zrušily.
     */
    public record Result(Account account, boolean fresh, boolean secured) {}

    public Result resolve(Connection c, String sub, String email, boolean emailVerified, String name, String picture) throws SQLException {
        Account a = find(c, "google_sub = ?", sub);
        if (a != null && "DELETED".equals(a.role)) {
            // smazaný účet si Google nedrží: uvolnit a pokračovat, jako by tu nikdy nebyl (dřív se už nikdo nepřihlásil)
            run(c, "UPDATE users SET google_sub = NULL WHERE id = ?", a.id);
            a = null;
        }
        if (a != null) return new Result(a, false, false);

        if (emailVerified && email != null && !email.isEmpty()) {
            Account byEmail = find(c, "email = ? AND role <> 'DELETED'", email);
            if (byEmail != null) {
                // účet už patří jinému Google účtu: nepřepisovat cizí propojení
                if (byEmail.googleSub != null && !byEmail.googleSub.isEmpty()) return new Result(null, false, false);
                boolean secure = !byEmail.verified;
                link(c, byEmail.id, sub, secure);
                byEmail.verified = true;
                byEmail.googleSub = sub;
                return new Result(byEmail, false, secure);
            }
        }
        return new Result(create(c, sub, emailVerified ? email : null, name, picture == null ? "" : picture), true, false);
    }

    /** Připojí Google; u neověřeného účtu napřed zruší vše, co zná jen jeho zakladatel. Jedna transakce. */
    private static void link(Connection c, int id, String sub, boolean secure) throws SQLException {
        boolean auto = c.getAutoCommit();
        c.setAutoCommit(false);
        try {
            if (secure) {
                // heslo, 2FA a ověřovací odkaz zakladatele přestanou platit; jeho přihlášení skončí (sessions_valid_after)
                try (PreparedStatement ps = c.prepareStatement(
                        "UPDATE users SET password_hash = '', totp_secret = NULL, totp_enabled_at = NULL, totp_last_step = NULL, "
                        + "verify_token_hash = NULL, verify_expires_at = NULL, sessions_valid_after = ? WHERE id = ?")) {
                    ps.setLong(1, System.currentTimeMillis());
                    ps.setInt(2, id);
                    ps.executeUpdate();
                }
                run(c, "DELETE FROM user_recovery_codes WHERE user_id = ?", id);
                run(c, "DELETE FROM password_resets WHERE user_id = ?", id);
            }
            try (PreparedStatement ps = c.prepareStatement(
                    "UPDATE users SET google_sub = ?, email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?")) {
                ps.setString(1, sub);
                ps.setInt(2, id);
                ps.executeUpdate();
            }
            c.commit();
        } catch (SQLException e) {
            c.rollback();
            throw e;
        } finally {
            c.setAutoCommit(auto);
        }
    }

    private static Account find(Connection c, String where, String value) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT id, username, role, avatar_url, email_verified_at, google_sub FROM users WHERE " + where + " LIMIT 1")) {
            ps.setString(1, value);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                Account a = new Account();
                a.id = rs.getInt(1); a.username = rs.getString(2); a.role = rs.getString(3); a.avatar = rs.getString(4);
                a.verified = rs.getTimestamp(5) != null;
                a.googleSub = rs.getString(6);
                return a;
            }
        }
    }

    private static Account create(Connection c, String sub, String email, String name, String picture) throws SQLException {
        String base = usernameFrom(name, email);
        String avatar = picture.startsWith("https://") && picture.length() <= 255 ? picture : null;
        for (int n = 0; n < 50; n++) {
            String username = n == 0 ? base : trim(base, 50 - String.valueOf(n + 1).length()) + (n + 1);
            if (find(c, "username = ?", username) != null) continue;
            try (PreparedStatement ps = c.prepareStatement(
                    "INSERT INTO users (username, email, password_hash, role, created_at, email_verified_at, google_sub, avatar_url) "
                            + "VALUES (?, ?, '', 'USER', NOW(), NOW(), ?, ?)", Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, username);
                ps.setString(2, email);
                ps.setString(3, sub);
                ps.setString(4, avatar);
                ps.executeUpdate();
                try (ResultSet k = ps.getGeneratedKeys()) {
                    k.next();
                    Account a = new Account();
                    a.id = k.getInt(1); a.username = username; a.role = "USER"; a.verified = true; a.avatar = avatar; a.googleSub = sub;
                    return a;
                }
            }
        }
        throw new SQLException("no free username for " + base);
    }

    /** Jméno, které web povolí ([A-Za-z0-9._-], 3–50): jméno z Googlu bez háčků, jinak začátek e-mailu. */
    public static String usernameFrom(String name, String email) {
        String s = slug(name);
        if (s.length() < 3 && email != null && email.contains("@")) s = slug(email.substring(0, email.indexOf('@')));
        if (s.length() < 3) s = "fanousek";
        return trim(s, 50);
    }

    private static String slug(String v) {
        if (v == null) return "";
        String s = Normalizer.normalize(v.trim(), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        s = s.replaceAll("\\s+", ".").replaceAll("[^A-Za-z0-9._-]", "").replaceAll("\\.{2,}", ".");
        return s.replaceAll("^[._-]+|[._-]+$", "");
    }

    private static String trim(String s, int max) { return s.length() <= max ? s : s.substring(0, max); }

    private static void run(Connection c, String sql, int id) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        }
    }
}
