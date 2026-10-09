package com.github.skeliit.model;

/**
 * What the admin's "add a track from YouTube" form is filled with after a link is pasted:
 * the clip as YouTube knows it, a suggested song, and whether the clip or the song is already here.
 */
public class TrackDraft {
    public String youtubeId;
    /** The clip's title on YouTube. */
    public String videoTitle;
    /** A song name suggested from the title ("Skeli - X [Official video]" → "X"). */
    public String songName;
    public Integer year;
    /** The song the clip already belongs to, if it is in the database. */
    public Integer linkedSongId;
    public String linkedSongName;
    public String linkedSongUuid;
    /** A song with the suggested name that is already here (the clip is probably its new version). */
    public Integer sameNameSongId;

    public String getYoutubeId() { return youtubeId; }
    public String getVideoTitle() { return videoTitle; }
    public String getSongName() { return songName; }
    public Integer getYear() { return year; }
    public Integer getLinkedSongId() { return linkedSongId; }
    public String getLinkedSongName() { return linkedSongName; }
    public String getLinkedSongUuid() { return linkedSongUuid; }
    public Integer getSameNameSongId() { return sameNameSongId; }
    public String getThumbUrl() { return "/yt-thumb/" + youtubeId + "/hqdefault.jpg"; }
}
