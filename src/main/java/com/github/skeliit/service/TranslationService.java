package com.github.skeliit.service;

import com.github.skeliit.Config;
import com.github.skeliit.I18n;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Machine translation for admin (lyrics, meta description, SEO slug source text).
 * Providers (first configured wins): DeepL ({@code DEEPL_API_KEY}), LibreTranslate ({@code LIBRETRANSLATE_URL}).
 */
public class TranslationService {
    public static final class NotConfiguredException extends Exception {
        public NotConfiguredException() { super("no_translator"); }
    }

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    private final ObjectMapper mapper = new ObjectMapper();

    public boolean isConfigured() {
        String deepl = Config.get("DEEPL_API_KEY");
        String libre = Config.get("LIBRETRANSLATE_URL");
        return (deepl != null && !deepl.isBlank()) || (libre != null && !libre.isBlank());
    }

    public String providerName() {
        if (Config.get("DEEPL_API_KEY") != null && !Config.get("DEEPL_API_KEY").isBlank()) return "DeepL";
        if (Config.get("LIBRETRANSLATE_URL") != null && !Config.get("LIBRETRANSLATE_URL").isBlank()) return "LibreTranslate";
        return "none";
    }

    public String translate(String text, String fromLang, String toLang) throws Exception {
        if (text == null || text.isBlank()) return "";
        fromLang = I18n.safeLang(fromLang);
        toLang = I18n.safeLang(toLang);
        if (fromLang.equals(toLang)) return text;

        String deepl = Config.get("DEEPL_API_KEY");
        if (deepl != null && !deepl.isBlank()) {
            return translateDeepL(text, fromLang, toLang, deepl.trim());
        }
        String libre = Config.get("LIBRETRANSLATE_URL");
        if (libre != null && !libre.isBlank()) {
            return translateLibre(text, fromLang, toLang, libre.trim().replaceAll("/$", ""));
        }
        throw new NotConfiguredException();
    }

    private String translateDeepL(String text, String from, String to, String apiKey) throws Exception {
        // Free keys often use api-free.deepl.com
        boolean free = apiKey.endsWith(":fx") || "1".equals(Config.get("DEEPL_FREE", "0"));
        String host = free ? "https://api-free.deepl.com" : "https://api.deepl.com";
        String body = "text=" + URLEncoder.encode(text, StandardCharsets.UTF_8)
                + "&source_lang=" + URLEncoder.encode(from.toUpperCase(), StandardCharsets.UTF_8)
                + "&target_lang=" + URLEncoder.encode(mapDeepLTarget(to), StandardCharsets.UTF_8);
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(host + "/v2/translate"))
                .timeout(Duration.ofSeconds(60))
                .header("Authorization", "DeepL-Auth-Key " + apiKey)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (res.statusCode() >= 300) {
            throw new IllegalStateException("deepl_" + res.statusCode());
        }
        JsonNode root = mapper.readTree(res.body());
        JsonNode translations = root.path("translations");
        if (!translations.isArray() || translations.isEmpty()) {
            throw new IllegalStateException("deepl_empty");
        }
        return translations.get(0).path("text").asText("");
    }

    private static String mapDeepLTarget(String lang) {
        // DeepL uses EN for English; UK Ukrainian is supported as UK
        return switch (lang) {
            case "en" -> "EN";
            case "de" -> "DE";
            case "uk" -> "UK";
            case "cs" -> "CS";
            default -> lang.toUpperCase();
        };
    }

    private String translateLibre(String text, String from, String to, String base) throws Exception {
        String json = mapper.createObjectNode()
                .put("q", text)
                .put("source", from)
                .put("target", to)
                .put("format", "text")
                .toString();
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(base + "/translate"))
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();
        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (res.statusCode() >= 300) {
            throw new IllegalStateException("libre_" + res.statusCode());
        }
        return mapper.readTree(res.body()).path("translatedText").asText("");
    }

    /** Translate and return lines joined the same way (preserves blank lines roughly). */
    public String translateMultiline(String text, String from, String to) throws Exception {
        if (text == null || text.isBlank()) return "";
        // DeepL/Libre handle multiline; keep as one request for quality
        return translate(text, from, to);
    }
}
