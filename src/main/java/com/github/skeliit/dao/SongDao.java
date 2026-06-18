package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.Song;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SongDao {
    public List<Song> listWithFirstLyric() throws SQLException {
        String sql = "SELECT s.id, s.name, s.year, s.apple_music_id, (SELECT MIN(l.id) FROM lyrics l WHERE l.song_id=s.id) AS firstLyricId FROM songs s ORDER BY s.name ASC";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            List<Song> out = new ArrayList<>();
            while (rs.next()) {
                out.add(mapSong(rs, true));
            }
            return out;
        }
    }

    public List<Song> listAll() throws SQLException {
        String sql = "SELECT id, name, year, uuid, apple_music_id FROM songs ORDER BY name ASC";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            List<Song> out = new ArrayList<>();
            while (rs.next()) {
                out.add(mapSong(rs, false));
            }
            return out;
        }
    }

    public void updateAppleMusicId(int songId, String appleMusicId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE songs SET apple_music_id=? WHERE id=?")) {
            ps.setString(1, appleMusicId);
            ps.setInt(2, songId);
            ps.executeUpdate();
        }
    }

    private Song mapSong(ResultSet rs, boolean withFirstLyric) throws SQLException {
        Song s = new Song();
        s.id = rs.getInt("id");
        s.name = rs.getString("name");
        int y = rs.getInt("year"); s.year = rs.wasNull() ? null : y;
        s.appleMusicId = rs.getString("apple_music_id");
        if (withFirstLyric) {
            int fl = rs.getInt("firstLyricId"); s.firstLyricId = rs.wasNull() ? null : fl;
        }
        return s;
    }
}
