package com.github.skeliit;

import com.github.skeliit.dao.LyricDao;
import com.github.skeliit.dao.SongDao;
import com.github.skeliit.model.Song;
import com.github.skeliit.service.AppleCatalog;
import com.github.skeliit.service.AppleMusicClient;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Admin "Apple Music" sync: songs without an Apple Music ID get it from the free public catalogue
 * (matched by title). Timed lyrics need a paid Apple developer key (APPLE_MUSIC_TEAM_ID, _KEY_ID,
 * _PRIVATE_KEY + _USER_TOKEN) and are fetched only when those are set.
 * Goes back to the admin page with the counts in the URL.
 */
@WebServlet(name = "AppleMusicSyncServlet", urlPatterns = {"/admin/apple-sync"})
public class AppleMusicSyncServlet extends HttpServlet {

    private static final Logger LOG = Logger.getLogger(AppleMusicSyncServlet.class.getName());

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Object role = req.getSession().getAttribute("role");
        if (role == null || !"ADMIN".equals(role.toString())) {
            resp.setStatus(403);
            resp.getWriter().write("Forbidden");
            return;
        }

        String artistId = env("APPLE_MUSIC_ARTIST_ID", AppleCatalog.SKELI_ARTIST_ID);
        String storefront = env("APPLE_MUSIC_STOREFRONT", "cz");
        SongDao songDao = new SongDao();

        int filled = 0, missing = 0, lyricsStored = 0;
        List<Song> songs;
        try {
            List<AppleCatalog.Track> catalog = AppleCatalog.artistTracks(artistId, storefront);
            songs = songDao.listAll();
            for (Song song : songs) {
                if (song.appleMusicId != null && !song.appleMusicId.isBlank()) continue;
                AppleCatalog.Track match = AppleCatalog.match(song.name, catalog);
                if (match == null) { missing++; continue; }
                try {
                    songDao.updateAppleMusicId(song.id, match.id());
                    song.appleMusicId = match.id();
                    filled++;
                } catch (Exception e) {
                    // the id already belongs to another song
                    LOG.log(Level.WARNING, "Apple Music ID " + match.id() + " for " + song.name + ": " + e.getMessage());
                    missing++;
                }
            }
        } catch (Exception e) {
            LOG.log(Level.WARNING, "Apple Music catalogue lookup failed", e);
            resp.sendRedirect("/admin.jsp?apple=error#sync");
            return;
        }

        // timed lyrics: only with the paid developer key and a user token
        String teamId = System.getenv("APPLE_MUSIC_TEAM_ID");
        String keyId = System.getenv("APPLE_MUSIC_KEY_ID");
        String privateKey = System.getenv("APPLE_MUSIC_PRIVATE_KEY");
        String userToken = System.getenv("APPLE_MUSIC_USER_TOKEN");
        if (teamId != null && keyId != null && privateKey != null && userToken != null && !userToken.isBlank()) {
            AppleMusicClient client = new AppleMusicClient(teamId, keyId, privateKey, userToken, storefront,
                    env("APPLE_MUSIC_ARTIST", "Skeli"));
            LyricDao lyricDao = new LyricDao();
            for (Song song : songs) {
                if (song.appleMusicId == null) continue;
                try {
                    AppleMusicClient.AppleMusicLyrics lyrics = client.fetchLyrics(song.appleMusicId);
                    if (lyrics != null) {
                        lyricDao.upsertAppleMusicLyrics(song.id, lyrics.plainText(), lyrics.ttml(), "en");
                        lyricsStored++;
                    }
                } catch (Exception e) {
                    LOG.log(Level.WARNING, "Apple Music lyrics for " + song.name + ": " + e.getMessage());
                }
            }
        }

        resp.sendRedirect("/admin.jsp?apple=" + filled + "&appleMissing=" + missing + "&appleLyrics=" + lyricsStored + "#sync");
    }

    private static String env(String name, String fallback) {
        String v = System.getenv(name);
        return v == null || v.isBlank() ? fallback : v;
    }
}
