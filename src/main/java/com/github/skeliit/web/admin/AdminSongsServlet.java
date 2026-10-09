package com.github.skeliit.web.admin;

import com.github.skeliit.Db;
import com.github.skeliit.model.SongOverview;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@WebServlet(name = "AdminSongsServlet", urlPatterns = { "/admin/songs" })
public class AdminSongsServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Object role = req.getSession().getAttribute("role");
        if (role == null || !"ADMIN".equals(role.toString())) {
            resp.setStatus(403);
            return;
        }

        try (Connection conn = Db.get()) {
            List<SongOverview> songs = fetchSongsOverview(conn);
            req.setAttribute("songs", songs);
            req.getRequestDispatcher("/WEB-INF/views/admin/songs.jsp").forward(req, resp);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    private List<SongOverview> fetchSongsOverview(Connection conn) throws SQLException {
        List<SongOverview> songs = new ArrayList<>();
        String sql = "SELECT s.id, s.uuid, s.name, s.year, s.preview_image_url, s.apple_music_id, s.spotify_id, " +
                "EXISTS(SELECT 1 FROM videos v WHERE v.song_id = s.id) AS has_video, " +
                "(SELECT v2.youtube_id FROM videos v2 WHERE v2.song_id = s.id ORDER BY v2.published_at DESC, v2.id DESC LIMIT 1) AS youtube_id, " +
                "EXISTS(SELECT 1 FROM lyrics l WHERE l.song_id = s.id AND l.lang = 'cs') AS has_lyrics, " +
                "(SELECT MIN(l2.id) FROM lyrics l2 WHERE l2.song_id = s.id AND l2.lang = 'cs') AS first_lyric_id, " +
                "GROUP_CONCAT(DISTINCT l.lang ORDER BY l.lang SEPARATOR ',') AS languages " +
                "FROM songs s " +
                "LEFT JOIN lyrics l ON l.song_id = s.id " +
                "GROUP BY s.id, s.uuid, s.name, s.year, s.preview_image_url, s.apple_music_id, s.spotify_id " +
                "ORDER BY s.year DESC, s.name ASC";

        try (PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                SongOverview song = new SongOverview();
                song.id = rs.getInt("id");
                song.uuid = rs.getString("uuid");
                song.name = rs.getString("name");
                song.year = rs.getObject("year") != null ? rs.getInt("year") : null;
                song.previewImageUrl = rs.getString("preview_image_url");
                song.appleMusicId = rs.getString("apple_music_id");
                song.spotifyId = rs.getString("spotify_id");
                song.hasVideo = rs.getBoolean("has_video");
                song.youtubeId = rs.getString("youtube_id");
                song.hasLyrics = rs.getBoolean("has_lyrics");
                int fl = rs.getInt("first_lyric_id");
                song.firstLyricId = rs.wasNull() ? null : fl;
                String langs = rs.getString("languages");
                if (langs != null && !langs.isEmpty()) {
                    song.languages = langs.split(",");
                } else {
                    song.languages = new String[0];
                }
                songs.add(song);
            }
        }
        return songs;
    }
}
