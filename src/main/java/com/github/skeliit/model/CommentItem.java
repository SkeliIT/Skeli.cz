package com.github.skeliit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.List;

/**
 * One comment under a song or a clip, as the comments script (js/comments.js) gets it from
 * /api/comments. Top-level comments carry their replies (oldest first); replies have none.
 */
public class CommentItem {
    public int id;
    public Integer parentId;          // null = top-level comment
    @JsonIgnore                       // only for the permissions here, not sent to the browser
    public int userId;
    public String user;               // null when the account was deleted
    public String avatar;             // "" = no photo
    public boolean artist;            // Skeli himself: a badge next to the name
    public String content;
    public long created;              // epoch ms; the browser writes "2 days ago" in its language
    public Long edited;               // epoch ms of the last edit, null = never edited
    public boolean pinned;
    public boolean hearted;           // a heart from the artist
    public int up;
    public int down;
    public int my;                    // the viewer's own vote: 1, -1 or 0
    public boolean canEdit;           // the author or an admin
    public boolean canPin;            // the artist or an admin, top-level comments only
    public boolean canHeart;          // only the artist
    public boolean canReport;         // logged in and not your own
    public List<CommentItem> replies = new ArrayList<>();

    /** How high the comment goes under "Top": likes count, so do replies and a heart from the artist. */
    public double score() {
        return (up - down) + 0.5 * replies.size() + (hearted ? 1 : 0);
    }
}
