package com.github.skeliit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;

@WebServlet(name = "ProfileExportServlet", urlPatterns = { "/profile/export" })
public class ProfileExportServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession s = req.getSession(false);
        if (s == null || s.getAttribute("userId") == null) {
            resp.sendRedirect("/login.jsp");
            return;
        }
        int uid = (int) s.getAttribute("userId");
        ObjectMapper m = new ObjectMapper();
        ObjectNode root = m.createObjectNode();
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c
                    .prepareStatement("SELECT id, username, email, role, created_at FROM users WHERE id=?")) {
                ps.setInt(1, uid);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        ObjectNode u = root.putObject("user");
                        u.put("id", rs.getInt(1));
                        u.put("username", rs.getString(2));
                        u.put("email", rs.getString(3));
                        u.put("role", rs.getString(4));
                        u.put("created_at", String.valueOf(rs.getTimestamp(5)));
                    }
                }
            }
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT display_name, age, city, bio, theme, lang, visible FROM user_profiles WHERE user_id=?")) {
                ps.setInt(1, uid);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        ObjectNode p = root.putObject("profile");
                        p.put("display_name", rs.getString(1));
                        if (rs.getObject(2) != null)
                            p.put("age", rs.getInt(2));
                        p.put("city", rs.getString(3));
                        p.put("bio", rs.getString(4));
                        p.put("theme", rs.getString(5));
                        p.put("lang", rs.getString(6));
                        p.put("visible", rs.getBoolean(7));
                    }
                }
            }
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT lyric_id, content, created_at FROM comments WHERE user_id=? ORDER BY created_at DESC LIMIT 500")) {
                ps.setInt(1, uid);
                try (ResultSet rs = ps.executeQuery()) {
                    var arr = root.putArray("comments");
                    while (rs.next()) {
                        ObjectNode o = m.createObjectNode();
                        o.put("lyric_id", rs.getInt(1));
                        o.put("content", rs.getString(2));
                        o.put("created_at", String.valueOf(rs.getTimestamp(3)));
                        arr.add(o);
                    }
                }
            }
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT video_id, created_at FROM favorites WHERE user_id=? ORDER BY created_at DESC")) {
                ps.setInt(1, uid);
                try (ResultSet rs = ps.executeQuery()) {
                    var arr = root.putArray("favorites");
                    while (rs.next()) {
                        ObjectNode o = m.createObjectNode();
                        o.put("video_id", rs.getString(1));
                        o.put("created_at", String.valueOf(rs.getTimestamp(2)));
                        arr.add(o);
                    }
                }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        byte[] bytes = m.writerWithDefaultPrettyPrinter().writeValueAsBytes(root);
        resp.setContentType("application/json; charset=UTF-8");
        resp.setHeader("Content-Disposition", "attachment; filename=skeli_profile_" + uid + ".json");
        resp.getOutputStream().write(bytes);
    }
}
