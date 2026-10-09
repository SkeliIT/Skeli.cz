package com.github.skeliit.web.site;

import com.github.skeliit.WebUtils;
import com.github.skeliit.filter.CsrfFilter;
import com.github.skeliit.model.LyricView;
import com.github.skeliit.service.LyricService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@WebServlet(name = "LyricRouterServlet", urlPatterns = {"/lyrics/*"})
public class LyricRouterServlet extends HttpServlet {
    private final LyricService svc = new LyricService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo(); // /{id-or-slug}
        if (path == null || path.equals("/")) { resp.sendRedirect("/texty.jsp"); return; }
        path = URLDecoder.decode(path.substring(1), StandardCharsets.UTF_8);
        Integer id = null;
        try { if (path.matches("^\\d+.*")) id = Integer.parseInt(path.split("-",2)[0]); } catch (Exception ignored) {}
        // If missing id, try slug match via songs list
        if (id == null) {
            try {
                String slug = path.toLowerCase().replaceAll("[^a-z0-9]+","-").replaceAll("^-|-$","");
                var songs = svc.listSongs();
                for (var s : songs) {
                    String sslug = s.name.toLowerCase().replaceAll("[^a-z0-9]+","-").replaceAll("^-|-$","");
                    if (sslug.startsWith(slug) && s.firstLyricId != null) { id = s.firstLyricId; break; }
                }
            } catch (Exception ignore) {}
        }
        if (id == null || id == 0) { resp.sendError(404); return; }
        try {
            // Ensure CSRF token exists in session
            req.setAttribute("csrf", CsrfFilter.token(req.getSession()));
            
            String lang = (String) req.getSession().getAttribute("lang");
            var songs = svc.listSongs();
            LyricView v = svc.getLyric(id, lang);
            if (v == null) { resp.sendError(404); return; }
            req.setAttribute("songs", songs);
            setNeighbours(req, songs, v.songId);
            req.setAttribute("lyric", v);
            // <title> and meta description for search results and link previews
            req.setAttribute("pageTitle", v.songName);
            req.setAttribute("pageDescription", firstLines(v.words, 160));
            // link previews: custom song image, else YouTube thumbnail
            req.setAttribute("pageType", "music.song");
            if (v.songUuid != null && !v.songUuid.isBlank()) {
                req.setAttribute("canonicalPath", v.getPublicPath());
            }
            String pageImage = absoluteImage(v.previewImageUrl);
            if (pageImage == null && v.youtubeId != null && v.youtubeId.matches("[A-Za-z0-9_-]{6,20}")) {
                pageImage = "https://i.ytimg.com/vi/" + v.youtubeId + "/hqdefault.jpg";
            }
            if (pageImage != null) {
                req.setAttribute("pageImage", pageImage);
            }
            // all clips of the song (newest first): the page offers a version switch when there are several
            req.setAttribute("clips", com.github.skeliit.model.SongClip.forSong(v.songId));
            req.setAttribute("comments", svc.comments(v.id));   // v may be another language's row of the song
            req.getRequestDispatcher("/WEB-INF/views/lyric.jsp").forward(req, resp);
        } catch (Exception e) { throw new ServletException(e); }
    }

    /**
     * The songs before and after this one in the newest-first list (only songs with lyrics), for the
     * "previous / next song" links under the lyrics: prevSong is the newer one, nextSong the older one.
     */
    static void setNeighbours(HttpServletRequest req, java.util.List<com.github.skeliit.model.Song> songs, int songId) {
        java.util.List<com.github.skeliit.model.Song> withLyrics = songs.stream().filter(s -> s.firstLyricId != null).toList();
        for (int i = 0; i < withLyrics.size(); i++) {
            if (withLyrics.get(i).id != songId) continue;
            if (i > 0) req.setAttribute("prevSong", withLyrics.get(i - 1));
            if (i + 1 < withLyrics.size()) req.setAttribute("nextSong", withLyrics.get(i + 1));
            return;
        }
    }

    /** The opening lines of the lyrics joined into one line, cut at a word boundary. */
    public static String firstLines(String words, int max) {
        if (words == null) return null;
        String s = words.strip().replaceAll("\\s*\\R\\s*", " / ").replaceAll("\\s+", " ");
        if (s.length() <= max) return s;
        int cut = s.lastIndexOf(' ', max);
        return s.substring(0, cut > 0 ? cut : max).replaceAll("[ /,]+$", "") + "…";
    }

    /** Makes a site-relative upload path absolute for Open Graph; leaves http(s) URLs alone. */
    static String absoluteImage(String url) {
        if (url == null || url.isBlank()) return null;
        if (url.startsWith("http://") || url.startsWith("https://")) return url;
        if (url.startsWith("/")) return WebUtils.baseUrl() + url;
        return WebUtils.baseUrl() + "/" + url;
    }
}
