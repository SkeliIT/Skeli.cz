package com.github.skeliit.web.api;

import com.github.skeliit.service.VisitStats;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Called by js/presence.js: when a page is shown (?view=1, on a lyric page also &lyric=ID) and then
 * once a minute while the tab is visible. Counts the visit (VisitStats) and answers how many people
 * are on the site right now: {"online":3}. Bots without JavaScript never call it. With ?play=clip&id= it only
 * counts a started clip for the admin's charts.
 */
@WebServlet(name = "PresenceServlet", urlPatterns = {"/api/presence"})
public class PresenceServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        boolean newPage = "1".equals(req.getParameter("view"));
        Integer lyricId = null;
        String l = req.getParameter("lyric");
        if (l != null && l.matches("[0-9]{1,9}")) lyricId = Integer.valueOf(l);
        // ?play=clip&id=<YouTube id>: a clip was started (js/presence.js on the event 'skeli:play'); lyrics and karaoke count themselves
        if ("clip".equals(req.getParameter("play"))) {
            VisitStats.countPlay(req, "clip", req.getParameter("id"));
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
            return;
        }
        int online = VisitStats.ping(req, newPage, lyricId);
        // přihlášený: pro stav online na profilu (jen v paměti, ukáže se jen tomu, kdo si ho zapnul)
        jakarta.servlet.http.HttpSession session = req.getSession(false);
        if (session != null && session.getAttribute("user_id") instanceof Integer me) com.github.skeliit.service.OnlineUsers.touch(me);
        resp.setHeader("Cache-Control", "no-store");
        resp.setContentType("application/json; charset=UTF-8");
        resp.getWriter().write("{\"online\":" + online + "}");
    }
}
