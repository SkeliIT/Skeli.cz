package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Base64;

/**
 * E-mail verification. After registering, a user gets a link (/verify?token=...);
 * until they open it they can log in but not comment or vote.
 *
 * Verification is only required when SMTP is configured: without it no link could
 * ever arrive, so on such an instance (e.g. local development) everyone counts as verified.
 *
 * GET  /verify?token=  confirms the address
 * POST /verify/resend  sends a new link to the logged-in user
 */
@WebServlet(name = "EmailVerification", urlPatterns = {"/verify", "/verify/resend"})
public class EmailVerification extends HttpServlet {
    /** How long a link stays valid. */
    private static final int VALID_HOURS = 48;
    private static final SecureRandom RANDOM = new SecureRandom();

    public static boolean isRequired() {
        return EmailUtil.isConfigured();
    }

    /** True when the logged-in user may comment and vote (verified, or verification not required). */
    public static boolean isVerified(HttpSession session) {
        return !isRequired() || (session != null && Boolean.TRUE.equals(session.getAttribute("emailVerified")));
    }

    /** Creates a new link token for the user (replacing any older one) and returns it. Only its hash is stored. */
    static String issueToken(Connection conn, int userId) throws SQLException {
        byte[] b = new byte[32];
        RANDOM.nextBytes(b);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(b);
        try (PreparedStatement ps = conn.prepareStatement(
                "UPDATE users SET verify_token_hash=?, verify_expires_at=DATE_ADD(NOW(), INTERVAL " + VALID_HOURS + " HOUR) WHERE id=?")) {
            ps.setString(1, ResetPasswordServlet.hashToken(token));
            ps.setInt(2, userId);
            ps.executeUpdate();
        }
        return token;
    }

    /** Sends the verification e-mail; returns false if it could not be sent. */
    static boolean sendLink(HttpServletRequest req, String email, String username, String token) {
        String link = WebUtils.baseUrl() + "/verify?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        String body = I18n.getText(req, "email.verify.body").replace("{username}", username).replace("{link}", link);
        try {
            EmailUtil.sendMail(email, I18n.getText(req, "email.verify.subject"), body);
            return true;
        } catch (Exception e) {
            req.getServletContext().log("Verification e-mail could not be sent to user " + username, e);
            return false;
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String token = req.getParameter("token");
        if (token == null || token.isBlank()) {
            resp.sendRedirect("/login.jsp?verified=invalid");
            return;
        }
        Integer userId = null;
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT id FROM users WHERE verify_token_hash=? AND verify_expires_at > NOW()")) {
                ps.setString(1, ResetPasswordServlet.hashToken(token));
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) userId = rs.getInt(1);
                }
            }
            if (userId != null) {
                try (PreparedStatement ps = c.prepareStatement(
                        "UPDATE users SET email_verified_at=NOW(), verify_token_hash=NULL, verify_expires_at=NULL WHERE id=?")) {
                    ps.setInt(1, userId);
                    ps.executeUpdate();
                }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        if (userId == null) {
            resp.sendRedirect("/login.jsp?verified=invalid");
            return;
        }
        HttpSession session = req.getSession(false);
        if (session != null && userId.equals(session.getAttribute("userId"))) {
            session.setAttribute("emailVerified", Boolean.TRUE);
            resp.sendRedirect("/index.jsp?verified=1");
        } else {
            resp.sendRedirect("/login.jsp?verified=1");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        Integer userId = session != null ? (Integer) session.getAttribute("userId") : null;
        // only paths on this site, never another domain
        String back = req.getParameter("back");
        if (back == null || !back.startsWith("/") || back.startsWith("//") || back.contains("\\")) back = "/index.jsp";
        if (userId == null) {
            resp.sendRedirect("/login.jsp");
            return;
        }
        String result = "resent";
        if (!RequestLimiter.tryAcquire("verify-resend", userId, 3, RequestLimiter.HOUR)) {
            result = "limit";
        } else {
            try (Connection c = Db.get()) {
                String email = null, username = null;
                try (PreparedStatement ps = c.prepareStatement(
                        "SELECT email, username FROM users WHERE id=? AND email_verified_at IS NULL")) {
                    ps.setInt(1, userId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) { email = rs.getString(1); username = rs.getString(2); }
                    }
                }
                if (email != null) {
                    sendLink(req, email, username, issueToken(c, userId));
                }
            } catch (SQLException e) {
                throw new ServletException(e);
            }
        }
        String anchor = "";
        int hash = back.indexOf('#');
        if (hash >= 0) { anchor = back.substring(hash); back = back.substring(0, hash); }
        String sep = back.contains("?") ? "&" : "?";
        resp.sendRedirect(back + sep + "verify=" + result + anchor);
    }
}
