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
    /** The picture's place in the Texty row, set in admin (null = automatic): x = shift in % of the
     *  row's picture area (−400…400), y = the point of the picture (% of its height, −200…300) that sits
     *  on the row's 45 % line, the same on a computer and a phone; zoom 0.25–3 compared with "as wide
     *  as the area". */
    public Double artX, artY, artZoom;
    public Double getArtX() { return artX; }
    public Double getArtY() { return artY; }
    public Double getArtZoom() { return artZoom; }
    public String getArtStyle() { return artStyle(artX, artY, artZoom); }

    /** CSS variables for .song-row-art img, or "" when the picture is placed automatically. */
    public static String artStyle(Double x, Double y, Double zoom) {
        if (x == null || y == null || zoom == null) return "";
        return String.format(java.util.Locale.ROOT, "--tx:%.2f;--py:%.2f;--az:%.3f",
                clamp(x, -400, 400), clamp(y, -200, 300), clamp(zoom, 0.25, 3));
    }

    public static double clamp(double v, double min, double max) {
        return Double.isNaN(v) ? min : Math.max(min, Math.min(max, v));
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
