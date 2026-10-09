package com.github.skeliit.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/** One-time tokens (password reset, e-mail check, newsletter) are stored only as a hash. */
public final class Tokens {
    private Tokens() {}

    /** SHA-256 hex of a token, so a DB leak does not expose usable links. */
    public static String hash(String token) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(d);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
