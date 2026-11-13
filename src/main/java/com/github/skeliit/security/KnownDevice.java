package com.github.skeliit.security;

import com.github.skeliit.Config;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * „Známé zařízení“: prohlížeč, ve kterém se člověk už úspěšně přihlásil, dostane podepsanou cookie (číslo účtu + podpis).
 * Když někdo útočí na účet z mnoha adres a narazí na limit pro celý účet, majitel se ze svého prohlížeče dostane dál
 * (audit C8: dřív šlo cizí účet zamknout na 15 minut). Cookie nic neotevírá, heslo je potřeba vždy.
 * Podpis je HMAC-SHA256 klíčem odvozeným z DATA_KEY; bez klíče se cookie nedává ani neuznává.
 */
public final class KnownDevice {
    static final String COOKIE = "skeliKnown";
    private static final int YEAR = 60 * 60 * 24 * 365;
    private static final byte[] SECRET = derive(Config.get("DATA_KEY"));

    private KnownDevice() {}

    /** Klíč pro podpis odvozený z DATA_KEY (jiný účel = jiný klíč); null bez DATA_KEY. */
    static byte[] derive(String dataKey) {
        if (dataKey == null || dataKey.isBlank()) return null;
        return hmac(dataKey.strip().getBytes(StandardCharsets.UTF_8), "skeli-known-device-v1");
    }

    /** Hodnota cookie pro účet: "id.podpis"; null bez klíče. */
    static String value(byte[] secret, int userId) {
        if (secret == null) return null;
        String sig = Base64.getUrlEncoder().withoutPadding().encodeToString(hmac(secret, "known:" + userId));
        return userId + "." + sig;
    }

    /** Patří cookie (podepsaná naším klíčem) přesně tomuhle účtu? */
    static boolean matches(byte[] secret, String cookie, int userId) {
        String expected = value(secret, userId);
        return expected != null && cookie != null
                && MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), cookie.getBytes(StandardCharsets.UTF_8));
    }

    /** Přihlásil se tenhle prohlížeč do účtu už někdy úspěšně? */
    public static boolean isKnown(HttpServletRequest req, int userId) {
        Cookie[] all = req.getCookies();
        if (all != null) for (Cookie c : all) if (COOKIE.equals(c.getName()) && matches(SECRET, c.getValue(), userId)) return true;
        return false;
    }

    /** Po úspěšném přihlášení heslem si prohlížeč zapamatuje účet (rok). */
    public static void remember(HttpServletRequest req, HttpServletResponse resp, int userId) {
        String v = value(SECRET, userId);
        if (v == null) return;
        Cookie c = new Cookie(COOKIE, v);
        c.setHttpOnly(true);
        c.setSecure(req.isSecure() || com.github.skeliit.filter.SecurityHeadersFilter.httpsOnly());
        c.setComment("__SAME_SITE_LAX__");   // Jetty pošle SameSite=Lax
        c.setPath("/");
        c.setMaxAge(YEAR);
        resp.addCookie(c);
    }

    private static byte[] hmac(byte[] key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
