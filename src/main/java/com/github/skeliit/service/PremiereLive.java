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

    /** Smajlíci: 7 obličejů SKELO SQUAD (f1–f7) + srdce, oheň, smích, wow, potlesk, oslava a joint. Jiné klíče server nepřijme. */
    public static final String[] REACTIONS = {"f1", "f2", "f3", "f4", "f5", "f6", "f7", "srdce", "ohen", "smich", "wow", "tlesk", "oslava", "joint"};
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

    // Skeli (účet umělce) v sále: jeho avatar sedí na svém pevném místě (js/premiera-sal.js) – jen čas, žádný klíč ani účet
    private static volatile long skeliDo = 0;
    public static void skeliSeen(long now) { skeliDo = now + PRESENT_MS; }
    public static boolean skeliVSale(long now) { return now < skeliDo; }

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

    // ---------- MEXICKÁ VLNA: 8 potlesků 👏 (od kohokoli) za 3 s → vlna pro všechny naráz ----------
    // Server určí jeden čas začátku (o 3,5 s později, ať ho stihnou dostat všichni – sál se ptá každé ~3 s), pak 7 s pauza.
    // Jen během 30 min odpočtu (to hlídá servlet). Pamatují se jen časy potlesků, ne kdo tleskal.
    public static final int VLNA_PRAH = 8;
    public static final long VLNA_OKNO_MS = 3_000, VLNA_ZPOZDENI_MS = 3_500, VLNA_PAUZA_MS = 7_000;
    private static final java.util.Deque<Long> TLESK = new java.util.ArrayDeque<>();
    private static volatile long vlnaAt = 0;

    /** Potlesk během odpočtu: přičte a když je jich dost, naplánuje vlnu. */
    public static synchronized void tleskni(long now) {
        while (!TLESK.isEmpty() && now - TLESK.peekFirst() > VLNA_OKNO_MS) TLESK.pollFirst();
        if (now < vlnaAt + VLNA_PAUZA_MS) return;                    // vlna běží nebo je pauza: potlesk se nepočítá
        TLESK.addLast(now);
        if (TLESK.size() >= VLNA_PRAH) { vlnaAt = now + VLNA_ZPOZDENI_MS; TLESK.clear(); }
    }

    /** Kolik potlesků je teď ve hře (pro kroužek kolem tlačítka smajlíků). */
    public static synchronized int tleskPocet(long now) {
        while (!TLESK.isEmpty() && now - TLESK.peekFirst() > VLNA_OKNO_MS) TLESK.pollFirst();
        return now < vlnaAt + VLNA_PAUZA_MS ? 0 : TLESK.size();
    }

    /** Čas začátku poslední vlny (0 = žádná). */
    public static long vlnaAt() { return vlnaAt; }

    // ---------- NÁLADOMĚR: každý prohlížeč má jednu náladu (f1–f7), jde ji změnit; jen během odpočtu (hlídá servlet) ----------
    // Klíč je náhodný řetězec z prohlížeče (ne účet); po restartu serveru se zapomene.
    private static final Map<String, String> NALADY = new ConcurrentHashMap<>();

    /** Nastaví náladu prohlížeče; false = neznámý obličej. */
    public static boolean nalada(String klic, String f) {
        if (f == null || !f.matches("f[1-7]")) return false;
        if (NALADY.size() < MAX_PEOPLE || NALADY.containsKey(klic)) NALADY.put(klic, f);
        return true;
    }

    /** Počty nálad celého sálu (f1–f7, i nuly) a nálada tohoto prohlížeče pod klíčem „moje“. */
    public static Map<String, Object> nalady(String klic) {
        Map<String, Object> out = new LinkedHashMap<>();
        int[] n = new int[7];
        for (String f : NALADY.values()) n[f.charAt(1) - '1']++;
        for (int i = 0; i < 7; i++) out.put("f" + (i + 1), n[i]);
        if (klic != null && NALADY.containsKey(klic)) out.put("moje", NALADY.get(klic));
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
