package com.github.skeliit.model;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Odznaky hry CatSmash: klíč (texty pong.badge.{klíč}) → ikona Font Awesome, v pořadí, jak se ukazují na profilu.
 * Část odznaků počítá server z uložených výher (pong_results), zbytek se děje uvnitř zápasu (odstřely, šroubky…)
 * a hlásí ho prohlížeč – ty jsou v CLAIMABLE a ukládají se do pong_badges.
 * Každý získaný odznak jde nosit jako titul u jména (users.pong_title), většina navíc odemkne věc ve hře
 * (pálku, míček nebo pozadí – mapa je v js/catsmash/hra.js).
 */
public final class PongBadges {
    /** Titul u jména (komentáře, tabulka, Můj účet) – zatím vypnutý, majitel vymýšlí lepší názvy. Data zůstávají. */
    public static final boolean TITLES_ON = false;

    private PongBadges() {}

    public static final Map<String, String> ICONS = new LinkedHashMap<>();
    static {
        ICONS.put("first", "fa-trophy");
        ICONS.put("easy", "fa-mug-hot");
        ICONS.put("normal", "fa-scale-balanced");
        ICONS.put("angry", "fa-cat");
        ICONS.put("clean", "fa-shield-halved");
        ICONS.put("close", "fa-heart-pulse");
        ICONS.put("fast", "fa-bolt");
        ICONS.put("streak", "fa-medal");          // stupně: bronz 10, stříbro 50, zlato 100 výher
        ICONS.put("wins50", "fa-medal");
        ICONS.put("wins100", "fa-medal");
        ICONS.put("sniper", "fa-crosshairs");
        ICONS.put("super", "fa-explosion");
        ICONS.put("tinker", "fa-screwdriver-wrench");
        ICONS.put("yarn", "fa-mitten");
        ICONS.put("overheat", "fa-fire");
        ICONS.put("comeback", "fa-arrow-trend-up");
        ICONS.put("marathon", "fa-person-running");
        ICONS.put("night", "fa-moon");
        ICONS.put("loyal", "fa-calendar-check");
        // jen za nejtěžší obtížnost (Kevin naštvaný)
        ICONS.put("hwins5", "fa-crown");
        ICONS.put("hfast", "fa-meteor");
        ICONS.put("hclean", "fa-skull");
        ICONS.put("hsniper", "fa-bullseye");
        ICONS.put("hcomeback", "fa-fire-flame-curved");
        ICONS.put("wardrobe", "fa-shirt");
        ICONS.put("skelosquad", "fa-gem");      // nejvzácnější: všech 5 odznaků za nejtěžší obtížnost
    }

    /** Odznaky, které hlásí prohlížeč (stalo se to uvnitř zápasu, server to nevidí). */
    public static final Set<String> CLAIMABLE = Set.of(
            "sniper", "super", "tinker", "yarn", "overheat", "comeback", "marathon", "night", "loyal", "hsniper", "hcomeback");

    /** Odznaky, které odemykají vzhled pálky nebo míček; má-li hráč všechny, dostane Šatník. */
    public static final Set<String> LOOKS = Set.of(
            "first", "easy", "tinker", "normal", "loyal", "streak", "night", "sniper", "overheat", "close", "marathon", "comeback",
            "clean", "super", "angry", "wins100", "wins50");

    /** Odznaky za nejtěžší obtížnost; kdo má všech 5, dostane SkeloSquad. */
    public static final java.util.List<String> HARD = java.util.List.of("hwins5", "hfast", "hclean", "hsniper", "hcomeback");

    /** Odznaky, které navíc odemknou rámeček kolem fotky (users.pong_frame): 3 nejtěžší běžné + 5 za nejtěžší obtížnost. */
    public static final java.util.List<String> FRAMES = java.util.List.of(
            "angry", "wins100", "wardrobe", "hwins5", "hfast", "hclean", "hsniper", "hcomeback");

    public static boolean isFrame(String key) { return key != null && FRAMES.contains(key); }

    /** Stupeň odznaku (barva medaile) nebo null. */
    public static String tier(String key) {
        return switch (key) {
            case "streak" -> "bronze";
            case "wins50" -> "silver";
            case "wins100" -> "gold";
            default -> null;
        };
    }

    public static boolean exists(String key) {
        return key != null && ICONS.containsKey(key);
    }

    public static String icon(String key) {
        return ICONS.getOrDefault(key, "fa-trophy");
    }
}
