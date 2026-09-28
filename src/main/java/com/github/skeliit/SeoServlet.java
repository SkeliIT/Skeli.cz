package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.URI;

import com.github.skeliit.model.Song;
import com.github.skeliit.service.LyricService;

/**
 * /robots.txt and /sitemap.xml with absolute URLs built from APP_BASE_URL.
 * The sitemap lists the public pages plus every song's lyric page.
 * A test instance (host starting with "test.") tells crawlers to stay away.
 */
@WebServlet(name = "SeoServlet", urlPatterns = {"/robots.txt", "/sitemap.xml"})
public class SeoServlet extends HttpServlet {
    private static final String[] PAGES = {
        "/", "/music.jsp", "/texty.jsp", "/about.jsp", "/aktuality.jsp", "/donate.jsp",
        "/privacy.jsp", "/terms.jsp", "/gdpr.jsp"
    };

    private final LyricService svc = new LyricService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String base = WebUtils.baseUrl();
        if ("/robots.txt".equals(req.getServletPath())) {
            robots(base, resp);
        } else {
            sitemap(base, resp);
        }
    }

    static boolean isTestInstance(String base) {
        try {
            String host = URI.create(base).getHost();
            return host != null && host.startsWith("test.");
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private void robots(String base, HttpServletResponse resp) throws IOException {
        resp.setContentType("text/plain;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        out.println("User-agent: *");
        if (isTestInstance(base)) {
            out.println("Disallow: /");
            return;
        }
        out.println("Disallow: /admin");
        out.println("Disallow: /uzivatel.jsp");
        out.println("Disallow: /profile.jsp");
        out.println();
        out.println("Sitemap: " + base + "/sitemap.xml");
    }

    private void sitemap(String base, HttpServletResponse resp) throws IOException, ServletException {
        resp.setContentType("application/xml;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        out.println("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        out.println("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
        for (String p : PAGES) {
            out.println("  <url><loc>" + WebUtils.escapeHtml(base + p) + "</loc></url>");
        }
        try {
            for (Song s : svc.listSongs()) {
                if (s.firstLyricId == null || s.uuid == null || s.uuid.isBlank()) continue;
                try {
                    for (com.github.skeliit.model.SongLocale loc : new com.github.skeliit.dao.LyricDao().listLocalesWithWords(s.id)) {
                        String path = loc.publicPath(s.uuid);
                        out.println("  <url><loc>" + WebUtils.escapeHtml(base + path) + "</loc></url>");
                    }
                } catch (Exception ignore) {
                    String path = s.getPublicPath("cs");
                    if (path != null) {
                        out.println("  <url><loc>" + WebUtils.escapeHtml(base + path) + "</loc></url>");
                    }
                }
            }
        } catch (Exception e) {
            // without the database the static pages are still worth listing
            log("sitemap: could not list songs", e);
        }
        out.println("</urlset>");
    }
}
