package com.github.skeliit;

import jakarta.servlet.ServletContext;
import jakarta.servlet.http.HttpServletRequest;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Properties;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * UI translations from /WEB-INF/i18n/messages_{lang}.properties.
 * Files are the single source of truth; each language is loaded once and cached.
 * Keys missing in a language fall back to Czech.
 */
public final class I18n {
    private static final ConcurrentHashMap<String, Properties> CACHE = new ConcurrentHashMap<>();
    public static final String DEFAULT_LANG = "cs";
    /** Languages selectable in the UI. Anything else from a request is rejected. */
    public static final Set<String> SUPPORTED_LANGS = Set.of("cs", "en", "de", "uk", "vi");

    private I18n() {
        // utility class
    }

    public static boolean isSupported(String lang) {
        return lang != null && SUPPORTED_LANGS.contains(lang);
    }

    /** Returns the lang if supported, otherwise the default language. */
    public static String safeLang(Object lang) {
        return lang instanceof String s && isSupported(s) ? s : DEFAULT_LANG;
    }

    /** Translations for the given language, with Czech as fallback for missing keys. */
    public static Properties bundle(ServletContext context, String lang) {
        String l = safeLang(lang);
        Properties cached = CACHE.get(l);
        if (cached != null) return cached;
        Properties defaults = DEFAULT_LANG.equals(l) ? null : bundle(context, DEFAULT_LANG);
        Properties loaded = loadProperties(context, l, defaults);
        Properties previous = CACHE.putIfAbsent(l, loaded);
        return previous != null ? previous : loaded;
    }

    /** Translations for the language chosen in the request's session. */
    public static Properties bundle(HttpServletRequest req) {
        return bundle(req.getServletContext(), (String) req.getSession().getAttribute("lang"));
    }

    public static String getText(HttpServletRequest req, String key, String fallback) {
        return bundle(req).getProperty(key, fallback);
    }

    public static String getText(HttpServletRequest req, String key) {
        return getText(req, key, key);
    }

    private static Properties loadProperties(ServletContext context, String lang, Properties defaults) {
        Properties props = new Properties(defaults);
        String path = "/WEB-INF/i18n/messages_" + lang + ".properties";
        try (InputStream in = context.getResourceAsStream(path)) {
            if (in != null) {
                props.load(new InputStreamReader(in, StandardCharsets.UTF_8));
            }
        } catch (Exception ignored) {
            // fallback to defaults only
        }
        return props;
    }
}
