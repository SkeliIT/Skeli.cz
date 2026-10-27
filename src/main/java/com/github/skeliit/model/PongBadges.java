package com.github.skeliit.model;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Odznaky hry CatSmash: klíč (texty pong.badge.{klíč}) → ikona Font Awesome, v pořadí, jak se ukazují na profilu.
 * Část odznaků počítá server z uložených výher (pong_results), zbytek se děje uvnitř zápasu (odstřely, šroubky…)
 * a hlásí ho prohlížeč – ty jsou v CLAIMABLE a ukládají se do pong_badges.
 * Každý získaný odznak jde nosit jako titul u jména (users.pong_title), většina navíc odemkne věc ve hře
 * (pálku, míček nebo pozadí – mapa je v js/kevin-pong.js).
 */
public final class PongBadges {
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
        ICONS.put("wardrobe", "fa-shirt");
    }

    /** Odznaky, které hlásí prohlížeč (stalo se to uvnitř zápasu, server to nevidí). */
    public static final Set<String> CLAIMABLE = Set.of(
            "sniper", "super", "tinker", "yarn", "overheat", "comeback", "marathon", "night", "loyal");

    /** Odznaky, které odemykají vzhled pálky nebo míček; má-li hráč všechny, dostane Šatník. */
    public static final Set<String> LOOKS = Set.of(
            "easy", "clean", "overheat", "angry", "comeback", "yarn", "night", "super", "loyal", "wins50", "sniper", "tinker", "close");

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
