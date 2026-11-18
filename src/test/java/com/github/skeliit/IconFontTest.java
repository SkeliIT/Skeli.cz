package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Písma ikon jsou zmenšená jen na používané ikony (tools/fa-subset.py). Když někdo v kódu použije novou ikonu a písmo
 * se znovu nevyrobí, byl by na webu prázdný čtvereček. Tenhle test to zastaví ještě před nasazením.
 */
class IconFontTest {
    private static final Path MAIN = Path.of("src/main");
    private static final Path FA = MAIN.resolve("webapp/vendor/fontawesome");
    private static final Set<String> EXT = Set.of("jsp", "jspf", "tag", "js", "mjs", "java", "css", "json", "properties", "html", "xml");

    @Test
    @DisplayName("Každá ikona použitá v kódu je ve zmenšeném písmu")
    void everyUsedIconIsInTheFont() throws IOException {
        Map<String, String> names = new HashMap<>();
        String css = Files.readString(FA.resolve("css/all.min.css"));
        Matcher rule = Pattern.compile("((?:\\.fa-[a-z0-9-]+(?::before|:after)?,?)+)\\{(?:content|--fa):\"\\\\([0-9a-f]+)\"").matcher(css);
        while (rule.find()) {
            Matcher name = Pattern.compile("\\.fa-([a-z0-9-]+)").matcher(rule.group(1));
            while (name.find()) names.put("fa-" + name.group(1), rule.group(2));
        }
        Set<String> inFont = Set.copyOf(Files.readAllLines(FA.resolve("subset-icons.txt")));

        List<String> missing = new ArrayList<>();
        Pattern token = Pattern.compile("\\bfa-[a-z0-9-]+");
        try (Stream<Path> files = Files.walk(MAIN)) {
            for (Path f : (Iterable<Path>) files::iterator) {
                String p = f.toString().replace('\\', '/');
                String ext = p.substring(p.lastIndexOf('.') + 1);
                if (!Files.isRegularFile(f) || !EXT.contains(ext) || p.matches(".*/(vendor|uploads|eq|karaoke)/.*")) continue;
                String text = new String(Files.readAllBytes(f), StandardCharsets.UTF_8);
                // ikona přímo v CSS: content: "\f023"
                Matcher direct = Pattern.compile("content:\\s*\"\\\\(f[0-9a-f]{3})\"").matcher(text);
                while (direct.find()) if (!inFont.contains(direct.group(1))) missing.add(direct.group(1) + " (" + MAIN.relativize(f) + ")");
                Matcher m = token.matcher(text);
                while (m.find()) {
                    String cp = names.get(m.group());
                    if (cp != null && !inFont.contains(cp)) missing.add(m.group() + " (" + MAIN.relativize(f) + ")");
                }
            }
        }
        assertTrue(missing.isEmpty(), "Spusť python tools/fa-subset.py, v písmu chybí: " + missing);
    }
}
