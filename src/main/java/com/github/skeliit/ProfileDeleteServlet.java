package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.*;
import java.util.UUID;

@WebServlet(name = "ProfileDeleteServlet", urlPatterns = { "/profile/delete" })
public class ProfileDeleteServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession s = req.getSession(false);
        if (s == null || s.getAttribute("userId") == null) {
            resp.sendRedirect("/login.jsp");
            return;
        }
        String confirm = req.getParameter("confirm");
        if (confirm == null || !"DELETE".equalsIgnoreCase(confirm.trim())) {
            resp.sendRedirect("/uzivatel.jsp?confirm=required");
            return;
        }
        int uid = (int) s.getAttribute("userId");
        try (Connection c = Db.get()) {
            // Minimal safe soft-delete: anonymize username, drop role
            String anon = "deleted_" + UUID.randomUUID().toString().substring(0, 8);
            try (PreparedStatement ps = c
                    .prepareStatement("UPDATE users SET username=?, email=NULL, role='DELETED' WHERE id=?")) {
                ps.setString(1, anon);
                ps.setInt(2, uid);
                ps.executeUpdate();
            }
            try (PreparedStatement ps = c
                    .prepareStatement("UPDATE user_profiles SET display_name=NULL, bio=NULL WHERE user_id=?")) {
                ps.setInt(1, uid);
                ps.executeUpdate();
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        if (s != null)
            s.invalidate();
        resp.sendRedirect("/index.jsp?account=deleted");
    }
}
