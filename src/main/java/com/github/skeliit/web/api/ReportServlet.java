package com.github.skeliit.web.api;

import com.github.skeliit.WebUtils;
import com.github.skeliit.dao.ReportDao;
import com.github.skeliit.filter.CsrfFilter;
import com.github.skeliit.security.RequestLimiter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;

/**
 * MC Kevin's "Nahlásit problém" (issue #28): a visitor tells him something is wrong on the page (a missing video,
 * a wrong line…) and the admin finds it under Hodnocení webu → Nahlášené problémy.
 * GET  /api/report  → {"csrf": "…"} (the token for the POST; asked only when someone opens the form, so the other
 *                     visitors get no session for it)
 * POST /api/report  message (3–1000 characters), page (the path it was sent from) → {"ok":true}
 * Stored: the message, the page and, for a signed-in visitor, the account – no IP address, no e-mail.
 * At most 5 reports an hour from one address (RequestLimiter, in memory).
 */
@WebServlet(name = "ReportServlet", urlPatterns = {"/api/report"})
public class ReportServlet extends HttpServlet {
    static final int MAX = 1000;
    private final ReportDao reports = new ReportDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String token = CsrfFilter.token(req.getSession(true));
        json(resp, "{\"csrf\":\"" + WebUtils.escapeJs(token) + "\"}");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // (the CSRF filter has checked the X-CSRF-Token header already)
        String message = message(req.getParameter("message"));
        if (message == null || message.length() < 3) {
            resp.setStatus(400);
            json(resp, "{\"ok\":false,\"error\":\"empty\"}");
            return;
        }
        if (!WebUtils.isDirectLocalRequest(req)
                && !RequestLimiter.tryAcquire("site-report", WebUtils.clientIp(req), 5, RequestLimiter.HOUR)) {
            resp.setStatus(429);
            json(resp, "{\"ok\":false,\"error\":\"limit\"}");
            return;
        }
        HttpSession s = req.getSession(false);
        Integer userId = s != null && s.getAttribute("userId") instanceof Integer uid ? uid : null;
        try {
            reports.add(page(req.getParameter("page")), message, userId);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        json(resp, "{\"ok\":true}");
    }

    /** The message as typed, line breaks kept, cut to the column's length; null when empty. */
    static String message(String v) {
        if (v == null) return null;
        String m = v.replace("\r\n", "\n").replace('\r', '\n').strip();
        if (m.isEmpty()) return null;
        return m.length() > MAX ? m.substring(0, MAX) : m;
    }

    /** Only a path on this site ("/cs/song/…"), at most 255 characters; anything else becomes "/". */
    static String page(String v) {
        if (v == null || !v.startsWith("/") || v.startsWith("//")) return "/";
        String p = v.replaceAll("[\\r\\n\\t]", "");
        return p.length() > 255 ? p.substring(0, 255) : p;
    }

    private static void json(HttpServletResponse resp, String body) throws IOException {
        resp.setHeader("Cache-Control", "no-store");
        resp.setContentType("application/json; charset=UTF-8");
        resp.getWriter().write(body);
    }
}
