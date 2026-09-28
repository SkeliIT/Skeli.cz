package com.github.skeliit.model;

/** One YouTube clip linked (or to-be-linked) to a song, for admin UI. */
public class SongVideo {
    public int id;
    public String youtubeId;
    public String title;
    public Integer songId;

    public int getId() { return id; }
    public String getYoutubeId() { return youtubeId; }
    public String getTitle() { return title; }
    public Integer getSongId() { return songId; }
}
