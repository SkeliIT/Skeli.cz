package com.github.skeliit.model;

/** Člověk v seznamu přátel, žádostí nebo výsledků hledání. Obyčejná třída, překladač JSP neumí record. */
public class Friend {
    public final int id;
    public final String username;
    public final String avatarUrl;
    /** Má veřejný profil? Jen pak na něj vede odkaz. */
    public final boolean pub;
    /** Stav jako v chatu (online, idle, busy, dnd, offline); vyplní jen FriendDao.friendsWithState pro můj seznam přátel. */
    public String state = "offline";

    public Friend(int id, String username, String avatarUrl, boolean pub) {
        this.id = id;
        this.username = username;
        this.avatarUrl = avatarUrl;
        this.pub = pub;
    }
}
