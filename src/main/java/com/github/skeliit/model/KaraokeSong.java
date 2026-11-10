package com.github.skeliit.model;

/** A song in the karaoke list (/karaoke-kino): its name split for the row, year and newest clip. */
public class KaraokeSong {
    public String uuid;
    public String title;
    public String credits;
    public Integer year;
    public String youtubeId;
    /** the non-empty lines of the Czech lyrics */
    public String[] lines;
    /** CSS variables of a poster picture placed by hand in admin, or "" (Song.posterStyle) */
    public String posterStyle = "";
    /** délka klipu v sekundách (0 = neznámá) */
    public int duration;

    public String getUuid() { return uuid; }
    public String getTitle() { return title; }
    public String getCredits() { return credits; }
    public Integer getYear() { return year; }
    public String getYoutubeId() { return youtubeId; }
    public int getDuration() { return duration; }
    public String getThumb() { return "/yt-thumb/" + youtubeId + "/hqdefault.jpg"; }
}
