package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Seznam výběrů ve stylech, který končí čárkou a za ním je prázdný řádek, skoro vždy znamená, že se smazal jeho
 * poslední řádek i s obsahem {…}. Prohlížeč pak seznam spojí s dalším pravidlem a styly dostanou úplně jiné prvky
 * (2026-11-22: na slabých telefonech obří ekvalizér a prázdné místo na každé stránce). Prohlížeč chybu nehlásí,
 * proto ji hlídá tenhle test.
 */
class CssSelectorListTest {
    private static final Path CSS = Path.of("src/main/webapp/css");
    // čárka, konec řádku a hned prázdný řádek
    private static final Pattern DANGLING = Pattern.compile(",[ \\t]*\\r?\\n[ \\t]*\\r?\\n");
    private static final Pattern COMMENT = Pattern.compile("/\\*.*?\\*/", Pattern.DOTALL);

    @Test
    @DisplayName("Ve stylech není neukončený seznam výběrů (čárka před prázdným řádkem)")
    void noDanglingSelectorList() throws IOException {
        List<String> found = new ArrayList<>();
        try (Stream<Path> files = Files.walk(CSS)) {
            for (Path f : files.filter(p -> p.toString().endsWith(".css")).toList()) {
                String text = Files.readString(f, StandardCharsets.UTF_8);
                // komentáře nahradit mezerami (konce řádků zůstanou, aby sedělo číslo řádku)
                Matcher c = COMMENT.matcher(text);
                StringBuilder sb = new StringBuilder();
                while (c.find()) c.appendReplacement(sb, Matcher.quoteReplacement(c.group().replaceAll("[^\\n]", " ")));
                c.appendTail(sb);
                String clean = sb.toString();
                Matcher m = DANGLING.matcher(clean);
                while (m.find()) {
                    long line = clean.substring(0, m.start()).chars().filter(ch -> ch == '\n').count() + 1;
                    found.add(CSS.relativize(f) + ":" + line);
                }
            }
        }
        assertTrue(found.isEmpty(), "Seznam výběrů končí čárkou a pak prázdný řádek (chybí {…}?): " + found);
    }
}
