package com.github.skeliit.model;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Katalog vzhledů, které se dají získat (záložka Nastavení → Vzhled). Jediné místo, kde je u každé věci
 * napsané, čím se odemkne – když Skeli rozdělí odměny jinak (stránka „Skeli bonusy“), mění se jen tady.
 *
 * Pravidla: FREE = má každý, DAYS = počet dní na webu celkem (vynechaný den nic nesmaže), SITE = odznak webu (s_*),
 * PONG = odznak CatSmash. Co člověk jednou získal, zapíše RewardDao do user_rewards a už se mu nevezme,
 * i kdyby se pravidlo později změnilo. Admin má odemčené všechno (zkouší vzhledy na webu).
 *
 * Sloty: kstyle = styl karaoke kina, profile = vzhled profilu, kfont = písmo textu v karaoke, kanim = animace textu.
 * Rámeček fotky a vzhled chatu mají svá pravidla jinde (PongBadges, ChatPrefs).
 */
public final class Rewards {
    private Rewards() {}

    public enum Rule { FREE, DAYS, SITE, PONG }

    /** Jedna věc z katalogu. Klíč v user_rewards = slot + ":" + value. */
    public static final class Item {
        public final String slot, value, badge;
        public final Rule rule;
        public final int days;

        Item(String slot, String value, Rule rule, int days, String badge) {
            this.slot = slot; this.value = value; this.rule = rule; this.days = days; this.badge = badge;
        }

        public String key() { return slot + ":" + value; }
        public String getSlot() { return slot; }
        public String getValue() { return value; }
        public String getBadge() { return badge; }
        public int getDays() { return days; }
        public String getRule() { return rule.name(); }
    }

    /** Co člověk má: dny na webu, odznaky webu, odznaky CatSmash, už zapsané odměny, admin. */
    public static final class Have {
        public final int days;
        public final Set<String> site, pong, stored;
        public final boolean admin;

        public Have(int days, Set<String> site, Set<String> pong, Set<String> stored, boolean admin) {
            this.days = days; this.site = site; this.pong = pong; this.stored = stored; this.admin = admin;
        }

        /** Splňuje pravidlo teď (bez ohledu na to, co už má zapsané). */
        public boolean meets(Item it) {
            switch (it.rule) {
                case FREE: return true;
                case DAYS: return days >= it.days;
                case SITE: return site.contains(it.badge);
                case PONG: return pong.contains(it.badge);
                default: return false;
            }
        }

        /** Smí věc zvolit: admin, splněné pravidlo, nebo ji už jednou získal. */
        public boolean open(Item it) {
            return admin || stored.contains(it.key()) || meets(it);
        }
    }

    private static final Map<String, Item> ALL = new LinkedHashMap<>();

    private static void add(String slot, String value, Rule rule, int days, String badge) {
        Item it = new Item(slot, value, rule, days, badge);
        ALL.put(it.key(), it);
    }
    private static void free(String slot, String value) { add(slot, value, Rule.FREE, 0, null); }
    private static void days(String slot, String value, int n) { add(slot, value, Rule.DAYS, n, null); }
    private static void site(String slot, String value, String badge) { add(slot, value, Rule.SITE, 0, badge); }

    static {
        // Karaoke – styly kina (kino/styly.js). Lyric video je výchozí a zdarma.
        free("kstyle", "l");
        days("kstyle", "c", 3);           // Čisté plátno
        site("kstyle", "o", "s_karaoke");  // Kouř a oheň – kdo zašel do kina
        days("kstyle", "t", 14);          // Tunel
    }

    /** Všechny věci jednoho slotu v pořadí katalogu. */
    public static List<Item> of(String slot) {
        List<Item> out = new ArrayList<>();
        for (Item it : ALL.values()) if (it.slot.equals(slot)) out.add(it);
        return out;
    }

    /** Věc podle slotu a hodnoty, nebo null (neznámá hodnota = server ji nepřijme). */
    public static Item find(String slot, String value) {
        return slot == null || value == null ? null : ALL.get(slot + ":" + value);
    }

    /** Všechny věci (pro zapsání získaných do user_rewards). */
    public static List<Item> all() { return List.copyOf(ALL.values()); }
}
