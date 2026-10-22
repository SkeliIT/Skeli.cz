package com.github.skeliit.web.api;

import com.github.skeliit.WebUtils;
import com.github.skeliit.dao.LyricHelpDao;
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
 * „Pomoz nám dopsat text“ na stránce písně (karta ve WEB-INF/views/lyric.jsp): návštěvník, který jazyku rozumí,
 * napíše chybějící kus. Čeká to v adminu (Písně → ta píseň); na web nic nejde samo.
 * POST /api/lyric-help  song (id), message (3–5000 znaků), website (past na roboty, musí být prázdné) → {"ok":true}
 * Jen u písně, která o pomoc žádá. Ukládá se text a u přihlášeného jeho účet – žádná IP ani e-mail.
 * Nejvýš 3 za hodinu z jedné adresy (RequestLimiter, v paměti).
 */
@WebServlet(name = "LyricHelpServlet", urlPatterns = {"/api/lyric-help"})
public class LyricHelpServlet extends HttpServlet {
    static final int MAX = 5000;
    private final LyricHelpDao help = new LyricHelpDao();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // (token proti podvrženým formulářům už zkontroloval CsrfFilter)
        String hp = req.getParameter("website");
        if (hp != null && !hp.isEmpty()) { json(resp, "{\"ok\":true}"); return; }   // robot: tváříme se, že to prošlo
        String message = message(req.getParameter("message"));
        int songId;
        try { songId = Integer.parseInt(String.valueOf(req.getParameter("song"))); } catch (NumberFormatException e) { songId = 0; }
        if (message == null || message.length() < 3 || songId <= 0) {
            resp.setStatus(400);
            json(resp, "{\"ok\":false,\"error\":\"empty\"}");
            return;
        }
        try {
            if (!help.isWanted(songId)) {
                resp.setStatus(400);
                json(resp, "{\"ok\":false,\"error\":\"closed\"}");
                return;
            }
            if (!WebUtils.isDirectLocalRequest(req)
                    && !RequestLimiter.tryAcquire("lyric-help", WebUtils.clientIp(req), 3, RequestLimiter.HOUR)) {
                resp.setStatus(429);
                json(resp, "{\"ok\":false,\"error\":\"limit\"}");
                return;
            }
            HttpSession s = req.getSession(false);
            Integer userId = s != null && s.getAttribute("userId") instanceof Integer uid ? uid : null;
            help.add(songId, message, userId);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        json(resp, "{\"ok\":true}");
    }

    /** Text tak, jak ho napsal (konce řádků zůstanou), zkrácený na 5000 znaků; null, když je prázdný. */
    static String message(String v) {
        if (v == null) return null;
        String m = v.replace("\r\n", "\n").replace('\r', '\n').strip();
        if (m.isEmpty()) return null;
        return m.length() > MAX ? m.substring(0, MAX) : m;
    }

    private static void json(HttpServletResponse resp, String body) throws IOException {
        resp.setHeader("Cache-Control", "no-store");
        resp.setContentType("application/json; charset=UTF-8");
        resp.getWriter().write(body);
    }
}
