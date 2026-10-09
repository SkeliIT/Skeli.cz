package com.github.skeliit.model;

import java.sql.Timestamp;

/** One of a user's own comments on song lyrics, listed on their profile page. */
public class UserComment {
    public final int id;
    public final String content;
    public final Timestamp createdAt;
    public final int lyricId;
    public final String songName;

    public UserComment(int id, String content, Timestamp createdAt, int lyricId, String songName) {
        this.id = id;
        this.content = content;
        this.createdAt = createdAt;
        this.lyricId = lyricId;
        this.songName = songName;
    }
}
