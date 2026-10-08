package com.github.skeliit.dao;

import com.github.skeliit.Db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

/** Numbers for the admin dashboard (admin.jsp). A plain map: the JSP compiler can't read records. */
public class AdminDao {

    /** songs, clips, lyrics, comments, users, subscribers, reports, clipsWithoutSong, songsWithoutLyrics */
    public Map<String, Integer> stats() throws SQLException {
        String sql = "SELECT "
                + "(SELECT COUNT(*) FROM songs) AS songs, "
                + "(SELECT COUNT(*) FROM videos) AS clips, "
                + "(SELECT COUNT(DISTINCT song_id) FROM lyrics) AS lyrics, "
                + "(SELECT COUNT(*) FROM comments) + (SELECT COUNT(*) FROM video_comments) AS comments, "
                + "(SELECT COUNT(*) FROM users WHERE role <> 'DELETED') AS users, "
                + "(SELECT COUNT(*) FROM newsletter_emails WHERE confirmed_at IS NOT NULL) AS subscribers, "
                + "(SELECT COUNT(*) FROM (SELECT DISTINCT kind, comment_id FROM comment_reports) r) AS reports, "
                + "(SELECT COUNT(*) FROM videos WHERE song_id IS NULL) AS clipsWithoutSong, "
                + "(SELECT COUNT(*) FROM songs s WHERE NOT EXISTS (SELECT 1 FROM lyrics l WHERE l.song_id = s.id)) AS songsWithoutLyrics";
        Map<String, Integer> out = new LinkedHashMap<>();
        try (Connection conn = Db.get(); PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                for (int i = 1; i <= rs.getMetaData().getColumnCount(); i++) {
                    out.put(rs.getMetaData().getColumnLabel(i), rs.getInt(i));
                }
            }
        }
        return out;
    }
}
