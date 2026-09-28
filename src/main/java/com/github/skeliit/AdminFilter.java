package com.github.skeliit;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Admin pages: the role is read from the database on every admin request, not only at login,
 * so taking ADMIN away (or deleting the account) in the admin works immediately instead of
 * after that person logs out.
 */
public class AdminFilter implements Filter {
    @Override public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;
        HttpSession session = req.getSession(false);
        Object userId = session != null ? session.getAttribute("userId") : null;
        if (!(userId instanceof Integer id) || !"ADMIN".equals(session.getAttribute("role"))) {
            forbid(resp);
            return;
        }
        String role;
        try {
            role = currentRole(id);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        if (role == null) {                // account deleted meanwhile
            session.invalidate();
            forbid(resp);
            return;
        }
        session.setAttribute("role", role); // keeps the header menu in step too
        if (!"ADMIN".equals(role)) {
            forbid(resp);
            return;
        }
        chain.doFilter(request, response);
    }

    private static String currentRole(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT role FROM users WHERE id=?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    private static void forbid(HttpServletResponse resp) throws IOException {
        resp.setStatus(403);
        resp.getWriter().write("Forbidden");
    }
}
