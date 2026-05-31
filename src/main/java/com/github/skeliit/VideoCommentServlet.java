package com.github.skeliit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.*;

@WebServlet(name = "VideoCommentServlet", urlPatterns = { "/video-comment" })
public class VideoCommentServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String yt = req.getParameter("yt");
        if (yt == null || yt.isBlank()) {
            resp.setStatus(400);
            return;
        }
        ObjectMapper m = new ObjectMapper();
        ArrayNode arr = m.createArrayNode();
        HttpSession s = req.getSession(false);
        Integer uid = s != null ? (Integer) s.getAttribute("userId") : null;
        try (Connection c = Db.get();
                PreparedStatement ps = c.prepareStatement(
                        "SELECT vc.id, vc.content, vc.created_at, u.username, u.id AS uid, " +
                                "COALESCE(SUM(v.vote=1),0) AS up, COALESCE(SUM(v.vote=-1),0) AS down " +
                                "FROM video_comments vc JOIN users u ON u.id=vc.user_id " +
                                "LEFT JOIN video_comment_votes v ON v.comment_id=vc.id " +
                                "WHERE vc.youtube_id=? GROUP BY vc.id ORDER BY vc.created_at DESC")) {
            ps.setString(1, yt);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ObjectNode o = m.createObjectNode();
                    o.put("id", rs.getInt("id"));
                    o.put("content", rs.getString("content"));
                    o.put("createdAt", String.valueOf(rs.getTimestamp("created_at")));
                    o.put("user", rs.getString("username"));
                    o.put("up", rs.getInt("up"));
                    o.put("down", rs.getInt("down"));
                    o.put("mine", uid != null && uid == rs.getInt("uid"));
                    arr.add(o);
                }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.setContentType("application/json; charset=UTF-8");
        resp.getWriter().write(arr.toString());
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession s = req.getSession(false);
        if (s == null || s.getAttribute("userId") == null) {
            resp.setStatus(401);
            return;
        }
        int userId = (int) s.getAttribute("userId");
        String csrf = req.getParameter("csrf");
        Object sc = s.getAttribute("csrf");
        if (sc != null && (csrf == null || !sc.equals(csrf))) {
            resp.setStatus(400);
            return;
        }
        String action = req.getParameter("action");
        try (Connection c = Db.get()) {
            switch (action == null ? "" : action) {
                case "add": {
                    String yt = req.getParameter("yt");
                    String content = req.getParameter("content");
                    if (yt == null || content == null || content.isBlank()) {
                        resp.setStatus(400);
                        return;
                    }
                    try (PreparedStatement ps = c.prepareStatement(
                            "INSERT INTO video_comments(user_id, youtube_id, content) VALUES(?,?,?)")) {
                        ps.setInt(1, userId);
                        ps.setString(2, yt);
                        ps.setString(3, content);
                        ps.executeUpdate();
                    }
                    break;
                }
                case "update": {
                    int id = Integer.parseInt(req.getParameter("comment_id"));
                    String content = req.getParameter("content");
                    try (PreparedStatement ps = c
                            .prepareStatement("UPDATE video_comments SET content=? WHERE id=? AND user_id=?")) {
                        ps.setString(1, content);
                        ps.setInt(2, id);
                        ps.setInt(3, userId);
                        ps.executeUpdate();
                    }
                    break;
                }
                case "delete": {
                    int id = Integer.parseInt(req.getParameter("comment_id"));
                    try (PreparedStatement ps = c
                            .prepareStatement("DELETE FROM video_comments WHERE id=? AND user_id=?")) {
                        ps.setInt(1, id);
                        ps.setInt(2, userId);
                        ps.executeUpdate();
                    }
                    break;
                }
                case "vote": {
                    int id = Integer.parseInt(req.getParameter("comment_id"));
                    String v = req.getParameter("vote");
                    int val = "up".equals(v) ? 1 : -1;
                    try (PreparedStatement ps = c.prepareStatement(
                            "INSERT INTO video_comment_votes(comment_id,user_id,vote) VALUES(?,?,?) ON DUPLICATE KEY UPDATE vote=VALUES(vote)")) {
                        ps.setInt(1, id);
                        ps.setInt(2, userId);
                        ps.setInt(3, val);
                        ps.executeUpdate();
                    }
                    break;
                }
                default:
                    resp.setStatus(400);
                    return;
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.setContentType("application/json; charset=UTF-8");
        resp.getWriter().write("{\"ok\":true}");
    }
}
