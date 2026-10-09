package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.TrackDraft;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.UUID;

/** Adding a track from YouTube in one go: the clip, its song (new or existing), the listen links and the lyrics. */
public class TrackDao {

    /** Fills in what the database already knows about the clip and the suggested song name. */
    public void complete(TrackDraft d) throws SQLException {
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT s.id, s.name, s.uuid FROM videos v JOIN songs s ON s.id = v.song_id WHERE v.youtube_id = ?")) {
                ps.setString(1, d.youtubeId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) { d.linkedSongId = rs.getInt(1); d.linkedSongName = rs.getString(2); d.linkedSongUuid = rs.getString(3); }
                }
            }
            if (d.songName != null) {
                try (PreparedStatement ps = c.prepareStatement("SELECT id FROM songs WHERE LOWER(name) = LOWER(?) ORDER BY id LIMIT 1")) {
                    ps.setString(1, d.songName);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) d.sameNameSongId = rs.getInt(1);
                    }
                }
            }
        }
    }

    /**
     * Saves the track and returns the song's uuid. {@code songId} links the clip to an existing song;
     * otherwise a new song {@code songName} ({@code year}) is created. Empty links and lyrics are skipped,
     * so nothing that is already filled in gets wiped.
     */
    public String save(String youtubeId, String videoTitle, Timestamp released, Integer songId, String songName, Integer year,
                       String spotifyId, String appleMusicId, String lyricsCs) throws SQLException {
        try (Connection c = Db.get()) {
            c.setAutoCommit(false);
            try {
                if (songId == null) {
                    try (PreparedStatement ins = c.prepareStatement("INSERT INTO songs (uuid, name, year) VALUES (?, ?, ?)", Statement.RETURN_GENERATED_KEYS)) {
                        ins.setString(1, UUID.randomUUID().toString());
                        ins.setString(2, songName);
                        if (year == null) ins.setNull(3, Types.INTEGER); else ins.setInt(3, year);
                        ins.executeUpdate();
                        try (ResultSet rs = ins.getGeneratedKeys()) { rs.next(); songId = rs.getInt(1); }
                    }
                }
                // the clip: added if it isn't here yet, linked to the song either way
                try (PreparedStatement ps = c.prepareStatement(
                        "INSERT INTO videos (youtube_id, title, published_at, song_id) VALUES (?, ?, ?, ?) "
                                + "ON DUPLICATE KEY UPDATE song_id = VALUES(song_id), title = COALESCE(NULLIF(VALUES(title), ''), title), "
                                + "published_at = COALESCE(published_at, VALUES(published_at))")) {
                    ps.setString(1, youtubeId);
                    ps.setString(2, videoTitle == null ? youtubeId : videoTitle);
                    ps.setTimestamp(3, released);
                    ps.setInt(4, songId);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = c.prepareStatement(
                        "UPDATE songs SET spotify_id = COALESCE(?, spotify_id), apple_music_id = COALESCE(?, apple_music_id) WHERE id = ?")) {
                    ps.setString(1, spotifyId);
                    ps.setString(2, appleMusicId);
                    ps.setInt(3, songId);
                    ps.executeUpdate();
                }
                c.commit();
            } catch (SQLException e) {
                c.rollback();
                throw e;
            } finally {
                c.setAutoCommit(true);
            }
            if (lyricsCs != null && !lyricsCs.isBlank() && new LyricDao().getWords(songId, "cs") == null) {
                new LyricDao().saveWords(songId, "cs", lyricsCs);
            }
            try (PreparedStatement ps = c.prepareStatement("SELECT uuid FROM songs WHERE id = ?")) {
                ps.setInt(1, songId);
                try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getString(1) : null; }
            }
        }
    }
}
