package com.github.skeliit.web.site;

import org.junit.jupiter.api.Test;

import jakarta.servlet.http.HttpServletRequest;

import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class FeedServletTest {

    @Test
    void parsesValidFeedPaths() {
        FeedServlet.Request r = FeedServlet.parse("/en/feed", "/songs.atom");
        assertNotNull(r);
        assertEquals("en", r.lang());
        assertEquals("songs", r.kind());
        assertEquals("atom", r.format());
        assertEquals("application/atom+xml", r.contentType());
        assertEquals("/en/feed/songs.rss", r.otherFormatPath());
        assertEquals("/uk/feed/all.rss", FeedServlet.parse("/uk/feed", "/all.rss").path());
        assertEquals("vi", FeedServlet.parse("/vi/feed", "/news.rss").lang());
    }

    @Test
    void rejectsUnknownKindsFormatsAndLanguages() {
        assertNull(FeedServlet.parse("/cs/feed", "/comments.rss"));
        assertNull(FeedServlet.parse("/cs/feed", "/all.json"));
        assertNull(FeedServlet.parse("/cs/feed", "/all.rss/x"));
        assertNull(FeedServlet.parse("/cs/feed", null));
        assertNull(FeedServlet.parse("/sk/feed", "/all.rss"));
        assertNull(FeedServlet.parse("/feed", "/all.rss"));
    }

    @Test
    void limitIsClamped() {
        assertEquals(30, FeedServlet.limit(null));
        assertEquals(30, FeedServlet.limit("abc"));
        assertEquals(1, FeedServlet.limit("-5"));
        assertEquals(100, FeedServlet.limit("5000"));
        assertEquals(10, FeedServlet.limit(" 10 "));
    }

    @Test
    void etagDependsOnContent() {
        String a = FeedServlet.etag("a".getBytes(StandardCharsets.UTF_8));
        assertEquals(a, FeedServlet.etag("a".getBytes(StandardCharsets.UTF_8)));
        assertNotEquals(a, FeedServlet.etag("b".getBytes(StandardCharsets.UTF_8)));
        assertTrue(a.startsWith("\"") && a.endsWith("\""));
    }

    @Test
    void conditionalGet() {
        String tag = "\"abc\"";
        long modified = 1_700_000_000_500L;
        assertTrue(FeedServlet.notModified(tag, -1, tag, modified));
        assertTrue(FeedServlet.notModified("\"x\", W/\"abc\"", -1, tag, modified));
        assertFalse(FeedServlet.notModified("\"x\"", modified + 10_000, tag, modified)); // ETag má přednost
        assertTrue(FeedServlet.notModified(null, 1_700_000_000_000L, tag, modified)); // stejná sekunda
        assertFalse(FeedServlet.notModified(null, 1_699_999_999_000L, tag, modified));
        assertFalse(FeedServlet.notModified(null, -1, tag, modified));
    }

    @Test
    void changedAtKeepsTimeWhileContentIsTheSame() {
        assertEquals(1000L, FeedServlet.changedAt("\"a\"", 1000L, "\"a\"", 5000L));
        // jiný obsah (např. přejmenovaný klip) = změna teď, i když se data položek nezměnila
        assertEquals(5000L, FeedServlet.changedAt("\"a\"", 1000L, "\"b\"", 5000L));
    }

    @Test
    void invalidDateHeaderIsIgnored() {
        HttpServletRequest broken = (HttpServletRequest) Proxy.newProxyInstance(getClass().getClassLoader(),
                new Class<?>[] {HttpServletRequest.class}, (proxy, method, args) -> {
                    if ("getDateHeader".equals(method.getName())) throw new IllegalArgumentException("not a date");
                    return null;
                });
        assertEquals(-1, FeedServlet.dateHeader(broken, "If-Modified-Since"));
    }
}
