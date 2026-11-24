package com.github.skeliit.service;

import com.github.skeliit.dao.AppSettingsDao;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Živá místnost premiéry (/premiera, web/api/PremiereLiveServlet) – jen v paměti serveru, nic osobního se neukládá:
 * <ul>
 *   <li><b>kdo je v sále</b>: náhodný klíč z prohlížeče (ne účet, ne IP) → kdy se naposledy ozval; v sále = ozval se
 *       za posledních 20 s. Sedadla v kinosále se plní podle tohohle počtu.</li>
 *   <li><b>smajlíci</b>: jen součty za celou premiéru (kdo klikl, se nepamatuje). Prohlížeč si z rozdílu mezi dvěma
 *       dotazy spočítá, kolik smajlíků od ostatních má vypustit.</li>
 *   <li><b>nouzové vypínače</b> (admin → Premiéra): chat / smajlíci / efekty. Ty jsou v databázi (app_settings),
 *       aby přežily restart; v paměti se drží 10 s.</li>
 * </ul>
 * Po restartu serveru se počty smajlíků vynulují (přítomnost se obnoví sama do 20 s) – přijatelné.
 */
public final class PremiereLive {
    private PremiereLive() {}

    /** Smajlíci: 7 obličejů SKELO SQUAD (f1–f7) + srdce, oheň a joint. Jiné klíče server nepřijme. */
    public static final String[] REACTIONS = {"f1", "f2", "f3", "f4", "f5", "f6", "f7", "srdce", "ohen", "joint"};
    static final long PRESENT_MS = 20_000;
    private static final int MAX_PEOPLE = 20_000;   // pojistka paměti: víc klíčů se nepamatuje (počítá se dál jen do tohohle)

    private static final Map<String, Long> SEEN = new ConcurrentHashMap<>();
    private static final Map<String, AtomicLong> COUNTS = new ConcurrentHashMap<>();
    private static volatile long lastSweep = 0;

    /** Prohlížeč se ozval (každý dotaz místnosti). Klíč už je ověřený (jen písmena a číslice). */
    public static void seen(String key) {
        long now = System.currentTimeMillis();
        if (SEEN.size() < MAX_PEOPLE || SEEN.containsKey(key)) SEEN.put(key, now);
        if (now - lastSweep > 10_000) {                      // staré klíče pryč (nejvýš jednou za 10 s)
            lastSweep = now;
            SEEN.values().removeIf(t -> now - t > PRESENT_MS * 3);
        }
    }

    /** Kolik lidí je teď v sále (ozvali se za posledních 20 s). */
    public static int people() {
        long now = System.currentTimeMillis();
        int n = 0;
        for (long t : SEEN.values()) if (now - t <= PRESENT_MS) n++;
        return n;
    }

    /** Přičte smajlíka; false = neznámý klíč. */
    public static boolean react(String reaction) {
        for (String r : REACTIONS) {
            if (r.equals(reaction)) { COUNTS.computeIfAbsent(r, k -> new AtomicLong()).incrementAndGet(); return true; }
        }
        return false;
    }

    /** Součty smajlíků v pevném pořadí (i nuly). */
    public static Map<String, Long> counts() {
        Map<String, Long> out = new LinkedHashMap<>();
        for (String r : REACTIONS) { AtomicLong a = COUNTS.get(r); out.put(r, a == null ? 0 : a.get()); }
        return out;
    }

    // ---------- nouzové vypínače ----------
    public static final String[] SWITCHES = {"chat", "reakce", "efekty", "kviz"};
    private static volatile Map<String, Boolean> offCache = Map.of();
    private static volatile long offRead = 0;

    /** Je část místnosti vypnutá adminem? (chat, reakce, efekty) */
    public static boolean off(String what) {
        long now = System.currentTimeMillis();
        if (now - offRead > 10_000) {
            Map<String, Boolean> m = new LinkedHashMap<>();
            try {
                AppSettingsDao dao = new AppSettingsDao();
                for (String s : SWITCHES) m.put(s, "1".equals(dao.get("premiere_off_" + s)));
                offCache = m;
            } catch (java.sql.SQLException e) {
                // databáze nejde: necháme poslední známý stav
            }
            offRead = now;
        }
        return Boolean.TRUE.equals(offCache.get(what));
    }

    /** Admin přepnul vypínač: uloží a hned platí. */
    public static void setOff(String what, boolean off) throws java.sql.SQLException {
        new AppSettingsDao().set("premiere_off_" + what, off ? "1" : null);
        offRead = 0;
    }
}
