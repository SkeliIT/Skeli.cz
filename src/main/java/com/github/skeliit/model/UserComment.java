package com.github.skeliit.model;

import java.sql.Timestamp;

/** One of a user's own comments (under lyrics or under a clip), listed on the "My account" page. */
public class UserComment {
    /** "lyric" or "video", as /api/comments calls them */
    public final String kind;
    public final int id;
    public final String content;
    public final Timestamp createdAt;
    public final boolean reply;
    /** the song's or clip's name */
    public final String placeName;
    /** where the comment is on the site */
    public final String link;
    public final int up;

    public UserComment(String kind, int id, String content, Timestamp createdAt, boolean reply, String placeName,
                       String link, int up) {
        this.kind = kind;
        this.id = id;
        this.content = content;
        this.createdAt = createdAt;
        this.reply = reply;
        this.placeName = placeName;
        this.link = link;
        this.up = up;
    }

    public boolean isLyric() { return "lyric".equals(kind); }
}
