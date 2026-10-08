package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.sql.*;

@WebServlet(name = "LoginServlet", urlPatterns = {"/login"})
public class LoginServlet extends HttpServlet {

    /** Failed sign-ins from one address in 15 minutes before it has to wait (a household or school shares an address). */
    static final int IP_FAILURES = 30;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.sendRedirect("login.jsp");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = req.getParameter("username");
        String password = req.getParameter("password");
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            req.setAttribute("loginError", I18n.getText(req, "auth.error.fillAll", "Vyplňte prosím jméno i heslo."));
            req.setAttribute("username", username);
            req.getRequestDispatcher("/login.jsp").forward(req, resp);
            return;
        }
        // per account (guessing one password) and per address (one password tried on many accounts)
        String ip = WebUtils.clientIp(req);
        boolean ipBlocked = !WebUtils.isDirectLocalRequest(req)
                && RequestLimiter.isFull("login-fail-ip", ip, IP_FAILURES, 15 * RequestLimiter.MINUTE);
        if (ipBlocked || LoginRateLimiter.isBlocked(username)) {
            req.setAttribute("loginError", I18n.getText(req, "auth.error.tooManyAttempts", "Příliš mnoho neúspěšných pokusů. Zkuste to znovu za 15 minut."));
            req.setAttribute("username", username);
            req.getRequestDispatcher("/login.jsp").forward(req, resp);
            return;
        }
        try (Connection conn = Db.get();
             // log in with the username or the e-mail address
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT id, username, password_hash, role, avatar_url, email_verified_at FROM users WHERE username = ? OR email = ? LIMIT 1")) {
            ps.setString(1, username);
            ps.setString(2, username.toLowerCase(java.util.Locale.ROOT));
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    String hash = rs.getString("password_hash");
                    // a deleted account (role DELETED, no password) can never sign in
                    if (hash != null && hash.startsWith("$2") && !"DELETED".equals(rs.getString("role"))
                            && BCrypt.checkpw(password, hash)) {
                        LoginRateLimiter.reset(username);
                        HttpSession session = signIn(req, rs.getInt("id"), rs.getString("username"), rs.getString("role"),
                                rs.getString("avatar_url"), rs.getTimestamp("email_verified_at") != null);
                        // remember me (persistent JSESSIONID)
                        if ("1".equals(req.getParameter("remember"))) {
                            session.setMaxInactiveInterval(60*60*24*30); // 30 dní
                            jakarta.servlet.http.Cookie c = new jakarta.servlet.http.Cookie("JSESSIONID", session.getId());
                            c.setHttpOnly(true);
                            c.setSecure(isHttps(req));
                            c.setComment("__SAME_SITE_LAX__"); // Jetty emits SameSite=Lax
                            c.setPath(req.getContextPath().isEmpty() ? "/" : req.getContextPath());
                            c.setMaxAge(60*60*24*30);
                            resp.addCookie(c);
                        }
                        String next = safeNext(req.getParameter("next"));
                        resp.sendRedirect(next != null ? next : "index.jsp");
                        return;
                    }
                }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        LoginRateLimiter.recordFailure(username);
        RequestLimiter.tryAcquire("login-fail-ip", ip, IP_FAILURES, 15 * RequestLimiter.MINUTE);
        req.setAttribute("loginError", I18n.getText(req, "auth.error.invalidCredentials", "Neplatné uživatelské jméno nebo heslo."));
        req.setAttribute("username", username);
        req.getRequestDispatcher("/login.jsp").forward(req, resp);
    }

    /** A page on this site to go back to after signing in (e.g. the admin page), or null. Never another site. */
    public static String safeNext(String next) {
        return next != null && next.length() <= 200 && next.matches("/(?!/)[A-Za-z0-9/._~%?=&-]*") ? next : null;
    }

    /** Puts the user into the session; shared by sign-in and registration (a new account is signed in right away). */
    static HttpSession signIn(HttpServletRequest req, int uid, String username, String role, String avatar, boolean emailVerified) {
        HttpSession session = req.getSession(true);
        // Prevent session fixation: issue a new session ID after authentication
        req.changeSessionId();
        session.setAttribute("userId", uid);
        session.setAttribute("user_id", uid); // for legacy JSP/servlets expecting user_id
        session.setAttribute("username", username);
        session.setAttribute("role", role);
        if (avatar != null) session.setAttribute("avatar_url", avatar);
        session.setAttribute("emailVerified", emailVerified);
        session.setAttribute("signedInAt", System.currentTimeMillis()); // admin pages ask again after a while (AdminFilter)
        return session;
    }

    /** True when the client connection is HTTPS, also behind a TLS-terminating proxy. */
    private static boolean isHttps(HttpServletRequest req) {
        return req.isSecure() || "https".equalsIgnoreCase(req.getHeader("X-Forwarded-Proto"));
    }
}
