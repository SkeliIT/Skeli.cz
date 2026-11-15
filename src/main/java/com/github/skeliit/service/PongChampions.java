package com.github.skeliit.service;

import com.github.skeliit.dao.PongDao;
import com.github.skeliit.model.PongBadges;

import java.sql.SQLException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Šampioni CatSmash = první tři ze „Šampionů měsíce“ na úvodní stránce (když tento měsíc ještě nikdo nehrál,
 * první tři ze Síně slávy – stejně jako úvod). Mohou si kolem fotky zvolit rámeček champ1 / champ2 / champ3 (v Nastavení
 * volba „champ“ v users.pong_frame); kdo vypadne z první trojky, nemá žádný, dokud se nevrátí nebo nezvolí jiný.
 * Pořadí se drží v paměti minutu, nové skóre ho zneplatní.
 */
public final class PongChampions {
    private static final long TTL = 60_000;
    private static volatile Map<Integer, Integer> places = Map.of();
    private static volatile long at;

    private PongChampions() {}

    /** Id hráče → místo 1–3. */
    public static Map<Integer, Integer> places() {
        long now = System.currentTimeMillis();
        if (now - at > TTL) {
            synchronized (PongChampions.class) {
                if (now - at > TTL) {
                    try {
                        PongDao dao = new PongDao();
                        LocalDate today = LocalDate.now(ZoneId.of("Europe/Prague"));
                        List<Integer> ids = dao.championIds(3, today.withDayOfMonth(1).atStartOfDay());
                        if (ids.isEmpty()) ids = dao.championIds(3, null);
                        Map<Integer, Integer> m = new HashMap<>();
                        for (int i = 0; i < ids.size(); i++) m.put(ids.get(i), i + 1);
                        places = Map.copyOf(m);
                    } catch (SQLException e) {
                        // necháme poslední známé pořadí
                    }
                    at = now;
                }
            }
        }
        return places;
    }

    /** Místo 1–3, nebo null. */
    public static Integer place(int userId) { return places().get(userId); }

    /** Po zápisu nového skóre: příště se pořadí spočítá znovu. */
    public static void invalidate() { at = 0; }

    /** Volba „medaile šampiona“ v users.pong_frame (jedna z možností v Nastavení, ne povinnost). */
    public static final String CHOICE = "champ";

    /** Rámeček, který ostatní uvidí: vždy ten, který si člověk vybral. Medaile jen dokud je v první trojce. */
    public static String frame(int userId, String chosen) {
        if (CHOICE.equals(chosen)) { Integer p = place(userId); return p != null ? "champ" + p : null; }
        return PongBadges.isFrame(chosen) ? chosen : null;
    }
}
