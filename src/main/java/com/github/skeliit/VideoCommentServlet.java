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
        boolean admin = s != null && "ADMIN".equals(s.getAttribute("role"));
        String lang = I18n.safeLang(s != null ? s.getAttribute("lang") : null);
        try (Connection c = Db.get();
                PreparedStatement ps = c.prepareStatement(
                        "SELECT vc.id, vc.parent_id, vc.content, vc.created_at, vc.updated_at, u.username, u.avatar_url, u.role, u.id AS uid, " +
                                "COALESCE(SUM(v.vote=1),0) AS up, COALESCE(SUM(v.vote=-1),0) AS down " +
                                "FROM video_comments vc JOIN users u ON u.id=vc.user_id " +
                                "LEFT JOIN video_comment_votes v ON v.comment_id=vc.id " +
                                "WHERE vc.youtube_id=? GROUP BY vc.id ORDER BY vc.created_at DESC, vc.id DESC")) {
            ps.setString(1, yt);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ObjectNode o = m.createObjectNode();
                    o.put("id", rs.getInt("id"));
                    int parent = rs.getInt("parent_id");
                    if (rs.wasNull()) o.putNull("parentId"); else o.put("parentId", parent);
                    o.put("content", rs.getString("content"));
                    o.put("createdAt", WebUtils.formatDateTime(rs.getTimestamp("created_at"), lang));
                    o.put("edited", rs.getTimestamp("updated_at") != null);
                    // a deleted account: no name, no avatar
                    boolean gone = "DELETED".equals(rs.getString("role"));
                    o.put("user", gone ? I18n.getText(req, "account.deleted") : rs.getString("username"));
                    o.put("avatar", gone ? "" : WebUtils.safeUrl(rs.getString("avatar_url"), ""));
                    o.put("up", rs.getInt("up"));
                    o.put("down", rs.getInt("down"));
                    boolean mine = uid != null && uid == rs.getInt("uid");
                    o.put("mine", mine);
                    // the author and admins may edit or delete
                    o.put("canEdit", mine || admin);
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
        boolean admin = "ADMIN".equals(s.getAttribute("role"));
        if (!CsrfFilter.isValid(req)) {
            resp.setStatus(400);
            return;
        }
        String action = req.getParameter("action");
        try (Connection c = Db.get()) {
            switch (action == null ? "" : action) {
                case "add": {
                    String yt = req.getParameter("yt");
                    String content = WebUtils.cleanComment(req.getParameter("content"));
                    if (yt == null || content == null) {
                        resp.setStatus(400);
                        return;
                    }
                    if (!EmailVerification.isVerified(s)) {
                        resp.setStatus(403);
                        return;
                    }
                    if (!RequestLimiter.tryAcquire("comment", userId, 5, RequestLimiter.MINUTE)) {
                        resp.setStatus(429);
                        return;
                    }
                    Integer parentId = replyTarget(c, req.getParameter("parent_id"), yt);
                    try (PreparedStatement ps = c.prepareStatement(
                            "INSERT INTO video_comments(user_id, parent_id, youtube_id, content) VALUES(?,?,?,?)")) {
                        ps.setInt(1, userId);
                        if (parentId == null) ps.setNull(2, Types.INTEGER); else ps.setInt(2, parentId);
                        ps.setString(3, yt);
                        ps.setString(4, content);
                        ps.executeUpdate();
                    }
                    break;
                }
                case "update": {
                    int id = Integer.parseInt(req.getParameter("comment_id"));
                    String content = WebUtils.cleanComment(req.getParameter("content"));
                    if (content == null) {
                        resp.setStatus(400);
                        return;
                    }
                    try (PreparedStatement ps = c.prepareStatement(
                            "UPDATE video_comments SET content=? WHERE id=? AND (user_id=? OR ?)")) {
                        ps.setString(1, content);
                        ps.setInt(2, id);
                        ps.setInt(3, userId);
                        ps.setBoolean(4, admin);
                        ps.executeUpdate();
                    }
                    break;
                }
                case "delete": {
                    int id = Integer.parseInt(req.getParameter("comment_id"));
                    boolean deleted;
                    try (PreparedStatement ps = c
                            .prepareStatement("DELETE FROM video_comments WHERE id=? AND (user_id=? OR ?)")) {
                        ps.setInt(1, id);
                        ps.setInt(2, userId);
                        ps.setBoolean(3, admin);
                        deleted = ps.executeUpdate() > 0;
                    }
                    if (deleted) {
                        try (PreparedStatement ps = c.prepareStatement("DELETE FROM video_comment_votes WHERE comment_id=?")) {
                            ps.setInt(1, id);
                            ps.executeUpdate();
                        }
                        CommentReportServlet.deleteReports(c, "video", id);
                    }
                    break;
                }
                case "vote": {
                    int id = Integer.parseInt(req.getParameter("comment_id"));
                    String v = req.getParameter("vote");
                    int val = "up".equals(v) ? 1 : -1;
                    if (!EmailVerification.isVerified(s)) {
                        resp.setStatus(403);
                        return;
                    }
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

    /** Top-level comment a reply attaches to (one level deep), or null. Must be on the same video. */
    private static Integer replyTarget(Connection c, String parentParam, String yt) throws SQLException {
        if (parentParam == null || !parentParam.matches("\\d{1,10}")) return null;
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT id, parent_id FROM video_comments WHERE id=? AND youtube_id=?")) {
            ps.setInt(1, Integer.parseInt(parentParam));
            ps.setString(2, yt);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                int parentOfParent = rs.getInt(2);
                return rs.wasNull() ? rs.getInt(1) : parentOfParent;
            }
        }
    }
}
