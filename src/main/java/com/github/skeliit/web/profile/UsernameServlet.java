package com.github.skeliit.web.profile;

import com.github.skeliit.Db;
import com.github.skeliit.security.RequestLimiter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Změna uživatelského jména (to, které je vidět u komentářů a v hlavičce) – i pro účty založené přes Google.
 * Stejná pravidla jako při registraci, jméno nesmí být obsazené ani se vydávat za Skeliho, admina nebo Kevina,
 * nejvýš 3 změny za den. Výsledek: /nastaveni.jsp?name=ok|taken|invalid|reserved|limit#profil
 */
@WebServlet(name = "UsernameServlet", urlPatterns = {"/profile/username"})
public class UsernameServlet extends HttpServlet {
    static final Pattern USERNAME = Pattern.compile("^[A-Za-z0-9._-]{3,50}$");

    /** Jména, která by mátla (vydávala se za umělce, správce nebo maskota). */
    static boolean reserved(String name) {
        String n = name.toLowerCase(Locale.ROOT).replaceAll("[._-]", "");
        return n.contains("skeli") || n.contains("admin") || n.contains("moderator") || n.equals("kevin") || n.startsWith("kevin")
                || n.contains("skelosquad") || n.equals("deleted");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user_id") == null) {
            resp.sendRedirect("/login.jsp?next=/nastaveni.jsp");
            return;
        }
        int userId = (int) session.getAttribute("user_id");
        String name = req.getParameter("username");
        name = name == null ? "" : name.trim();
        String result;
        if (name.equals(session.getAttribute("username"))) result = "ok";
        else if (!USERNAME.matcher(name).matches()) result = "invalid";
        else if (reserved(name)) result = "reserved";
        else if (!RequestLimiter.tryAcquire("username-change", userId, 3, 24 * RequestLimiter.HOUR)) result = "limit";
        else {
            try (Connection c = Db.get()) {
                try (PreparedStatement ps = c.prepareStatement("SELECT id FROM users WHERE username = ? AND id <> ?")) {
                    ps.setString(1, name);
                    ps.setInt(2, userId);
                    try (ResultSet rs = ps.executeQuery()) { result = rs.next() ? "taken" : null; }
                }
                if (result == null) {
                    try (PreparedStatement ps = c.prepareStatement("UPDATE users SET username = ? WHERE id = ?")) {
                        ps.setString(1, name);
                        ps.setInt(2, userId);
                        ps.executeUpdate();
                    }
                    session.setAttribute("username", name);
                    result = "ok";
                }
            } catch (SQLException e) {
                // jméno mezitím obsadil někdo jiný (unikátní klíč) – jinak opravdová chyba
                if ("23000".equals(e.getSQLState())) result = "taken";
                else throw new ServletException(e);
            }
        }
        resp.sendRedirect("/nastaveni.jsp?name=" + result + "#profil");
    }
}
