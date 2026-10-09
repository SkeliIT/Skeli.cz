package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.job.VideoTitles;
import com.github.skeliit.model.DiscoItem;
import com.github.skeliit.model.LyricListItem;
import com.github.skeliit.model.Song;
import com.github.skeliit.model.SongVideo;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SongDao {
    private static final String SONG_COLS =
            "id, name, year, uuid, seo_slug, apple_music_id, spotify_id, preview_image_url, art_x, art_y, art_zoom";

    /** Newest first (year, then the newest clip), the same order as the Texty page and its previous / next links. */
    public List<Song> listWithFirstLyric() throws SQLException {
        String sql = "SELECT s.id, s.name, s.year, s.uuid, s.seo_slug, s.apple_music_id, s.spotify_id, s.preview_image_url, s.art_x, s.art_y, s.art_zoom, " +
                "(SELECT MIN(l.id) FROM lyrics l WHERE l.song_id=s.id) AS firstLyricId, " +
                "(SELECT v.youtube_id FROM videos v WHERE v.song_id = s.id ORDER BY v.published_at DESC, v.id DESC LIMIT 1) AS youtubeId " +
                "FROM songs s ORDER BY s.year DESC, (SELECT MAX(v.published_at) FROM videos v WHERE v.song_id = s.id) DESC, s.name ASC";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            List<Song> out = new ArrayList<>();
            while (rs.next()) out.add(mapSong(rs, true));
            return out;
        }
    }

    /** Songs that have lyrics, as the Texty list shows them: newest year first, then the newest clip. */
    public List<LyricListItem> withLyrics(String lang) throws SQLException {
        String sql = "SELECT s.id, s.uuid, s.name, s.year, s.preview_image_url, s.art_x, s.art_y, s.art_zoom, MIN(l.id) AS lyric_id, "
                + "(SELECT v.youtube_id FROM videos v WHERE v.song_id = s.id ORDER BY v.published_at DESC, v.id DESC LIMIT 1) AS youtube_id, "
                + "(SELECT MAX(v.published_at) FROM videos v WHERE v.song_id = s.id) AS newest_clip, "
                + "(SELECT lt.title FROM lyrics lt WHERE lt.song_id = s.id AND lt.lang = ? ORDER BY lt.id LIMIT 1) AS tr_title "
                + "FROM lyrics l JOIN songs s ON s.id = l.song_id "
                + "GROUP BY s.id, s.uuid, s.name, s.year, s.preview_image_url, s.art_x, s.art_y, s.art_zoom "
                + "ORDER BY s.year DESC, newest_clip DESC, s.name ASC";
        List<LyricListItem> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, lang);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int lyricId = rs.getInt("lyric_id");
                    if (rs.wasNull() || lyricId <= 0) continue;
                    Double x = nullableDouble(rs, "art_x"), y = nullableDouble(rs, "art_y"), z = nullableDouble(rs, "art_zoom");
                    out.add(new LyricListItem(rs.getInt("id"), rs.getString("uuid"), rs.getString("name"), year(rs.getObject("year")),
                            lyricId, rs.getString("youtube_id"), rs.getString("preview_image_url"), rs.getString("tr_title"),
                            Song.artStyle(x, y, z)));
                }
            }
        }
        return out;
    }

    /**
     * The Diskografie: every song (newest first; a song with several clips is dated and sorted by
     * its newest clip), then the clips that aren't linked to a song.
     */
    public List<DiscoItem> discography(String lang) throws SQLException {
        String sql = "SELECT s.name, CASE WHEN (SELECT COUNT(*) FROM videos v WHERE v.song_id = s.id) > 1 "
                + "         THEN (SELECT YEAR(MAX(v.published_at)) FROM videos v WHERE v.song_id = s.id) ELSE s.year END AS year, "
                + "       s.uuid, (SELECT MIN(l.id) FROM lyrics l WHERE l.song_id = s.id) AS lyric_id, "
                + "       (SELECT v.youtube_id FROM videos v WHERE v.song_id = s.id ORDER BY v.published_at DESC, v.id DESC LIMIT 1) AS yt, "
                + "       0 AS grp, s.id AS ord, s.preview_image_url AS preview, s.apple_music_id AS apple, s.spotify_id AS spotify, "
                + "       (SELECT lt.title FROM lyrics lt WHERE lt.song_id = s.id AND lt.lang = ? ORDER BY lt.id LIMIT 1) AS tr "
                + "FROM songs s "
                + "UNION ALL "
                + "SELECT v.title, NULL, NULL, NULL, v.youtube_id, 1, v.id, NULL, NULL, NULL, NULL FROM videos v WHERE v.song_id IS NULL "
                + "ORDER BY grp, year DESC, ord DESC";
        List<DiscoItem> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, lang);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    boolean song = rs.getInt("grp") == 0;
                    String name = song ? rs.getString("name") : VideoTitles.display(rs.getString("name"));
                    if (name == null || name.isBlank()) name = "YouTube";
                    if (song) name = name.replaceFirst("(?i)^\\s*skeli\\s*-\\s*", "");
                    int lyricId = rs.getInt("lyric_id");
                    if (rs.wasNull() || lyricId < 0) lyricId = 0;
                    out.add(new DiscoItem(song, rs.getInt("ord"), name, year(rs.getObject("year")),
                            song ? rs.getString("uuid") : null, lyricId, rs.getString("yt"), rs.getString("preview"),
                            rs.getString("apple"), rs.getString("spotify"), song ? rs.getString("tr") : null));
                }
            }
        }
        return out;
    }

    /** A year from the database: a number, a date (YEAR column) or text like "2025-01-01". */
    static Integer year(Object v) {
        if (v == null) return null;
        if (v instanceof java.sql.Date d) return d.toLocalDate().getYear();
        if (v instanceof Number n) return n.intValue();
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("^\\s*(\\d{4})").matcher(v.toString());   // "2025", "2025-01-01"
        return m.find() ? Integer.valueOf(m.group(1)) : null;
    }

    public List<Song> listAll() throws SQLException {
        String sql = "SELECT " + SONG_COLS + " FROM songs ORDER BY name ASC";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            List<Song> out = new ArrayList<>();
            while (rs.next()) out.add(mapSong(rs, false));
            return out;
        }
    }

    public Song findById(int id) throws SQLException {
        String sql = "SELECT " + SONG_COLS + ", " +
                "(SELECT MIN(l.id) FROM lyrics l WHERE l.song_id=s.id AND l.lang='cs') AS firstLyricId " +
                "FROM songs s WHERE id=?";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapSong(rs, true) : null;
            }
        }
    }

    public Song findByUuid(String uuid) throws SQLException {
        if (uuid == null || uuid.isBlank()) return null;
        String sql = "SELECT " + SONG_COLS + ", " +
                "(SELECT MIN(l.id) FROM lyrics l WHERE l.song_id=s.id AND l.lang='cs') AS firstLyricId " +
                "FROM songs s WHERE uuid=?";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, uuid.trim());
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapSong(rs, true) : null;
            }
        }
    }

    public Song findBySeoSlug(String slug) throws SQLException {
        if (slug == null || slug.isBlank()) return null;
        // Prefer lyric-level SEO (any language), then legacy songs.seo_slug
        String sql = "SELECT s.id, s.name, s.year, s.uuid, s.seo_slug, s.apple_music_id, s.spotify_id, s.preview_image_url, s.art_x, s.art_y, s.art_zoom, " +
                "(SELECT MIN(l2.id) FROM lyrics l2 WHERE l2.song_id=s.id AND l2.lang='cs') AS firstLyricId " +
                "FROM songs s JOIN lyrics l ON l.song_id=s.id WHERE l.seo_slug=? LIMIT 1";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, slug.trim().toLowerCase());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapSong(rs, true);
            }
        }
        String legacy = "SELECT " + SONG_COLS + ", " +
                "(SELECT MIN(l.id) FROM lyrics l WHERE l.song_id=s.id AND l.lang='cs') AS firstLyricId " +
                "FROM songs s WHERE seo_slug=?";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(legacy)) {
            ps.setString(1, slug.trim().toLowerCase());
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapSong(rs, true) : null;
            }
        }
    }

    /** True if another song already uses this SEO slug. */
    public boolean isSeoSlugTaken(String slug, int exceptSongId) throws SQLException {
        if (slug == null || slug.isBlank()) return false;
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement(
                     "SELECT 1 FROM songs WHERE seo_slug=? AND id<>? LIMIT 1")) {
            ps.setString(1, slug.trim().toLowerCase());
            ps.setInt(2, exceptSongId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    public void updateBasics(int songId, String name, Integer year, String appleMusicId, String spotifyId,
                             String seoSlug) throws SQLException {
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement(
                     "UPDATE songs SET name=?, year=?, apple_music_id=?, spotify_id=?, seo_slug=? WHERE id=?")) {
            ps.setString(1, name);
            if (year == null) ps.setNull(2, Types.INTEGER); else ps.setInt(2, year);
            ps.setString(3, blankToNull(appleMusicId));
            ps.setString(4, blankToNull(spotifyId));
            ps.setString(5, blankToNull(seoSlug));
            ps.setInt(6, songId);
            ps.executeUpdate();
        }
    }

    public void updateAppleMusicId(int songId, String appleMusicId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE songs SET apple_music_id=? WHERE id=?")) {
            ps.setString(1, blankToNull(appleMusicId));
            ps.setInt(2, songId);
            ps.executeUpdate();
        }
    }

    public void updatePreviewImageUrl(int songId, String previewImageUrl) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE songs SET preview_image_url=? WHERE id=?")) {
            ps.setString(1, previewImageUrl);
            ps.setInt(2, songId);
            ps.executeUpdate();
        }
    }

    /** The picture's place in the Texty row; all null = automatic again. */
    public void updateArt(int songId, Double x, Double y, Double zoom) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE songs SET art_x=?, art_y=?, art_zoom=? WHERE id=?")) {
            ps.setObject(1, x);
            ps.setObject(2, y);
            ps.setObject(3, zoom);
            ps.setInt(4, songId);
            ps.executeUpdate();
        }
    }

    public String getPreviewImageUrl(int songId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT preview_image_url FROM songs WHERE id=?")) {
            ps.setInt(1, songId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    public List<SongVideo> videosForSong(int songId) throws SQLException {
        String sql = "SELECT id, youtube_id, title, song_id FROM videos WHERE song_id=? ORDER BY published_at DESC, id DESC";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, songId);
            try (ResultSet rs = ps.executeQuery()) {
                List<SongVideo> out = new ArrayList<>();
                while (rs.next()) out.add(mapVideo(rs));
                return out;
            }
        }
    }

    public void linkVideo(String youtubeId, int songId, String title) throws SQLException {
        try (Connection c = Db.get()) {
            try (PreparedStatement up = c.prepareStatement(
                    "UPDATE videos SET song_id=?, title=COALESCE(NULLIF(?, ''), title) WHERE youtube_id=?")) {
                up.setInt(1, songId);
                up.setString(2, title);
                up.setString(3, youtubeId);
                int n = up.executeUpdate();
                if (n == 0) {
                    try (PreparedStatement ins = c.prepareStatement(
                            "INSERT INTO videos (youtube_id, title, song_id) VALUES (?, ?, ?)")) {
                        ins.setString(1, youtubeId);
                        ins.setString(2, blankToNull(title) != null ? title : youtubeId);
                        ins.setInt(3, songId);
                        ins.executeUpdate();
                    }
                }
            }
        }
    }

    public void unlinkVideo(String youtubeId, int songId) throws SQLException {
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement("UPDATE videos SET song_id=NULL WHERE youtube_id=? AND song_id=?")) {
            ps.setString(1, youtubeId);
            ps.setInt(2, songId);
            ps.executeUpdate();
        }
    }

    public String[] lyricLanguages(int songId) throws SQLException {
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement(
                     "SELECT GROUP_CONCAT(DISTINCT lang ORDER BY lang SEPARATOR ',') FROM lyrics WHERE song_id=?")) {
            ps.setInt(1, songId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next() || rs.getString(1) == null || rs.getString(1).isEmpty()) return new String[0];
                return rs.getString(1).split(",");
            }
        }
    }

    private Song mapSong(ResultSet rs, boolean withFirstLyric) throws SQLException {
        Song s = new Song();
        s.id = rs.getInt("id");
        s.name = rs.getString("name");
        int y = rs.getInt("year"); s.year = rs.wasNull() ? null : y;
        try { s.uuid = rs.getString("uuid"); } catch (SQLException ignore) {}
        try { s.seoSlug = rs.getString("seo_slug"); } catch (SQLException ignore) {}
        s.appleMusicId = rs.getString("apple_music_id");
        try { s.spotifyId = rs.getString("spotify_id"); } catch (SQLException ignore) {}
        s.previewImageUrl = rs.getString("preview_image_url");
        s.artX = nullableDouble(rs, "art_x");
        s.artY = nullableDouble(rs, "art_y");
        s.artZoom = nullableDouble(rs, "art_zoom");
        if (withFirstLyric) {
            int fl = rs.getInt("firstLyricId"); s.firstLyricId = rs.wasNull() ? null : fl;
            try { s.youtubeId = rs.getString("youtubeId"); } catch (SQLException ignore) {}
        }
        return s;
    }

    private SongVideo mapVideo(ResultSet rs) throws SQLException {
        SongVideo v = new SongVideo();
        v.id = rs.getInt("id");
        v.youtubeId = rs.getString("youtube_id");
        v.title = rs.getString("title");
        int sid = rs.getInt("song_id");
        v.songId = rs.wasNull() ? null : sid;
        return v;
    }

    private static Double nullableDouble(ResultSet rs, String col) throws SQLException {
        double v = rs.getDouble(col);
        return rs.wasNull() ? null : v;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
