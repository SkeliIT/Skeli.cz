package com.github.skeliit.web.site;

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

/**
 * POST /comment/report — a logged-in user flags someone else's comment as inappropriate.
 * Parameters: kind ("lyric" or "video") and comment_id. Each user can report a comment once;
 * admins see the reports on admin.jsp and delete the comment or dismiss the reports.
 * Answers JSON ({"ok": true}); js/comments.js shows the thank-you note.
 */
@WebServlet(name = "CommentReportServlet", urlPatterns = {"/comment/report"})
public class CommentReportServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        Integer userId = session != null ? (Integer) session.getAttribute("userId") : null;
        String kind = "video".equals(req.getParameter("kind")) ? "video" : "lyric";
        String idParam = req.getParameter("comment_id");
        if (userId == null) {
            respond(resp, 401);
            return;
        }
        if (idParam == null || !idParam.matches("\\d{1,10}")) {
            respond(resp, 400);
            return;
        }
        int commentId = Integer.parseInt(idParam);
        String table = "video".equals(kind) ? "video_comments" : "comments";
        int status = 200;
        try (Connection c = Db.get()) {
            Integer authorId = null;
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT user_id FROM " + table + " WHERE id=?")) {
                ps.setInt(1, commentId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) authorId = rs.getInt(1);
                }
            }
            if (authorId == null) {
                status = 404;
            } else if (authorId.equals(userId)) {
                status = 400; // your own comment: edit or delete it instead
            } else if (!RequestLimiter.tryAcquire("report", userId, 10, RequestLimiter.HOUR)) {
                status = 429;
            } else {
                try (PreparedStatement ps = c.prepareStatement(
                        "INSERT IGNORE INTO comment_reports (kind, comment_id, reporter_id) VALUES (?, ?, ?)")) {
                    ps.setString(1, kind);
                    ps.setInt(2, commentId);
                    ps.setInt(3, userId);
                    ps.executeUpdate();
                }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        respond(resp, status);
    }

    private static void respond(HttpServletResponse resp, int status) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json; charset=UTF-8");
        resp.getWriter().write("{\"ok\":" + (status == 200) + "}");
    }

    /** Removes the reports of a comment (when it is deleted or the reports are dismissed). */
    public static void deleteReports(Connection c, String kind, int commentId) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("DELETE FROM comment_reports WHERE kind=? AND comment_id=?")) {
            ps.setString(1, kind);
            ps.setInt(2, commentId);
            ps.executeUpdate();
        }
    }
}
