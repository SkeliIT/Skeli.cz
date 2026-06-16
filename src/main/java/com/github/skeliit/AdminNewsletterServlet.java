package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@WebServlet(name = "AdminNewsletterServlet", urlPatterns = {"/admin/newsletter"})
public class AdminNewsletterServlet extends HttpServlet {
    private Connection getConn() throws SQLException {
        return Db.get();
    }
    private boolean isAdmin(HttpSession s){ return s!=null && "ADMIN".equals(s.getAttribute("role")); }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req.getSession(false))) { resp.sendError(403); return; }
        List<String[]> emails = new ArrayList<>();
        try (Connection conn = getConn();
             PreparedStatement ps = conn.prepareStatement("SELECT email, subscribed_at, unsubscribed_at FROM newsletter_emails ORDER BY subscribed_at DESC");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                emails.add(new String[]{rs.getString(1), String.valueOf(rs.getTimestamp(2)), String.valueOf(rs.getTimestamp(3))});
            }
        } catch (SQLException e) { throw new ServletException(e); }
        req.setAttribute("emails", emails);
        req.getRequestDispatcher("/admin_newsletter.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req.getSession(false))) { resp.sendError(403); return; }
        String email = req.getParameter("email");
        if (email != null && !email.isBlank()) {
            try (Connection conn = getConn();
                 PreparedStatement ps = conn.prepareStatement("DELETE FROM newsletter_emails WHERE email=?")) {
                ps.setString(1, email);
                ps.executeUpdate();
            } catch (SQLException e) { throw new ServletException(e); }
        }
        resp.sendRedirect("/admin/newsletter");
    }
}
