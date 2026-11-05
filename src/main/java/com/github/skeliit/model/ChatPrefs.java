package com.github.skeliit.model;

import java.util.List;

/** Nastavení chatu. Povolené hodnoty jsou tady, aby se do stránky ani databáze nedostalo nic jiného. Třída, ne record: překladač JSP record neumí. */
public class ChatPrefs {
    public static final List<String> STATUSES = List.of("online", "busy", "dnd", "invisible");
    public static final List<String> THEMES = List.of("gold", "blue", "purple", "green", "pink", "gray", "solid");
    public static final List<String> FONTS = List.of("text", "clean", "system");
    public static final List<String> SIZES = List.of("s", "m", "l");

    public String status = "online";
    public String theme = "gold";
    public String font = "text";
    public String size = "m";
    public boolean receipts = true;   // „Viděno“: kdo si to vypne, nevidí to ani u ostatních
}
