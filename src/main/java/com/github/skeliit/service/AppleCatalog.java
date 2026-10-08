package com.github.skeliit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.Normalizer;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Skeli's tracks in the public Apple Music catalogue through the free iTunes lookup
 * (no developer account or key needed, unlike {@link AppleMusicClient}).
 */
public final class AppleCatalog {

    /** Skeli on Apple Music: https://music.apple.com/cz/artist/skeli/1820513581 */
    public static final String SKELI_ARTIST_ID = "1820513581";

    public record Track(String id, String name, String releaseDate) {}

    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    private AppleCatalog() {}

    /** All songs of the artist in the given storefront (e.g. "cz"). */
    public static List<Track> artistTracks(String artistId, String country) throws Exception {
        String url = "https://itunes.apple.com/lookup?entity=song&limit=200&id=" + artistId + "&country=" + country;
        HttpResponse<String> resp = HTTP.send(HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(15)).GET().build(), HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) throw new IllegalStateException("iTunes lookup HTTP " + resp.statusCode());
        return parse(resp.body());
    }

    static List<Track> parse(String json) throws Exception {
        List<Track> tracks = new ArrayList<>();
        for (JsonNode r : new ObjectMapper().readTree(json).path("results")) {
            if (!"track".equals(r.path("wrapperType").asText())) continue;
            tracks.add(new Track(r.path("trackId").asText(), r.path("trackName").asText(""),
                    r.path("releaseDate").asText("")));
        }
        return tracks;
    }

    /**
     * The bare title for matching: no "Skeli -" in front, nothing in brackets, no "ft./feat." part,
     * no diacritics or punctuation. "Tik Tak ( feat.TAADA & Cheorchina )" and "Tik Tak" are both "tik tak".
     */
    public static String baseName(String name) {
        if (name == null) return "";
        String s = name.replaceAll("\\([^)]*\\)|\\[[^]]*]", " ")
                .replaceFirst("(?i)^\\s*skeli\\s*-\\s*", "")
                .replaceFirst("(?i)\\s(ft|feat)\\.?\\s.*$", "");
        s = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }

    /** The track with the same bare title, or null; a song by other artists ("JML - ...") does not match. */
    public static Track match(String songName, List<Track> tracks) {
        String key = baseName(songName);
        if (key.isEmpty()) return null;
        for (Track t : tracks) {
            if (key.equals(baseName(t.name()))) return t;
        }
        return null;
    }
}
