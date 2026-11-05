package com.github.skeliit.model;

/** Píseň se srdcem na profilu. Třída, ne record: překladač JSP record neumí. */
public class LikedSong {
    public final String uuid;
    public final String title;
    public final String thumb;   // null = píseň nemá obrázek

    public LikedSong(String uuid, String name, String thumb) {
        this.uuid = uuid;
        this.title = SongTitle.of(name).title;
        this.thumb = thumb;
    }
}
