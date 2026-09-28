package com.github.skeliit.web;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * /music used to render an old template (WEB-INF/views/music.jsp) that answered 500; the music
 * page is /music.jsp. Kept as a permanent redirect so old links and search results still land.
 */
public class MusicController extends HttpServlet {
    @Override protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
        resp.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
        resp.setHeader("Location", req.getContextPath() + "/music.jsp");
    }
}
