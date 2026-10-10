package com.github.skeliit.model;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

/**
 * A comment as the admin's comment list shows it: on a song's lyrics or on a clip. Top-level
 * comments carry their replies (oldest first), so the admin sees who answered whom.
 */
public class AdminComment {
    /** "lyric" (comments) or "video" (video_comments) */
    public final String kind;
    public final int id;
    /** null for a top-level comment */
    public final Integer parentId;
    /** null when the author's account was deleted */
    public final String author;
    public final String content;
    public final Timestamp createdAt;
    public final boolean edited;
    public final boolean pinned;
    public final boolean hearted;
    /** lyric comments: the lyric and its song */
    public final int lyricId;
    public final String songName;
    /** video comments: the clip */
    public final String youtubeId;
    public final String videoTitle;
    public final int reports;
    /** the answers under a top-level comment, oldest first */
    public final List<AdminComment> replies = new ArrayList<>();

    public AdminComment(String kind, int id, Integer parentId, String author, String content, Timestamp createdAt,
                        boolean edited, boolean pinned, boolean hearted, int lyricId, String songName,
                        String youtubeId, String videoTitle, int reports) {
        this.kind = kind;
        this.id = id;
        this.parentId = parentId;
        this.author = author;
        this.content = content;
        this.createdAt = createdAt;
        this.edited = edited;
        this.pinned = pinned;
        this.hearted = hearted;
        this.lyricId = lyricId;
        this.songName = songName;
        this.youtubeId = youtubeId;
        this.videoTitle = videoTitle;
        this.reports = reports;
    }

    public boolean isLyric() { return "lyric".equals(kind); }

    /** The newest moment in the thread: the comment or its last reply. Threads are sorted by it. */
    public Timestamp lastActivity() {
        Timestamp last = createdAt;
        for (AdminComment r : replies) if (r.createdAt != null && (last == null || r.createdAt.after(last))) last = r.createdAt;
        return last;
    }

    /** Where the comment can be seen on the site (the Music page opens the right clip). */
    public String link() {
        return (isLyric() ? "/lyrics/" + lyricId : "/music.jsp?clip=" + youtubeId) + "#comment-" + id;
    }

    /** The song or the clip the comment belongs to. */
    public String where() {
        String name = isLyric() ? songName : videoTitle;
        return name == null || name.isBlank() ? (isLyric() ? "text #" + lyricId : "klip " + youtubeId) : name;
    }
}
