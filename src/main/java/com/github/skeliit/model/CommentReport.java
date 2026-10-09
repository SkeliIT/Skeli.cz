package com.github.skeliit.model;

/** A reported comment on the admin dashboard: which one, how often, and what it says. */
public class CommentReport {
    /** "lyric" (a comment on a song's lyrics) or "video" */
    public final String kind;
    public final int commentId;
    public final int reports;
    public final String author;
    public final String content;
    /** the lyric the comment belongs to (0 for a video comment) */
    public final int lyricId;

    public CommentReport(String kind, int commentId, int reports, String author, String content, int lyricId) {
        this.kind = kind;
        this.commentId = commentId;
        this.reports = reports;
        this.author = author;
        this.content = content;
        this.lyricId = lyricId;
    }

    public boolean isLyric() { return "lyric".equals(kind); }
}
