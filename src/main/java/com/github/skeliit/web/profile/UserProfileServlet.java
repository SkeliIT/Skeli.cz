package com.github.skeliit.web.profile;

import com.github.skeliit.Db;
import com.github.skeliit.I18n;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.*;

@WebServlet(name = "UserProfileServlet", urlPatterns = {"/profile/update"})
public class UserProfileServlet extends HttpServlet {
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("user_id") == null) {
            resp.sendRedirect("/login.jsp");
            return;
        }
        
        int userId = (int) session.getAttribute("user_id");
        String displayName = req.getParameter("display_name");
        String ageStr = req.getParameter("age");
        String city = req.getParameter("city");
        String bio = req.getParameter("bio");
        String theme = req.getParameter("theme");
        String lang = I18n.safeLang(req.getParameter("lang"));
        boolean visible = "1".equals(req.getParameter("public_profile")) || "on".equalsIgnoreCase(req.getParameter("public_profile"));
        
        Integer age = null;
        if (ageStr != null && !ageStr.trim().isEmpty()) {
            try {
                age = Integer.parseInt(ageStr);
                if (age < 1 || age > 120) age = null;
            } catch (NumberFormatException e) {
                age = null;
            }
        }
        
        try (Connection conn = Db.get()) {
            // Insert or update
            String sql = "INSERT INTO user_profiles (user_id, display_name, age, city, bio, theme, lang, visible) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                        "ON DUPLICATE KEY UPDATE " +
                        "display_name=VALUES(display_name), age=VALUES(age), city=VALUES(city), " +
                        "bio=VALUES(bio), theme=VALUES(theme), lang=VALUES(lang), visible=VALUES(visible)";
            
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, userId);
                ps.setString(2, displayName);
                if (age != null) {
                    ps.setInt(3, age);
                } else {
                    ps.setNull(3, Types.INTEGER);
                }
                ps.setString(4, city);
                ps.setString(5, bio);
                ps.setString(6, theme != null ? theme : "dark");
                ps.setString(7, lang);
                ps.setBoolean(8, visible);
                ps.executeUpdate();
            }
            
            // výstavka: oblíbený song (jen existující píseň) a moto (max 160 znaků, prázdné = nic)
            String fav = req.getParameter("fav_song"), motto = req.getParameter("motto");
            motto = motto == null ? null : motto.replaceAll("\\s+", " ").trim();
            if (motto != null && motto.length() > 160) motto = motto.substring(0, 160);
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE user_profiles SET fav_song_uuid = (SELECT uuid FROM songs WHERE BINARY uuid = BINARY ? LIMIT 1), motto = ?, motto_font = ? WHERE user_id = ?")) {
                String font = req.getParameter("motto_font");
                ps.setString(1, fav == null || fav.isBlank() ? null : fav);
                ps.setString(2, motto == null || motto.isEmpty() ? null : motto);
                ps.setString(3, com.github.skeliit.dao.UserDao.MOTTO_FONTS.contains(font) ? font : "brush");
                ps.setInt(4, userId);
                ps.executeUpdate();
            }

            session.setAttribute("lang", lang);
            
            resp.sendRedirect("/nastaveni.jsp?saved=true#profil");
        } catch (SQLException e) {
            throw new ServletException("Database error", e);
        }
    }
}
