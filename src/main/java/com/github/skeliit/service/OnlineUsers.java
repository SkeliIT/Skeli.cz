package com.github.skeliit.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Kdo z přihlášených je právě na webu a jestli se v poslední době pohnul. Jen v paměti, nikam se neukládá a po restartu
 * je to prázdné. Otevřená a viditelná stránka se hlásí každou minutu; po zavření nebo schování záložky člověk do 5 minut zmizí.
 * Ostatním se to ukáže, jen když si to člověk zapnul.
 */
public final class OnlineUsers {
    private static final long WINDOW_MS = 5 * 60_000L;
    private static final long IDLE_MS = 5 * 60_000L;
    private static final Map<Integer, Long> SEEN = new ConcurrentHashMap<>();
    private static final Map<Integer, Long> ACTIVE = new ConcurrentHashMap<>();

    private OnlineUsers() { }

    /** Stránka se ozvala; active = člověk od minula hýbal myší, psal nebo posouval. */
    public static void touch(int userId, boolean active) {
        touch(userId, active, System.currentTimeMillis());
    }

    /** Čas se předává kvůli testu. */
    static void touch(int userId, boolean active, long now) {
        SEEN.put(userId, now);
        if (active) ACTIVE.put(userId, now);
        SEEN.values().removeIf(t -> t < now - WINDOW_MS);
        ACTIVE.keySet().retainAll(SEEN.keySet());
    }

    public static boolean isOnline(int userId) {
        return isOnline(userId, System.currentTimeMillis());
    }

    static boolean isOnline(int userId, long now) {
        Long t = SEEN.get(userId);
        return t != null && t >= now - WINDOW_MS;
    }

    /** Je na webu, ale aspoň 5 minut se ničeho nedotkl. */
    public static boolean isIdle(int userId) {
        return isIdle(userId, System.currentTimeMillis());
    }

    static boolean isIdle(int userId, long now) {
        if (!isOnline(userId, now)) return false;
        Long t = ACTIVE.get(userId);
        return t == null || t < now - IDLE_MS;
    }
}
