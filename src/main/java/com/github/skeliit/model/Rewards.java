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
        days("kstyle", "u", 7);           // Ulice
        days("kstyle", "g", 21);          // Galerie

        // Vzhledy profilu (css/profile-looks.css). Základní (barva webu) je prázdná hodnota a má ji každý.
        days("profile", "cover", 3);         // Obálka
        site("profile", "mono", "s_voice");  // Monolit – první komentář
        days("profile", "gal", 7);           // Galerie
        site("profile", "radar", "s_friend");// Radar – první přítel
        site("profile", "wall", "s_fan");    // Zeď – srdce pěti písním
        days("profile", "aurora", 14);       // Polární záře
        site("profile", "holo", "s_talk");   // Hologram – 25 komentářů
        days("profile", "cock", 30);         // Kokpit
        // nové vzhledy 2026-11 (navrhy/profil-vzhledy-6); staré výše po převodu všech nových zmizí (migrace starý → nový)
        days("profile", "komiks", 3);        // Komiks (místo Obálky)
        days("profile", "zapisnik", 7);      // Zápisník (místo Galerie)
        site("profile", "metro", "s_friend");// Metro (místo Radaru) – první přítel
        site("profile", "mixtape", "s_voice");// Mixtape (místo Monolitu) – první komentář
        site("profile", "carbon", "s_talk"); // Carbon (místo Hologramu) – 25 komentářů
        days("profile", "jizda", 30);        // Noční jízda (místo Kokpitu)
        days("profile", "arkada", 21);       // Arkáda (nová)
        days("profile", "trpyt", 14);        // Půlnoční třpyt (místo Polární záře)
        site("profile", "sakura", "s_fan");  // Sakura (místo Zdi) – srdce pěti písním
        site("profile", "opal", "s_artist"); // Opál (nový) – přidaná vlastní tvorba
        site("profile", "aura", "s_karaoke");// Aura (nová) – karaoke
        site("profile", "y2k", "s_heart");   // Y2K chrom (nový, místo zamítnuté Levandule) – srdce od Skeliho

        // Karaoke – písmo textu (css/karaoke-fonts.css). Výchozí = Bruno Ace SC (prázdná hodnota).
        free("kfont", "oswald");
        free("kfont", "anton");
        days("kfont", "bebas", 3);
        days("kfont", "russo", 3);
        days("kfont", "saira", 7);
        days("kfont", "bungee", 7);
        site("kfont", "marck", "s_fan");
        days("kfont", "blackops", 14);
        days("kfont", "majormono", 14);
        days("kfont", "fraunces", 14);
        site("kfont", "sedgwick", "s_talk");
        days("kfont", "rubikwet", 30);
        days("kfont", "monoton", 30);
        site("kfont", "comforter", "s_heart");

        // Karaoke – jak řádek naskočí (kino/styly.css a-*). Výchozí = jemné prolnutí (prázdná hodnota).
        free("kanim", "blur");
        free("kanim", "mask");
        days("kanim", "type", 3);
        days("kanim", "wave", 7);
        days("kanim", "flip", 14);
        site("kanim", "glitch", "s_karaoke");
        days("kanim", "smoke", 30);
    }

    /** Písmo karaoke: hodnota → jméno písma v CSS (bez hodnoty = Bruno Ace SC). */
    public static final Map<String, String> KFONTS = Map.ofEntries(
            Map.entry("oswald", "Oswald"), Map.entry("anton", "Anton"), Map.entry("bebas", "Bebas Neue"), Map.entry("russo", "Russo One"),
            Map.entry("saira", "Saira Stencil One"), Map.entry("bungee", "Bungee"), Map.entry("marck", "Marck Script"),
            Map.entry("blackops", "Black Ops One"), Map.entry("majormono", "Major Mono Display"), Map.entry("fraunces", "Fraunces"),
            Map.entry("sedgwick", "Sedgwick Ave Display"), Map.entry("rubikwet", "Rubik Wet Paint"), Map.entry("monoton", "Monoton"),
            Map.entry("comforter", "Comforter Brush"));

    /** Jméno písma pro CSS (null/neznámé = výchozí Bruno Ace SC). */
    public static String fontFamily(String value) {
        String f = value == null ? null : KFONTS.get(value);
        return f == null ? "Bruno Ace SC" : f;
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
