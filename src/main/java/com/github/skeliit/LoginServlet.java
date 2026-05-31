package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.sql.*;

@WebServlet(name = "LoginServlet", urlPatterns = {"/login"})
public class LoginServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.sendRedirect("login.jsp");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = req.getParameter("username");
        String password = req.getParameter("password");
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            req.setAttribute("loginError", I18n.getText(req, "auth.error.fillAll", "Vyplňte prosím jméno i heslo."));
            req.setAttribute("username", username);
            req.getRequestDispatcher("/login.jsp").forward(req, resp);
            return;
        }
        try (Connection conn = Db.get();
             PreparedStatement ps = conn.prepareStatement("SELECT id, password_hash, role FROM users WHERE username = ?")) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    String hash = rs.getString("password_hash");
                    if (hash != null && BCrypt.checkpw(password, hash)) {
                        HttpSession session = req.getSession(true);
                        int uid = rs.getInt("id");
                        session.setAttribute("userId", uid);
                        session.setAttribute("user_id", uid); // for legacy JSP/servlets expecting user_id
                        session.setAttribute("username", username);
                        session.setAttribute("role", rs.getString("role"));
                        // remember me (persistent JSESSIONID)
                        if ("1".equals(req.getParameter("remember"))) {
                            session.setMaxInactiveInterval(60*60*24*30); // 30 dní
                            jakarta.servlet.http.Cookie c = new jakarta.servlet.http.Cookie("JSESSIONID", session.getId());
                            c.setHttpOnly(true);
                            c.setPath(req.getContextPath().isEmpty() ? "/" : req.getContextPath());
                            c.setMaxAge(60*60*24*30);
                            resp.addCookie(c);
                        }
                        resp.sendRedirect("index.jsp");
                        return;
                    }
                }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        req.setAttribute("loginError", I18n.getText(req, "auth.error.invalidCredentials", "Neplatné uživatelské jméno nebo heslo."));
        req.setAttribute("username", username);
        req.getRequestDispatcher("/login.jsp").forward(req, resp);
    }
}
