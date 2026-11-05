package com.github.skeliit.model;

/** Skladba uživatele na profilu („Moje tvorba“). Adresy se skládají jen z částí ověřených v service/MusicLinks. Třída, ne record: překladač JSP record neumí. */
public class UserTrack {
    public int id;
    public String title;
    public Integer year;
    public String youtubeId;
    public String spotify;      // track/ID nebo album/ID
    public String apple;        // cz/song/ID
    public String soundcloud;   // interpret/skladba
    public String hiddenReason;
    public boolean hidden;

    public String youtubeUrl() { return youtubeId == null ? null : "https://www.youtube.com/watch?v=" + youtubeId; }
    public String spotifyUrl() { return spotify == null ? null : "https://open.spotify.com/" + spotify; }
    public String appleUrl() { return apple == null ? null : "https://music.apple.com/" + apple; }
    public String soundcloudUrl() { return soundcloud == null ? null : "https://soundcloud.com/" + soundcloud; }

    /** Kam vede klik na obrázek: první služba, která je vyplněná. */
    public String firstUrl() {
        if (youtubeId != null) return youtubeUrl();
        if (spotify != null) return spotifyUrl();
        if (apple != null) return appleUrl();
        return soundcloudUrl();
    }
}
