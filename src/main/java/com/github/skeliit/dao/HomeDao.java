package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.WebUtils;
import com.github.skeliit.job.VideoTitles;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/** Data for the home page: the newest clips, the songs on the running tapes and a line from a lyric. */
public class HomeDao {

    /** A clip; {@code title} falls back to the linked song name and may be null. */
    public record HomeVideo(String youtubeId, String title, Timestamp published) {}

    /** A song with lyrics; {@code thumb} is its newest clip's thumbnail or its preview photo. */
    public record TapeSong(String name, String href, String thumb, Integer year) {}

    /** Two lines from one of Skeli's songs (table home_quotes) and where the whole lyric is. */
    public static final class Quote {
        public final String line1, line2, song, href;
        Quote(String line1, String line2, String song, String href) {
            this.line1 = line1; this.line2 = line2; this.song = song; this.href = href;
        }
    }

    /** A random quote for the hero, linked to its song in {@code lang}; null when there is none. */
    public Quote randomQuote(String lang) throws SQLException {
        try (Connection conn = Db.get();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT q.line1, q.line2, s.name, s.uuid FROM home_quotes q JOIN songs s ON s.id = q.song_id ORDER BY RAND() LIMIT 1");
             ResultSet rs = ps.executeQuery()) {
            if (!rs.next()) return null;
            String uuid = rs.getString("uuid");
            String href = uuid == null ? "/texty.jsp" : "/" + com.github.skeliit.I18n.safeLang(lang) + "/song/" + uuid;
            return new Quote(rs.getString("line1"), rs.getString("line2"), com.github.skeliit.model.SongTitle.of(rs.getString("name")).title, href);
        }
    }

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

    /** Songs with lyrics for the tapes on the home page, linked to their page in {@code lang}. */
    public List<TapeSong> songsWithLyrics(String lang) throws SQLException {
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
                String href = uuid != null && !uuid.isBlank() ? "/" + com.github.skeliit.I18n.safeLang(lang) + "/song/" + uuid : "/lyrics/" + rs.getInt("lyric_id");
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
