package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.VideoTitles;
import com.github.skeliit.WebUtils;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/** Data for the home page: the newest clips and the songs on the running tapes. */
public class HomeDao {

    /** A clip; {@code title} falls back to the linked song name and may be null. */
    public record HomeVideo(String youtubeId, String title, Timestamp published) {}

    /** A song with lyrics; {@code thumb} is its newest clip's thumbnail or its preview photo. */
    public record TapeSong(String name, String href, String thumb, Integer year) {}

    public List<HomeVideo> latestVideos(int limit) throws SQLException {
        List<HomeVideo> list = new ArrayList<>();
        try (Connection conn = Db.get();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT v.youtube_id, v.title, v.published_at, s.name FROM videos v LEFT JOIN songs s ON s.id = v.song_id "
                     + "ORDER BY v.published_at DESC, v.id DESC LIMIT ?")) {
            ps.setInt(1, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String title = VideoTitles.display(rs.getString(2));
                    if (title == null) title = rs.getString(4);
                    list.add(new HomeVideo(rs.getString(1), title, rs.getTimestamp(3)));
                }
            }
        }
        return list;
    }

    /** Songs that have lyrics, newest first, linked like on the lyrics page. */
    public List<TapeSong> songsWithLyrics() throws SQLException {
        List<TapeSong> list = new ArrayList<>();
        try (Connection conn = Db.get();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT s.name, s.uuid, s.year, s.preview_image_url, MIN(l.id) AS lyric_id, "
                     + "(SELECT v.youtube_id FROM videos v WHERE v.song_id = s.id ORDER BY v.published_at DESC, v.id DESC LIMIT 1) AS youtube_id "
                     + "FROM lyrics l JOIN songs s ON s.id = l.song_id "
                     + "GROUP BY s.id, s.name, s.uuid, s.year, s.preview_image_url ORDER BY s.year DESC, s.name");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                String name = rs.getString("name");
                if (name == null) continue;
                name = name.replaceFirst("(?i)^\\s*skeli\\s*-\\s*", "");
                String uuid = rs.getString("uuid");
                String href = uuid != null && !uuid.isBlank() ? "/cs/song/" + uuid : "/lyrics/" + rs.getInt("lyric_id");
                int y = rs.getInt("year");
                Integer year = rs.wasNull() ? null : y;
                String youtubeId = rs.getString("youtube_id");
                String thumb = youtubeId != null
                        ? "/yt-thumb/" + youtubeId + "/default.jpg"
                        : WebUtils.safeUrl(rs.getString("preview_image_url"), null);
                list.add(new TapeSong(name, href, thumb, year));
            }
        }
        return list;
    }
}
