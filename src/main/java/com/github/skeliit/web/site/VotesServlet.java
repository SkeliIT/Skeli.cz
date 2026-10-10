package com.github.skeliit.web.site;

import com.github.skeliit.dao.LyricDao;
import com.github.skeliit.security.RequestLimiter;
import com.github.skeliit.web.auth.EmailVerification;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;

/**
 * POST /vote with lyric_id: the "I like it" heart on a song page, given or taken back (one per person
 * and song, whatever the language). Answers {"liked": true, "likes": 12} for the page script.
 */
@WebServlet(name = "VotesServlet", urlPatterns = {"/vote"})
public class VotesServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        Integer userId = session != null ? (Integer) session.getAttribute("userId") : null;
        String lyricId = req.getParameter("lyric_id");
        resp.setContentType("application/json; charset=UTF-8");
        if (userId == null) { resp.setStatus(401); resp.getWriter().write("{\"ok\":false}"); return; }
        if (lyricId == null || !lyricId.matches("\\d{1,9}")) { resp.setStatus(400); resp.getWriter().write("{\"ok\":false}"); return; }
        if (!EmailVerification.isVerified(session)) { resp.setStatus(403); resp.getWriter().write("{\"error\":\"verify\"}"); return; }
        if (!RequestLimiter.tryAcquire("like", userId, 60, RequestLimiter.MINUTE)) { resp.setStatus(429); resp.getWriter().write("{\"ok\":false}"); return; }
        try {
            int[] r = new LyricDao().toggleLike(Integer.parseInt(lyricId), userId);
            if (r == null) { resp.setStatus(404); resp.getWriter().write("{\"ok\":false}"); return; }
            resp.getWriter().write("{\"liked\":" + (r[0] == 1) + ",\"likes\":" + r[1] + "}");
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }
}
