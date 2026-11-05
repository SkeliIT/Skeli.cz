package com.github.skeliit.model;

import java.sql.Timestamp;

/** Nahlášení profilu v admin_users.jsp. Obyčejná třída, překladač JSP neumí record. */
public class UserReport {
    public final int id;
    public final int reportedId;
    public final String username;
    public final String reason;
    public final String note;
    public final Timestamp createdAt;
    public final String avatarUrl;
    public final String coverUrl;
    public final boolean blocked;

    public UserReport(int id, int reportedId, String username, String reason, String note, Timestamp createdAt, String avatarUrl, String coverUrl, boolean blocked) {
        this.id = id;
        this.reportedId = reportedId;
        this.username = username;
        this.reason = reason;
        this.note = note;
        this.createdAt = createdAt;
        this.avatarUrl = avatarUrl;
        this.coverUrl = coverUrl;
        this.blocked = blocked;
    }

    /** Důvod česky (admin je česky). */
    public String getReasonText() {
        return switch (reason) {
            case "spam" -> "Spam nebo reklama";
            case "abuse" -> "Urážky nebo obtěžování";
            case "image" -> "Nevhodná fotka nebo záhlaví";
            case "fake" -> "Vydává se za někoho jiného";
            default -> "Něco jiného";
        };
    }
}
