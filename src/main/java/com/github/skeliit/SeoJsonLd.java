package com.github.skeliit;

import java.util.ArrayList;
import java.util.List;

/**
 * Structured data (schema.org JSON-LD) for search engines: Skeli as a musician (MusicGroup – schema.org
 * uses it for solo artists too) with his profiles, the site on the home page, and a song with its
 * breadcrumb on a lyric page. Printed by header.jsp inside &lt;script type="application/ld+json"&gt;.
 */
public final class SeoJsonLd {

    /** Skeli's official profiles (the same links as in the footer). */
    static final String[] SAME_AS = {
        "https://www.facebook.com/mcskeli/",
        "https://www.instagram.com/skeli.official/",
        "https://www.youtube.com/@Skeli",
        "https://open.spotify.com/artist/5IouXw8U9uKCTwmncG5bUl",
        "https://music.apple.com/cz/artist/skeli/1820513581"
    };

    private SeoJsonLd() {}

    /**
     * @param page      the public page ("/", "/about.jsp", …) or null
     * @param pageType  "music.song" on a lyric page
     * @param songName  the song's name on a lyric page
     * @return the JSON, or null when the page gets none
     */
    public static String forPage(String base, String pageUrl, String page, String pageType, String songName,
                                 String image, String lang, String homeLabel, String lyricsLabel) {
        String artistId = base + "/#skeli";
        String artist = "{\"@type\":\"MusicGroup\",\"@id\":" + str(artistId) + ",\"name\":\"Skeli\""
                + ",\"url\":" + str(base + "/")
                + ",\"image\":" + str(base + "/img/og-image.jpg")
                + ",\"genre\":[\"Hip hop\",\"Rap\"],\"foundingLocation\":{\"@type\":\"Country\",\"name\":\"Czech Republic\"}"
                + ",\"sameAs\":" + array(SAME_AS) + "}";
        List<String> graph = new ArrayList<>();
        if ("music.song".equals(pageType) && songName != null && !songName.isBlank()) {
            graph.add(artist);
            graph.add("{\"@type\":\"MusicRecording\",\"name\":" + str(songName) + ",\"url\":" + str(pageUrl)
                    + ",\"inLanguage\":" + str(lang)
                    + (image != null ? ",\"image\":" + str(image) : "")
                    + ",\"byArtist\":{\"@id\":" + str(artistId) + "}}");
            graph.add("{\"@type\":\"BreadcrumbList\",\"itemListElement\":["
                    + crumb(1, homeLabel, base + "/") + ","
                    + crumb(2, lyricsLabel, base + "/texty.jsp") + ","
                    + crumb(3, songName, pageUrl) + "]}");
        } else if ("/".equals(page)) {
            graph.add("{\"@type\":\"WebSite\",\"name\":\"Skeli\",\"url\":" + str(base + "/")
                    + ",\"inLanguage\":" + str(lang) + ",\"publisher\":{\"@id\":" + str(artistId) + "}}");
            graph.add(artist);
        } else if ("/about.jsp".equals(page) || "/music.jsp".equals(page)) {
            graph.add(artist);
        } else {
            return null;
        }
        return "{\"@context\":\"https://schema.org\",\"@graph\":[" + String.join(",", graph) + "]}";
    }

    private static String crumb(int pos, String name, String url) {
        return "{\"@type\":\"ListItem\",\"position\":" + pos + ",\"name\":" + str(name) + ",\"item\":" + str(url) + "}";
    }

    private static String array(String[] items) {
        List<String> out = new ArrayList<>();
        for (String s : items) out.add(str(s));
        return "[" + String.join(",", out) + "]";
    }

    /** A JSON string that is also safe inside an HTML script element (no "</script>" can end it). */
    static String str(String s) {
        if (s == null) return "null";
        StringBuilder b = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> b.append("\\\"");
                case '\\' -> b.append("\\\\");
                case '\n' -> b.append("\\n");
                case '\r' -> b.append("\\r");
                case '\t' -> b.append("\\t");
                case '<' -> b.append("\\u003c");
                case '>' -> b.append("\\u003e");
                case '&' -> b.append("\\u0026");
                default -> {
                    if (c < 0x20) b.append(String.format("\\u%04x", (int) c));
                    else b.append(c);
                }
            }
        }
        return b.append('"').toString();
    }
}
