package com.github.skeliit.security;

import com.github.skeliit.web.files.AvatarFileServlet;
import jakarta.servlet.ServletContext;

import java.io.File;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Deleting an account for real (the user's choice 2026-10-07): every personal detail goes –
 * name, e-mail, password, avatar (also the file), profile, favourites, reports,
 * playlists, notifications, linked accounts, pending resets and the newsletter subscription
 * with that e-mail. The votes stay counted (they belong to no name any more, the user's wish)
 * and the comments stay so discussions still make sense, shown as
 * "Deleted account" (the user row remains as an empty shell with role DELETED, so the
 * comments keep their author id).
 */
public final class AccountDeletion {
    private AccountDeletion() {}

    /** Deletes the user's data in one transaction; returns false when there is no such user. */
    public static boolean delete(Connection c, int userId, ServletContext ctx) throws SQLException {
        String email = null;
        List<String> avatars = new ArrayList<>();
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT u.email, u.avatar_url, p.avatar_url FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id "
                + "WHERE u.id = ? AND u.role <> 'DELETED'")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return false;
                email = rs.getString(1);
                avatars.add(rs.getString(2));
                avatars.add(rs.getString(3));
            }
        }
        boolean auto = c.getAutoCommit();
        c.setAutoCommit(false);
        try {
            run(c, "DELETE FROM favorites WHERE user_id = ?", userId);
            run(c, "DELETE FROM linked_accounts WHERE user_id = ?", userId);
            run(c, "DELETE FROM notifications WHERE user_id = ?", userId);
            run(c, "DELETE FROM password_resets WHERE user_id = ?", userId);
            run(c, "DELETE FROM comment_reports WHERE reporter_id = ?", userId);
            run(c, "DELETE pi FROM playlist_items pi JOIN playlists p ON p.id = pi.playlist_id WHERE p.user_id = ?", userId);
            run(c, "DELETE FROM playlists WHERE user_id = ?", userId);
            run(c, "DELETE FROM user_profiles WHERE user_id = ?", userId);
            if (email != null && !email.isBlank()) {
                try (PreparedStatement ps = c.prepareStatement("DELETE FROM newsletter_emails WHERE email = ?")) {
                    ps.setString(1, email);
                    ps.executeUpdate();
                }
            }
            // an empty shell for the comments: no name, e-mail, password or avatar; it can't sign in
            try (PreparedStatement ps = c.prepareStatement(
                    "UPDATE users SET username = ?, email = NULL, password_hash = '', avatar_url = NULL, role = 'DELETED', "
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
        // the avatar files (after the commit: a failed delete must not keep the data)
        File dir = AvatarFileServlet.avatarDir(ctx);
        for (String url : avatars) {
            if (url == null || !url.startsWith("/uploads/avatars/")) continue;
            String name = url.substring(url.lastIndexOf('/') + 1).replaceAll("\\?.*$", "");
            if (name.isEmpty() || name.contains("..")) continue;
            File f = new File(dir, name);
            if (f.isFile() && !f.delete()) ctx.log("Account deletion: could not delete " + f);
        }
        return true;
    }

    private static void run(Connection c, String sql, int userId) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        }
    }
}
