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
 * The tick in "Co čeká" on the dashboard: the item is fine as it is and stops showing.
 * POST kind=clip, id=youtube id   a clip that stays without a song
 * POST kind=song, id=song id      a song that stays without lyrics
 */
@WebServlet(name = "AdminTodoServlet", urlPatterns = { "/admin/todo" })
public class AdminTodoServlet extends HttpServlet {
    private final AdminDao admin = new AdminDao();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Object role = req.getSession().getAttribute("role");
        if (role == null || !"ADMIN".equals(role.toString())) { resp.setStatus(403); return; }
        String kind = req.getParameter("kind"), id = req.getParameter("id");
        if (id != null && !id.isBlank()) {
            try {
                admin.markTodoDone(String.valueOf(kind), id.trim());
            } catch (SQLException e) {
                throw new ServletException(e);
            }
        }
        resp.sendRedirect("/admin.jsp#todo");
    }
}
