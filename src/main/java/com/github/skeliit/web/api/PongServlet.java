package com.github.skeliit.web.api;

import com.github.skeliit.I18n;
import com.github.skeliit.WebUtils;
import com.github.skeliit.dao.PongDao;
import com.github.skeliit.filter.CsrfFilter;
import com.github.skeliit.model.PongBadges;
import com.github.skeliit.model.PongRank;
import com.github.skeliit.security.RequestLimiter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

/**
 * CatSmash (js/catsmash/hra.js): pinkání s Kevinem do 10 gólů, tabulka pořadí pro registrované.
 * GET  /api/pong/top?d=1|2|3 → {"signedIn":…, "csrf":"…", "top":[{place,name,avatar,ms,kevin,me}], "me":{place,ms}|null}
 * POST /api/pong/start d      → začátek hry (čas startu si pamatuje server v session)
 * POST /api/pong/win  d, ms, kevin → výhra přihlášeného hráče; ms = délka hry podle prohlížeče, server ji přijme
 *                     jen když sedí s jeho vlastním měřením (nejvýš o 1,5 s víc než od startu) a je reálná
 *                     (10 gólů nejde dát rychleji než za 20 s). Jedna výhra na jeden start, nejvýš 30 za hodinu.
 * GET  /api/pong/me             → {"signedIn":…, "csrf":"…", "badges":["first",…], "title":"…"|null} (odznaky z účtu)
 * POST /api/pong/badges keys=a,b → odznaky ze zápasu, které viděl prohlížeč (jen PongBadges.CLAIMABLE)
 * POST /api/pong/title  t=klíč  → titul u jména (jen získaný odznak, prázdné = bez titulu); s back= přesměruje
 * POST /api/pong/frame  f=klíč  → rámeček kolem fotky (jen získaný odznak z PongBadges.FRAMES, prázdné = bez); s back= přesměruje
 */
