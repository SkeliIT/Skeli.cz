package com.github.skeliit;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Proměnné v textech ({name}, {n}, {0}…) musí být ve všech jazycích stejné, jinak web v některém jazyce napíše
 * prázdné místo nebo holé „{name}“. Stejně tak HTML odkazy v Zásadách a Podmínkách a řádky \n v e-mailech.
 * (Jazyková revize 17. 11. 2026.)
 */
class I18nPlaceholdersTest {
    private static final Path I18N_DIR = Path.of("src/main/webapp/WEB-INF/i18n");
    private static final List<String> LANGS = List.of("cs", "en", "de", "uk", "vi");
    private static final Pattern VAR = Pattern.compile("\\{[A-Za-z0-9_]+}");
    private static final Pattern LINK = Pattern.compile("<a\\s+href=\"[^\"]+\"");

    private static Properties load(String lang) throws IOException {
        Properties p = new Properties();
        try (Reader r = Files.newBufferedReader(I18N_DIR.resolve("messages_" + lang + ".properties"), StandardCharsets.UTF_8)) {
            p.load(r);
        }
        return p;
    }

    private static Set<String> all(Pattern p, String text) {
        Set<String> out = new TreeSet<>();
        Matcher m = p.matcher(text == null ? "" : text);
        while (m.find()) out.add(m.group());
        return out;
    }

    @Test
    void everyLanguageHasTheSameVariablesLinksAndLineBreaks() throws IOException {
        Properties cs = load("cs");
        List<String> problems = new ArrayList<>();
        for (String lang : LANGS) {
            if (lang.equals("cs")) continue;
            Properties other = load(lang);
            for (String key : cs.stringPropertyNames()) {
                String a = cs.getProperty(key), b = other.getProperty(key);
                if (b == null) continue;                       // chybějící klíče hlídá I18nTest
                if (!all(VAR, a).equals(all(VAR, b)))
                    problems.add(lang + " " + key + ": proměnné " + all(VAR, a) + " ≠ " + all(VAR, b));
                if (!all(LINK, a).equals(all(LINK, b)))
                    problems.add(lang + " " + key + ": odkazy se liší");
                if (a.contains("\n") != b.contains("\n"))
                    problems.add(lang + " " + key + ": nové řádky jen v jednom jazyce");
            }
        }
        assertTrue(problems.isEmpty(), "Texty se liší v proměnných nebo odkazech:\n" + String.join("\n", problems));
    }
}
