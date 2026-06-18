package com.github.skeliit;

import com.github.skeliit.dao.LyricDao;
import com.github.skeliit.dao.SongDao;
import com.github.skeliit.model.Song;
import com.github.skeliit.service.AppleMusicClient;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet(name = "AppleMusicSyncServlet", urlPatterns = {"/admin/apple-sync"})
public class AppleMusicSyncServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Object role = req.getSession().getAttribute("role");
        if (role == null || !"ADMIN".equals(role.toString())) {
            resp.setStatus(403);
            resp.getWriter().write("Forbidden");
            return;
        }

        String teamId     = System.getenv("APPLE_MUSIC_TEAM_ID");
        String keyId      = System.getenv("APPLE_MUSIC_KEY_ID");
        String privateKey = System.getenv("APPLE_MUSIC_PRIVATE_KEY");
        String userToken  = System.getenv("APPLE_MUSIC_USER_TOKEN");
        String storefront = System.getenv("APPLE_MUSIC_STOREFRONT");
        String artist     = System.getenv("APPLE_MUSIC_ARTIST");
        String artistId   = System.getenv("APPLE_MUSIC_ARTIST_ID");

        if (teamId == null || keyId == null || privateKey == null) {
            resp.setStatus(500);
            resp.getWriter().write("Missing Apple Music configuration: APPLE_MUSIC_TEAM_ID, APPLE_MUSIC_KEY_ID, APPLE_MUSIC_PRIVATE_KEY");
            return;
        }
        if (storefront == null) storefront = "us";
        if (artist == null) artist = "Skeli";

        AppleMusicClient client = new AppleMusicClient(teamId, keyId, privateKey, userToken, storefront, artist);
        SongDao songDao = new SongDao();
        LyricDao lyricDao = new LyricDao();

        int synced = 0, lyricsStored = 0;
        List<String> errors = new ArrayList<>();

        try {
            // When the artist's Apple Music ID is known, enumerate their full catalog first.
            // This is more accurate than per-song text search.
            Map<String, AppleMusicClient.SongMatch> catalogByName = new HashMap<>();
            if (artistId != null && !artistId.isBlank()) {
                for (AppleMusicClient.SongMatch m : client.listArtistSongs(artistId)) {
                    catalogByName.put(AppleMusicClient.normalize(m.name()), m);
                }
            }

            List<Song> songs = songDao.listAll();
            for (Song song : songs) {
                try {
                    if (song.appleMusicId == null) {
                        AppleMusicClient.SongMatch match = null;
                        // Prefer artist catalog lookup over generic search
                        if (!catalogByName.isEmpty()) {
                            String key = AppleMusicClient.normalize(song.name);
                            match = catalogByName.get(key);
                            // Also try with year suffix stripped if no direct hit
                            if (match == null) {
                                for (Map.Entry<String, AppleMusicClient.SongMatch> e : catalogByName.entrySet()) {
                                    if (e.getKey().contains(key) || key.contains(e.getKey())) {
                                        // Prefer year match when both are known
                                        String rd = e.getValue().releaseDate();
                                        if (song.year == null || rd.isBlank() || rd.startsWith(String.valueOf(song.year))) {
                                            match = e.getValue();
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        // Fall back to catalog search when artist ID not set or no match found
                        if (match == null) {
                            match = client.searchSong(song.name, song.year);
                        }
                        if (match != null) {
                            songDao.updateAppleMusicId(song.id, match.id());
                            song.appleMusicId = match.id();
                            synced++;
                        }
                    } else {
                        synced++;
                    }

                    if (song.appleMusicId != null && userToken != null && !userToken.isBlank()) {
                        AppleMusicClient.AppleMusicLyrics lyrics = client.fetchLyrics(song.appleMusicId);
                        if (lyrics != null) {
                            lyricDao.upsertAppleMusicLyrics(song.id, lyrics.plainText(), lyrics.ttml(), "en");
                            lyricsStored++;
                        }
                    }
                } catch (Exception e) {
                    errors.add(song.name + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new ServletException(e);
        }

        resp.setContentType("application/json; charset=UTF-8");
        PrintWriter out = resp.getWriter();
        out.print("{\"synced\":" + synced + ",\"lyrics\":" + lyricsStored + ",\"errors\":[");
        for (int i = 0; i < errors.size(); i++) {
            if (i > 0) out.print(",");
            out.print("\"" + errors.get(i).replace("\\", "\\\\").replace("\"", "\\\"") + "\"");
        }
        out.print("]}");
    }
}
