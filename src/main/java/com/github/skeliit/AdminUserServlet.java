package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.*;

@WebServlet(name = "AdminUserServlet", urlPatterns = { "/admin/users" })
public class AdminUserServlet extends HttpServlet {
    private boolean isAdmin(HttpSession s) {
        return s != null && "ADMIN".equals(s.getAttribute("role"));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req.getSession(false))) {
            resp.sendError(403);
            return;
        }
        String action = req.getParameter("action");
        String id = req.getParameter("user_id");
        if (id == null) {
            resp.sendRedirect("/admin_users.jsp");
            return;
        }
        try (Connection conn = Db.get()) {
            if ("role".equals(action)) {
                String role = req.getParameter("role");
                if ("ADMIN".equals(role) || "USER".equals(role)) {
                    try (PreparedStatement ps = conn.prepareStatement("UPDATE users SET role=? WHERE id=?")) {
                        ps.setString(1, role);
                        ps.setInt(2, Integer.parseInt(id));
                        ps.executeUpdate();
                    }
                }
            } else if ("delete".equals(action)) {
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM users WHERE id=?")) {
                    ps.setInt(1, Integer.parseInt(id));
                    ps.executeUpdate();
                }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect("/admin_users.jsp");
    }
}
