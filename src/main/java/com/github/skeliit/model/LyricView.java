package com.github.skeliit.model;

public class LyricView {
    public int id;
    public int songId;
    public String songName;
    public Integer year;
    public String words;
    public String youtubeId;
    public long views;
    public int votesUp;
    public int votesDown;
    public String appleMusicId;
    public String previewImageUrl;
    /** Stable public song id. */
    public String songUuid;
    /** Language of this lyric row (cs/en/de/uk). */
    public String lang;
    /** Optional SEO alias for this language. */
    public String songSeoSlug;
    /** Optional meta description for this language. */
    public String metaDescription;

    public int getId() { return id; }
    public int getSongId() { return songId; }
    public String getSongName() { return songName; }
    /** The song title in the page's language (lyrics.title), shown under the original; null for Czech. */
    public String translatedTitle;
    public String getTranslatedTitle() {
        return translatedTitle == null || translatedTitle.isBlank() || "cs".equals(lang) ? null : translatedTitle;
    }
    /** The title without the artist and features ("No ty vole"), and those as a smaller line. */
    public String getShortName() { return SongTitle.of(songName).title; }
    public String getCredits() { return SongTitle.of(songName).credits; }
    public Integer getYear() { return year; }
    public String getWords() { return words; }
    public String getYoutubeId() { return youtubeId; }
    public long getViews() { return views; }
    public int getVotesUp() { return votesUp; }
    public int getVotesDown() { return votesDown; }
    public String getAppleMusicId() { return appleMusicId; }
    public String getPreviewImageUrl() { return previewImageUrl; }
    public String getSongUuid() { return songUuid; }
    public String getLang() { return lang; }
    public String getSongSeoSlug() { return songSeoSlug; }
    public String getMetaDescription() { return metaDescription; }

    /** Public path: /{lang}/song/{seoSlug|uuid}. */
    public String getPublicPath() {
        String l = (lang == null || lang.isBlank()) ? "cs" : lang;
        String key = (songSeoSlug != null && !songSeoSlug.isBlank())
                ? songSeoSlug.trim()
                : (songUuid != null ? songUuid : String.valueOf(id));
        return "/" + l + "/song/" + key;
    }
}
