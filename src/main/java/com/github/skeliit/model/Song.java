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
