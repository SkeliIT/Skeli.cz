package com.github.skeliit.service;

import java.net.HttpURLConnection;
import java.net.URI;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Odkazy na hudbu od uživatelů: z adresy se vezme jen ověřená část (služba podle přesné domény, ID podle přesného tvaru)
 * a adresa se z ní vždy skládá znovu. Cizí doména, javascript: ani vložený kód tak nikdy neprojdou. null = odkaz neznám.
 */
public final class MusicLinks {
    private static final Set<String> YOUTUBE_HOSTS = Set.of("youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com");
    private static final Set<String> SOUNDCLOUD_HOSTS = Set.of("soundcloud.com", "www.soundcloud.com", "m.soundcloud.com");
    /** Krátké odkazy ze sdílení na telefonu: jediné adresy, na které se server sám zeptá (kam vedou). */
    private static final Set<String> SHORT_HOSTS = Set.of("on.soundcloud.com", "spotify.link");

    private static final Pattern YT_ID = Pattern.compile("[A-Za-z0-9_-]{11}");
    private static final Pattern YT_PATH = Pattern.compile("^/(?:shorts|embed|live)/([A-Za-z0-9_-]{11})/?$");
    private static final Pattern YT_QUERY = Pattern.compile("(?:^|&)v=([A-Za-z0-9_-]{11})(?:&|$)");
    private static final Pattern SPOTIFY_PATH = Pattern.compile("^(?:/intl-[a-z-]{2,10})?/(track|album)/([A-Za-z0-9]{22})/?$");
    private static final Pattern APPLE_PATH = Pattern.compile("^/([a-z]{2})/(song|album)/(?:[^/]{1,200}/)?([0-9]{1,20})/?$");
    private static final Pattern APPLE_TRACK = Pattern.compile("(?:^|&)i=([0-9]{1,20})(?:&|$)");
    private static final Pattern SOUNDCLOUD_PATH = Pattern.compile("^/([A-Za-z0-9_-]{1,80})/((?:sets/)?[A-Za-z0-9_-]{1,160})/?$");

    private MusicLinks() { }

    private static URI uri(String raw) {
        if (raw == null) return null;
        String s = raw.strip();
        if (s.isEmpty() || s.length() > 500) return null;
        if (!s.contains("://")) s = "https://" + s;
        try {
            URI u = new URI(s);
            String scheme = u.getScheme() == null ? "" : u.getScheme().toLowerCase(Locale.ROOT);
            return (scheme.equals("https") || scheme.equals("http")) && u.getHost() != null && u.getUserInfo() == null ? u : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static String host(URI u) {
        return u.getHost().toLowerCase(Locale.ROOT);
    }

    /** Video ID (11 znaků). */
    public static String youtube(String raw) {
        URI u = uri(raw);
        if (u == null) return null;
        String path = u.getPath() == null ? "" : u.getPath();
        if (host(u).equals("youtu.be")) {
            String id = path.replaceFirst("^/", "").replaceFirst("/$", "");
            return YT_ID.matcher(id).matches() ? id : null;
        }
        if (!YOUTUBE_HOSTS.contains(host(u))) return null;
        if (path.equals("/watch") && u.getRawQuery() != null) {
            Matcher m = YT_QUERY.matcher(u.getRawQuery());
            return m.find() ? m.group(1) : null;
        }
        Matcher m = YT_PATH.matcher(path);
        return m.matches() ? m.group(1) : null;
    }

    /** „track/ID“ nebo „album/ID“. */
    public static String spotify(String raw) {
        URI u = uri(raw);
        if (u == null || !host(u).equals("open.spotify.com") || u.getPath() == null) return null;
        Matcher m = SPOTIFY_PATH.matcher(u.getPath());
        return m.matches() ? m.group(1) + "/" + m.group(2) : null;
    }

    /** „cz/song/ID“ nebo „cz/album/ID“; skladba z alba (?i=ID) je rovnou „song“. */
    public static String apple(String raw) {
        URI u = uri(raw);
        if (u == null || !host(u).equals("music.apple.com") || u.getPath() == null) return null;
        Matcher m = APPLE_PATH.matcher(u.getPath());
        if (!m.matches()) return null;
        if (m.group(2).equals("album") && u.getRawQuery() != null) {
            Matcher t = APPLE_TRACK.matcher(u.getRawQuery());
            if (t.find()) return m.group(1) + "/song/" + t.group(1);
        }
        return m.group(1) + "/" + m.group(2) + "/" + m.group(3);
    }

    /** „interpret/skladba“ nebo „interpret/sets/album“. */
    public static String soundcloud(String raw) {
        URI u = uri(raw);
        if (u == null || !SOUNDCLOUD_HOSTS.contains(host(u)) || u.getPath() == null) return null;
        Matcher m = SOUNDCLOUD_PATH.matcher(u.getPath());
        return m.matches() ? m.group(1) + "/" + m.group(2) : null;
    }

    /**
     * Krátký odkaz ze sdílení na telefonu převede na plný (jeden krok, jen ze SHORT_HOSTS, bez dalšího přesměrování).
     * Cokoli jiného vrátí beze změny, takže server nikdy nevolá adresu, kterou si někdo vymyslel.
     */
    public static String expandShort(String raw) {
        URI u = uri(raw);
        if (u == null || !SHORT_HOSTS.contains(host(u))) return raw;
        try {
            HttpURLConnection c = (HttpURLConnection) URI.create("https://" + host(u) + u.getRawPath()).toURL().openConnection();
            c.setInstanceFollowRedirects(false);
            c.setRequestMethod("HEAD");
            c.setConnectTimeout(3000);
            c.setReadTimeout(3000);
            String to = c.getResponseCode() / 100 == 3 ? c.getHeaderField("Location") : null;
            c.disconnect();
            return to != null ? to : raw;
        } catch (Exception e) {
            return raw;
        }
    }
}
