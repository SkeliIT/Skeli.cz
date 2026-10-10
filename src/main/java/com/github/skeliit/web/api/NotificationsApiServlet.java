package com.github.skeliit.web.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.skeliit.dao.NotificationDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The bell in the header (js/notifications.js), for the signed-in user only.
 * GET ?count=1 → {"unread": 2}; GET → {"unread": 2, "items": [Notification…]};
 * POST action=read → everything marked as read (when the list was opened).
 */
@WebServlet(name = "NotificationsApiServlet", urlPatterns = {"/api/notifications"})
public class NotificationsApiServlet extends HttpServlet {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final int LIMIT = 20;
    private final NotificationDao dao = new NotificationDao();

    private static Integer user(HttpServletRequest req) {
        HttpSession s = req.getSession(false);
        return s != null && s.getAttribute("userId") instanceof Integer id ? id : null;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Integer uid = user(req);
        resp.setContentType("application/json; charset=UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        if (uid == null) { resp.setStatus(401); resp.getWriter().write("{\"unread\":0}"); return; }
        try {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("unread", dao.unread(uid));
            if (!"1".equals(req.getParameter("count"))) out.put("items", dao.latest(uid, LIMIT));
            JSON.writeValue(resp.getWriter(), out);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Integer uid = user(req);
        resp.setContentType("application/json; charset=UTF-8");
        if (uid == null) { resp.setStatus(401); resp.getWriter().write("{\"ok\":false}"); return; }
        if (!"read".equals(req.getParameter("action"))) { resp.setStatus(400); resp.getWriter().write("{\"ok\":false}"); return; }
        try {
            dao.markAllRead(uid);
            resp.getWriter().write("{\"ok\":true}");
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }
}
