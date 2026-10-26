package com.github.skeliit.service;

import com.github.skeliit.WebUtils;
import com.github.skeliit.model.FeedItem;

import javax.xml.stream.XMLOutputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamWriter;
import java.io.Writer;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Vypíše položky feedu jako RSS 2.0 (s Atom odkazem self, Media RSS a content:encoded)
 * nebo jako Atom 1.0. Celé texty písní ve feedu nikdy nejsou, jen krátký popis a odkaz.
 */
public final class FeedWriter {
    private static final String ATOM_NS = "http://www.w3.org/2005/Atom";
    private static final String MEDIA_NS = "http://search.yahoo.com/mrss/";
    private static final String CONTENT_NS = "http://purl.org/rss/1.0/modules/content/";
    private static final String DC_NS = "http://purl.org/dc/elements/1.1/";
    private static final XMLOutputFactory XML = XMLOutputFactory.newInstance();

    /**
     * Údaje o celém feedu.
     *
     * @param id        stálé tag: URI feedu (Atom id)
     * @param pageUrl   HTML stránka, ke které feed patří
     * @param selfUrl   adresa tohoto feedu
     * @param altUrl    tentýž feed v druhém formátu
     * @param readMore  text odkazu pod HTML obsahem každé položky
     */
    public record Meta(String id, String title, String description, String lang, String pageUrl,
                       String selfUrl, String altUrl, String iconUrl, String readMore) {}

    private FeedWriter() {
        // jen statické metody
    }

    /** Nejnovější změna ze všech položek; prázdný feed dostane 1970 (Atom datum updated vyžaduje). */
    public static Instant lastUpdated(List<FeedItem> items) {
        Instant max = null;
        for (FeedItem i : items) {
            Instant u = i.updatedOrPublished();
            if (u != null && (max == null || u.isAfter(max))) max = u;
        }
        return max != null ? max : Instant.EPOCH;
    }

    public static void writeRss(Meta m, List<FeedItem> items, Writer out) throws XMLStreamException {
        XMLStreamWriter w = XML.createXMLStreamWriter(out);
        w.writeStartDocument("UTF-8", "1.0");
        w.writeStartElement("rss");
        w.writeAttribute("version", "2.0");
        w.writeNamespace("atom", ATOM_NS);
        w.writeNamespace("media", MEDIA_NS);
        w.writeNamespace("content", CONTENT_NS);
        w.writeNamespace("dc", DC_NS);
        w.writeStartElement("channel");
        text(w, "title", m.title());
        text(w, "link", m.pageUrl());
        text(w, "description", m.description());
        text(w, "language", m.lang());
        text(w, "lastBuildDate", rfc822(lastUpdated(items)));
        text(w, "generator", "skeli.cz");
        text(w, "ttl", "60");
        atomLink(w, "self", "application/rss+xml", m.selfUrl());
        atomLink(w, "alternate", "application/atom+xml", m.altUrl());
        if (m.iconUrl() != null) {
            w.writeStartElement("image");
            text(w, "url", m.iconUrl());
            text(w, "title", m.title());
            text(w, "link", m.pageUrl());
            w.writeEndElement();
        }
        for (FeedItem i : items) {
            w.writeStartElement("item");
            text(w, "title", i.title());
            text(w, "link", i.link());
            w.writeStartElement("guid");
            w.writeAttribute("isPermaLink", "false");
            w.writeCharacters(clean(i.id()));
            w.writeEndElement();
            if (i.published() != null) text(w, "pubDate", rfc822(i.published()));
            if (i.category() != null) text(w, "category", i.category());
            w.writeStartElement("dc", "creator", DC_NS);
            w.writeCharacters("Skeli");
            w.writeEndElement();
            if (i.summary() != null && !i.summary().isBlank()) text(w, "description", i.summary());
            w.writeStartElement("content", "encoded", CONTENT_NS);
            w.writeCharacters(clean(html(i, m.readMore())));
            w.writeEndElement();
            media(w, i);
            w.writeEndElement();
        }
        w.writeEndElement();
        w.writeEndElement();
        w.writeEndDocument();
        w.flush();
    }