@WebServlet(name = "PongServlet", urlPatterns = {"/api/pong/*"})
public class PongServlet extends HttpServlet {
    static final int MIN_MS = 20_000, MAX_MS = 60 * 60_000;
    private final PongDao pong = new PongDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession s = req.getSession(false);
        Integer me = userId(s);
        if ("/me".equals(req.getPathInfo())) {
            try {
                StringBuilder b = new StringBuilder("{\"signedIn\":").append(me != null);
                if (me != null) {
                    b.append(",\"csrf\":\"").append(WebUtils.escapeJs(CsrfFilter.token(s))).append("\",\"badges\":[");
                    int i = 0;
                    for (String k : pong.earned(me)) b.append(i++ > 0 ? "," : "").append('"').append(k).append('"');
                    String t = pong.title(me);
                    b.append("],\"title\":").append(t == null ? "null" : "\"" + t + "\"");
                }
                json(resp, b.append('}').toString());
            } catch (SQLException e) {
                throw new ServletException(e);
            }
            return;
        }
        if (!"/top".equals(req.getPathInfo())) { resp.sendError(404); return; }
        int d = difficulty(req.getParameter("d"));
        try {
            List<PongRank> top = pong.top(d, 10, me);
            PongRank mine = me == null ? null : pong.mine(d, me);
            StringBuilder b = new StringBuilder("{\"signedIn\":").append(me != null);
            if (me != null) b.append(",\"csrf\":\"").append(WebUtils.escapeJs(CsrfFilter.token(s))).append('"');
            b.append(",\"top\":[");
            for (int i = 0; i < top.size(); i++) {
                PongRank r = top.get(i);
                if (i > 0) b.append(',');
                b.append("{\"place\":").append(r.place).append(",\"name\":\"").append(WebUtils.escapeJs(r.username))
                        .append("\",\"avatar\":").append(r.avatarUrl == null ? "null" : "\"" + WebUtils.escapeJs(r.avatarUrl) + "\"")
                        .append(",\"ms\":").append(r.durationMs).append(",\"kevin\":").append(r.kevinGoals).append(",\"me\":").append(r.me)
                        .append(",\"title\":").append(titleJson(req, r.title))
                        .append(",\"frame\":").append(r.frame == null ? "null" : "\"" + r.frame + "\"").append('}');
            }
            b.append("],\"me\":");
            b.append(mine == null ? "null" : "{\"place\":" + mine.place + ",\"ms\":" + mine.durationMs + "}");
            json(resp, b.append('}').toString());
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // (CSRF už zkontroloval CsrfFilter – hlavička X-CSRF-Token)
        HttpSession s = req.getSession(false);
        Integer me = userId(s);
        if (me == null) { resp.setStatus(401); json(resp, "{\"ok\":false,\"error\":\"login\"}"); return; }
        if ("/badges".equals(req.getPathInfo())) {
            if (!RequestLimiter.tryAcquire("pong-badges", me, 60, RequestLimiter.HOUR)) {
                resp.setStatus(429);
                json(resp, "{\"ok\":false,\"error\":\"limit\"}");
                return;
            }
            String keys = req.getParameter("keys");
            try {
                int added = keys == null ? 0 : pong.claim(me, Arrays.stream(keys.split(",")).map(String::trim).limit(30).toList());
                json(resp, "{\"ok\":true,\"added\":" + added + "}");
            } catch (SQLException e) {
                throw new ServletException(e);
            }
            return;
        }
        if ("/frame".equals(req.getPathInfo())) {
            String f = req.getParameter("f");
            if (f != null && f.isBlank()) f = null;
            boolean ok;
            try {
                ok = f == null || PongBadges.isFrame(f) && pong.earned(me).contains(f);
                if (ok) pong.setFrame(me, f);
            } catch (SQLException e) {
                throw new ServletException(e);
            }
            if ("account".equals(req.getParameter("back"))) {
                resp.sendRedirect("/nastaveni.jsp?" + (ok ? "pongFrame=1" : "pongFrame=0") + "#profil");
                return;
            }
            if (!ok) resp.setStatus(400);
            json(resp, "{\"ok\":" + ok + "}");
            return;
        }
        if ("/title".equals(req.getPathInfo())) {
            String t = req.getParameter("t");
            if (t != null && t.isBlank()) t = null;
            boolean ok;
            try {
                Set<String> earned = pong.earned(me);
                ok = t == null || earned.contains(t);
                if (ok) pong.setTitle(me, t);
            } catch (SQLException e) {
                throw new ServletException(e);
            }
            if ("account".equals(req.getParameter("back"))) {                 // formulář na stránce Můj účet
                resp.sendRedirect("/nastaveni.jsp?" + (ok ? "pongTitle=1" : "pongTitle=0") + "#profil");
                return;
            }
            if (!ok) resp.setStatus(400);
            json(resp, "{\"ok\":" + ok + "}");
            return;
        }
        int d = difficulty(req.getParameter("d"));
        if ("/start".equals(req.getPathInfo())) {
            s.setAttribute("pongStart", System.currentTimeMillis());
            s.setAttribute("pongD", d);
            json(resp, "{\"ok\":true}");
            return;
        }
        if (!"/win".equals(req.getPathInfo())) { resp.sendError(404); return; }
        Object start = s.getAttribute("pongStart"), sd = s.getAttribute("pongD");
        s.removeAttribute("pongStart");                    // jedna výhra na jeden start
        int ms = intParam(req.getParameter("ms"), -1), kevin = intParam(req.getParameter("kevin"), -1);
        if (!(start instanceof Long t0) || !(sd instanceof Integer d0) || d0 != d
                || !plausible(ms, System.currentTimeMillis() - t0) || kevin < 0 || kevin > 9) {
            resp.setStatus(400);
            json(resp, "{\"ok\":false,\"error\":\"invalid\"}");
            return;
        }
        if (!RequestLimiter.tryAcquire("pong-win", me, 30, RequestLimiter.HOUR)) {
            resp.setStatus(429);
            json(resp, "{\"ok\":false,\"error\":\"limit\"}");
            return;
        }
        try {
            pong.addWin(me, d, ms, kevin);
            PongRank mine = pong.mine(d, me);
            json(resp, "{\"ok\":true,\"place\":" + (mine == null ? 0 : mine.place) + ",\"best\":" + (mine == null ? ms : mine.durationMs) + "}");
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    /** Titul u jména pro prohlížeč: {"key","icon","name","tier"} v jazyce stránky, nebo null. */
    static String titleJson(HttpServletRequest req, String key) {
        if (!PongBadges.exists(key)) return "null";
        String tier = PongBadges.tier(key);
        return "{\"key\":\"" + key + "\",\"icon\":\"" + PongBadges.icon(key) + "\",\"name\":\""
                + WebUtils.escapeJs(I18n.getText(req, "pong.badge." + key, key)) + "\",\"tier\":" + (tier == null ? "null" : "\"" + tier + "\"") + "}";
    }

    /** Délka hry z prohlížeče sedí se serverem (nejvýš o 1,5 s delší než od startu) a dá se reálně dosáhnout. */
    static boolean plausible(int ms, long serverElapsed) {
        return ms >= MIN_MS && ms <= MAX_MS && ms <= serverElapsed + 1500;
    }

    static int difficulty(String v) {
        int d = intParam(v, 2);
        return d < 1 || d > 3 ? 2 : d;
    }

    private static int intParam(String v, int def) {
        try { return v == null ? def : Integer.parseInt(v.trim()); } catch (NumberFormatException e) { return def; }
    }

    private static Integer userId(HttpSession s) {
        return s != null && s.getAttribute("userId") instanceof Integer uid ? uid : null;
    }

    private static void json(HttpServletResponse resp, String body) throws IOException {
        resp.setHeader("Cache-Control", "no-store");
        resp.setContentType("application/json; charset=UTF-8");
        resp.getWriter().write(body);
    }
}
