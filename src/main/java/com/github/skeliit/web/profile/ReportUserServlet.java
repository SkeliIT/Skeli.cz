package com.github.skeliit.web.profile;

import com.github.skeliit.dao.ModerationDao;
import com.github.skeliit.dao.UserDao;
import com.github.skeliit.security.RequestLimiter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;

/** POST /profile/report: přihlášený nahlásí cizí profil (name, reason, note), admin to uvidí v Uživatelích. Nejvýš 10 za hodinu. */
@WebServlet(name = "ReportUserServlet", urlPatterns = {"/profile/report"})
public class ReportUserServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        HttpSession s = req.getSession(false);
        Integer me = s == null ? null : (Integer) s.getAttribute("user_id");
        if (me == null) { resp.sendRedirect("/login.jsp"); return; }
        String name = req.getParameter("name"), reason = req.getParameter("reason"), note = req.getParameter("note");
        if (name == null || name.length() > 60) { resp.sendError(400); return; }
        String back = "/hrac/" + URLEncoder.encode(name, StandardCharsets.UTF_8).replace("+", "%20");
        if (reason == null || !ModerationDao.REASONS.contains(reason)) { resp.sendRedirect(back + "?reported=0"); return; }
        if (note != null && note.length() > 300) note = note.substring(0, 300);
        try {
            Integer id = new UserDao().publicPlayerId(name);
            if (id == null) { resp.sendError(404); return; }
            if (id.equals(me) || !RequestLimiter.tryAcquire("user-report", me, 10, RequestLimiter.HOUR)) {
                resp.sendRedirect(back + "?reported=0");
                return;
            }
            new ModerationDao().report(id, me, reason, note);
            com.github.skeliit.service.UrgentReports.tellAdmin(reason, "reports");
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect(back + "?reported=1");
    }
}
