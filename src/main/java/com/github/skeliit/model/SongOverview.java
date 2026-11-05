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
    /** Má píseň text v daném jazyce? (seznam Písní v adminu přeškrtne chybějící) */
    public boolean hasLang(String lang) { if (languages == null) return false; for (String l : languages) if (l != null && l.equalsIgnoreCase(lang)) return true; return false; }
    private static final String[] SITE_LANGS = { "cs", "en", "de", "uk", "vi" };
    /** V kolika jazycích webu má píseň text (0–5). */
    public int getLangCount() { int n = 0; for (String l : SITE_LANGS) if (hasLang(l)) n++; return n; }
    /** Popisek do seznamu Písní: „text 3/5“, nebo „bez textu“. */
    public String getLangLabel() { int n = getLangCount(); return n == 0 ? "bez textu" : "text " + n + "/" + SITE_LANGS.length; }
    /** Jazyky, ve kterých text je, pro bublinu v seznamu Písní. */
    public String getLangNames() { StringBuilder b = new StringBuilder(); for (String l : SITE_LANGS) if (hasLang(l)) b.append(b.length() > 0 ? ", " : "").append(l.toUpperCase()); return b.length() == 0 ? "žádné" : b.toString(); }
    /** Má všechno: video, Spotify, Apple Music a text ve všech jazycích (filtr v seznamu Písní). */
    public boolean isComplete() { return hasVideo && isHasSpotify() && isHasApple() && getLangCount() == SITE_LANGS.length; }
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
