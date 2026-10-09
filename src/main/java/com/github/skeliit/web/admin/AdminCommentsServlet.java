package com.github.skeliit.web.admin;

import com.github.skeliit.dao.AdminDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;

/**
 * The admin's comment list: the reported comments first, then every comment on lyrics and clips,
 * newest first. Deleting and dismissing go to AdminCommentServlet (/admin/comment).
 */
@WebServlet(name = "AdminCommentsServlet", urlPatterns = {"/admin/comments"})
public class AdminCommentsServlet extends HttpServlet {
    private static final int LIMIT = 300;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        AdminDao dao = new AdminDao();
        try {
            req.setAttribute("reports", dao.reportedComments());
            req.setAttribute("comments", dao.latestComments(LIMIT));
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        req.setAttribute("limit", LIMIT);
        req.getRequestDispatcher("/WEB-INF/views/admin/comments.jsp").forward(req, resp);
    }
}
