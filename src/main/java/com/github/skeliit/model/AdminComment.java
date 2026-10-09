package com.github.skeliit.model;

import java.sql.Timestamp;

/** A comment as the admin's comment list shows it: on a song's lyrics or on a clip. */
public class AdminComment {
    /** "lyric" (comments) or "video" (video_comments) */
    public final String kind;
    public final int id;
    /** null when the author's account was deleted */
    public final String author;
    public final String content;
    public final Timestamp createdAt;
    public final boolean edited;
    /** a reply to another comment */
    public final boolean reply;
    /** lyric comments: the lyric and its song */
    public final int lyricId;
    public final String songName;
    /** video comments: the clip */
    public final String youtubeId;
    public final String videoTitle;
    public final int reports;

    public AdminComment(String kind, int id, String author, String content, Timestamp createdAt, boolean edited,
                        boolean reply, int lyricId, String songName, String youtubeId, String videoTitle, int reports) {
        this.kind = kind;
        this.id = id;
        this.author = author;
        this.content = content;
        this.createdAt = createdAt;
        this.edited = edited;
        this.reply = reply;
        this.lyricId = lyricId;
        this.songName = songName;
        this.youtubeId = youtubeId;
        this.videoTitle = videoTitle;
        this.reports = reports;
    }

    public boolean isLyric() { return "lyric".equals(kind); }

    /** Where the comment can be seen on the site. */
    public String link() {
        return isLyric() ? "/lyrics/" + lyricId + "#comment-" + id : "/music.jsp";
    }

    /** The song or the clip the comment belongs to. */
    public String where() {
        String name = isLyric() ? songName : videoTitle;
        return name == null || name.isBlank() ? (isLyric() ? "text #" + lyricId : "klip " + youtubeId) : name;
    }
}
