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

@WebServlet(name = "ForgotPasswordServlet", urlPatterns = {"/forgot"})
public class ForgotPasswordServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = req.getParameter("username");
        if (username == null) { resp.sendRedirect("forgot.jsp"); return; }
        try (Connection conn = Db.get()) {
            Integer userId = null;
            try (PreparedStatement ps = conn.prepareStatement("SELECT id FROM users WHERE username=?")) {
                ps.setString(1, username);
                try (ResultSet rs = ps.executeQuery()) { if (rs.next()) userId = rs.getInt(1); }
            }
            if (userId != null) {
                String token = generateToken();
                try (PreparedStatement ps = conn.prepareStatement("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))")) {
                    ps.setInt(1, userId);
                    ps.setString(2, token);
                    ps.executeUpdate();
                }
                // Reálně by se posílal e-mail; zobrazíme odkaz pro test.
                resp.sendRedirect("reset.jsp?token=" + token);
                return;
            }
        } catch (SQLException e) { throw new ServletException(e); }
        resp.sendRedirect("forgot.jsp");
    }
    private static String generateToken() {
        byte[] b = new byte[32]; new SecureRandom().nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
}
