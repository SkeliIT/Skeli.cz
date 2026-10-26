package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.WebUtils;
import com.github.skeliit.job.VideoTitles;
import com.github.skeliit.model.FeedItem;
import com.github.skeliit.model.SongTitle;
import com.github.skeliit.web.site.LyricRouterServlet;

import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/** Položky RSS/Atom feedů, nejnovější první. Odkazy a obrázky jsou absolutní. */
public class FeedDao {
    /** Začátek id každé položky (RFC 4151); nesmí se změnit, jinak čtečky ukážou vše jako nové. */
    static final String TAG = "tag:skeli.cz,2025:";
    private static final Pattern YT_ID = Pattern.compile("[A-Za-z0-9_-]{6,20}");

    /**
     * Jedna položka za každou jazykovou verzi textu. Datum písně je její premiéra, jinak první klip,
     * jinak 1. leden jejího roku; verze se počítá od pozdějšího z tohoto data a jejího přidání, takže
     * nový překlad staré písně je ve feedu daného jazyka novinkou. Písně s premiérou teprve před sebou
     * ve feedu nejsou, písně bez data jsou na konci.
     */
    public List<FeedItem> songs(String lang, int limit) throws SQLException {
        String sql = "SELECT x.*, GREATEST(COALESCE(x.song_at, x.created_at), COALESCE(x.created_at, x.song_at)) AS pub FROM (" +
                "SELECT s.id, s.uuid, s.name, l.title AS lyric_title, s.preview_image_url, l.seo_slug, l.meta_description, " +
                "LEFT(l.words, 600) AS words, l.created_at, l.updated_at, " +
                "COALESCE(IF(s.release_at IS NULL, NULL, FROM_UNIXTIME(s.release_at DIV 1000)), " +
                "(SELECT MIN(v.published_at) FROM videos v WHERE v.song_id = s.id), " +
                "IF(s.year IS NULL, NULL, MAKEDATE(s.year, 1))) AS song_at, " +
                "(SELECT v.youtube_id FROM videos v WHERE v.song_id = s.id ORDER BY v.published_at DESC, v.id DESC LIMIT 1) AS yt " +
                "FROM lyrics l JOIN songs s ON s.id = l.song_id " +
                "WHERE l.lang = ? AND l.words IS NOT NULL AND l.words <> '' AND s.uuid IS NOT NULL " +
                "AND (s.release_at IS NULL OR s.release_at <= ?)" +
                ") x ORDER BY pub IS NULL, pub DESC, x.id DESC LIMIT ?";
        List<FeedItem> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, lang);
            ps.setLong(2, System.currentTimeMillis());
            ps.setInt(3, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String uuid = rs.getString("uuid");
                    String title = rs.getString("lyric_title");
                    if (title == null || title.isBlank()) title = SongTitle.of(rs.getString("name")).title;
                    String summary = rs.getString("meta_description");
                    if (summary == null || summary.isBlank()) {
                        summary = LyricRouterServlet.firstLines(rs.getString("words"), 200);
                    }
                    String yt = validYt(rs.getString("yt"));
                    String image = LyricRouterServlet.absoluteImage(rs.getString("preview_image_url"));
                    if (image == null && yt != null) image = ytThumb(yt);
                    Instant pub = instant(rs.getTimestamp("pub"));
                    Instant upd = instant(rs.getTimestamp("updated_at"));
                    out.add(new FeedItem(TAG + "song/" + uuid + "/" + lang, title,
                            songUrl(lang, rs.getString("seo_slug"), uuid), summary, image,
                            pub, later(pub, upd), "song", yt));
                }
            }
        }
        return out;
    }

    /** YouTube klipy a shorts. Odkaz vede na stránku písně, když má text v tomto jazyce. */
    public List<FeedItem> videos(String lang, int limit) throws SQLException {
        List<FeedItem> out = new ArrayList<>();
        out.addAll(youtube("videos", "video", lang, limit));
        out.addAll(youtube("shorts", "short", lang, limit));
        return newestFirst(out, limit);
    }

    /** Totéž co /aktuality.jsp: příspěvky ze sociálních sítí v tomto jazyce (nebo bez jazyka) a shorts. */
    public List<FeedItem> news(String lang, int limit) throws SQLException {
        List<FeedItem> out = new ArrayList<>();
        String sql = "SELECT source, post_id, permalink, image_url, caption, created_at FROM social_posts " +
                "WHERE (lang = ? OR lang IS NULL) ORDER BY created_at DESC, id DESC LIMIT ?";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, lang);
            ps.setInt(2, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String source = rs.getString("source");
                    String caption = rs.getString("caption");
                    Instant created = instant(rs.getTimestamp("created_at"));
                    out.add(new FeedItem(TAG + "social/" + source + "/" + rs.getString("post_id"),
                            socialTitle(caption, source),
                            LyricRouterServlet.absoluteImage(WebUtils.safeUrl(rs.getString("permalink"), "/aktuality.jsp")),
                            caption, LyricRouterServlet.absoluteImage(WebUtils.safeUrl(rs.getString("image_url"), null)),
                            created, created, source, null));
                }
            }
        }
        out.addAll(youtube("shorts", "short", lang, limit));
        return newestFirst(out, limit);
    }

    /** Písně, klipy a aktuality dohromady; short, který je v klipech i v aktualitách, jen jednou. */
    public List<FeedItem> all(String lang, int limit) throws SQLException {
        Map<String, FeedItem> byId = new LinkedHashMap<>();
        for (FeedItem i : songs(lang, limit)) byId.putIfAbsent(i.id(), i);
        for (FeedItem i : videos(lang, limit)) byId.putIfAbsent(i.id(), i);
        for (FeedItem i : news(lang, limit)) byId.putIfAbsent(i.id(), i);
        return newestFirst(new ArrayList<>(byId.values()), limit);
    }

    private List<FeedItem> youtube(String table, String category, String lang, int limit) throws SQLException {
        // table je jedna ze dvou konstant, nikdy vstup od uživatele
        String sql = "SELECT v.youtube_id, v.title, v.published_at, s.name, s.uuid, l.seo_slug, l.id AS lyric_id " +
                "FROM " + table + " v LEFT JOIN songs s ON s.id = v.song_id " +
                "LEFT JOIN lyrics l ON l.song_id = s.id AND l.lang = ? AND l.words IS NOT NULL AND l.words <> '' " +
                "WHERE v.published_at IS NOT NULL AND v.published_at <= NOW() " +
                "ORDER BY v.published_at DESC, v.id DESC LIMIT ?";
        List<FeedItem> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, lang);
            ps.setInt(2, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String yt = validYt(rs.getString("youtube_id"));
                    if (yt == null) continue;
                    String title = videoTitle(rs.getString("title"), "short".equals(category));
                    if (title == null || title.isBlank()) title = rs.getString("name");
                    if (title == null || title.isBlank()) title = yt;
                    boolean hasLyric = rs.getObject("lyric_id") != null && rs.getString("uuid") != null;
                    String link = hasLyric
                            ? songUrl(lang, rs.getString("seo_slug"), rs.getString("uuid"))
                            : ("short".equals(category) ? "https://www.youtube.com/shorts/" : "https://www.youtube.com/watch?v=") + yt;
                    Instant pub = instant(rs.getTimestamp("published_at"));
                    out.add(new FeedItem(TAG + category + "/" + yt, title, link, null, ytThumb(yt),
                            pub, pub, category, yt));
                }
            }
        }
        return out;
    }

    static List<FeedItem> newestFirst(List<FeedItem> items, int limit) {
        items.sort(Comparator.comparing(FeedItem::published, Comparator.nullsLast(Comparator.reverseOrder())));
        return items.size() > limit ? new ArrayList<>(items.subList(0, limit)) : items;
    }

    /** Název bez ocasu „SHORT #music #rap“, který kanál dává shortům. */
    static String videoTitle(String raw, boolean isShort) {
        String t = VideoTitles.display(raw);
        if (t == null) return null;
        // u shortu v jakékoli velikosti písmen („Já už vím Short“), u běžného klipu jen „SHORT“ velkými
        String clean = t.replaceAll("\\s*#[\\p{L}\\p{N}_]+", "")
                .replaceAll((isShort ? "(?i)" : "") + "[\\s-]*\\bSHORTS?\\b", "")
                .replaceAll("\\s+", " ").replaceAll("[\\s-]+$", "").trim();
        return clean.isEmpty() ? t : clean;
    }

    /** První řádek popisku příspěvku, zkrácený; bez popisku název sítě. */
    static String socialTitle(String caption, String source) {
        if (caption != null) {
            String first = caption.strip().split("\\R", 2)[0].strip();
            if (!first.isEmpty()) {
                if (first.length() <= 90) return first;
                int cut = first.lastIndexOf(' ', 90);
                return first.substring(0, cut > 0 ? cut : 90) + "…";
            }
        }
        if (source == null || source.isBlank()) return "Skeli";
        return Character.toUpperCase(source.charAt(0)) + source.substring(1);
    }

    private static String songUrl(String lang, String seoSlug, String uuid) {
        String slug = seoSlug != null && !seoSlug.isBlank() ? seoSlug.trim() : uuid;
        return WebUtils.baseUrl() + "/" + lang + "/song/" + slug;
    }

    private static String validYt(String id) {
        return id != null && YT_ID.matcher(id).matches() ? id : null;
    }

    private static String ytThumb(String yt) {
        return "https://i.ytimg.com/vi/" + yt + "/hqdefault.jpg";
    }

    private static Instant instant(Timestamp ts) {
        return ts == null ? null : ts.toInstant();
    }

    private static Instant later(Instant a, Instant b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isAfter(b) ? a : b;
    }
}
