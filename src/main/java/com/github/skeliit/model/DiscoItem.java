package com.github.skeliit.model;

import com.github.skeliit.WebUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/** A card of the Diskografie (music.jsp): a song, or a clip that isn't linked to a song. */
public class DiscoItem {
    /** true = a song (id = songs.id), false = a clip on its own (id = videos.id) */
    public final boolean song;
    public final int id;
    /** the name as shown: a song without the leading "Skeli -", a clip's cleaned YouTube title */
    public final String name;
    public final Integer year;
    public final String uuid;
    /** the song's first lyric, or 0 when it has none */
    public final int lyricId;
    /** the newest clip, or null */
    public final String youtubeId;
    public final String previewImageUrl;
    public final String appleMusicId;
    public final String spotifyId;
    /** the title in the page's language, or null */
    public final String translatedTitle;

    public DiscoItem(boolean song, int id, String name, Integer year, String uuid, int lyricId, String youtubeId,
                     String previewImageUrl, String appleMusicId, String spotifyId, String translatedTitle) {
        this.song = song;
        this.id = id;
        this.name = name;
        this.year = year;
        this.uuid = uuid;
        this.lyricId = lyricId;
        this.youtubeId = youtubeId;
        this.previewImageUrl = previewImageUrl;
        this.appleMusicId = appleMusicId;
        this.spotifyId = spotifyId;
        this.translatedTitle = translatedTitle;
    }

    /** The song's lyrics in the given language, or null when it has none. */
    public String lyricsPath(String lang) {
        if (lyricId <= 0) return null;
        return uuid != null && !uuid.isBlank() ? "/" + lang + "/song/" + uuid : "/lyrics/" + lyricId;
    }

    public String youtubeUrl() {
        return youtubeId == null ? null : "https://www.youtube.com/watch?v=" + WebUtils.escapeHtml(youtubeId);
    }

    public String previewUrl() {
        return WebUtils.safeUrl(previewImageUrl, null);
    }

    public String appleMusicUrl() {
        return appleMusicId != null && appleMusicId.matches("[0-9]{1,20}") ? "https://music.apple.com/cz/song/" + appleMusicId : null;
    }

    /** The track itself when its Spotify ID is known (admin), else a search for it. */
    public String spotifyUrl() {
        if (spotifyId != null && spotifyId.matches("[A-Za-z0-9]{22}")) return "https://open.spotify.com/track/" + spotifyId;
        return "https://open.spotify.com/search/" + URLEncoder.encode("Skeli " + name, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
