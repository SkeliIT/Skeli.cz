package com.github.skeliit.web.site;

import com.github.skeliit.I18n;
import com.github.skeliit.WebUtils;
import com.github.skeliit.dao.FeedDao;
import com.github.skeliit.model.FeedItem;
import com.github.skeliit.service.FeedWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * RSS 2.0 / Atom feedy: {@code /{lang}/feed/{songs|videos|news|all}.{rss|atom}}.
 * {@code /feed} přesměruje na souhrnný RSS v jazyce návštěvníka.
 * Hotové feedy zůstávají pár minut v paměti, aby čtečky, které se ptají každých pár minut,
 * nezatěžovaly databázi; podmíněný GET dostane 304.
 */
@WebServlet(name = "FeedServlet", urlPatterns = {
        "/feed",
        "/cs/feed/*", "/en/feed/*", "/de/feed/*", "/uk/feed/*", "/vi/feed/*"
})
public class FeedServlet extends HttpServlet {
    private static final Pattern PATH = Pattern.compile("^/(songs|videos|news|all)\\.(rss|atom)$");
    private static final int DEFAULT_LIMIT = 30;
    private static final int MAX_LIMIT = 100;
    private static final long CACHE_MS = 5 * 60 * 1000L;
    /** Jak dlouho se při výpadku databáze posílá starší feed, než se zkusí databáze znovu. */
    private static final long STALE_RETRY_MS = 30 * 1000L;
    /** HTML stránka, ke které feed patří (přeložená veřejná stránka, viz {@link SeoServlet#langUrl}). */
    private static final Map<String, String> PAGES = Map.of(
            "songs", "/texty.jsp", "videos", "/music.jsp", "news", "/aktuality.jsp", "all", "/");

    /** Ověřený požadavek na feed. */
    record Request(String lang, String kind, String format) {
        String path() { return "/" + lang + "/feed/" + kind + "." + format; }
        String otherFormatPath() { return "/" + lang + "/feed/" + kind + "." + ("rss".equals(format) ? "atom" : "rss"); }
        String contentType() { return "rss".equals(format) ? "application/rss+xml" : "application/atom+xml"; }
    }

    private record Rendered(byte[] body, String etag, long lastModified, long expires) {}

    private static final Map<String, Rendered> CACHE = new ConcurrentHashMap<>();
    private final FeedDao dao = new FeedDao();

    /** Rozebere servlet path („/cs/feed“) a path info („/all.rss“); null, když to není adresa feedu. */
    static Request parse(String servletPath, String pathInfo) {
        if (servletPath == null || pathInfo == null || !servletPath.matches("^/[a-z]{2}/feed$")) return null;
        String lang = servletPath.substring(1, 3);
        if (!I18n.isSupported(lang)) return null;
        Matcher m = PATH.matcher(pathInfo);
        return m.matches() ? new Request(lang, m.group(1), m.group(2)) : null;
    }

    static int limit(String param) {
        try {
            return Math.max(1, Math.min(MAX_LIMIT, Integer.parseInt(param.trim())));
        } catch (Exception e) {
            return DEFAULT_LIMIT;
        }
    }

