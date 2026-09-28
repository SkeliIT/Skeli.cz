package com.github.skeliit;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;
import java.util.Set;
import java.util.TreeSet;

import static org.junit.jupiter.api.Assertions.*;

public class I18nTest {
    private static final Path I18N_DIR = Path.of("src/main/webapp/WEB-INF/i18n");

    @Test
    void keepsSupportedLang() {
        assertEquals("en", I18n.safeLang("en"));
        assertEquals("vi", I18n.safeLang("vi"));
    }

    @Test
    void rejectsInjectedLang() {
        assertEquals("cs", I18n.safeLang("cs';alert(1);//"));
        assertEquals("cs", I18n.safeLang("../../web"));
    }

    @Test
    void nullAndNonStringFallBackToDefault() {
        assertEquals("cs", I18n.safeLang(null));
        assertEquals("cs", I18n.safeLang(42));
    }

    /** A key missing in one language would silently show Czech there. */
    @Test
    void everySupportedLanguageHasAllKeys() throws IOException {
        Set<String> expected = keys("cs");
        for (String lang : I18n.SUPPORTED_LANGS) {
            Set<String> actual = keys(lang);
            Set<String> missing = new TreeSet<>(expected);
            missing.removeAll(actual);
            Set<String> extra = new TreeSet<>(actual);
            extra.removeAll(expected);
            assertTrue(missing.isEmpty() && extra.isEmpty(),
                    "messages_" + lang + ": missing " + missing + ", extra " + extra);
        }
    }

    private static Set<String> keys(String lang) throws IOException {
        Properties p = new Properties();
        try (Reader r = Files.newBufferedReader(I18N_DIR.resolve("messages_" + lang + ".properties"), StandardCharsets.UTF_8)) {
            p.load(r);
        }
        return new TreeSet<>(p.stringPropertyNames());
    }
}
