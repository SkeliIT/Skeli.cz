package com.github.skeliit.security;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory limiter of failed logins per username. Keyed by username rather than IP
 * because the app runs behind a reverse proxy where all requests share one address.
 */
public final class LoginRateLimiter {
    private static final int MAX_FAILURES = 10;
    private static final long WINDOW_MS = 15 * 60 * 1000L;
    private static final Map<String, Deque<Long>> FAILURES = new ConcurrentHashMap<>();

    private LoginRateLimiter() {}

    public static boolean isBlocked(String username) {
        Deque<Long> d = FAILURES.get(key(username));
        if (d == null) return false;
        synchronized (d) {
            prune(d);
            return d.size() >= MAX_FAILURES;
        }
    }

    public static void recordFailure(String username) {
        Deque<Long> d = FAILURES.computeIfAbsent(key(username), k -> new ArrayDeque<>());
        synchronized (d) {
            prune(d);
            d.addLast(System.currentTimeMillis());
        }
    }

    public static void reset(String username) {
        FAILURES.remove(key(username));
    }

    private static void prune(Deque<Long> d) {
        long cutoff = System.currentTimeMillis() - WINDOW_MS;
        while (!d.isEmpty() && d.peekFirst() < cutoff) d.pollFirst();
    }

    private static String key(String username) {
        return username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    }
}
