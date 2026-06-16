package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

@WebServlet(name = "NewsletterUnsubscribeServlet", urlPatterns = {"/newsletter/unsubscribe"})
public class NewsletterUnsubscribeServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String token = req.getParameter("token");
        if (token == null || token.isBlank()) {
            resp.sendRedirect("/newsletter.jsp?error=token");
            return;
        }
        try (Connection conn = Db.get();
             PreparedStatement ps = conn.prepareStatement("UPDATE newsletter_emails SET unsubscribed_at=NOW() WHERE unsubscribe_token=?")) {
            ps.setString(1, token);
            int updated = ps.executeUpdate();
            if (updated > 0) {
                resp.sendRedirect("/newsletter.jsp?unsubscribed=1");
            } else {
                resp.sendRedirect("/newsletter.jsp?error=notfound");
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }
}
