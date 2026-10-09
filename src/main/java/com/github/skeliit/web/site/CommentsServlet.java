package com.github.skeliit.web.site;

import com.github.skeliit.Db;
import com.github.skeliit.WebUtils;
import com.github.skeliit.security.RequestLimiter;
import com.github.skeliit.web.auth.EmailVerification;
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
        String flash = null; // shown on the lyric page after the redirect
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
                        CommentReportServlet.deleteReports(conn, "lyric", Integer.parseInt(cid));
                        try (PreparedStatement del = conn.prepareStatement("DELETE FROM comments WHERE id=?")) {
                            del.setInt(1, Integer.parseInt(cid));
                            del.executeUpdate();
                        }
                    }
                }
            } else if ("update".equalsIgnoreCase(action)) {
                String cid = req.getParameter("comment_id");
                String content = WebUtils.cleanComment(req.getParameter("content"));
                if (cid != null && content != null) {
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
                                .prepareStatement("UPDATE comments SET content=?, updated_at=NOW() WHERE id=?")) {
                            upd.setString(1, content);
                            upd.setInt(2, Integer.parseInt(cid));
                            upd.executeUpdate();
                        }
                    }
                }
            } else {
                String content = WebUtils.cleanComment(req.getParameter("content"));
                if (WebUtils.isBot(req)) {
                    content = null; // honeypot filled in: drop silently
                } else if (!EmailVerification.isVerified(session)) {
                    content = null;
                    flash = "verify=required";
                } else if (content != null && !RequestLimiter.tryAcquire("comment", userId, 5, RequestLimiter.MINUTE)) {
                    content = null;
                    flash = "comment=limit";
                }
                if (content != null && lyricIdStr != null && !lyricIdStr.isBlank()) {
                    int lyricId = Integer.parseInt(lyricIdStr);
                    Integer parentId = replyTarget(conn, req.getParameter("parent_id"), lyricId);
                    try (PreparedStatement ps = conn.prepareStatement(
                            "INSERT INTO comments (lyric_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)")) {
                        ps.setInt(1, lyricId);
                        ps.setInt(2, userId);
                        if (parentId == null) ps.setNull(3, java.sql.Types.INTEGER); else ps.setInt(3, parentId);
                        ps.setString(4, content);
                        ps.executeUpdate();
                    }
                }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        // Redirect back to the lyrics page
        if (lyricIdStr != null && !lyricIdStr.isBlank()) {
            resp.sendRedirect(req.getContextPath() + "/lyrics/" + lyricIdStr + (flash != null ? "?" + flash : "") + "#comments");
        } else {
            resp.sendRedirect(req.getContextPath() + "/texty.jsp");
        }
    }

    /**
     * The top-level comment a reply belongs to, or null for a new top-level comment.
     * Replies stay one level deep: answering a reply attaches to its parent.
     * A parent from another song is ignored.
     */
    static Integer replyTarget(Connection conn, String parentParam, int lyricId) throws SQLException {
        if (parentParam == null || !parentParam.matches("\\d{1,10}")) return null;
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT id, parent_id FROM comments WHERE id=? AND lyric_id=?")) {
            ps.setInt(1, Integer.parseInt(parentParam));
            ps.setInt(2, lyricId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                int parentOfParent = rs.getInt(2);
                return rs.wasNull() ? rs.getInt(1) : parentOfParent;
            }
        }
    }
}
