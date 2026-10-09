package com.github.skeliit.security;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory "at most N actions per time window" limiter for spam protection
 * (registrations per IP, comments and reports per user). Counts are lost on
 * restart, which is fine for this purpose.
 */
public final class RequestLimiter {
    private static final Map<String, Deque<Long>> HITS = new ConcurrentHashMap<>();

    private RequestLimiter() {}

    /**
     * Records one action for {@code bucket}+{@code key} and returns true, or returns
     * false without recording when the limit for the window is already used up.
     */
    public static boolean tryAcquire(String bucket, Object key, int max, long windowMs) {
        Deque<Long> d = HITS.computeIfAbsent(bucket + ':' + key, k -> new ArrayDeque<>());
        long now = System.currentTimeMillis();
        synchronized (d) {
            while (!d.isEmpty() && d.peekFirst() < now - windowMs) d.pollFirst();
            if (d.size() >= max) return false;
            d.addLast(now);
            return true;
        }
    }

    /** True when the limit for the window is used up, without recording anything. */
    public static boolean isFull(String bucket, Object key, int max, long windowMs) {
        Deque<Long> d = HITS.get(bucket + ':' + key);
        if (d == null) return false;
        long now = System.currentTimeMillis();
        synchronized (d) {
            while (!d.isEmpty() && d.peekFirst() < now - windowMs) d.pollFirst();
            return d.size() >= max;
        }
    }

    /** Forgets all recorded actions (tests). */
    static void clear() {
        HITS.clear();
    }

    public static final long MINUTE = 60_000L;
    public static final long HOUR = 60 * MINUTE;
}
