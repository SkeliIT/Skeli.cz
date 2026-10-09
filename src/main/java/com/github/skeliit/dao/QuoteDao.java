package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.HomeQuote;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/** The quotes for the home page (two lines from a song), managed in the admin. */
public class QuoteDao {

    public List<HomeQuote> list() throws SQLException {
        List<HomeQuote> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT q.id, q.song_id, s.name, q.line1, q.line2 FROM home_quotes q JOIN songs s ON s.id = q.song_id ORDER BY s.name, q.id");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                HomeQuote q = new HomeQuote();
                q.id = rs.getInt(1);
                q.songId = rs.getInt(2);
                q.songName = rs.getString(3);
                q.line1 = rs.getString(4);
                q.line2 = rs.getString(5);
                out.add(q);
            }
        }
        return out;
    }

    public void add(int songId, String line1, String line2) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO home_quotes (song_id, line1, line2) VALUES (?, ?, ?)")) {
            ps.setInt(1, songId);
            ps.setString(2, line1);
            ps.setString(3, line2);
            ps.executeUpdate();
        }
    }

    public void update(int id, int songId, String line1, String line2) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE home_quotes SET song_id = ?, line1 = ?, line2 = ? WHERE id = ?")) {
            ps.setInt(1, songId);
            ps.setString(2, line1);
            ps.setString(3, line2);
            ps.setInt(4, id);
            ps.executeUpdate();
        }
    }

    public void delete(int id) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("DELETE FROM home_quotes WHERE id = ?")) {
            ps.setInt(1, id);
            ps.executeUpdate();
        }
    }
}
