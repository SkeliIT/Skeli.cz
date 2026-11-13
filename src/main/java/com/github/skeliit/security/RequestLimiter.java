package com.github.skeliit.security;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Omezovač „nejvýš N akcí za dobu“ v paměti (registrace z jedné adresy, komentáře, hlášení, chybná přihlášení…).
 * Po restartu se počty ztratí, to tady nevadí.
 * Staré záznamy se samy uklízejí (jednou za 10 minut), aby paměť s počtem adres a jmen nerostla donekonečna (audit D1).
 */
public final class RequestLimiter {
    private static final Map<String, Deque<Long>> HITS = new ConcurrentHashMap<>();
    /** Nejdelší okno, které se v projektu používá, je den (např. změna jména); starší záznam už nic neznamená. */
    static final long KEEP_MS = 25 * 60 * 60 * 1000L;
    private static final long SWEEP_EVERY_MS = 10 * 60 * 1000L;
    private static final AtomicLong lastSweep = new AtomicLong(System.currentTimeMillis());

    private RequestLimiter() {}

    /**
     * Records one action for {@code bucket}+{@code key} and returns true, or returns
     * false without recording when the limit for the window is already used up.
     */
    public static boolean tryAcquire(String bucket, Object key, int max, long windowMs) {
        sweepNow(System.currentTimeMillis(), false);
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

    /** Zapomene počty pro bucket+klíč (třeba po úspěšném přihlášení). */
    public static void reset(String bucket, Object key) {
        HITS.remove(bucket + ':' + key);
    }

    /** Uklidí záznamy bez akce za posledních KEEP_MS; jednou za 10 minut, nebo hned, když {@code force}. Vrací počet smazaných. */
    static int sweepNow(long now, boolean force) {
        long last = lastSweep.get();
        if (!force && (now - last < SWEEP_EVERY_MS || !lastSweep.compareAndSet(last, now))) return 0;
        int removed = 0;
        for (Map.Entry<String, Deque<Long>> e : HITS.entrySet()) {
            Deque<Long> d = e.getValue();
            boolean old;
            synchronized (d) {
                old = d.isEmpty() || d.peekLast() < now - KEEP_MS;
            }
            if (old && HITS.remove(e.getKey(), d)) removed++;
        }
        return removed;
    }

    /** Kolik klíčů je v paměti (testy). */
    static int size() {
        return HITS.size();
    }

    /** Forgets all recorded actions (tests). */
    static void clear() {
        HITS.clear();
    }

    public static final long MINUTE = 60_000L;
    public static final long HOUR = 60 * MINUTE;
}
