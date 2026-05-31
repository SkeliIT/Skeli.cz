package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.*;

@WebServlet(name = "AdminVideoServlet", urlPatterns = { "/admin/video" })
public class AdminVideoServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Object role = req.getSession().getAttribute("role");
        if (role == null || !"ADMIN".equals(role.toString())) {
            resp.setStatus(403);
            return;
        }
        String youtubeId = req.getParameter("youtube_id");
        String title = req.getParameter("title");
        String songName = req.getParameter("song_name");
        String yearStr = req.getParameter("year");
        String lyricIdStr = req.getParameter("lyric_id");
        Integer year = null;
        if (yearStr != null && !yearStr.isEmpty())
            try {
                year = Integer.parseInt(yearStr);
            } catch (Exception ignored) {
            }
        try (Connection conn = Db.get()) {
            if (title != null) {
                try (PreparedStatement ps = conn.prepareStatement("UPDATE videos SET title=? WHERE youtube_id=?")) {
                    ps.setString(1, title);
                    ps.setString(2, youtubeId);
                    ps.executeUpdate();
                }
            }
            Integer songId = null;
            if (songName != null && !songName.isEmpty()) {
                String uuid = java.util.UUID.randomUUID().toString();
                songId = ensureSong(conn, songName, year, uuid);
            } else if (lyricIdStr != null && !lyricIdStr.isEmpty()) {
                try (PreparedStatement ps = conn.prepareStatement("SELECT song_id FROM lyrics WHERE id=?")) {
                    ps.setInt(1, Integer.parseInt(lyricIdStr));
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next())
                            songId = rs.getInt(1);
                    }
                }
            }
            if (songId != null) {
                try (PreparedStatement ps = conn.prepareStatement("UPDATE videos SET song_id=? WHERE youtube_id=?")) {
                    ps.setInt(1, songId);
                    ps.setString(2, youtubeId);
                    ps.executeUpdate();
                }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect("/admin.jsp");
    }

    private Integer ensureSong(Connection conn, String name, Integer year, String uuid) throws SQLException {
        try (PreparedStatement sel = conn
                .prepareStatement("SELECT id FROM songs WHERE name=? AND ((year IS NULL AND ? IS NULL) OR year=?)")) {
            sel.setString(1, name);
            if (year == null) {
                sel.setNull(2, Types.INTEGER);
                sel.setNull(3, Types.INTEGER);
            } else {
                sel.setInt(2, year);
                sel.setInt(3, year);
            }
            try (ResultSet rs = sel.executeQuery()) {
                if (rs.next())
                    return rs.getInt(1);
            }
        }
        try (PreparedStatement ins = conn.prepareStatement("INSERT INTO songs (uuid, name, year) VALUES (?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS)) {
            ins.setString(1, uuid);
            ins.setString(2, name);
            if (year == null)
                ins.setNull(3, Types.INTEGER);
            else
                ins.setInt(3, year);
            ins.executeUpdate();
            try (ResultSet rs = ins.getGeneratedKeys()) {
                if (rs.next())
                    return rs.getInt(1);
            }
        }
        return null;
    }
}
