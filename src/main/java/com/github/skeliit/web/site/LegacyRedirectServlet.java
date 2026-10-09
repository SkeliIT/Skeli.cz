package com.github.skeliit.web.site;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Map;

/**
 * Old addresses of the site, moved for good (301) so old links and search results still land.
 * An exact mapping wins over the *.jsp mapping, so no file has to stay for them.
 */
@WebServlet(name = "LegacyRedirectServlet", urlPatterns = {
        "/bio.jsp", "/domu.jsp", "/video.jsp", "/gdpr.jsp", "/text.jsp", "/lyric.jsp", "/music",
        "/profile", "/profile/", "/profile/index.jsp"})
public class LegacyRedirectServlet extends HttpServlet {
    static final Map<String, String> MOVED = Map.of(
            "/bio.jsp", "/about.jsp",
            "/domu.jsp", "/index.jsp",
            "/video.jsp", "/music.jsp",
            "/gdpr.jsp", "/privacy.jsp",       // the privacy rules live in one place only
            "/text.jsp", "/texty.jsp",
            "/music", "/music.jsp",            // an old template that answered 500
            "/profile", "/profile.jsp",
            "/profile/", "/profile.jsp",
            "/profile/index.jsp", "/profile.jsp");

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
        resp.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
        resp.setHeader("Location", req.getContextPath() + target(req.getServletPath(), req.getParameter("id")));
    }

    /** Where an old address lives now; the old lyric page /lyric.jsp?id= is /lyrics/{id}. */
    static String target(String path, String id) {
        if ("/lyric.jsp".equals(path)) {
            return id != null && id.matches("[0-9]{1,9}") ? "/lyrics/" + id : "/texty.jsp";
        }
        return MOVED.getOrDefault(path, "/index.jsp");
    }
}
