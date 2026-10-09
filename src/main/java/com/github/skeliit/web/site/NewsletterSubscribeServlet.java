package com.github.skeliit.web.site;

import com.github.skeliit.Db;
import com.github.skeliit.EmailUtil;
import com.github.skeliit.I18n;
import com.github.skeliit.WebUtils;
import com.github.skeliit.security.RequestLimiter;
import com.github.skeliit.security.Tokens;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.security.SecureRandom;
import java.sql.*;
import java.util.Base64;
import java.util.regex.Pattern;

/**
 * Newsletter sign-up with double opt-in: the address only gets a confirmation e-mail here and
 * becomes a subscriber after clicking its link ({@link NewsletterConfirmServlet}). Nobody can
 * sign up someone else's address. The answer is the same whether the address was new, pending
 * or already subscribed, so the form does not reveal who is on the list.
 */
@WebServlet(name = "NewsletterSubscribeServlet", urlPatterns = {"/newsletter/subscribe"})
public class NewsletterSubscribeServlet extends HttpServlet {
    private static final SecureRandom random = new SecureRandom();
    static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    /** Do not send another confirmation to the same address sooner than this. */
    private static final int RESEND_MINUTES = 10;

    static String generateToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** A usable address: the same rule as registration, and it fits the column. */
    static boolean validEmail(String email) {
        return email != null && email.length() <= 254 && EMAIL.matcher(email).matches();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String email = req.getParameter("email");
        email = email == null ? "" : email.trim().toLowerCase();
        if (email.isEmpty()) {
            resp.sendRedirect("/newsletter.jsp?error=missing");
            return;
        }
        if (!validEmail(email)) {
            resp.sendRedirect("/newsletter.jsp?error=invalid");
            return;
        }
        // honeypot: people never see this field, bots fill it in
        String trap = req.getParameter("website");
        if (trap != null && !trap.isBlank()) {
            resp.sendRedirect("/newsletter.jsp?success=1");
            return;
        }
        // at most 5 sign-ups per hour from one IP (not for direct local requests, see WebUtils)
        if (!WebUtils.isDirectLocalRequest(req)
                && !RequestLimiter.tryAcquire("newsletter", WebUtils.clientIp(req), 5, RequestLimiter.HOUR)) {
            resp.sendRedirect("/newsletter.jsp?error=limit");
            return;
        }

        String confirmToken = generateToken();
        boolean send;
        try (Connection conn = Db.get()) {
            send = prepare(conn, email, confirmToken);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        if (send) {
            String link = WebUtils.baseUrl() + "/newsletter/confirm?token=" + confirmToken;
            if (EmailUtil.isConfigured()) {
                try {
                    EmailUtil.sendMail(email,
                            I18n.getText(req, "email.newsletter.confirm.subject"),
                            I18n.getText(req, "email.newsletter.confirm.body").replace("{link}", link));
                } catch (Exception e) {
                    getServletContext().log("Newsletter confirmation e-mail failed for " + email, e);
                }
            } else {
                // local development without SMTP: the link is only in the server log
                getServletContext().log("SMTP not configured; newsletter confirmation link: " + link);
            }
        }
        resp.sendRedirect("/newsletter.jsp?success=1");
    }

    /**
     * Stores the pending sign-up. Returns whether a confirmation e-mail should go out: not for an
     * address that is already confirmed, and not again within {@link #RESEND_MINUTES}.
     */
    private static boolean prepare(Connection conn, String email, String confirmToken) throws SQLException {
        try (PreparedStatement sel = conn.prepareStatement(
                "SELECT confirmed_at, unsubscribed_at, confirm_sent_at > NOW() - INTERVAL " + RESEND_MINUTES + " MINUTE AS recent "
                        + "FROM newsletter_emails WHERE email=?")) {
            sel.setString(1, email);
            try (ResultSet rs = sel.executeQuery()) {
                if (rs.next()) {
                    boolean subscribed = rs.getTimestamp("confirmed_at") != null && rs.getTimestamp("unsubscribed_at") == null;
                    if (subscribed || rs.getBoolean("recent")) return false;
                    try (PreparedStatement up = conn.prepareStatement(
                            "UPDATE newsletter_emails SET confirmed_at=NULL, unsubscribed_at=NULL, confirm_token_hash=?, "
                                    + "confirm_sent_at=NOW(), unsubscribe_token=? WHERE email=?")) {
                        up.setString(1, Tokens.hash(confirmToken));
                        up.setString(2, generateToken());
                        up.setString(3, email);
                        up.executeUpdate();
                    }
                    return true;
                }
            }
        }
        try (PreparedStatement ins = conn.prepareStatement(
                "INSERT INTO newsletter_emails (email, unsubscribe_token, confirm_token_hash, confirm_sent_at) VALUES (?, ?, ?, NOW())")) {
            ins.setString(1, email);
            ins.setString(2, generateToken());
            ins.setString(3, Tokens.hash(confirmToken));
            ins.executeUpdate();
        }
        return true;
    }
}
