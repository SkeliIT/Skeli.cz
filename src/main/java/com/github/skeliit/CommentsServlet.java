package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.*;

@WebServlet(name = "CommentsServlet", urlPatterns = { "/comment" })
public class CommentsServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        HttpSession session = req.getSession(false);
        Integer userId = (session != null) ? (Integer) session.getAttribute("userId") : null;
        if (userId == null && session != null) {
            // fallback: try to resolve from username if session cookie persisted but id
            // missing
            String uname = (String) session.getAttribute("username");
            if (uname != null) {
                try (Connection c = Db.get();
                        PreparedStatement p = c.prepareStatement("SELECT id FROM users WHERE username=?")) {
                    p.setString(1, uname);
                    try (ResultSet r = p.executeQuery()) {
                        if (r.next())
                            userId = r.getInt(1);
                    }
                } catch (SQLException ignored) {
                }
            }
        }
        if (userId == null) {
            resp.sendRedirect("login.jsp");
            return;
        }
        String action = req.getParameter("action");
        String lyricIdStr = req.getParameter("lyric_id");
        String uname = session != null ? (String) session.getAttribute("username") : null;
        try (Connection conn = Db.get()) {
            if ((lyricIdStr == null || lyricIdStr.isBlank())) {
                String cid = req.getParameter("comment_id");
                if (cid != null) {
                    try (PreparedStatement q = conn.prepareStatement("SELECT lyric_id FROM comments WHERE id=?")) {
                        q.setInt(1, Integer.parseInt(cid));
                        try (ResultSet rs = q.executeQuery()) {
                            if (rs.next())
                                lyricIdStr = String.valueOf(rs.getInt(1));
                        }
                    }
                }
            }
            if (lyricIdStr == null) {
                lyricIdStr = "";
            }
            if ("delete".equalsIgnoreCase(action)) {
                String cid = req.getParameter("comment_id");
                if (cid != null) {
                    boolean allow = false;
                    String role = (String) session.getAttribute("role");
                    try (PreparedStatement chk = conn.prepareStatement("SELECT user_id FROM comments WHERE id=?")) {
                        chk.setInt(1, Integer.parseInt(cid));
                        try (ResultSet rs = chk.executeQuery()) {
                            if (rs.next()) {
                                int owner = rs.getInt(1);
                                allow = (owner == userId) || "ADMIN".equals(role);
                                if (!allow && uname != null) {
                                    try (PreparedStatement q = conn
                                            .prepareStatement("SELECT id FROM users WHERE username=?")) {
                                        q.setString(1, uname);
                                        try (ResultSet ru = q.executeQuery()) {
                                            if (ru.next())
                                                allow = (ru.getInt(1) == owner);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (allow) {
                        try (PreparedStatement del = conn.prepareStatement("DELETE FROM comments WHERE id=?")) {
                            del.setInt(1, Integer.parseInt(cid));
                            del.executeUpdate();
                        }
                    }
                }
            } else if ("update".equalsIgnoreCase(action)) {
                String cid = req.getParameter("comment_id");
                String content = req.getParameter("content");
                if (cid != null && content != null && !content.isBlank()) {
                    boolean allow = false;
                    String role = (String) session.getAttribute("role");
                    try (PreparedStatement chk = conn.prepareStatement("SELECT user_id FROM comments WHERE id=?")) {
                        chk.setInt(1, Integer.parseInt(cid));
                        try (ResultSet rs = chk.executeQuery()) {
                            if (rs.next()) {
                                int owner = rs.getInt(1);
                                allow = (owner == userId) || "ADMIN".equals(role);
                                if (!allow && uname != null) {
                                    try (PreparedStatement q = conn
                                            .prepareStatement("SELECT id FROM users WHERE username=?")) {
                                        q.setString(1, uname);
                                        try (ResultSet ru = q.executeQuery()) {
                                            if (ru.next())
                                                allow = (ru.getInt(1) == owner);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (allow) {
                        try (PreparedStatement upd = conn
                                .prepareStatement("UPDATE comments SET content=? WHERE id=?")) {
                            upd.setString(1, content);
                            upd.setInt(2, Integer.parseInt(cid));
                            upd.executeUpdate();
                        }
                    }
                }
            } else {
                String content = req.getParameter("content");
                if (content != null && !content.isBlank() && lyricIdStr != null && !lyricIdStr.isBlank()) {
                    try (PreparedStatement ps = conn
                            .prepareStatement("INSERT INTO comments (lyric_id, user_id, content) VALUES (?, ?, ?)")) {
                        ps.setInt(1, Integer.parseInt(lyricIdStr));
                        ps.setInt(2, userId);
                        ps.setString(3, content);
                        ps.executeUpdate();
                    }
                }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        // Redirect back to the lyrics page
        if (lyricIdStr != null && !lyricIdStr.isBlank()) {
            resp.sendRedirect(req.getContextPath() + "/lyrics/" + lyricIdStr);
        } else {
            resp.sendRedirect(req.getContextPath() + "/texty.jsp");
        }
    }
}
