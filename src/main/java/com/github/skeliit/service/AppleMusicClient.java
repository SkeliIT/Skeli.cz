package com.github.skeliit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.ECDSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.interfaces.ECPrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;

public class AppleMusicClient {

    public record SongMatch(String id, String name, String releaseDate) {}
    public record AppleMusicLyrics(String ttml, String plainText) {}

    private final String teamId;
    private final String keyId;
    private final String privateKeyPem;
    private final String userToken;
    private final String storefront;
    private final String artistName;
    private final HttpClient http;
    private final ObjectMapper mapper;

    private volatile String cachedToken;
    private volatile long tokenExpiry;

    public AppleMusicClient(String teamId, String keyId, String privateKeyPem,
                            String userToken, String storefront, String artistName) {
        this.teamId = teamId;
        this.keyId = keyId;
        this.privateKeyPem = privateKeyPem;
        this.userToken = userToken;
        this.storefront = storefront;
        this.artistName = artistName;
        this.http = HttpClient.newHttpClient();
        this.mapper = new ObjectMapper();
    }

    private String devToken() throws Exception {
        long now = System.currentTimeMillis() / 1000;
        if (cachedToken != null && now < tokenExpiry - 60) return cachedToken;

        String pem = privateKeyPem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");
        byte[] keyBytes = Base64.getDecoder().decode(pem);
        ECPrivateKey privateKey = (ECPrivateKey) KeyFactory.getInstance("EC")
                .generatePrivate(new PKCS8EncodedKeySpec(keyBytes));

        long exp = now + 15_777_000L;
        JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.ES256).keyID(keyId).build();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(teamId)
                .issueTime(new Date(now * 1000))
                .expirationTime(new Date(exp * 1000))
                .build();
        SignedJWT jwt = new SignedJWT(header, claims);
        jwt.sign(new ECDSASigner(privateKey));

        cachedToken = jwt.serialize();
        tokenExpiry = exp;
        return cachedToken;
    }

    public SongMatch searchSong(String songName, Integer year) throws Exception {
        String query = URLEncoder.encode(artistName + " " + songName, StandardCharsets.UTF_8);
        String url = "https://api.music.apple.com/v1/catalog/" + storefront +
                "/search?types=songs&term=" + query + "&limit=5";

        String body = get(url, false);
        JsonNode data = mapper.readTree(body).path("results").path("songs").path("data");
        if (!data.isArray() || data.isEmpty()) return null;

        // Pick best match: prefer exact name match + year match
        String normalSong = normalize(songName);
        SongMatch best = null;
        int bestScore = -1;
        for (JsonNode item : data) {
            String id = item.path("id").asText(null);
            JsonNode attr = item.path("attributes");
            String name = attr.path("name").asText("");
            String artist = attr.path("artistName").asText("");
            String releaseDate = attr.path("releaseDate").asText("");

            int score = 0;
            if (normalize(name).contains(normalSong)) score += 2;
            if (normalize(artist).contains(normalize(artistName))) score += 1;
            if (year != null && releaseDate.startsWith(String.valueOf(year))) score += 2;

            if (score > bestScore) {
                bestScore = score;
                best = new SongMatch(id, name, releaseDate);
            }
        }
        return (bestScore >= 1) ? best : null;
    }

    public List<SongMatch> listArtistSongs(String artistId) throws Exception {
        List<SongMatch> all = new ArrayList<>();
        String url = "https://api.music.apple.com/v1/catalog/" + storefront +
                "/artists/" + artistId + "/relationships/songs?limit=100";
        while (url != null) {
            String body = get(url, false);
            JsonNode root = mapper.readTree(body);
            for (JsonNode item : root.path("data")) {
                String id = item.path("id").asText(null);
                if (id == null) continue;
                JsonNode attr = item.path("attributes");
                all.add(new SongMatch(id, attr.path("name").asText(""), attr.path("releaseDate").asText("")));
            }
            JsonNode next = root.path("next");
            url = (next.isMissingNode() || next.isNull() || next.asText("").isBlank())
                    ? null
                    : "https://api.music.apple.com" + next.asText();
        }
        return all;
    }

    public AppleMusicLyrics fetchLyrics(String appleMusicId) throws Exception {
        if (userToken == null || userToken.isBlank()) return null;
        String url = "https://api.music.apple.com/v1/catalog/" + storefront +
                "/songs/" + appleMusicId + "/lyrics";
        String body = get(url, true);
        JsonNode data = mapper.readTree(body).path("data");
        if (!data.isArray() || data.isEmpty()) return null;
        String ttml = data.get(0).path("attributes").path("ttml").asText(null);
        if (ttml == null || ttml.isBlank()) return null;
        return new AppleMusicLyrics(ttml, ttmlToPlainText(ttml));
    }

    private String get(String url, boolean withUserToken) throws Exception {
        HttpRequest.Builder req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer " + devToken())
                .header("Accept", "application/json")
                .GET();
        if (withUserToken) req.header("Music-User-Token", userToken);
        HttpResponse<String> resp = http.send(req.build(), HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) {
            throw new RuntimeException("Apple Music API error " + resp.statusCode() + ": " + resp.body());
        }
        return resp.body();
    }

    private static String ttmlToPlainText(String ttml) {
        try {
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setNamespaceAware(true);
            dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            Document doc = dbf.newDocumentBuilder().parse(new InputSource(new StringReader(ttml)));
            NodeList paragraphs = doc.getElementsByTagNameNS("*", "p");
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < paragraphs.getLength(); i++) {
                String text = paragraphs.item(i).getTextContent().trim();
                if (!text.isEmpty()) sb.append(text).append("\n");
            }
            return sb.toString().trim();
        } catch (Exception e) {
            // Strip XML tags as fallback
            return ttml.replaceAll("<[^>]+>", "").replaceAll("\\s+", " ").trim();
        }
    }

    public static String normalize(String s) {
        if (s == null) return "";
        return java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9 ]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