    public static void writeAtom(Meta m, List<FeedItem> items, Writer out) throws XMLStreamException {
        XMLStreamWriter w = XML.createXMLStreamWriter(out);
        w.writeStartDocument("UTF-8", "1.0");
        w.writeStartElement("feed");
        w.writeDefaultNamespace(ATOM_NS);
        w.writeNamespace("media", MEDIA_NS);
        w.writeAttribute("xml", javax.xml.XMLConstants.XML_NS_URI, "lang", m.lang());
        text(w, "id", m.id());
        text(w, "title", m.title());
        text(w, "subtitle", m.description());
        text(w, "updated", rfc3339(lastUpdated(items)));
        link(w, "self", "application/atom+xml", m.selfUrl());
        link(w, "alternate", "text/html", m.pageUrl());
        link(w, "alternate", "application/rss+xml", m.altUrl());
        author(w);
        if (m.iconUrl() != null) text(w, "icon", m.iconUrl());
        w.writeStartElement("generator");
        w.writeAttribute("uri", WebUtils.baseUrl());
        w.writeCharacters("skeli.cz");
        w.writeEndElement();
        for (FeedItem i : items) {
            w.writeStartElement("entry");
            text(w, "id", i.id());
            text(w, "title", i.title());
            link(w, "alternate", "text/html", i.link());
            Instant updated = i.updatedOrPublished() != null ? i.updatedOrPublished() : lastUpdated(items);
            text(w, "updated", rfc3339(updated));
            if (i.published() != null) text(w, "published", rfc3339(i.published()));
            if (i.category() != null) {
                w.writeStartElement("category");
                w.writeAttribute("term", clean(i.category()));
                w.writeEndElement();
            }
            if (i.summary() != null && !i.summary().isBlank()) text(w, "summary", i.summary());
            w.writeStartElement("content");
            w.writeAttribute("type", "html");
            w.writeCharacters(clean(html(i, m.readMore())));
            w.writeEndElement();
            media(w, i);
            w.writeEndElement();
        }
        w.writeEndElement();
        w.writeEndDocument();
        w.flush();
    }

    /** Krátké HTML pro čtečky: náhled, popis, odkaz na stránku. */
    static String html(FeedItem i, String readMore) {
        StringBuilder sb = new StringBuilder();
        if (i.imageUrl() != null) {
            sb.append("<p><a href=\"").append(WebUtils.escapeHtml(i.link())).append("\"><img src=\"")
              .append(WebUtils.escapeHtml(i.imageUrl())).append("\" alt=\"").append(WebUtils.escapeHtml(i.title()))
              .append("\" /></a></p>");
        }
        if (i.summary() != null && !i.summary().isBlank()) {
            sb.append("<p>").append(WebUtils.escapeHtml(i.summary()).replace("\n", "<br />")).append("</p>");
        }
        sb.append("<p><a href=\"").append(WebUtils.escapeHtml(i.link())).append("\">")
          .append(WebUtils.escapeHtml(readMore)).append("</a></p>");
        return sb.toString();
    }

    private static void media(XMLStreamWriter w, FeedItem i) throws XMLStreamException {
        if (i.imageUrl() != null) {
            w.writeEmptyElement("media", "thumbnail", MEDIA_NS);
            w.writeAttribute("url", clean(i.imageUrl()));
        }
        if (i.videoId() != null) {
            w.writeEmptyElement("media", "player", MEDIA_NS);
            w.writeAttribute("url", "https://www.youtube.com/embed/" + clean(i.videoId()));
        }
    }

    private static void author(XMLStreamWriter w) throws XMLStreamException {
        w.writeStartElement("author");
        text(w, "name", "Skeli");
        text(w, "uri", WebUtils.baseUrl());
        w.writeEndElement();
    }

    private static void atomLink(XMLStreamWriter w, String rel, String type, String href) throws XMLStreamException {
        w.writeEmptyElement("atom", "link", ATOM_NS);
        w.writeAttribute("rel", rel);
        w.writeAttribute("type", type);
        w.writeAttribute("href", clean(href));
    }

    private static void link(XMLStreamWriter w, String rel, String type, String href) throws XMLStreamException {
        w.writeEmptyElement("link");
        w.writeAttribute("rel", rel);
        w.writeAttribute("type", type);
        w.writeAttribute("href", clean(href));
    }

    private static void text(XMLStreamWriter w, String name, String value) throws XMLStreamException {
        w.writeStartElement(name);
        w.writeCharacters(clean(value));
        w.writeEndElement();
    }

    /** Vynechá znaky, které XML 1.0 nedovoluje (řídicí znaky ve vložených popiscích). */
    static String clean(String s) {
        if (s == null) return "";
        StringBuilder sb = null;
        for (int k = 0; k < s.length(); ) {
            int cp = s.codePointAt(k);
            boolean ok = cp == 0x9 || cp == 0xA || cp == 0xD
                    || (cp >= 0x20 && cp <= 0xD7FF) || (cp >= 0xE000 && cp <= 0xFFFD) || cp >= 0x10000;
            if (!ok && sb == null) sb = new StringBuilder(s.substring(0, k));
            if (sb != null && ok) sb.appendCodePoint(cp);
            k += Character.charCount(cp);
        }
        return sb == null ? s : sb.toString();
    }

    static String rfc822(Instant i) {
        return DateTimeFormatter.RFC_1123_DATE_TIME.format(i.atOffset(ZoneOffset.UTC));
    }

    static String rfc3339(Instant i) {
        return DateTimeFormatter.ISO_INSTANT.format(i.truncatedTo(java.time.temporal.ChronoUnit.SECONDS));
    }
}
