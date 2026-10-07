package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.*;
import java.util.HexFormat;

@WebServlet(name = "ResetPasswordServlet", urlPatterns = {"/reset"})
public class ResetPasswordServlet extends HttpServlet {


    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String token = req.getParameter("token");
        String password = req.getParameter("password");
        String password2 = req.getParameter("password2");
        if (token == null || token.isBlank()) { resp.sendRedirect("forgot.jsp"); return; }
        String back = "reset.jsp?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8) + "&error=";
        java.util.Set<String> problems = WebUtils.passwordProblems(password);
        if (!problems.isEmpty()) {
            resp.sendRedirect(back + (problems.contains("invalid") ? "invalid_chars" : problems.contains("long") ? "too_long" : "weak"));
            return;
        }
        if (!password.equals(password2)) {
            resp.sendRedirect(back + "mismatch");
            return;
        }
        if (PwnedPasswords.breachCount(password) > 0) {
            resp.sendRedirect(back + "pwned");
            return;
        }
        try (Connection conn = Db.get()) {
            conn.setAutoCommit(false);
            try {
                Integer userId = null;
                try (PreparedStatement ps = conn.prepareStatement("SELECT user_id FROM password_resets WHERE token=? AND expires_at>NOW() FOR UPDATE")) {
                    ps.setString(1, hashToken(token));
                    try (ResultSet rs = ps.executeQuery()) { if (rs.next()) userId = rs.getInt(1); }
                }
                if (userId != null) {
                    String hash = BCrypt.hashpw(password, BCrypt.gensalt());
                    try (PreparedStatement ps = conn.prepareStatement("UPDATE users SET password_hash=? WHERE id=?")) {
                        ps.setString(1, hash);
                        ps.setInt(2, userId);
                        ps.executeUpdate();
                    }
                    // Invalidate every outstanding reset token of this user, not just the used one
                    try (PreparedStatement ps = conn.prepareStatement("DELETE FROM password_resets WHERE user_id=?")) {
                        ps.setInt(1, userId);
                        ps.executeUpdate();
                    }
                    conn.commit();
                    // whoever knew the old password is signed out everywhere
                    SessionRegistry.signOut(userId, null);
                    resp.sendRedirect("login.jsp?reset=1");
                    return;
                }
                conn.rollback();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        } catch (SQLException e) { throw new ServletException(e); }
        resp.sendRedirect("forgot.jsp?expired=1");
    }

    /** True when the link from the e-mail can still be used (reset.jsp says so before anyone types a password). */
    public static boolean isTokenValid(String token) {
        if (token == null || token.isBlank()) return false;
        try (Connection conn = Db.get();
             PreparedStatement ps = conn.prepareStatement("SELECT 1 FROM password_resets WHERE token=? AND expires_at>NOW()")) {
            ps.setString(1, hashToken(token));
            try (ResultSet rs = ps.executeQuery()) { return rs.next(); }
        } catch (SQLException e) {
            return true; // let the form decide on submit
        }
    }

    /** Reset tokens are stored as SHA-256 hex so a DB leak does not expose usable links. */
    static String hashToken(String token) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(d);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
