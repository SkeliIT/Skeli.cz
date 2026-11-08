package com.github.skeliit.model;

import java.util.List;

/** Nastavení chatu. Povolené hodnoty jsou tady, aby se do stránky ani databáze nedostalo nic jiného. Třída, ne record: překladač JSP record neumí. */
public class ChatPrefs {
    public static final List<String> STATUSES = List.of("online", "busy", "dnd", "invisible");
    public static final List<String> THEMES = List.of("gold", "blue", "purple", "green", "pink", "gray", "solid");
    public static final List<String> FONTS = List.of("text", "clean", "system");
    public static final List<String> SIZES = List.of("s", "m", "l");
    /** Vzhledy chatu (css/chat-looks.css, názvy chat.look.<id>). Prázdný řetězec = Základní, kde platí barva bublin (theme). */
    public static final List<String> LOOKS_DARK = List.of("d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "d11", "d16", "d18");
    public static final List<String> LOOKS_LIGHT = List.of("l1", "s2", "s4", "s11", "s13", "s15", "l8", "l10", "m4", "o1", "o2", "o3", "o4");

    public String status = "online";
    public String theme = "gold";
    public String font = "text";
    public String size = "m";
    public String lookDark = "";
    public String lookLight = "";
    public boolean receipts = true;   // „Viděno“: kdo si to vypne, nevidí to ani u ostatních

    /** Platná hodnota vzhledu: prázdná, nebo ze seznamu. */
    public static boolean validLook(String look, List<String> allowed) {
        return look != null && (look.isEmpty() || allowed.contains(look));
    }
}
