package com.github.skeliit.model;

import java.sql.Timestamp;

/** A problem a visitor reported to MC Kevin: the message, the page it came from and, if signed in, who sent it. */
public class SiteReport {
    public final int id;
    public final String page;
    public final String message;
    /** null for a visitor who wasn't signed in */
    public final String username;
    public final Timestamp at;

    public SiteReport(int id, String page, String message, String username, Timestamp at) {
        this.id = id; this.page = page; this.message = message; this.username = username; this.at = at;
    }

    public int getId() { return id; }
    public String getPage() { return page; }
    public String getMessage() { return message; }
    public String getUsername() { return username; }
    public Timestamp getAt() { return at; }
}
