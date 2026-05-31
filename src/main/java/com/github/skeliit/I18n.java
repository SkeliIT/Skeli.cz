package com.github.skeliit;

import jakarta.servlet.ServletContext;
import jakarta.servlet.http.HttpServletRequest;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

public final class I18n {
    private static final ConcurrentHashMap<String, Properties> CACHE = new ConcurrentHashMap<>();
    private static final String DEFAULT_LANG = "cs";

    private I18n() {
        // utility class
    }

    public static String getText(HttpServletRequest req, String key, String fallback) {
        String lang = (String) req.getSession().getAttribute("lang");
        if (lang == null) {
            lang = DEFAULT_LANG;
        }
        Properties props = CACHE.computeIfAbsent(lang, l -> loadProperties(req.getServletContext(), l));
        return props.getProperty(key, fallback);
    }

    private static Properties loadProperties(ServletContext context, String lang) {
        Properties props = new Properties();
        String path = "/WEB-INF/i18n/messages_" + lang + ".properties";
        try (InputStream in = context.getResourceAsStream(path)) {
            if (in != null) {
                props.load(new InputStreamReader(in, StandardCharsets.UTF_8));
            }
        } catch (Exception ignored) {
            // fallback to empty properties
        }
        return props;
    }
}
