package com.github.skeliit.security;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Hlídač osobních dat (audit 13. 11. 2026, C4): každá tabulka, která patří uživateli (má sloupec jako user_id,
 * sender_id, reporter_id…), musí být řešená ve smazání účtu (AccountDeletion) i v kopii dat (ProfileExportServlet).
 * Přidáš novou tabulku a zapomeneš na ni? Tenhle test spadne a řekne kterou.
 * Výjimka je možná jen s napsaným důvodem v mapě níž.
 */
class PersonalDataCoverageTest {
    static final Path MIGRATIONS = Path.of("src/main/resources/db/migration");
    static final Path DELETION = Path.of("src/main/java/com/github/skeliit/security/AccountDeletion.java");
    static final Path EXPORT = Path.of("src/main/java/com/github/skeliit/web/profile/ProfileExportServlet.java");

    /** Sloupce, podle kterých se pozná, že řádek patří nějakému uživateli. */
    static final Pattern USER_COLUMN = Pattern.compile(
            "`?\\b(user_id|sender_id|recipient_id|reporter_id|reported_id|actor_id|blocker_id|blocked_id|user_a|user_b|other_id|voter_id|owner_id)\\b`?");

    /** Tabulky, které smazání účtu záměrně nechává – s důvodem. */
    static final Map<String, String> KEPT_ON_DELETE = Map.of(
            "admin_log", "záznam změn adminů (kdo co v adminu změnil), patří ke kontrole adminů",
            "comments", "komentáře zůstávají pod anonymní skořápkou účtu (zásady soukromí); admin je smaže přes purge",
            "video_comments", "stejně jako comments",
            "lyrics_votes", "hlasy zůstávají započítané pod anonymní skořápkou (zásady soukromí)",
            "lyric_comment_votes", "stejně jako lyrics_votes",
            "video_comment_votes", "stejně jako lyrics_votes; admin purge je maže");

    /** Tabulky, které se do kopie dat záměrně nedávají – s důvodem. */
    static final Map<String, String> NOT_EXPORTED = Map.of(
            "admin_log", "záznam práce adminů, ne data uživatele",
            "password_resets", "jen dočasný otisk tokenu na obnovu hesla",
            "user_recovery_codes", "jen otisky záložních kódů 2FA (bezpečnost)");

    @Test void everyUserTableIsDeletedAndExported() throws IOException {
        Set<String> tables = userTables();
        assertTrue(tables.size() > 15, "našel jsem podezřele málo tabulek: " + tables);
        String deletion = Files.readString(DELETION, StandardCharsets.UTF_8);
        String export = Files.readString(EXPORT, StandardCharsets.UTF_8);
        List<String> problems = new ArrayList<>();
        for (String t : tables) {
            if (!KEPT_ON_DELETE.containsKey(t) && !mentions(deletion, t))
                problems.add(t + ": chybí ve smazání účtu (AccountDeletion)");
            if (!NOT_EXPORTED.containsKey(t) && !mentions(export, t))
                problems.add(t + ": chybí v kopii dat (ProfileExportServlet)");
        }
        assertTrue(problems.isEmpty(), "Osobní data bez pravidla:\n" + String.join("\n", problems)
                + "\nDoplň tabulku do mazání i exportu, nebo do výjimky s důvodem (a do zásad soukromí).");
    }

    @Test void exceptionsStillExist() throws IOException {
        Set<String> tables = userTables();
        for (String t : KEPT_ON_DELETE.keySet()) assertTrue(tables.contains(t), "výjimka pro neexistující tabulku: " + t);
        for (String t : NOT_EXPORTED.keySet()) assertTrue(tables.contains(t), "výjimka pro neexistující tabulku: " + t);
    }

    /** Je tabulka v SQL toho souboru (DELETE FROM, UPDATE, FROM, JOIN)? */
    static boolean mentions(String source, String table) {
        return Pattern.compile("(FROM|UPDATE|JOIN|INTO)\\s+`?" + table + "\\b").matcher(source).find();
    }

    /** Tabulky s daty uživatele podle migrací (v pořadí verzí: CREATE přidá, DROP ubere, ALTER s uživatelským sloupcem přidá). */
    static Set<String> userTables() throws IOException {
        List<Path> files;
        try (Stream<Path> s = Files.list(MIGRATIONS)) {
            files = s.filter(p -> p.getFileName().toString().matches("V\\d+__.*\\.sql"))
                    .sorted(Comparator.comparingInt(p -> Integer.parseInt(p.getFileName().toString().replaceAll("^V(\\d+)__.*", "$1"))))
                    .toList();
        }
        Set<String> out = new TreeSet<>();
        // jeden příkaz SQL: druh, název(y) tabulky, zbytek
        Pattern stmt = Pattern.compile("(?is)^(CREATE\\s+TABLE|DROP\\s+TABLE|ALTER\\s+TABLE)\\s+(?:IF\\s+(?:NOT\\s+)?EXISTS\\s+)?([`\\w]+(?:\\s*,\\s*[`\\w]+)*)(.*)$");
        for (Path f : files) {
            String sql = Files.readString(f, StandardCharsets.UTF_8).replaceAll("--[^\\n]*", "");
            for (String one : sql.split(";")) {
                Matcher m = stmt.matcher(one.strip());
                if (!m.find()) continue;
                String kind = m.group(1).toUpperCase().replaceAll("\\s+", " ");
                String body = m.group(3);
                for (String name : m.group(2).split(",")) {
                    String t = name.replace("`", "").trim().toLowerCase();
                    if (t.isEmpty() || t.equals("users")) continue;
                    if (kind.equals("DROP TABLE")) out.remove(t);
                    else if (USER_COLUMN.matcher(body).find()) out.add(t);
                }
            }
        }
        return out;
    }
}
