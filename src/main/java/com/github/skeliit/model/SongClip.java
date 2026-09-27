package com.github.skeliit.model;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import com.github.skeliit.Db;

/**
 * One YouTube clip of a song. A song can have several (e.g. the 2016 original
 * and a 2025 remake); pages then let the visitor pick the version.
 */
public class SongClip {
    public String youtubeId;
    public String title;
    public Integer year;
    /** "original" (oldest of several), "remake" (title says so) or "version". */
    public String kind;

    public String getYoutubeId() { return youtubeId; }
    public String getTitle() { return title; }
    public Integer getYear() { return year; }
    public String getKind() { return kind; }

    /** Label like "Remake · 2025" in the page language. */
    public String label(Properties t) {
        String name = switch (kind) {
            case "original" -> t.getProperty("music.version.original", "Originál");
            case "remake" -> t.getProperty("music.version.remake", "Remake");
            default -> t.getProperty("music.version.other", "Verze");
        };
        return year == null ? name : name + " · " + year;
    }

    /** Clips of every song, newest first, keyed by song id. */
    public static Map<Integer, List<SongClip>> bySong() throws SQLException {
        Map<Integer, List<SongClip>> out = new LinkedHashMap<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT song_id, youtube_id, title, published_at FROM videos WHERE song_id IS NOT NULL " +
                "ORDER BY published_at DESC, id DESC");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.computeIfAbsent(rs.getInt(1), k -> new ArrayList<>()).add(read(rs));
            }
        }
        out.values().forEach(SongClip::markKinds);
        return out;
    }

    /** Clips of one song, newest first. */
    public static List<SongClip> forSong(int songId) throws SQLException {
        List<SongClip> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT song_id, youtube_id, title, published_at FROM videos WHERE song_id = ? " +
                "ORDER BY published_at DESC, id DESC")) {
            ps.setInt(1, songId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) out.add(read(rs));
            }
        }
        markKinds(out);
        return out;
    }

    private static SongClip read(ResultSet rs) throws SQLException {
        SongClip s = new SongClip();
        s.youtubeId = rs.getString(2);
        s.title = rs.getString(3);
        Timestamp ts = rs.getTimestamp(4);
        s.year = ts == null ? null : ts.toLocalDateTime().getYear();
        return s;
    }

    /** Newest-first list: the last (oldest) is the original when there are several. */
    static void markKinds(List<SongClip> clips) {
        for (int i = 0; i < clips.size(); i++) {
            SongClip s = clips.get(i);
            boolean remake = s.title != null && s.title.toLowerCase().contains("remake");
            if (remake) s.kind = "remake";
            else if (clips.size() > 1 && i == clips.size() - 1) s.kind = "original";
            else s.kind = "version";
        }
    }
}
