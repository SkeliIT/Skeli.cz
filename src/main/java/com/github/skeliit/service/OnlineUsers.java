package com.github.skeliit.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Kdo z přihlášených je právě na webu (poslední ozvání stránky do 5 minut). Jen v paměti, nikam se neukládá
 * a po restartu je to prázdné. Ostatním se to ukáže, jen když si to člověk zapnul (users.online_public).
 */
public final class OnlineUsers {
    private static final long WINDOW_MS = 5 * 60_000L;
    private static final Map<Integer, Long> SEEN = new ConcurrentHashMap<>();

    private OnlineUsers() { }

    public static void touch(int userId) {
        long now = System.currentTimeMillis();
        SEEN.put(userId, now);
        SEEN.values().removeIf(t -> t < now - WINDOW_MS);
    }

    public static boolean isOnline(int userId) {
        Long t = SEEN.get(userId);
        return t != null && t >= System.currentTimeMillis() - WINDOW_MS;
    }
}
