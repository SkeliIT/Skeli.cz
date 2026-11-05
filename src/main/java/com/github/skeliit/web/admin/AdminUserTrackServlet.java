package com.github.skeliit.web.admin;

import com.github.skeliit.dao.UserTrackDao;
import com.github.skeliit.web.auth.LoginServlet;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;

/**
 * POST /admin/user-track: action = hide (s důvodem, ten uvidí majitel) | show. Moderace skladeb uživatelů z jejich profilu.
 * Přístup hlídá AdminFilter, zápis do záznamu změn AdminAuditFilter.
 */
@WebServlet(name = "AdminUserTrackServlet", urlPatterns = {"/admin/user-track"})
public class AdminUserTrackServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String back = LoginServlet.safeNext(req.getParameter("back"));
        if (back == null) back = "/admin/users";
        String rawId = req.getParameter("id");
        if (rawId == null || !rawId.matches("[0-9]{1,9}")) { resp.sendRedirect(back); return; }
        int id = Integer.parseInt(rawId);
        try {
            if ("show".equals(req.getParameter("action"))) {
                new UserTrackDao().setHidden(id, null);
            } else if ("hide".equals(req.getParameter("action"))) {
                String reason = req.getParameter("reason");
                reason = reason == null ? "" : reason.strip();
                if (!reason.isEmpty()) new UserTrackDao().setHidden(id, reason.length() > 200 ? reason.substring(0, 200) : reason);
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect(back);
    }
}
