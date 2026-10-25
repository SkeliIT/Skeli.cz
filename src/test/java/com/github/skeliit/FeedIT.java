package com.github.skeliit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.*;

/**
 * RSS/Atom feedy proti běžící lokální instanci (mvn jetty:run).
 * Jen HTTP, prohlížeč z {@link UiTestSupport} není potřeba.
 */
public class FeedIT {
    private static final String BASE_URL = System.getProperty("it.baseUrl", "http://localhost:8080");
    private final HttpClient http = HttpClient.newHttpClient();

    private HttpResponse<String> get(String path, String... headers) throws Exception {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(BASE_URL + path)).GET();
        if (headers.length > 0) b.headers(headers);
        return http.send(b.build(), HttpResponse.BodyHandlers.ofString());
    }

    @Test
    @DisplayName("Every language/kind/format returns a feed")
    void allFeedsRespond() throws Exception {
        for (String lang : new String[] {"cs", "en", "de", "uk", "vi"}) {
            for (String kind : new String[] {"songs", "videos", "news", "all"}) {
                HttpResponse<String> rss = get("/" + lang + "/feed/" + kind + ".rss");
                assertEquals(200, rss.statusCode(), lang + "/" + kind + ".rss");
                assertTrue(rss.headers().firstValue("Content-Type").orElse("").startsWith("application/rss+xml"));
                assertTrue(rss.body().contains("<rss version=\"2.0\""), lang + "/" + kind);

                HttpResponse<String> atom = get("/" + lang + "/feed/" + kind + ".atom");
                assertEquals(200, atom.statusCode(), lang + "/" + kind + ".atom");
                assertTrue(atom.headers().firstValue("Content-Type").orElse("").startsWith("application/atom+xml"));
                assertTrue(atom.body().contains("xml:lang=\"" + lang + "\""));
            }
        }
    }

    @Test
    @DisplayName("Conditional GET with the ETag returns 304")
    void etagGives304() throws Exception {
        HttpResponse<String> first = get("/cs/feed/all.rss");
        String etag = first.headers().firstValue("ETag").orElseThrow();
        HttpResponse<String> second = get("/cs/feed/all.rss", "If-None-Match", etag);
        assertEquals(304, second.statusCode());
    }

    @Test
    @DisplayName("Unknown feeds are 404, /feed redirects")
    void unknownAndRedirect() throws Exception {
        assertEquals(404, get("/cs/feed/nope.rss").statusCode());
        assertEquals(404, get("/cs/feed/all.json").statusCode());
        HttpResponse<String> r = get("/feed");
        assertEquals(302, r.statusCode());
        assertEquals("no-store", r.headers().firstValue("Cache-Control").orElse(""));
        assertTrue(r.headers().firstValue("Location").orElse("").endsWith("/cs/feed/all.rss"));
    }

    @Test
    @DisplayName("Pages advertise their feeds in <head>")
    void autodiscovery() throws Exception {
        String home = get("/").body();
        assertTrue(home.contains("type=\"application/rss+xml\""), "home has RSS link");
        assertTrue(home.contains("/cs/feed/all.rss"));
        String news = get("/aktuality.jsp?lang=en").body();
        assertTrue(news.contains("/en/feed/news.rss"), "news page advertises the news feed");
    }
}
