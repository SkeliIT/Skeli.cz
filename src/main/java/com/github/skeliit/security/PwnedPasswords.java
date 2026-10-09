package com.github.skeliit.security;

import com.github.skeliit.Config;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;

/**
 * Has a password appeared in known data breaches? Asks Have I Been Pwned with k-anonymity:
 * only the first 5 characters of the password's SHA-1 leave the server, the answer is every
 * breached hash with that prefix (padded with fakes) and the match happens here. When the
 * service can't be reached in time the password is let through (the other rules still apply).
 * PWNED_CHECK=false turns it off.
 */
public final class PwnedPasswords {
    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();

    private PwnedPasswords() {}

    /** How many times the password was seen in breaches; 0 when never, unknown or switched off. */
    public static int breachCount(String password) {
        if (password == null || password.isEmpty() || "false".equalsIgnoreCase(Config.get("PWNED_CHECK"))) return 0;
        try {
            String hash = HexFormat.of().withUpperCase()
                    .formatHex(MessageDigest.getInstance("SHA-1").digest(password.getBytes(StandardCharsets.UTF_8)));
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.pwnedpasswords.com/range/" + hash.substring(0, 5)))
                    .timeout(Duration.ofSeconds(3))
                    .header("Add-Padding", "true")
                    .header("User-Agent", "skeli.cz password check")
                    .GET().build();
            HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
            return resp.statusCode() == 200 ? countIn(resp.body(), hash.substring(5)) : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    /** The count for {@code suffix} in a range answer ("SUFFIX:COUNT" per line); padding lines have 0. */
    static int countIn(String body, String suffix) {
        if (body == null) return 0;
        for (String line : body.split("\r?\n")) {
            int colon = line.indexOf(':');
            if (colon > 0 && line.substring(0, colon).trim().equalsIgnoreCase(suffix)) {
                try {
                    return Integer.parseInt(line.substring(colon + 1).trim());
                } catch (NumberFormatException e) {
                    return 0;
                }
            }
        }
        return 0;
    }
}
