package com.github.skeliit.model;

/** One line of the CatSmash leaderboard: a player's best (fastest) win on a difficulty. */
public class PongRank {
    public final int place;
    public final String username;
    public final String avatarUrl;
    public final int durationMs;
    public final int kevinGoals;
    public final boolean me;
    /** Titul u jména (klíč odznaku z PongBadges) nebo null. */
    public String title;

    public PongRank(int place, String username, String avatarUrl, int durationMs, int kevinGoals, boolean me) {
        this.place = place;
        this.username = username;
        this.avatarUrl = avatarUrl;
        this.durationMs = durationMs;
        this.kevinGoals = kevinGoals;
        this.me = me;
    }
}
