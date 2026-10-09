package com.github.skeliit.model;

public class SongOverview {
    public int id;
    public String uuid;
    public String name;
    public Integer year;
    public boolean hasVideo;
    public boolean hasLyrics;
    public String[] languages;
    public String previewImageUrl;
    public Integer firstLyricId;
    public String appleMusicId;
    public String spotifyId;

    // Getters for EL expressions
    public int getId() { return id; }
    public String getUuid() { return uuid; }
    public String getName() { return name; }
    public Integer getYear() { return year; }
    public boolean isHasVideo() { return hasVideo; }
    public boolean isHasLyrics() { return hasLyrics; }
    public String[] getLanguages() { return languages; }
    public String getPreviewImageUrl() { return previewImageUrl; }
    public Integer getFirstLyricId() { return firstLyricId; }
    public String getAppleMusicId() { return appleMusicId; }
    public String getSpotifyId() { return spotifyId; }
    public boolean isHasApple() { return appleMusicId != null && !appleMusicId.isBlank(); }
    public boolean isHasSpotify() { return spotifyId != null && !spotifyId.isBlank(); }
    /** The newest clip, for the thumbnail when the song has no preview photo. */
    public String youtubeId;
    /** The uploaded preview photo, else the newest clip's thumbnail, else null. */
    public String getThumbUrl() {
        if (isHasPreview()) return com.github.skeliit.WebUtils.safeUrl(previewImageUrl, null);
        if (youtubeId != null && youtubeId.matches("[A-Za-z0-9_-]{6,20}")) return "/yt-thumb/" + youtubeId + "/mqdefault.jpg";
        return null;
    }
    public boolean isHasPreview() { return previewImageUrl != null && !previewImageUrl.isBlank(); }
}
