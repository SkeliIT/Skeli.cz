package com.github.skeliit.model;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Odznaky za život na webu, ne za hru (ty jsou v PongBadges a na profilu v bloku své hry). Klíče začínají „s_“, aby se nikdy
 * nepotkaly s herními. Vitrína bere oboje, proto tady je i společné icon/rarity/nameKey.
 */
public final class SiteBadges {
    /** Klíč → {ikona, vzácnost}. Pořadí = pořadí na profilu. */
    public static final Map<String, String[]> ALL = new LinkedHashMap<>();
    static {
        ALL.put("s_voice", new String[] { "fa-comments", "c" });      // první komentář
        ALL.put("s_friend", new String[] { "fa-user-group", "c" });   // první přítel
        ALL.put("s_fan", new String[] { "fa-heart", "c" });           // srdce u 5 písní
        ALL.put("s_karaoke", new String[] { "fa-microphone", "c" });  // otevřel karaoke kino
        ALL.put("s_artist", new String[] { "fa-music", "u" });        // přidal svoji tvorbu
        ALL.put("s_talk", new String[] { "fa-comments", "u" });       // 25 komentářů
        ALL.put("s_helper", new String[] { "fa-flag", "u" });         // nahlásil chybu nebo pomohl s textem
        ALL.put("s_early", new String[] { "fa-seedling", "r" });      // účet z prvních měsíců webu
        ALL.put("s_year", new String[] { "fa-cake-candles", "r" });   // rok na webu
        ALL.put("s_heart", new String[] { "fa-heart-circle-check", "e" });   // srdce od Skeliho
    }

    private SiteBadges() { }

    public static boolean isSite(String key) {
        return key != null && key.startsWith("s_");
    }

    public static String icon(String key) {
        return isSite(key) && ALL.containsKey(key) ? ALL.get(key)[0] : PongBadges.icon(key);
    }

    public static String rarity(String key) {
        return isSite(key) && ALL.containsKey(key) ? ALL.get(key)[1] : PongBadges.rarity(key);
    }

    /** Klíč překladu názvu. */
    public static String nameKey(String key) {
        return (isSite(key) ? "site.badge." : "pong.badge.") + key;
    }
}
