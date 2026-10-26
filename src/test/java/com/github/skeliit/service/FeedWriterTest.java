package com.github.skeliit.service;

import com.github.skeliit.model.FeedItem;
import org.junit.jupiter.api.Test;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FeedWriterTest {
    private static final String ATOM = "http://www.w3.org/2005/Atom";
    private static final String MEDIA = "http://search.yahoo.com/mrss/";

    private static final Instant T1 = Instant.parse("2026-03-01T12:00:00Z");
    private static final Instant T2 = Instant.parse("2026-05-10T08:30:15.123Z");

    private static final FeedWriter.Meta META = new FeedWriter.Meta(
            "tag:skeli.cz,2025:feed/uk/all", "Skeli – усе нове", "Тексти & відео <нові>", "uk",
            "https://skeli.cz/?lang=uk", "https://skeli.cz/uk/feed/all.rss", "https://skeli.cz/uk/feed/all.atom",
            "https://skeli.cz/apple-touch-icon.png", "Відкрити");

    private static final List<FeedItem> ITEMS = List.of(
            new FeedItem("tag:skeli.cz,2025:song/abc/uk", "Tik Tak & <Co>", "https://skeli.cz/uk/song/tik-tak",
                    "перший рядок / 🔥 druhý\u0007", "https://skeli.cz/uploads/song-previews/a.jpg",
                    T1, T2, "song", "YQt6qBZ2f4g"),
            new FeedItem("tag:skeli.cz,2025:social/instagram/1", "Post", "https://instagram.com/p/1",
                    null, null, null, null, "instagram", null));

    private static Document parse(String xml) throws Exception {
        DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
        f.setNamespaceAware(true);
        return f.newDocumentBuilder().parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void rssIsWellFormedWithItemsAndExtensions() throws Exception {
        StringWriter out = new StringWriter();
        FeedWriter.writeRss(META, ITEMS, out);
        Document d = parse(out.toString());

        Element rss = d.getDocumentElement();
        assertEquals("rss", rss.getTagName());
        assertEquals("2.0", rss.getAttribute("version"));
        assertEquals(2, d.getElementsByTagName("item").getLength());
        assertEquals("Skeli – усе нове", d.getElementsByTagName("title").item(0).getTextContent());
        assertEquals("Тексти & відео <нові>", d.getElementsByTagName("description").item(0).getTextContent());

        Element self = (Element) d.getElementsByTagNameNS(ATOM, "link").item(0);
        assertEquals("self", self.getAttribute("rel"));
        assertEquals("https://skeli.cz/uk/feed/all.rss", self.getAttribute("href"));

        Element item = (Element) d.getElementsByTagName("item").item(0);
        assertEquals("Tik Tak & <Co>", item.getElementsByTagName("title").item(0).getTextContent());
        assertEquals("Sun, 1 Mar 2026 12:00:00 GMT", item.getElementsByTagName("pubDate").item(0).getTextContent());
        assertEquals("false", ((Element) item.getElementsByTagName("guid").item(0)).getAttribute("isPermaLink"));
        // řídicí znak pryč, emoji zůstává
        assertEquals("перший рядок / 🔥 druhý", item.getElementsByTagName("description").item(0).getTextContent());
        assertEquals("https://www.youtube.com/embed/YQt6qBZ2f4g",
                ((Element) item.getElementsByTagNameNS(MEDIA, "player").item(0)).getAttribute("url"));
        String html = item.getElementsByTagNameNS("http://purl.org/rss/1.0/modules/content/", "encoded")
                .item(0).getTextContent();
        assertTrue(html.contains("<img src=\"https://skeli.cz/uploads/song-previews/a.jpg\""), html);
        assertTrue(html.contains("Tik Tak &amp; &lt;Co&gt;"), html);

        // položka bez data nemá pubDate místo rozbitého
        Element second = (Element) d.getElementsByTagName("item").item(1);
        assertEquals(0, second.getElementsByTagName("pubDate").getLength());
    }

    @Test
    void atomIsWellFormedWithRequiredElements() throws Exception {
        StringWriter out = new StringWriter();
        FeedWriter.writeAtom(META, ITEMS, out);
        Document d = parse(out.toString());

        Element feed = d.getDocumentElement();
        assertEquals(ATOM, feed.getNamespaceURI());
        assertEquals("feed", feed.getLocalName());
        assertEquals("uk", feed.getAttributeNS("http://www.w3.org/XML/1998/namespace", "lang"));
        assertEquals("2026-05-10T08:30:15Z", feed.getElementsByTagNameNS(ATOM, "updated").item(0).getTextContent());
        assertEquals(2, d.getElementsByTagNameNS(ATOM, "entry").getLength());

        Element self = (Element) feed.getElementsByTagNameNS(ATOM, "link").item(0);
        assertEquals("self", self.getAttribute("rel"));
        assertEquals("https://skeli.cz/uk/feed/all.rss", self.getAttribute("href"));

        // každá položka musí mít id, title a updated (ta bez data dostane datum feedu)
        for (int k = 0; k < 2; k++) {
            Element e = (Element) d.getElementsByTagNameNS(ATOM, "entry").item(k);
            assertEquals(1, e.getElementsByTagNameNS(ATOM, "id").getLength());
            assertEquals(1, e.getElementsByTagNameNS(ATOM, "title").getLength());
            assertFalse(e.getElementsByTagNameNS(ATOM, "updated").item(0).getTextContent().isBlank());
        }
        Element first = (Element) d.getElementsByTagNameNS(ATOM, "entry").item(0);
        assertEquals("2026-03-01T12:00:00Z", first.getElementsByTagNameNS(ATOM, "published").item(0).getTextContent());
        assertEquals("song", ((Element) first.getElementsByTagNameNS(ATOM, "category").item(0)).getAttribute("term"));
    }

    @Test
    void emptyFeedIsStillValid() throws Exception {
        StringWriter out = new StringWriter();
        FeedWriter.writeAtom(META, List.of(), out);
        Document d = parse(out.toString());
        assertEquals("1970-01-01T00:00:00Z", d.getElementsByTagNameNS(ATOM, "updated").item(0).getTextContent());
    }

    @Test
    void cleanDropsOnlyCharactersInvalidInXml() {
        assertEquals("a\tb\nc😀", FeedWriter.clean("a\tb\u0000\nc\u001F😀￾"));
        assertEquals("", FeedWriter.clean(null));
    }
}
