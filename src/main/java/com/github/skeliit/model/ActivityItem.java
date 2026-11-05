package com.github.skeliit.model;

import java.sql.Timestamp;

/** Řádek v aktivitě na profilu. kind: badge (arg = klíč odznaku), win (arg = obtížnost), track (arg = název), comment (arg = úryvek), friend (arg = jméno). */
public class ActivityItem {
    public final String kind;
    public final String arg;
    public final Timestamp at;

    public ActivityItem(String kind, String arg, Timestamp at) {
        this.kind = kind;
        this.arg = arg;
        this.at = at;
    }
}
