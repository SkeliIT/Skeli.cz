package com.github.skeliit;

import com.github.skeliit.dao.LyricDao;
import com.github.skeliit.dao.SongDao;
import com.github.skeliit.model.LyricView;
import com.github.skeliit.model.Song;
import com.github.skeliit.model.SongLocale;
import com.github.skeliit.service.LyricService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Public song pages:
 * <ul>
 *   <li>{@code /{lang}/song/{seo-slug|uuid}} — canonical per-language URL</li>
 *   <li>{@code /song/{key}} — redirects to {@code /cs/song/{key}}</li>
 * </ul>
 */
@WebServlet(name = "SongRouterServlet", urlPatterns = {
        "/song/*",
        "/cs/song/*", "/en/song/*", "/de/song/*", "/uk/song/*"
})
public class SongRouterServlet extends HttpServlet {
    private static final Pattern UUID_RE =
            Pattern.compile("(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");

    private final LyricService svc = new LyricService();
    private final SongDao songs = new SongDao();
    private final LyricDao lyrics = new LyricDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String servletPath = req.getServletPath(); // e.g. /en/song or /song
        String pathInfo = req.getPathInfo();       // e.g. /musis-odejit

        String lang;
        if ("/song".equals(servletPath)) {
            // Legacy /song/{key} → /cs/song/{key}
            if (pathInfo == null || pathInfo.equals("/")) {
                resp.sendRedirect(req.getContextPath() + "/texty.jsp");
                return;
            }
            String key = URLDecoder.decode(pathInfo.substring(1), StandardCharsets.UTF_8).trim();
            resp.setStatus(301);
            resp.setHeader("Location", req.getContextPath() + "/cs/song/" + key);
            return;
        }

        // /{lang}/song
        lang = servletPath.substring(1, 3); // cs|en|de|uk
        if (!I18n.isSupported(lang)) {
            resp.sendError(404);
            return;
        }
        if (pathInfo == null || pathInfo.equals("/")) {
            resp.sendRedirect(req.getContextPath() + "/texty.jsp");
            return;
        }

        String key = URLDecoder.decode(pathInfo.substring(1), StandardCharsets.UTF_8).trim();
        if (key.length() > 36 && key.charAt(36) == '-' && UUID_RE.matcher(key.substring(0, 36)).matches()) {
            key = key.substring(0, 36);
        }
        if (key.isEmpty()) {
            resp.sendError(404);
            return;
        }

        try {
            Integer lyricId;
            Song song = null;
            if (UUID_RE.matcher(key).matches()) {
                song = songs.findByUuid(key);
                lyricId = song == null ? null : lyrics.findLyricIdBySongUuid(song.uuid, lang);
            } else {
                lyricId = lyrics.findLyricIdBySeoSlug(key.toLowerCase(), lang);
                if (lyricId == null) {
                    // slug may be for another lang — try resolve song via any slug then redirect
                    song = songs.findBySeoSlug(key.toLowerCase());
                    if (song != null) {
                        lyricId = lyrics.findLyricIdBySongUuid(song.uuid, lang);
                    }
                }
            }

            if (lyricId == null) {
                resp.sendError(404);
                return;
            }

            // Pin UI language to URL language
            req.getSession().setAttribute("lang", lang);
            req.setAttribute("csrf", CsrfFilter.token(req.getSession()));

            LyricView v = svc.getLyric(lyricId, lang);
            if (v == null) {
                resp.sendError(404);
                return;
            }
            if (song == null && v.songUuid != null) {
                song = songs.findByUuid(v.songUuid);
            }
            v.lang = lang;

            // Prefer this language's SEO slug from locales
            List<SongLocale> locales = lyrics.listLocalesWithWords(v.songId);
            Map<String, String> hreflang = new LinkedHashMap<>();
            for (SongLocale loc : locales) {
                String path = loc.publicPath(v.songUuid);
                hreflang.put(loc.lang, path);
                if (loc.lang.equals(lang) && loc.seoSlug != null && !loc.seoSlug.isBlank()) {
                    v.songSeoSlug = loc.seoSlug;
                }
                if (loc.lang.equals(lang) && loc.metaDescription != null && !loc.metaDescription.isBlank()) {
                    v.metaDescription = loc.metaDescription;
                }
            }
            // Always expose UUID variant for this lang as fallback hreflang if missing
            if (!hreflang.containsKey(lang) && v.songUuid != null) {
                hreflang.put(lang, "/" + lang + "/song/" + v.songUuid);
            }

            String canonical = v.getPublicPath();
            // If user hit UUID URL but SEO slug exists, 301 to slug
            if (UUID_RE.matcher(key).matches() && v.songSeoSlug != null && !v.songSeoSlug.isBlank()) {
                resp.setStatus(301);
                resp.setHeader("Location", req.getContextPath() + canonical);
                return;
            }

            req.setAttribute("songs", svc.listSongs());
            req.setAttribute("lyric", v);
            req.setAttribute("hreflang", hreflang);
            req.setAttribute("pageTitle", v.songName);
            String desc = v.metaDescription;
            if (desc == null || desc.isBlank()) {
                desc = LyricRouterServlet.firstLines(v.words, 160);
            }
            req.setAttribute("pageDescription", desc);
            req.setAttribute("pageType", "music.song");
            req.setAttribute("canonicalPath", canonical);
            String pageImage = LyricRouterServlet.absoluteImage(v.previewImageUrl);
            if (pageImage == null && v.youtubeId != null && v.youtubeId.matches("[A-Za-z0-9_-]{6,20}")) {
                pageImage = "https://i.ytimg.com/vi/" + v.youtubeId + "/hqdefault.jpg";
            }
            if (pageImage != null) {
                req.setAttribute("pageImage", pageImage);
            }
            req.setAttribute("comments", svc.comments(lyricId));
            req.getRequestDispatcher("/WEB-INF/views/lyric.jsp").forward(req, resp);
        } catch (Exception e) {
            throw new ServletException(e);
        }
    }
}
