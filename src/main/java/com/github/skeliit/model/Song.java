package com.github.skeliit.model;

public class Song {
    public int id;
    public String uuid;
    /** Optional SEO-friendly path segment for /song/{seoSlug}. */
    public String seoSlug;
    public String name;
    public Integer year;
    public Integer firstLyricId;
    public String appleMusicId;
    public String spotifyId;
    public String previewImageUrl;

    // Getters for EL expressions
    public int getId() { return id; }
    public String getUuid() { return uuid; }
    public String getSeoSlug() { return seoSlug; }
    public String getName() { return name; }
    public Integer getYear() { return year; }
    public Integer getFirstLyricId() { return firstLyricId; }
    public String getAppleMusicId() { return appleMusicId; }
    public String getSpotifyId() { return spotifyId; }
    public String getPreviewImageUrl() { return previewImageUrl; }
    /** The newest clip of the song (only filled by SongDao.listWithFirstLyric). */
    public String youtubeId;
    /** A small picture of the song: its newest clip's thumbnail, else its preview photo, else null. */
    public String getThumbUrl() {
        if (youtubeId != null && youtubeId.matches("[A-Za-z0-9_-]{6,20}")) return "/yt-thumb/" + youtubeId + "/mqdefault.jpg";
        return com.github.skeliit.WebUtils.safeUrl(previewImageUrl, null);
    }
    /** The name without the artist and features, for the song bar and the previous / next links. */
    public String getShortName() { return SongTitle.of(name).title; }

    /** Public path for Czech (default): /cs/song/{seoSlug|uuid}. */
    public String getPublicPath() {
        return getPublicPath("cs");
    }

    public String getPublicPath(String lang) {
        String l = (lang == null || lang.isBlank()) ? "cs" : lang;
        if (seoSlug != null && !seoSlug.isBlank() && "cs".equals(l)) {
            return "/" + l + "/song/" + seoSlug.trim();
        }
        if (uuid != null && !uuid.isBlank()) return "/" + l + "/song/" + uuid;
        return null;
    }
}