    /** Silný ETag z vypsaných bajtů. */
    static String etag(byte[] body) {
        try {
            byte[] h = MessageDigest.getInstance("SHA-256").digest(body);
            return "\"" + HexFormat.of().formatHex(h, 0, 16) + "\"";
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /**
     * Kdy se feed naposledy změnil: při stejném obsahu (ETag) zůstává čas předchozí verze, jinak teď.
     * Data položek k tomu nestačí: přejmenovaný klip nebo položka, která z feedu zmizí, je nezmění.
     */
    static long changedAt(String previousEtag, long previousChangedAt, String etag, long now) {
        return etag.equals(previousEtag) ? previousChangedAt : now;
    }

    /** Datum z hlavičky požadavku; neplatné datum se bere jako chybějící (-1), ne jako chyba 500. */
    static long dateHeader(HttpServletRequest req, String name) {
        try {
            return req.getDateHeader(name);
        } catch (IllegalArgumentException e) {
            return -1;
        }
    }

    /** True, když je kopie u klienta aktuální (If-None-Match má přednost před If-Modified-Since). */
    static boolean notModified(String ifNoneMatch, long ifModifiedSince, String etag, long lastModified) {
        if (ifNoneMatch != null) {
            for (String t : ifNoneMatch.split(",")) {
                String v = t.trim();
                if (v.startsWith("W/")) v = v.substring(2);
                if (v.equals(etag) || v.equals("*")) return true;
            }
            return false;
        }
        // HTTP data mají přesnost na sekundy
        return ifModifiedSince > 0 && lastModified / 1000 <= ifModifiedSince / 1000;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if ("/feed".equals(req.getServletPath())) {
            HttpSession session = req.getSession(false);
            String lang = I18n.safeLang(session != null ? session.getAttribute("lang") : null);
            // dočasně (302) a bez cache: cíl závisí na jazyku v session, trvalé 301 by si prohlížeč zapamatoval
            resp.setStatus(302);
            resp.setHeader("Cache-Control", "no-store");
            resp.setHeader("Location", req.getContextPath() + "/" + lang + "/feed/all.rss");
            return;
        }
        Request r = parse(req.getServletPath(), req.getPathInfo());
        if (r == null) {
            resp.sendError(404);
            return;
        }
        int limit = limit(req.getParameter("limit"));
        String key = r.path() + "?" + limit;
        Rendered feed = CACHE.get(key);
        if (feed == null || feed.expires() < System.currentTimeMillis()) {
            try {
                feed = render(r, limit, feed);
                CACHE.put(key, feed);
            } catch (Exception e) {
                log("feed " + key + ": could not render", e);
                if (feed == null) {
                    // prázdný feed by čtečky přiměl zapomenout položky, které už mají
                    resp.setHeader("Retry-After", "300");
                    resp.sendError(503);
                    return;
                }
                // databáze nejede: starší feed je lepší než žádný; databáze se zkusí znovu až za chvíli,
                // ne při každém požadavku
                feed = new Rendered(feed.body(), feed.etag(), feed.lastModified(),
                        System.currentTimeMillis() + STALE_RETRY_MS);
                CACHE.put(key, feed);
            }
        }

        resp.setHeader("ETag", feed.etag());
        resp.setDateHeader("Last-Modified", feed.lastModified());
        resp.setHeader("Cache-Control", "public, max-age=900");
        if (notModified(req.getHeader("If-None-Match"), dateHeader(req, "If-Modified-Since"),
                feed.etag(), feed.lastModified())) {
            resp.setStatus(304);
            return;
        }
        resp.setContentType(r.contentType() + ";charset=UTF-8");
        resp.setContentLength(feed.body().length);
        resp.getOutputStream().write(feed.body());
    }

    /** Vypíše feed znovu z databáze; previous = dosavadní verze v paměti (kvůli času poslední změny), může chybět. */
    private Rendered render(Request r, int limit, Rendered previous) throws Exception {
        List<FeedItem> items = switch (r.kind()) {
            case "songs" -> dao.songs(r.lang(), limit);
            case "videos" -> dao.videos(r.lang(), limit);
            case "news" -> dao.news(r.lang(), limit);
            default -> dao.all(r.lang(), limit);
        };
        Properties t = I18n.bundle(getServletContext(), r.lang());
        String base = WebUtils.baseUrl();
        String page = PAGES.get(r.kind());
        FeedWriter.Meta meta = new FeedWriter.Meta(
                "tag:skeli.cz,2025:feed/" + r.lang() + "/" + r.kind(),
                t.getProperty("feed.title." + r.kind(), "Skeli"),
                t.getProperty("feed.description." + r.kind(), "Skeli"),
                r.lang(),
                base + SeoServlet.langUrl(page, r.lang()),
                base + r.path(),
                base + r.otherFormatPath(),
                base + "/apple-touch-icon.png",
                t.getProperty("feed.readMore", "skeli.cz"));
        StringWriter out = new StringWriter();
        if ("rss".equals(r.format())) {
            FeedWriter.writeRss(meta, items, out);
        } else {
            FeedWriter.writeAtom(meta, items, out);
        }
        byte[] body = out.toString().getBytes(StandardCharsets.UTF_8);
        String etag = etag(body);
        long now = System.currentTimeMillis();
        long changed = previous == null ? now : changedAt(previous.etag(), previous.lastModified(), etag, now);
        return new Rendered(body, etag, changed, now + CACHE_MS);
    }
}
