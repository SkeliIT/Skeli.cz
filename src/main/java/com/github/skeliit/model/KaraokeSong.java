package com.github.skeliit.model;

/** Píseň v seznamu Karaoke: název rozdělený pro řádek, rok, nejnovější klip a obrázek do ikonky. */
public class KaraokeSong {
    public String uuid;
    public String title;
    public String credits;
    public Integer year;
    public String youtubeId;
    /** neprázdné řádky českého textu */
    public String[] lines;
    /** CSS proměnné posunu obrázku z adminu (stejný jako na kartě na Hudbě), nebo "" (Song.posterStyle) */
    public String posterStyle = "";
    /** délka klipu v sekundách (0 = neznámá) */
    public int duration;
    /** true = spolupráce (cizí track, kde Skeli hostuje) */
    public boolean collab;

    public String getUuid() { return uuid; }
    public String getTitle() { return title; }
    public String getCredits() { return credits; }
    public Integer getYear() { return year; }
    public String getYoutubeId() { return youtubeId; }
    public int getDuration() { return duration; }
    /** hlavní obrázek písně vybraný v adminu (null = náhled klipu) */
    public String mainImage;
    public boolean isPlaced() { return mainImage != null; }
    /** obrázek do kulaté ikonky: hlavní obrázek z adminu, jinak náhled klipu */
    public String getThumb() { return mainImage != null ? mainImage : "/yt-thumb/" + youtubeId + "/hqdefault.jpg"; }
}
