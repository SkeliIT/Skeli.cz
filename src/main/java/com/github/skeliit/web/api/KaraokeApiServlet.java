package com.github.skeliit.web.api;

import com.github.skeliit.dao.KaraokeDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;

/**
 * GET /api/karaoke?yt=<YouTube id>: when each line of the lyrics is sung in that clip, for js/karaoke.js.
 * {"lines": 42, "times": [[12.4, 15.9], ...], "source": "manual" | "auto"}; 404 when the clip has none.
 * A correction made in the admin (karaoke_timings) wins over the automatic file karaoke/<id>.json.
 */
@WebServlet(name = "KaraokeApiServlet", urlPatterns = {"/api/karaoke"})
public class KaraokeApiServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String yt = req.getParameter("yt");
        if (yt == null || !yt.matches("[A-Za-z0-9_-]{6,20}")) {
            resp.sendError(400);
            return;
        }
        String json;
        try {
            json = new KaraokeDao().manual(yt);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        if (json == null) {
            try (InputStream in = getServletContext().getResourceAsStream("/karaoke/" + yt + ".json")) {
                if (in == null) {
                    resp.setStatus(404);
                    resp.setContentType("application/json; charset=UTF-8");
                    resp.getWriter().write("{\"lines\":0}");
                    return;
                }
                String file = new String(in.readAllBytes(), StandardCharsets.UTF_8).trim();
                // the file is {"lines": .., "matched": .., "times": [..]}: mark where it came from
                json = file.substring(0, file.lastIndexOf('}')) + ",\"source\":\"auto\"}";
            }
        }
        resp.setContentType("application/json; charset=UTF-8");
        resp.setHeader("Cache-Control", "no-cache");
        resp.getWriter().write(json);
    }
}
