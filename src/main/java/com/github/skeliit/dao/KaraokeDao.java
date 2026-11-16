package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.job.VideoTitles;
import com.github.skeliit.model.KaraokeClip;
import com.github.skeliit.model.KaraokeSong;
import com.github.skeliit.model.SongTitle;

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

    /**
     * The song for the karaoke cinema (/karaoke/{uuid}): its newest clip, name, year and Czech lyrics, or null
     * when it has no clip or no Czech lyrics. [youtubeId, name, year (may be null), words]
     */
    public String[] cinemaSong(String uuid) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT v.youtube_id, s.name, s.year, l.words FROM songs s "
                        + "JOIN videos v ON v.song_id = s.id JOIN lyrics l ON l.song_id = s.id AND l.lang = 'cs' "
                        + "WHERE s.uuid = ? AND l.words IS NOT NULL AND l.words <> '' "
                        + "ORDER BY v.published_at IS NULL, v.published_at DESC LIMIT 1")) {
            ps.setString(1, uuid);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                return new String[] {rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4)};
            }
        }
    }

    /** Songs with a clip and Czech lyrics, newest first (the karaoke list; the servlet keeps those with timings). */
    public List<KaraokeSong> cinemaSongs() throws SQLException {
        List<KaraokeSong> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT s.uuid, s.name, s.year, l.words, s.poster_x, s.poster_y, s.poster_zoom, (SELECT v.youtube_id FROM videos v WHERE v.song_id = s.id "
                        + "ORDER BY v.published_at IS NULL, v.published_at DESC LIMIT 1) yt "
                        + "FROM songs s JOIN lyrics l ON l.song_id = s.id AND l.lang = 'cs' "
                        + "WHERE l.words IS NOT NULL AND l.words <> '' AND s.uuid IS NOT NULL ORDER BY s.collab, s.year IS NULL, s.year DESC, s.name");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                if (rs.getString(8) == null) continue;
                KaraokeSong k = new KaraokeSong();
                SongTitle st = SongTitle.of(rs.getString(2));
                k.uuid = rs.getString(1);
                k.title = st.title;
                k.credits = st.credits;
                int y = rs.getInt(3);
                k.year = rs.wasNull() ? null : y;
                k.lines = lines(rs.getString(4));
                k.youtubeId = rs.getString(8);
                k.posterStyle = com.github.skeliit.model.Song.posterStyle((Double) rs.getObject(5, Double.class), (Double) rs.getObject(6, Double.class), (Double) rs.getObject(7, Double.class));
                out.add(k);
            }
        }
        return out;
    }

    /** The non-empty lines, as js/karaoke.js and tools/karaoke-align.py count them. */
    public static String[] lines(String words) {
        if (words == null) return new String[0];
        return Arrays.stream(words.split("\\r?\\n")).map(String::strip).filter(l -> !l.isEmpty()).toArray(String[]::new);
    }
}
