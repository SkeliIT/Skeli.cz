package com.github.skeliit.web.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.skeliit.dao.KaraokeDao;
import com.github.skeliit.model.KaraokeClip;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

/**
 * Karaoke timings by hand: the list of clips with Czech lyrics, and for one clip an editor where the
 * admin plays the clip and taps the start of each line (WEB-INF/views/admin/karaoke.jsp).
 * GET  /admin/karaoke            the list
 * GET  /admin/karaoke?yt=<id>    the editor
 * POST action=save (yt, times = JSON [[start, end], ...], one pair per line) | reset (back to the automatic file)
 */
@WebServlet(name = "AdminKaraokeServlet", urlPatterns = {"/admin/karaoke"})
public class AdminKaraokeServlet extends HttpServlet {
    private static final ObjectMapper JSON = new ObjectMapper();
    private final KaraokeDao dao = new KaraokeDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }
        String yt = req.getParameter("yt");
        try {
            List<KaraokeClip> clips = dao.clips();
            for (KaraokeClip k : clips) k.auto = getServletContext().getResource("/karaoke/" + k.youtubeId + ".json") != null;
            if (yt != null && yt.matches("[A-Za-z0-9_-]{6,20}")) {
                KaraokeClip clip = clips.stream().filter(k -> k.youtubeId.equals(yt)).findFirst().orElse(null);
                if (clip == null) { resp.sendError(404); return; }
                req.setAttribute("clip", clip);
                req.setAttribute("linesJson", JSON.writeValueAsString(clip.lines));
            }
            req.setAttribute("clips", clips);
            req.getRequestDispatcher("/WEB-INF/views/admin/karaoke.jsp").forward(req, resp);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }
        String yt = req.getParameter("yt");
        resp.setContentType("application/json; charset=UTF-8");
        if (yt == null || !yt.matches("[A-Za-z0-9_-]{6,20}")) { resp.setStatus(400); resp.getWriter().write("{\"ok\":false}"); return; }
        try {
            KaraokeClip clip = dao.clip(yt);
            if (clip == null) { resp.setStatus(404); resp.getWriter().write("{\"ok\":false}"); return; }
            if ("reset".equals(req.getParameter("action"))) {
                dao.reset(yt);
                resp.getWriter().write("{\"ok\":true}");
                return;
            }
            String times = cleanTimes(req.getParameter("times"), clip.lines.length);
            if (times == null) { resp.setStatus(400); resp.getWriter().write("{\"ok\":false,\"error\":\"times\"}"); return; }
            Integer uid = (Integer) req.getSession().getAttribute("userId");
            dao.save(yt, clip.lines.length, times, uid == null ? 0 : uid);
            resp.getWriter().write("{\"ok\":true}");
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    /** The times rebuilt from numbers only: one [start, end] per line, start ≤ end, 0–3600 s; null when wrong. */
    static String cleanTimes(String json, int lineCount) {
        if (json == null || json.length() > 200_000) return null;
        try {
            JsonNode arr = JSON.readTree(json);
            if (!arr.isArray() || arr.size() != lineCount) return null;
            StringBuilder out = new StringBuilder("[");
            for (int i = 0; i < arr.size(); i++) {
                JsonNode p = arr.get(i);
                if (!p.isArray() || p.size() != 2 || !p.get(0).isNumber() || !p.get(1).isNumber()) return null;
                double s = p.get(0).asDouble(), e = p.get(1).asDouble();
                if (s < 0 || e < s || e > 3600) return null;
                if (i > 0) out.append(',');
                out.append('[').append(Math.round(s * 100) / 100.0).append(',').append(Math.round(e * 100) / 100.0).append(']');
            }
            return out.append(']').toString();
        } catch (IOException ex) {
            return null;
        }
    }

    private static boolean isAdmin(HttpServletRequest req) {
        Object role = req.getSession().getAttribute("role");
        return role != null && "ADMIN".equals(role.toString());
    }
}
