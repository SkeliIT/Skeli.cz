package com.github.skeliit.model;

/** One language variant of a song's lyric + SEO fields (admin / public routing). */
public class SongLocale {
    public int id;          // lyrics.id (0 if not yet persisted)
    public int songId;
    public String lang;
    public String words;
    public String seoSlug;
    public String metaDescription;

    public int getId() { return id; }
    public int getSongId() { return songId; }
    public String getLang() { return lang; }
    public String getWords() { return words; }
    public String getSeoSlug() { return seoSlug; }
    public String getMetaDescription() { return metaDescription; }


    public String publicPath(String songUuid) {
        String slug = seoSlug != null && !seoSlug.isBlank() ? seoSlug.trim() : songUuid;
        return "/" + lang + "/song/" + slug;
    }
}
