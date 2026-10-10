package com.github.skeliit.model;

import java.sql.Timestamp;

/** The card at the top of "My account": who you are and a few numbers about your comments. */
public class AccountSummary {
    public String username;
    public String email;
    public Timestamp memberSince;
    public boolean artist;
    public boolean admin;
    public int comments;
    /** thumbs up your comments got */
    public int likes;
    /** hearts from Skeli on your comments */
    public int hearts;
}
