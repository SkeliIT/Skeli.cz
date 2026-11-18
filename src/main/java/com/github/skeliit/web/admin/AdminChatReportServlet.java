package com.github.skeliit.web.admin;

import com.github.skeliit.dao.ChatDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;

/** POST /admin/chat-report: action = delete (zpráva zmizí z chatu) | dismiss. Přístup hlídá AdminFilter, zápis AdminAuditFilter. */
@WebServlet(name = "AdminChatReportServlet", urlPatterns = {"/admin/chat-report"})
public class AdminChatReportServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String id = req.getParameter("id");
        if (id != null && id.matches("[0-9]{1,9}")) {
            try {
                new ChatDao().resolveReport(Integer.parseInt(id), "delete".equals(req.getParameter("action")));
            } catch (SQLException e) {
                throw new ServletException(e);
            }
        }
        resp.sendRedirect("/admin_users.jsp?msg=report_done#chat-reports");
    }
}
