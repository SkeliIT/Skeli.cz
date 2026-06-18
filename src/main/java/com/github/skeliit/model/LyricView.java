package com.github.skeliit.model;

public class LyricView {
    public int id;
    public int songId;
    public String songName;
    public Integer year;
    public String words;
    public String youtubeId;
    public long views;
    public int votesUp;
    public int votesDown;
    public String appleMusicId;

    // Getters for EL expressions
    public int getId() { return id; }
    public int getSongId() { return songId; }
    public String getSongName() { return songName; }
    public Integer getYear() { return year; }
    public String getWords() { return words; }
    public String getYoutubeId() { return youtubeId; }
    public long getViews() { return views; }
    public int getVotesUp() { return votesUp; }
    public int getVotesDown() { return votesDown; }
    public String getAppleMusicId() { return appleMusicId; }
}
