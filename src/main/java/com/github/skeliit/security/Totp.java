package com.github.skeliit.security;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Map;

/**
 * Two-factor sign-in codes (TOTP, RFC 6238 – what Google Authenticator, Microsoft Authenticator, Aegis… show):
 * a shared key in Base32, a 6-digit code every 30 seconds from HMAC-SHA1. A code is accepted one step before and
 * after (clocks drift), and never twice (the caller keeps the last step used). The QR code for the app is drawn
 * here as an SVG, so the key never leaves our server.
 */
public final class Totp {
    public static final int DIGITS = 6;
    public static final long STEP_SECONDS = 30;
    private static final String BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final SecureRandom RANDOM = new SecureRandom();

    private Totp() {}

    /** A new shared key: 20 random bytes (160 bits, as RFC 4226 recommends) in Base32. */
    public static String newSecret() {
        byte[] b = new byte[20];
        RANDOM.nextBytes(b);
        return base32(b);
    }

    /** The current 30-second step. */
    public static long step(long epochMillis) {
        return Math.floorDiv(epochMillis / 1000, STEP_SECONDS);
    }

    /** The code for one step. */
    public static String code(String secret, long step) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(unbase32(secret), "HmacSHA1"));
            byte[] h = mac.doFinal(ByteBuffer.allocate(8).putLong(step).array());
            int o = h[h.length - 1] & 0x0f;
            int bin = ((h[o] & 0x7f) << 24) | ((h[o + 1] & 0xff) << 16) | ((h[o + 2] & 0xff) << 8) | (h[o + 3] & 0xff);
            return String.format("%0" + DIGITS + "d", bin % (int) Math.pow(10, DIGITS));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    /**
     * The step the code belongs to (now, one before or one after), or -1 when it is wrong or was already used
     * (its step is not after lastStep).
     */
    public static long verify(String secret, String code, long nowMillis, long lastStep) {
        if (secret == null || code == null) return -1;
        String c = code.replaceAll("\\s", "");
        if (!c.matches("\\d{" + DIGITS + "}")) return -1;
        long now = step(nowMillis);
        for (long s = now - 1; s <= now + 1; s++) {
            if (s > lastStep && constantTimeEquals(code(secret, s), c)) return s;
        }
        return -1;
    }

    /** The link the authenticator app reads from the QR code: otpauth://totp/Skeli.cz:name?secret=…&issuer=Skeli.cz */
    public static String otpauthUri(String account, String secret) {
        String label = enc("Skeli.cz:" + account);
        return "otpauth://totp/" + label + "?secret=" + secret + "&issuer=" + enc("Skeli.cz") + "&digits=" + DIGITS + "&period=" + STEP_SECONDS;
    }

    /** A QR code of the text as an SVG (black squares on white, a quiet zone round it). */
    public static String qrSvg(String text) {
        try {
            BitMatrix m = new QRCodeWriter().encode(text, BarcodeFormat.QR_CODE, 0, 0,
                    Map.of(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M, EncodeHintType.MARGIN, 2));
            int w = m.getWidth(), h = m.getHeight();
            StringBuilder p = new StringBuilder();
            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    if (m.get(x, y)) p.append('M').append(x).append(' ').append(y).append("h1v1h-1z");
                }
            }
            return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 " + w + " " + h + "\" shape-rendering=\"crispEdges\">"
                    + "<rect width=\"" + w + "\" height=\"" + h + "\" fill=\"#fff\"/><path d=\"" + p + "\" fill=\"#000\"/></svg>";
        } catch (WriterException e) {
            throw new IllegalStateException(e);
        }
    }

    /** The key in groups of four, for typing it into the app by hand. */
    public static String grouped(String secret) {
        return secret.replaceAll("(.{4})(?!$)", "$1 ");
    }

    static String base32(byte[] data) {
        StringBuilder out = new StringBuilder();
        int buffer = 0, bits = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xff);
            bits += 8;
            while (bits >= 5) {
                out.append(BASE32.charAt((buffer >> (bits - 5)) & 31));
                bits -= 5;
            }
        }
        if (bits > 0) out.append(BASE32.charAt((buffer << (5 - bits)) & 31));
        return out.toString();
    }

    static byte[] unbase32(String s) {
        String c = s.replaceAll("[\\s=]", "").toUpperCase();
        ByteBuffer out = ByteBuffer.allocate(c.length() * 5 / 8);
        int buffer = 0, bits = 0;
        for (char ch : c.toCharArray()) {
            int v = BASE32.indexOf(ch);
            if (v < 0) throw new IllegalArgumentException("not Base32");
            buffer = (buffer << 5) | v;
            bits += 5;
            if (bits >= 8) {
                out.put((byte) (buffer >> (bits - 8)));
                bits -= 8;
            }
        }
        return out.array();
    }

    private static boolean constantTimeEquals(String a, String b) {
        return java.security.MessageDigest.isEqual(a.getBytes(StandardCharsets.US_ASCII), b.getBytes(StandardCharsets.US_ASCII));
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
