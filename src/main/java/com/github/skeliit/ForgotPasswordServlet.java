package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.security.SecureRandom;
import java.sql.*;
import java.util.Base64;

@WebServlet(name = "ForgotPasswordServlet", urlPatterns = {"/forgot"})
public class ForgotPasswordServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = req.getParameter("username");
        if (username == null || username.isBlank()) { resp.sendRedirect("forgot.jsp"); return; }
        username = username.trim();
        // At most 5 requests per hour from one IP (not for direct local requests, see WebUtils)
        if (!WebUtils.isDirectLocalRequest(req)
                && !RequestLimiter.tryAcquire("forgot", WebUtils.clientIp(req), 5, RequestLimiter.HOUR)) {
            resp.sendRedirect("forgot.jsp?sent=true");
            return;
        }
        try (Connection conn = Db.get()) {
            Integer userId = null;
            String email = null;
            // same as login: the username or the e-mail address
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id, email FROM users WHERE username = ? OR email = ? LIMIT 1")) {
                ps.setString(1, username);
                ps.setString(2, username.toLowerCase(java.util.Locale.ROOT));
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        userId = rs.getInt(1);
                        email = rs.getString(2);
                    }
                }
            }
            if (userId != null && (email == null || email.isBlank())) {
                getServletContext().log("Password reset requested for user " + userId + " without an e-mail address");
            } else if (userId != null && !EmailUtil.isConfigured()) {
                getServletContext().log("Password reset requested but SMTP is not configured (SMTP_HOST/USERNAME/PASSWORD)");
            } else if (userId != null
                    // at most 3 reset e-mails per hour to one account, so nobody can flood a mailbox
                    && RequestLimiter.tryAcquire("forgot-user", userId, 3, RequestLimiter.HOUR)) {
                String token = generateToken();
                // Only the newest link stays valid
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM password_resets WHERE user_id=?")) {
                    ps.setInt(1, userId);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))")) {
                    ps.setInt(1, userId);
                    ps.setString(2, ResetPasswordServlet.hashToken(token));
                    ps.executeUpdate();
                }
                // Send password reset email
                try {
                    EmailUtil.sendMail(email, I18n.getText(req, "email.reset.subject"), buildBody(req, token));
                } catch (Exception mailErr) {
                    // Log error but continue - user should see success message for security
                    getServletContext().log("Password reset e-mail could not be sent", mailErr);
                }
                // Always show success message for security (don't reveal if user exists)
                resp.sendRedirect("forgot.jsp?sent=true");
                return;
            }
        } catch (SQLException e) { throw new ServletException(e); }
        // Show success message even if user not found for security
        resp.sendRedirect("forgot.jsp?sent=true");
    }
    private static String generateToken() {
        byte[] b = new byte[32]; new SecureRandom().nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private static String buildBody(HttpServletRequest req, String token) {
        // Base URL comes from configuration, never from the Host header (reset link poisoning)
        String resetLink = WebUtils.baseUrl() + "/reset.jsp?token=" + token;
        return I18n.getText(req, "email.reset.body").replace("{link}", resetLink);
    }
}
