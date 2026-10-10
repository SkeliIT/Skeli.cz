package com.github.skeliit.model;

/** A clip of a song that has Czech lyrics, in the admin's karaoke list. */
public class KaraokeClip {
    public String youtubeId;
    public String title;
    public String songName;
    /** the non-empty lines of the Czech lyrics */
    public String[] lines;
    /** corrected by hand in the admin */
    public boolean manual;
    /** there is an automatic file karaoke/<id>.json */
    public boolean auto;

    public String getYoutubeId() { return youtubeId; }
    public String getTitle() { return title; }
    public String getSongName() { return songName; }
    public boolean isManual() { return manual; }
    public boolean isAuto() { return auto; }
    public int getLineCount() { return lines == null ? 0 : lines.length; }
}
