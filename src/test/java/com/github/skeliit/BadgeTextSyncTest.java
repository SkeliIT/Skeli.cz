package com.github.skeliit;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Odznaky CatSmash mají texty na dvou místech: na webu (messages_*.properties, profil) a ve hře
 * (js/lines/catsmash-*.js). Název, podmínka i odměna musí být v obou stejné, jinak se odznak v profilu jmenuje
 * jinak než ve hře (17. 11. 2026 tak profil sliboval jiné odměny, než hra dávala).
 */
class BadgeTextSyncTest {
    private static final Path WEB = Path.of("src/main/webapp");
    private static final List<String> LANGS = List.of("cs", "en", "de", "uk", "vi");
    /** blok "název": { "klíč": "text", … } ze souboru hry */
    private static Map<String, String> block(String js, String name) {
        Map<String, String> out = new LinkedHashMap<>();
        int at = js.indexOf("\n  \"" + name + "\":");
        if (at < 0) return out;
        int end = js.indexOf('}', at);
        Matcher m = Pattern.compile("\"([A-Za-z0-9_]+)\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"").matcher(js.substring(js.indexOf('{', at), end));
        while (m.find()) out.put(m.group(1), m.group(2).replace("\\\"", "\""));
        return out;
    }

    @Test
    void profileAndGameSayTheSameAboutEveryBadge() throws IOException {
        List<String> problems = new ArrayList<>();
        for (String lang : LANGS) {
            Properties p = new Properties();
            try (Reader r = Files.newBufferedReader(WEB.resolve("WEB-INF/i18n/messages_" + lang + ".properties"), StandardCharsets.UTF_8)) {
                p.load(r);
            }
            String js = Files.readString(WEB.resolve("js/lines/catsmash-" + lang + ".js"), StandardCharsets.UTF_8);
            Map<String, String> names = block(js, "badgeNames"), how = block(js, "badgeHow"), rewards = block(js, "rewards");
            if (names.size() < 20) problems.add(lang + ": ve hře chybí názvy odznaků");
            for (String k : names.keySet()) {
                check(problems, lang, "název " + k, p.getProperty("pong.badge." + k), names.get(k));
                check(problems, lang, "podmínka " + k, p.getProperty("pong.badge." + k + ".how"), how.get(k));
                check(problems, lang, "odměna " + k, p.getProperty("pong.badge." + k + ".reward"), rewards.get(k));
            }
        }
        assertTrue(problems.isEmpty(), "Odznaky se na profilu a ve hře liší:\n" + String.join("\n", problems));
    }

    private static void check(List<String> problems, String lang, String what, String web, String game) {
        if (web == null || game == null || !web.equals(game))
            problems.add(lang + " " + what + ": web „" + web + "“ × hra „" + game + "“");
    }
}
