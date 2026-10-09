package com.github.skeliit.web.site;

import com.github.skeliit.Db;
import com.github.skeliit.EmailUtil;
import com.github.skeliit.I18n;
import com.github.skeliit.WebUtils;
import com.github.skeliit.security.Tokens;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * The link from the newsletter confirmation e-mail (valid 48 hours). Confirms the address and
 * sends the welcome e-mail with the unsubscribe link.
 */
@WebServlet(name = "NewsletterConfirmServlet", urlPatterns = {"/newsletter/confirm"})
public class NewsletterConfirmServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String token = req.getParameter("token");
        if (token == null || token.isBlank() || token.length() > 100) {
            resp.sendRedirect("/newsletter.jsp?error=confirm");
            return;
        }
        String hash = Tokens.hash(token);
        String email = null, unsubscribeToken = null;
        try (Connection c = Db.get()) {
            try (PreparedStatement sel = c.prepareStatement(
                    "SELECT email, unsubscribe_token FROM newsletter_emails "
                            + "WHERE confirm_token_hash=? AND confirm_sent_at > NOW() - INTERVAL 48 HOUR")) {
                sel.setString(1, hash);
                try (ResultSet rs = sel.executeQuery()) {
                    if (rs.next()) {
                        email = rs.getString(1);
                        unsubscribeToken = rs.getString(2);
                    }
                }
            }
            if (email == null) {
                resp.sendRedirect("/newsletter.jsp?error=confirm");
                return;
            }
            try (PreparedStatement up = c.prepareStatement(
                    "UPDATE newsletter_emails SET confirmed_at=NOW(), unsubscribed_at=NULL, confirm_token_hash=NULL WHERE email=?")) {
                up.setString(1, email);
                up.executeUpdate();
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        if (EmailUtil.isConfigured()) {
            String link = WebUtils.baseUrl() + "/newsletter/unsubscribe?token=" + unsubscribeToken;
            try {
                EmailUtil.sendMail(email,
                        I18n.getText(req, "email.newsletter.subject"),
                        I18n.getText(req, "email.newsletter.body").replace("{link}", link));
            } catch (Exception e) {
                getServletContext().log("Newsletter welcome e-mail failed for " + email, e);
            }
        }
        resp.sendRedirect("/newsletter.jsp?confirmed=1");
    }
}
