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

@WebServlet(name = "NewsletterSubscribeServlet", urlPatterns = {"/newsletter/subscribe"})
public class NewsletterSubscribeServlet extends HttpServlet {
    private static final SecureRandom random = new SecureRandom();

    private static String generateToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String email = req.getParameter("email");
        if (email == null || email.isBlank()) {
            resp.sendRedirect("/newsletter.jsp?error=missing");
            return;
        }
        String token = generateToken();
        try (Connection conn = Db.get()) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO newsletter_emails (email, unsubscribe_token) VALUES (?, ?) ON DUPLICATE KEY UPDATE unsubscribed_at=NULL, unsubscribe_token=?")) {
                ps.setString(1, email);
                ps.setString(2, token);
                ps.setString(3, token);
                ps.executeUpdate();
            }
            // Send confirmation email with unsubscribe link
            String link = req.getRequestURL().toString().replace("/newsletter/subscribe", "/newsletter/unsubscribe") + "?token=" + token;
            String subject = "Potvrzení odběru novinek";
            String body = "Děkujeme za přihlášení k odběru novinek.\n" +
                    "Pokud si přejete odběr zrušit a vymazat svůj e-mail, klikněte zde: " + link + "\n\n" +
                    "Vaše adresa bude použita pouze pro zasílání novinek. Kdykoli se můžete odhlásit.";
            try {
                EmailUtil.sendMail(email, subject, body);
            } catch (Exception e) {
                // Log error, but do not fail subscription
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect("/newsletter.jsp?success=1");
    }
}
