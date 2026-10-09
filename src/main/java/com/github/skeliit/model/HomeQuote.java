package com.github.skeliit.model;

/** Two lines from a song shown on the home page (table home_quotes), as the admin lists them. */
public class HomeQuote {
    public int id;
    public int songId;
    public String songName;
    public String line1;
    public String line2;

    public int getId() { return id; }
    public int getSongId() { return songId; }
    public String getSongName() { return songName; }
    public String getLine1() { return line1; }
    public String getLine2() { return line2; }
}
