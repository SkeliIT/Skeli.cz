package com.github.skeliit.web.site;

import com.github.skeliit.dao.FeedbackDao;
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
 * POST /feedback – "Co říkáš na web?" on the home page: vote (up|down) and an optional message (500 characters).
 * Signed-in users only, one rating each (sending again changes it); back to the home page's card.
 */
@WebServlet(name = "FeedbackServlet", urlPatterns = { "/feedback" })
public class FeedbackServlet extends HttpServlet {
    static final int MAX = 500;
    private final FeedbackDao feedback = new FeedbackDao();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession s = req.getSession(false);
        if (s == null || !(s.getAttribute("userId") instanceof Integer uid)) {
            resp.sendRedirect("/login.jsp?next=%2Fabout.jsp%23feedback");
            return;
        }
        String vote = req.getParameter("vote");
        if (!"up".equals(vote) && !"down".equals(vote) || !isBlank(req.getParameter("website"))) {   // website = the honeypot
            resp.sendRedirect("/about.jsp#feedback");
            return;
        }
        if (!RequestLimiter.tryAcquire("feedback", uid, 10, RequestLimiter.HOUR)) {
            resp.sendRedirect("/about.jsp?feedback=limit#feedback");
            return;
        }
        try {
            feedback.save(uid, "up".equals(vote) ? 1 : -1, message(req.getParameter("message")));
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect("/about.jsp?feedback=thanks#feedback");
    }

    /** The message as typed, line breaks kept, cut to the column's length; empty = none. */
    static String message(String v) {
        if (v == null) return null;
        String m = v.replace("\r\n", "\n").replace('\r', '\n').strip();
        if (m.isEmpty()) return null;
        return m.length() > MAX ? m.substring(0, MAX) : m;
    }

    private static boolean isBlank(String v) { return v == null || v.isBlank(); }
}
