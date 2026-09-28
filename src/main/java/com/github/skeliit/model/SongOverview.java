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
    public boolean isHasPreview() { return previewImageUrl != null && !previewImageUrl.isBlank(); }
}
