package com.github.skeliit.security;

import com.github.skeliit.dao.CommentDao;
import com.github.skeliit.service.ProfileImages;
import com.github.skeliit.service.ProfileImages.Kind;
import jakarta.servlet.ServletContext;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

/**
 * Deleting an account for real (the user's choice 2026-10-07): every personal detail goes –
 * name, e-mail, password, avatar and profile header (also the files), profile, reports, pending resets and the
 * newsletter subscription with that e-mail. The votes stay counted (they belong to no name any
 * more, the user's wish)
 * and the comments stay so discussions still make sense, shown as
 * "Deleted account" (the user row remains as an empty shell with role DELETED, so the
 * comments keep their author id).
 *
 * {@link #purge} je mazání adminem (spamer): zmizí úplně, i s komentáři a hlasy.
 */
public final class AccountDeletion {
    private AccountDeletion() {}

    /** Co je potřeba uklidit mimo tabulku users. */
    private record Leftovers(String email, String avatar, String profileAvatar, String cover) {}

    private static Leftovers read(Connection c, int userId) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT u.email, u.avatar_url, p.avatar_url, u.cover_url FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id "
                + "WHERE u.id = ? AND u.role <> 'DELETED'")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? new Leftovers(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4)) : null;
            }
        }
    }

    /** Soubory až po uložení do databáze: nepovedené smazání souboru nesmí nechat data v databázi. */
    private static void deleteFiles(Leftovers l, ServletContext ctx) {
        ProfileImages.delete(ctx, Kind.AVATAR, l.avatar);
        ProfileImages.delete(ctx, Kind.AVATAR, l.profileAvatar);
        ProfileImages.delete(ctx, Kind.COVER, l.cover);
    }

    private static void deleteNewsletter(Connection c, String email) throws SQLException {
        if (email == null || email.isBlank()) return;
        try (PreparedStatement ps = c.prepareStatement("DELETE FROM newsletter_emails WHERE email = ?")) {
            ps.setString(1, email);
            ps.executeUpdate();
        }
    }

    /** Deletes the user's data in one transaction; returns false when there is no such user. */
    public static boolean delete(Connection c, int userId, ServletContext ctx) throws SQLException {
        Leftovers l = read(c, userId);
        if (l == null) return false;
        boolean auto = c.getAutoCommit();
        c.setAutoCommit(false);
        try {
            run(c, "DELETE FROM password_resets WHERE user_id = ?", userId);
            run(c, "DELETE FROM comment_reports WHERE reporter_id = ?", userId);
            run(c, "DELETE FROM user_reports WHERE reporter_id = ? OR reported_id = ?", userId, userId);
            run(c, "DELETE FROM friendships WHERE user_a = ? OR user_b = ?", userId, userId);
            run(c, "DELETE FROM user_blocks WHERE blocker_id = ? OR blocked_id = ?", userId, userId);
            run(c, "DELETE FROM site_badges WHERE user_id = ?", userId);
            run(c, "DELETE FROM user_tracks WHERE user_id = ?", userId);
            run(c, "DELETE FROM user_chat_prefs WHERE user_id = ?", userId);
            run(c, "DELETE FROM chat_muted WHERE user_id = ? OR other_id = ?", userId, userId);
            run(c, "DELETE FROM chat_reactions WHERE user_id = ?", userId);
            run(c, "DELETE FROM chat_reports WHERE reporter_id = ? OR sender_id = ?", userId, userId);
            run(c, "DELETE FROM chat_hidden WHERE user_id = ? OR other_id = ?", userId, userId);
            run(c, "DELETE FROM chat_messages WHERE user_a = ? OR user_b = ?", userId, userId);
            run(c, "DELETE FROM user_profiles WHERE user_id = ?", userId);
            run(c, "DELETE FROM notifications WHERE user_id = ?", userId);
            deleteNewsletter(c, l.email);
            // an empty shell for the comments: no name, e-mail, password or avatar; it can't sign in
            try (PreparedStatement ps = c.prepareStatement(
                    "UPDATE users SET username = ?, email = NULL, password_hash = '', avatar_url = NULL, cover_url = NULL, role = 'DELETED', "
                    + "email_verified_at = NULL, verify_token_hash = NULL, verify_expires_at = NULL WHERE id = ?")) {
                ps.setString(1, "deleted_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
                ps.setInt(2, userId);
                ps.executeUpdate();
            }
            c.commit();
        } catch (SQLException e) {
            c.rollback();
            throw e;
        } finally {
            c.setAutoCommit(auto);
        }
        deleteFiles(l, ctx);
        return true;
    }

    /**
     * Admin maže uživatele úplně: komentáře pod texty i klipy (s odpověďmi, hlasy a nahlášeními), jeho hlasy,
     * odběr novinek, fotku a záhlaví. Řádek users jde pryč a zbytek odstraní cizí klíče. U hlasů a komentářů ke
     * klipům cizí klíč na uživatele není, proto se mažou tady. Vrací false, když uživatel neexistuje.
     */
    public static boolean purge(Connection c, int userId, ServletContext ctx) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("SELECT 1 FROM users WHERE id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) { if (!rs.next()) return false; }
        }
        Leftovers l = read(c, userId);                       // už smazaná skořápka: žádné osobní údaje
        CommentDao comments = new CommentDao();
        for (CommentDao.Kind kind : CommentDao.Kind.values()) {
            for (int id : comments.idsByUser(kind, userId)) comments.delete(kind, id);
        }
        run(c, "DELETE FROM video_comment_votes WHERE user_id = ?", userId);
        if (l != null) deleteNewsletter(c, l.email);
        run(c, "DELETE FROM users WHERE id = ?", userId);
        if (l != null) deleteFiles(l, ctx);
        return true;
    }

    private static void run(Connection c, String sql, int a, int b) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, a);
            ps.setInt(2, b);
            ps.executeUpdate();
        }
    }

    private static void run(Connection c, String sql, int userId) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        }
    }
}
