package com.github.skeliit.model;

import java.sql.Timestamp;

/** Nahlášená zpráva, jak ji vidí admin: jediná zpráva z chatu, kterou admin vidí. */
public class ChatReport {
    public int id;
    public String sender;
    public String reporter;
    public String reason;
    public String note;
    public String body;
    public Timestamp createdAt;
}
