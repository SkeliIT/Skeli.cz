package com.github.skeliit;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Hlídá, že v CSS, JS a JSP nejsou neviditelné řídicí znaky (kromě tabulátoru a konců řádků).
 * 18. 11. 2026 se při úpravě zápis ikony "\f00c" změnil na znak „form feed“: prohlížeč ho v CSS bere
 * jako konec řádku, spolkl zavírací závorku a rozpadly se všechny styly za ním (patička, cookies lišta).
 */
class AssetControlCharsTest {
    @Test
    void noControlCharactersInWebSources() throws IOException {
        List<String> bad = new ArrayList<>();
        try (Stream<Path> files = Files.walk(Path.of("src/main/webapp"))) {
            for (Path p : (Iterable<Path>) files.filter(Files::isRegularFile)
                    .filter(f -> f.toString().matches(".*\\.(css|js|jsp|jspf)$"))
                    .filter(f -> !f.toString().replace('\\', '/').contains("/vendor/"))::iterator) {
                String s = Files.readString(p, StandardCharsets.UTF_8);
                for (int i = 0; i < s.length(); i++) {
                    char c = s.charAt(i);
                    if (c < 0x20 && c != '\t' && c != '\n' && c != '\r') {
                        int line = 1 + (int) s.substring(0, i).chars().filter(ch -> ch == '\n').count();
                        bad.add(p + ":" + line + " (znak 0x" + Integer.toHexString(c) + ")");
                        break;
                    }
                }
            }
        }
        assertTrue(bad.isEmpty(), "Neviditelné řídicí znaky ve zdrojích webu: " + bad);
    }
}
