package com.github.skeliit.web.site;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * /music used to render an old template that answered 500; the music page is /music.jsp. Kept as a
 * permanent redirect so old links and search results still land.
 */
@WebServlet(name = "MusicRedirectServlet", urlPatterns = {"/music"})
public class MusicRedirectServlet extends HttpServlet {
    @Override protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
        resp.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
        resp.setHeader("Location", req.getContextPath() + "/music.jsp");
    }
}
