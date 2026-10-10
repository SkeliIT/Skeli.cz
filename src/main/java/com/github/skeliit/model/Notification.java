package com.github.skeliit.model;

/** One line under the bell in the header, as js/notifications.js gets it from /api/notifications. */
public class Notification {
    public int id;
    /** "reply" or "heart" */
    public String type;
    /** who answered (null when the account was deleted) */
    public String actor;
    public String actorAvatar;
    /** the start of the reply, or of the comment that got the heart */
    public String snippet;
    /** "song" or "clip", and its name */
    public String place;
    public String placeName;
    /** where the comment is: /lyrics/{id}#comment-{n} or /music.jsp?clip={id}#comment-{n} */
    public String link;
    public long created;
    public boolean read;
}
