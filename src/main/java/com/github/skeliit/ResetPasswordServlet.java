package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.sql.*;

@WebServlet(name = "ResetPasswordServlet", urlPatterns = {"/reset"})
public class ResetPasswordServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String token = req.getParameter("token");
        String password = req.getParameter("password");
        if (token == null || password == null || password.length() < 8) { resp.sendRedirect("reset.jsp?token="+token); return; }
        try (Connection conn = Db.get()) {
            Integer userId = null;
            try (PreparedStatement ps = conn.prepareStatement("SELECT user_id FROM password_resets WHERE token=? AND expires_at>NOW()")) {
                ps.setString(1, token);
                try (ResultSet rs = ps.executeQuery()) { if (rs.next()) userId = rs.getInt(1); }
            }
            if (userId != null) {
                String hash = BCrypt.hashpw(password, BCrypt.gensalt());
                try (PreparedStatement ps = conn.prepareStatement("UPDATE users SET password_hash=? WHERE id=?")) {
                    ps.setString(1, hash);
                    ps.setInt(2, userId);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM password_resets WHERE token=?")) {
                    ps.setString(1, token);
                    ps.executeUpdate();
                }
                resp.sendRedirect("login.jsp");
                return;
            }
        } catch (SQLException e) { throw new ServletException(e); }
        resp.sendRedirect("forgot.jsp");
    }
}
