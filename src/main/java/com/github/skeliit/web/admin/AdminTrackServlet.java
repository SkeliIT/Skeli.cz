package com.github.skeliit.web.admin;

import com.github.skeliit.dao.SongDao;
import com.github.skeliit.dao.TrackDao;
import com.github.skeliit.job.VideoTitles;
import com.github.skeliit.model.TrackDraft;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.sql.SQLIntegrityConstraintViolationException;
import java.sql.Timestamp;

/**
 * Add a track from YouTube in one go.
 * GET  /admin/track            the form for a link
 * GET  /admin/track?url=…      the link read: title, song name and year filled in from YouTube
 * POST /admin/track            saves the clip, its song (new or existing), Spotify / Apple Music and the lyrics,
 *                              then opens the song in the admin
 */
@WebServlet(name = "AdminTrackServlet", urlPatterns = { "/admin/track" })
public class AdminTrackServlet extends HttpServlet {

    private final TrackDao tracks = new TrackDao();
    private final SongDao songs = new SongDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }
        try {
            String url = req.getParameter("url");
            if (url != null && !url.isBlank()) {
                String id = AdminVideoServlet.youtubeId(url);
                if (id == null) {
                    req.setAttribute("error", "Tohle nevypadá jako odkaz na YouTube video.");
                } else {
                    req.setAttribute("draft", draft(id));
                }
            }
            req.setAttribute("songs", songs.listAll());
            req.getRequestDispatcher("/WEB-INF/views/admin/track.jsp").forward(req, resp);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    /** What YouTube and the database say about the clip. */
    private TrackDraft draft(String youtubeId) throws SQLException {
        TrackDraft d = new TrackDraft();
        d.youtubeId = youtubeId;
        d.videoTitle = VideoTitles.fetch(youtubeId);
        // the clean title with its features ("Y (ft. X)"), as the songs are named here
        d.songName = VideoTitles.display(d.videoTitle);
        Timestamp released = VideoTitles.fetchUploadDate(youtubeId);
        if (released != null) d.year = released.toLocalDateTime().getYear();
        tracks.complete(d);
        return d;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }
        String youtubeId = AdminVideoServlet.youtubeId(req.getParameter("youtube_id"));
        String back = "/admin/track?url=" + URLEncoder.encode(youtubeId == null ? "" : youtubeId, StandardCharsets.UTF_8);
        if (youtubeId == null) { resp.sendRedirect("/admin/track?msg=bad_youtube"); return; }
        Integer songId = "existing".equals(req.getParameter("song_mode")) ? parseInt(req.getParameter("song_id")) : null;
        String songName = trim(req.getParameter("song_name"));
        if (songId == null && songName == null) { resp.sendRedirect(back + "&msg=bad_name"); return; }
        Integer year = parseInt(req.getParameter("year"));
        String spotify = trim(req.getParameter("spotify"));
        String apple = trim(req.getParameter("apple"));
        try {
            String uuid = tracks.save(youtubeId, trim(req.getParameter("video_title")), VideoTitles.fetchUploadDate(youtubeId), songId, songName, year,
                    spotify == null ? null : AdminSongDetailServlet.spotifyId(spotify),
                    apple == null ? null : AdminSongDetailServlet.appleMusicId(apple),
                    req.getParameter("lyrics"));
            resp.sendRedirect("/admin/song?uuid=" + uuid + "&msg=track_added");
        } catch (SQLIntegrityConstraintViolationException e) {
            // Spotify / Apple Music IDs are unique: the link belongs to another song already
            resp.sendRedirect(back + "&msg=link_taken");
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    private static boolean isAdmin(HttpServletRequest req) {
        Object role = req.getSession().getAttribute("role");
        return role != null && "ADMIN".equals(role.toString());
    }

    private static String trim(String v) { return v == null || v.isBlank() ? null : v.trim(); }

    private static Integer parseInt(String v) {
        try { return v == null || v.isBlank() ? null : Integer.valueOf(v.trim()); } catch (NumberFormatException e) { return null; }
    }
}
