package com.github.skeliit.web.admin;

import com.github.skeliit.service.VisitStats;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;

/** Admin: visit statistics back to zero (e.g. right before the launch). POST with CSRF, behind AdminFilter. */
@WebServlet(name = "AdminStatsResetServlet", urlPatterns = {"/admin/stats-reset"})
public class AdminStatsResetServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // a second safety: the form sends confirm=ANO only after the browser's "Are you sure?"
        if (!"ANO".equals(req.getParameter("confirm"))) {
            resp.sendRedirect("/admin.jsp#stats");
            return;
        }
        try {
            VisitStats.reset();
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect("/admin.jsp?statsReset=1#stats");
    }
}
