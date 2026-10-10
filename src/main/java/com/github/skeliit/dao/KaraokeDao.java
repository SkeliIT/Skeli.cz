package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.job.VideoTitles;
import com.github.skeliit.model.KaraokeClip;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Karaoke timings corrected by hand in the admin (karaoke_timings). The automatic ones are files
 * (karaoke/<youtube id>.json); a row here wins over the file.
 */
public class KaraokeDao {

    /** The hand-made timings as JSON {"lines": n, "times": [...], "source": "manual"}, or null. */
    public String manual(String youtubeId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT line_count, times FROM karaoke_timings WHERE youtube_id = ?")) {
            ps.setString(1, youtubeId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                return "{\"lines\":" + rs.getInt(1) + ",\"times\":" + rs.getString(2) + ",\"source\":\"manual\"}";
            }
        }
    }

    public void save(String youtubeId, int lineCount, String timesJson, int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO karaoke_timings (youtube_id, line_count, times, updated_by) VALUES (?, ?, ?, ?) "
                        + "ON DUPLICATE KEY UPDATE line_count = VALUES(line_count), times = VALUES(times), updated_by = VALUES(updated_by)")) {
            ps.setString(1, youtubeId);
            ps.setInt(2, lineCount);
            ps.setString(3, timesJson);
            ps.setInt(4, userId);
            ps.executeUpdate();
        }
    }

    /** Back to the automatic timings (the file). */
    public void reset(String youtubeId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("DELETE FROM karaoke_timings WHERE youtube_id = ?")) {
            ps.setString(1, youtubeId);
            ps.executeUpdate();
        }
    }

    /** The clips whose song has Czech lyrics (only those can have karaoke), newest song first. */
    public List<KaraokeClip> clips() throws SQLException {
        List<KaraokeClip> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT v.youtube_id, v.title, s.name, l.words, (SELECT 1 FROM karaoke_timings k WHERE k.youtube_id = BINARY v.youtube_id) "
                        + "FROM videos v JOIN songs s ON s.id = v.song_id JOIN lyrics l ON l.song_id = s.id AND l.lang = 'cs' "
                        + "WHERE l.words IS NOT NULL AND l.words <> '' ORDER BY s.year DESC, s.name");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                KaraokeClip k = new KaraokeClip();
                k.youtubeId = rs.getString(1);
                k.title = VideoTitles.display(rs.getString(2));
                k.songName = rs.getString(3);
                k.lines = lines(rs.getString(4));
                k.manual = rs.getObject(5) != null;
                out.add(k);
            }
        }
        return out;
    }

    /** One clip of the list, or null. */
    public KaraokeClip clip(String youtubeId) throws SQLException {
        for (KaraokeClip k : clips()) if (k.youtubeId.equals(youtubeId)) return k;
        return null;
    }

    /** The non-empty lines, as js/karaoke.js and tools/karaoke-align.py count them. */
    public static String[] lines(String words) {
        if (words == null) return new String[0];
        return Arrays.stream(words.split("\\r?\\n")).map(String::strip).filter(l -> !l.isEmpty()).toArray(String[]::new);
    }
}
