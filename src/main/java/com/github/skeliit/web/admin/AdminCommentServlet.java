package com.github.skeliit.web.admin;

import com.github.skeliit.Db;
import com.github.skeliit.web.site.CommentReportServlet;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.*;

@WebServlet(name = "AdminCommentServlet", urlPatterns = {"/admin/comment"})
public class AdminCommentServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Object role = req.getSession().getAttribute("role");
        if (role == null || !"ADMIN".equals(role.toString())) { resp.setStatus(403); return; }
        String idStr = req.getParameter("comment_id");
        if (idStr == null || !idStr.trim().matches("\\d{1,10}")) { resp.sendRedirect("/admin.jsp"); return; }
        int id = Integer.parseInt(idStr.trim());
        // kind: "lyric" (default, comments on song lyrics) or "video" (comments on the music page)
        String kind = "video".equals(req.getParameter("kind")) ? "video" : "lyric";
        // action: "delete" (default) removes the comment, "dismiss" only clears its reports
        boolean dismiss = "dismiss".equals(req.getParameter("action"));
        try (Connection conn = Db.get()) {
            CommentReportServlet.deleteReports(conn, kind, id);
            if (!dismiss) {
                String table = "video".equals(kind) ? "video_comments" : "comments";
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM " + table + " WHERE id=?")) {
                    ps.setInt(1, id);
                    ps.executeUpdate();
                }
            }
        } catch (SQLException e) { throw new ServletException(e); }
        resp.sendRedirect("/admin/comments");
    }
}
