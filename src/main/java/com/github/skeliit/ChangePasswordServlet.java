package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.sql.*;

public class ChangePasswordServlet extends HttpServlet {
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user_id") == null) {
            resp.sendRedirect("/login.jsp");
            return;
        }
        
        int userId = (int) session.getAttribute("user_id");
        String oldPassword = req.getParameter("old_password");
        String newPassword = req.getParameter("new_password");
        String confirmPassword = req.getParameter("confirm_password");
        
        // Validace
        if (oldPassword == null || oldPassword.trim().isEmpty() ||
            newPassword == null || newPassword.trim().isEmpty() ||
            confirmPassword == null || confirmPassword.trim().isEmpty()) {
            resp.sendRedirect("/uzivatel.jsp?error=empty");
            return;
        }
        
        if (!newPassword.equals(confirmPassword)) {
            resp.sendRedirect("/uzivatel.jsp?error=mismatch");
            return;
        }
        
        java.util.Set<String> problems = WebUtils.passwordProblems(newPassword);
        if (!problems.isEmpty()) {
            String code = problems.contains("invalid") ? "invalid_chars" : problems.contains("long") ? "too_long" : "short";
            resp.sendRedirect("/uzivatel.jsp?error=" + code);
            return;
        }
        if (PwnedPasswords.breachCount(newPassword) > 0) {
            resp.sendRedirect("/uzivatel.jsp?error=pwned");
            return;
        }
        
        try (Connection conn = Db.get()) {
            // Ověř staré heslo
            String selectSql = "SELECT password_hash FROM users WHERE id = ?";
            String currentHash;
            try (PreparedStatement ps = conn.prepareStatement(selectSql)) {
                ps.setInt(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        resp.sendRedirect("/uzivatel.jsp?error=user_not_found");
                        return;
                    }
                    currentHash = rs.getString("password_hash");
                }
            }
            
            // Zkontroluj staré heslo
            if (!BCrypt.checkpw(oldPassword, currentHash)) {
                resp.sendRedirect("/uzivatel.jsp?error=wrong_old");
                return;
            }
            
            // Updatuj nové heslo
            String newHash = BCrypt.hashpw(newPassword, BCrypt.gensalt(12));
            String updateSql = "UPDATE users SET password_hash = ? WHERE id = ?";
            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setString(1, newHash);
                ps.setInt(2, userId);
                ps.executeUpdate();
            }
            // anyone else signed in with the old password is signed out (this device stays)
            SessionRegistry.signOut(userId, req.getSession(false));

            resp.sendRedirect("/uzivatel.jsp?password_changed=true");
        } catch (SQLException e) {
            throw new ServletException("Database error", e);
        }
    }
}
