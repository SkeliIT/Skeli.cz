package com.github.skeliit.web.admin;

import com.github.skeliit.dao.FeedbackDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;

/**
 * "Co říkáš na web?": every rating and message. A heart puts the message on the home page.
 * GET  /admin/feedback
 * POST action=heart|unheart|delete, id
 * POST action=delete_report, id   a problem reported to Kevin is sorted out (deleted from the database)
 */
@WebServlet(name = "AdminFeedbackServlet", urlPatterns = { "/admin/feedback" })
public class AdminFeedbackServlet extends HttpServlet {
    private final FeedbackDao feedback = new FeedbackDao();
    private final com.github.skeliit.dao.ReportDao reports = new com.github.skeliit.dao.ReportDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }
        try {
            req.setAttribute("items", feedback.all());
            req.setAttribute("reports", reports.all());
            int[] c = feedback.counts();
            req.setAttribute("up", c[0]);
            req.setAttribute("down", c[1]);
            req.getRequestDispatcher("/WEB-INF/views/admin/feedback.jsp").forward(req, resp);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }
        String action = req.getParameter("action");
        int id;
        try { id = Integer.parseInt(req.getParameter("id")); } catch (NumberFormatException e) { resp.sendRedirect("/admin/feedback"); return; }
        try {
            if ("heart".equals(action)) feedback.heart(id, true);
            else if ("unheart".equals(action)) feedback.heart(id, false);
            else if ("delete".equals(action)) feedback.delete(id);
            else if ("delete_report".equals(action)) { reports.delete(id); resp.sendRedirect("/admin/feedback#reports"); return; }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect("/admin/feedback#f" + id);
    }

    private static boolean isAdmin(HttpServletRequest req) {
        Object role = req.getSession().getAttribute("role");
        return role != null && "ADMIN".equals(role.toString());
    }
}
