package com.github.skeliit.model;

import com.github.skeliit.WebUtils;

/** A song with lyrics as the Texty list shows it (dao/SongDao.withLyrics). */
public class LyricListItem {
    public final int songId;
    public final String uuid;
    public final String name;
    public final Integer year;
    /** the song's first lyric (any language), for the old /lyrics/{id} address */
    public final int lyricId;
    /** the newest clip, or null */
    public final String youtubeId;
    public final String previewImageUrl;
    /** the title in the page's language, or null */
    public final String translatedTitle;
    /** CSS variables of a picture placed by hand in admin, or "" (Song.artStyle) */
    public final String artStyle;

    public LyricListItem(int songId, String uuid, String name, Integer year, int lyricId, String youtubeId,
                         String previewImageUrl, String translatedTitle, String artStyle) {
        this.songId = songId;
        this.uuid = uuid;
        this.name = name;
        this.year = year;
        this.lyricId = lyricId;
        this.youtubeId = youtubeId;
        this.previewImageUrl = previewImageUrl;
        this.translatedTitle = translatedTitle;
        this.artStyle = artStyle;
    }

    /** The song's page in the given language (the old /lyrics/{id} when the song has no uuid). */
    public String path(String lang) {
        return uuid != null && !uuid.isBlank() ? "/" + lang + "/song/" + uuid : "/lyrics/" + lyricId;
    }

    /** The picture of the row: the newest clip's thumbnail, else the preview photo, else null. */
    public String artUrl() {
        if (youtubeId != null && !youtubeId.isEmpty()) return "/yt-thumb/" + youtubeId + "/hqdefault.jpg";
        return WebUtils.safeUrl(previewImageUrl, null);
    }
}
