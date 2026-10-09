package com.github.skeliit;

import com.github.skeliit.dao.LyricDao;
import com.github.skeliit.dao.SongDao;
import com.github.skeliit.model.Song;
import com.github.skeliit.model.SongLocale;
import com.github.skeliit.service.TranslationService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Song hub in admin: media + per-language lyrics / SEO / meta description.
 * GET  /admin/song?uuid=…
 * POST action=save|save_locale|save_art|link_video|unlink_video|translate_locale
 */
@WebServlet(name = "AdminSongDetailServlet", urlPatterns = { "/admin/song" })
public class AdminSongDetailServlet extends HttpServlet {

    private static final String[] LANGS = { "cs", "en", "de", "uk", "vi" };

    private final SongDao songs = new SongDao();
    private final LyricDao lyrics = new LyricDao();
    private final TranslationService translator = new TranslationService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }
        try {
            Song song = resolveSong(req);
            if (song == null) {
                if (req.getParameter("uuid") != null || req.getParameter("id") != null) {
                    resp.sendError(404);
                } else {
                    resp.sendRedirect(req.getContextPath() + "/admin/songs");
                }
                return;
            }
            String uuidParam = req.getParameter("uuid");
            if (uuidParam == null || uuidParam.isBlank()) {
                resp.sendRedirect(req.getContextPath() + "/admin/song?uuid=" + song.uuid);
                return;
            }
            req.setAttribute("song", song);
            List<com.github.skeliit.model.SongVideo> videos = songs.videosForSong(song.id);
            req.setAttribute("videos", videos);
            // the picture in the song's Texty row: its newest clip, else its preview photo
            String rowArt = !videos.isEmpty() && videos.get(0).youtubeId != null
                    ? "/yt-thumb/" + videos.get(0).youtubeId + "/hqdefault.jpg"
                    : WebUtils.safeUrl(song.previewImageUrl, null);
            req.setAttribute("rowArt", rowArt);
            req.setAttribute("songTitle", com.github.skeliit.model.SongTitle.of(song.name));
            req.setAttribute("locales", buildLocaleMap(song.id));
            req.setAttribute("langs", LANGS);
            req.setAttribute("translatorReady", translator.isConfigured());
            req.setAttribute("translatorName", translator.providerName());
            SongLocale cs = lyrics.findLocale(song.id, "cs");
            String publicPath = cs != null ? cs.publicPath(song.uuid) : song.getPublicPath("cs");
            req.setAttribute("publicSongUrl", WebUtils.baseUrl() + publicPath);
            req.getRequestDispatcher("/admin_song.jsp").forward(req, resp);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    private Map<String, SongLocale> buildLocaleMap(int songId) throws SQLException {
        Map<String, SongLocale> map = new LinkedHashMap<>();
        for (String lang : LANGS) {
            SongLocale loc = lyrics.findLocale(songId, lang);
            if (loc == null) {
                loc = new SongLocale();
                loc.songId = songId;
                loc.lang = lang;
                loc.words = "";
            }
            map.put(lang, loc);
        }
        return map;
    }

    private Song resolveSong(HttpServletRequest req) throws SQLException {
        String uuid = req.getParameter("uuid");
        if (uuid != null && !uuid.isBlank()) {
            return songs.findByUuid(uuid.trim());
        }
        int id = parseId(req.getParameter("id"));
        return id > 0 ? songs.findById(id) : null;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }
        if (!CsrfFilter.isValid(req)) {
            resp.setStatus(403);
            resp.getWriter().write("CSRF");
            return;
        }
        int id = parseId(req.getParameter("id"));
        if (id <= 0) {
            resp.sendRedirect(req.getContextPath() + "/admin/songs");
            return;
        }
        String action = req.getParameter("action");
        if (action == null) action = "save";
        try {
            Song song = songs.findById(id);
            if (song == null) {
                resp.sendError(404);
                return;
            }
            String hub = req.getContextPath() + "/admin/song?uuid=" + song.uuid;
            switch (action) {
                case "link_video" -> {
                    String yt = normalizeYoutubeId(req.getParameter("youtube_id"));
                    if (yt == null) {
                        resp.sendRedirect(hub + "&msg=bad_youtube");
                        return;
                    }
                    songs.linkVideo(yt, id, req.getParameter("title"));
                    resp.sendRedirect(hub + "&msg=video_linked");
                }
                case "unlink_video" -> {
                    String yt = normalizeYoutubeId(req.getParameter("youtube_id"));
                    if (yt != null) songs.unlinkVideo(yt, id);
                    resp.sendRedirect(hub + "&msg=video_unlinked");
                }
                case "save_art" -> {
                    if ("1".equals(req.getParameter("auto"))) {
                        songs.updateArt(id, null, null, null);
                    } else {
                        Double x = parseDouble(req.getParameter("art_x"));
                        Double y = parseDouble(req.getParameter("art_y"));
                        Double zoom = parseDouble(req.getParameter("art_zoom"));
                        if (x == null || y == null || zoom == null) {
                            resp.sendRedirect(hub + "&msg=bad_art#row-art");
                            return;
                        }
                        songs.updateArt(id, Song.clamp(x, -400, 400), Song.clamp(y, -200, 300), Song.clamp(zoom, 0.25, 3));
                    }
                    resp.sendRedirect(hub + "&msg=art_saved#row-art");
                }
                case "save_locale" -> {
                    String lang = I18n.safeLang(req.getParameter("lang"));
                    String words = req.getParameter("words");
                    if (words == null) words = "";
                    String seoSlug = normalizeSeoSlug(req.getParameter("seo_slug"));
                    if (seoSlug != null && seoSlug.isEmpty()) {
                        resp.sendRedirect(hub + "&msg=bad_seo_slug&tab=" + lang);
                        return;
                    }
                    SongLocale existing = lyrics.findLocale(id, lang);
                    int exceptId = existing != null ? existing.id : 0;
                    if (seoSlug != null && lyrics.isSeoSlugTaken(seoSlug, lang, exceptId)) {
                        resp.sendRedirect(hub + "&msg=seo_slug_taken&tab=" + lang);
                        return;
                    }
                    String meta = req.getParameter("meta_description");
                    if (meta != null && meta.length() > 320) meta = meta.substring(0, 320);
                    lyrics.upsertLocale(id, lang, words, seoSlug, meta);
                    // Keep legacy songs.seo_slug in sync for Czech
                    if ("cs".equals(lang)) {
                        songs.updateBasics(id, song.name, song.year, song.appleMusicId, song.spotifyId, seoSlug);
                    }
                    resp.sendRedirect(hub + "&msg=locale_saved&tab=" + lang);
                }
                case "translate_locale" -> {
                    String lang = I18n.safeLang(req.getParameter("lang"));
                    if ("cs".equals(lang)) {
                        resp.sendRedirect(hub + "&msg=bad_translate&tab=" + lang);
                        return;
                    }
                    if (!translator.isConfigured()) {
                        resp.sendRedirect(hub + "&msg=no_translator&tab=" + lang);
                        return;
                    }
                    SongLocale cs = lyrics.findLocale(id, "cs");
                    if (cs == null || cs.words == null || cs.words.isBlank()) {
                        resp.sendRedirect(hub + "&msg=no_cs_source&tab=" + lang);
                        return;
                    }
                    try {
                        String translated = translator.translateMultiline(cs.words, "cs", lang);
                        String metaSrc = cs.metaDescription;
                        if (metaSrc == null || metaSrc.isBlank()) {
                            metaSrc = LyricRouterServlet.firstLines(cs.words, 160);
                        }
                        String metaTr = translator.translate(metaSrc, "cs", lang);
                        if (metaTr != null && metaTr.length() > 320) metaTr = metaTr.substring(0, 320);
                        String slugHint = translator.translate(
                                cs.seoSlug != null && !cs.seoSlug.isBlank() ? cs.seoSlug.replace('-', ' ') : song.name,
                                "cs", lang);
                        String seoSlug = normalizeSeoSlug(slugHint);
                        if (seoSlug != null && seoSlug.isEmpty()) seoSlug = null;
                        SongLocale existing = lyrics.findLocale(id, lang);
                        int exceptId = existing != null ? existing.id : 0;
                        if (seoSlug != null && lyrics.isSeoSlugTaken(seoSlug, lang, exceptId)) {
                            seoSlug = seoSlug + "-" + lang;
                        }
                        String words = translated;
                        if (existing != null && existing.words != null && !existing.words.isBlank()
                                && !"1".equals(req.getParameter("overwrite"))) {
                            // keep existing words unless overwrite
                            words = existing.words;
                            if (existing.seoSlug != null && !existing.seoSlug.isBlank()) seoSlug = existing.seoSlug;
                            if (existing.metaDescription != null && !existing.metaDescription.isBlank()) {
                                metaTr = existing.metaDescription;
                            }
                        }
                        lyrics.upsertLocale(id, lang, words, seoSlug, metaTr);
                        resp.sendRedirect(hub + "&msg=translated&tab=" + lang);
                    } catch (TranslationService.NotConfiguredException e) {
                        resp.sendRedirect(hub + "&msg=no_translator&tab=" + lang);
                    } catch (Exception e) {
                        resp.sendRedirect(hub + "&msg=translate_failed&tab=" + lang);
                    }
                }
                default -> {
                    String name = req.getParameter("name");
                    if (name == null || name.isBlank()) {
                        resp.sendRedirect(hub + "&msg=bad_name");
                        return;
                    }
                    Integer year = null;
                    String yearStr = req.getParameter("year");
                    if (yearStr != null && !yearStr.isBlank()) {
                        try { year = Integer.parseInt(yearStr.trim()); } catch (NumberFormatException ignore) {}
                    }
                    SongLocale cs = lyrics.findLocale(id, "cs");
                    String seoKeep = cs != null ? cs.seoSlug : song.seoSlug;
                    songs.updateBasics(id, name.trim(), year,
                            appleMusicId(req.getParameter("apple_music_id")),
                            spotifyId(req.getParameter("spotify_id")),
                            seoKeep);
                    resp.sendRedirect(hub + "&msg=saved");
                }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    private static boolean isAdmin(HttpServletRequest req) {
        Object role = req.getSession().getAttribute("role");
        return role != null && "ADMIN".equals(role.toString());
    }

    private static int parseId(String s) {
        try { return Integer.parseInt(s); } catch (Exception e) { return -1; }
    }

    /** A Spotify track ID, from the ID itself or a share link (open.spotify.com/…/track/ID?si=…, spotify:track:ID). */
    static String spotifyId(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("track[/:]([A-Za-z0-9]{22})(?![A-Za-z0-9])").matcher(s);
        return m.find() ? m.group(1) : s;
    }

    /** An Apple Music song ID, from the ID itself or a link (…/song/name/ID or …/album/name/…?i=ID). */
    static String appleMusicId(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("[?&]i=([0-9]{1,20})").matcher(s);
        if (m.find()) return m.group(1);
        m = java.util.regex.Pattern.compile("([0-9]{6,20})(?![0-9])(?!.*[0-9]{6,})").matcher(s);
        return m.find() ? m.group(1) : s;
    }

    private static Double parseDouble(String s) {
        try {
            double v = Double.parseDouble(s.trim());
            return Double.isFinite(v) ? v : null;
        } catch (Exception e) {
            return null;
        }
    }

    static String normalizeYoutubeId(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        if (s.matches("[A-Za-z0-9_-]{11}")) return s;
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("(?:youtu\\.be/|v=|shorts/)([A-Za-z0-9_-]{11})")
                .matcher(s);
        return m.find() ? m.group(1) : null;
    }

    /** Blank → null (clear). Invalid non-blank → empty string. */
    static String normalizeSeoSlug(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String slug = WebUtils.slugify(raw.trim());
        if (slug.isEmpty() || slug.length() > 120) return "";
        if (slug.matches("(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) return "";
        return slug;
    }
}
