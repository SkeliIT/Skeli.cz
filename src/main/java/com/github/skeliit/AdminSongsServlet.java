package com.github.skeliit;

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
            req.getRequestDispatcher("/admin_songs.jsp").forward(req, resp);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    private List<SongOverview> fetchSongsOverview(Connection conn) throws SQLException {
        List<SongOverview> songs = new ArrayList<>();
        String sql = "SELECT s.id, s.uuid, s.name, s.year, " +
                "EXISTS(SELECT 1 FROM videos v WHERE v.song_id = s.id) AS has_video, " +
                "EXISTS(SELECT 1 FROM lyrics l WHERE l.song_id = s.id AND l.lang = 'cs') AS has_lyrics, " +
                "GROUP_CONCAT(DISTINCT l.lang ORDER BY l.lang SEPARATOR ',') AS languages " +
                "FROM songs s " +
                "LEFT JOIN lyrics l ON l.song_id = s.id " +
                "GROUP BY s.id, s.uuid, s.name, s.year " +
                "ORDER BY s.year DESC, s.name ASC";

        try (PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                SongOverview song = new SongOverview();
                song.id = rs.getInt("id");
                song.uuid = rs.getString("uuid");
                song.name = rs.getString("name");
                song.year = rs.getObject("year") != null ? rs.getInt("year") : null;
                song.hasVideo = rs.getBoolean("has_video");
                song.hasLyrics = rs.getBoolean("has_lyrics");
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
