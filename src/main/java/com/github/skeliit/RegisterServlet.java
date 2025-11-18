package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.net.URI;
import java.security.SecureRandom;
import java.sql.*;
import java.util.Base64;
import java.util.Properties;

import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

@WebServlet(name = "RegisterServlet", urlPatterns = {"/register"})
public class RegisterServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.sendRedirect("register.jsp");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = req.getParameter("username");
        String email = req.getParameter("email");
        String password = req.getParameter("password");
        String password2 = req.getParameter("password2");
        String consent = req.getParameter("consent");
        if (username == null || password == null || password2 == null || !password.equals(password2) || consent == null) {
            resp.sendRedirect("register.jsp");
            return;
        }
        String hash = BCrypt.hashpw(password, BCrypt.gensalt());
        Integer newUserId = null;
        try (Connection conn = Db.get();
             PreparedStatement ps = conn.prepareStatement("INSERT INTO users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, 'USER', NOW())", Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, username);
            ps.setString(2, email);
            ps.setString(3, hash);
            ps.executeUpdate();
            try (ResultSet gk = ps.getGeneratedKeys()) { if (gk.next()) newUserId = gk.getInt(1); }
            // create password reset token to include in email
            if (newUserId != null) {
                String token = generateToken();
                try (PreparedStatement ps2 = conn.prepareStatement("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?,?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))")) {
                    ps2.setInt(1, newUserId);
                    ps2.setString(2, token);
                    ps2.executeUpdate();
                }
                try { sendMail(email, buildSubject(), buildBody(req, token)); } catch (Exception mailErr) { /* ignore mail errors */ }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect("login.jsp");
    }

    private static String generateToken() {
        byte[] b = new byte[32]; new SecureRandom().nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private static String buildSubject() { return "Registrace dokončena"; }
    private static String buildBody(HttpServletRequest req, String token) {
        String base = req.getRequestURL().toString().replace(req.getRequestURI(), req.getContextPath());
        String resetLink = base + "/reset.jsp?token=" + token;
        return "Díky za registraci!\n\nPokud chcete změnit heslo, použijte tento odkaz (platí 30 min):\n" + resetLink + "\n";
    }
    private static void sendMail(String to, String subject, String text) throws Exception {
        if (to == null || to.isBlank()) return;
        String host = System.getenv("MAIL_HOST");
        String user = System.getenv("MAIL_USER");
        String pass = System.getenv("MAIL_PASS");
        String port = System.getenv("MAIL_PORT"); if (port == null) port = "587";
        if (host == null || user == null || pass == null) return; // not configured
        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", host);
        props.put("mail.smtp.port", port);
        Session session = Session.getInstance(props);
        Message msg = new MimeMessage(session);
        msg.setFrom(new InternetAddress(user));
        msg.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to));
        msg.setSubject(subject);
        msg.setText(text);
        Transport.send(msg, user, pass);
    }
}
