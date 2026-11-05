package com.github.skeliit.model;

/** Řádek v seznamu konverzací. Třída, ne record: překladač JSP record neumí. */
public class ChatConversation {
    public String username;
    public String avatarUrl;
    public String lastBody;     // null = zatím si nepsali (přítel bez konverzace)
    public boolean lastMine;
    public boolean lastDeleted;
    public long lastAt;
    public int unread;
}
