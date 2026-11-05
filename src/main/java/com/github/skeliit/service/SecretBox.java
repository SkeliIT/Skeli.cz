package com.github.skeliit.service;

import com.github.skeliit.Config;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Šifrování textu v databázi (AES-256-GCM) klíčem CHAT_KEY z .env. Kdo získá jen databázi nebo její zálohu, zprávy nepřečte.
 * Správce serveru, který má i .env, by je přečíst uměl: není to šifrování mezi dvěma telefony.
 * Bez klíče (lokální vývoj, server před doplněním klíče) se text ukládá tak, jak je, a starý nezašifrovaný text jde číst dál.
 * Pozor: když se klíč ztratí, zašifrované zprávy už nikdo nepřečte. Klíč proto patří i mimo server.
 */
public final class SecretBox {
    private static final Logger LOG = Logger.getLogger(SecretBox.class.getName());
    static final String PREFIX = "gcm1:";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final SecretKeySpec KEY = readKey(Config.get("CHAT_KEY"));

    private SecretBox() { }

    /** Klíč je 32 bajtů v base64 (openssl rand -base64 32); špatný klíč je jako žádný a řekne se to do logu. */
    static SecretKeySpec readKey(String base64) {
        if (base64 == null || base64.isBlank()) return null;
        try {
            byte[] raw = Base64.getDecoder().decode(base64.strip());
            if (raw.length == 32) return new SecretKeySpec(raw, "AES");
        } catch (IllegalArgumentException e) {
            // níž se zaloguje
        }
        LOG.severe("CHAT_KEY nemá 32 bajtů v base64, zprávy se nešifrují.");
        return null;
    }

    public static boolean enabled() {
        return KEY != null;
    }

    public static boolean isSealed(String stored) {
        return stored != null && stored.startsWith(PREFIX);
    }

    /** Zašifruje text. Prázdný text (smazaná zpráva) a text bez klíče zůstanou, jak jsou. */
    public static String seal(String plain) {
        return seal(plain, KEY);
    }

    static String seal(String plain, SecretKeySpec key) {
        if (key == null || plain == null || plain.isEmpty()) return plain;
        try {
            byte[] iv = new byte[IV_BYTES];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            byte[] data = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            byte[] all = new byte[iv.length + data.length];
            System.arraycopy(iv, 0, all, 0, iv.length);
            System.arraycopy(data, 0, all, iv.length, data.length);
            return PREFIX + Base64.getEncoder().encodeToString(all);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Šifrování selhalo", e);
        }
    }

    /** Přečte uložený text. Starý nezašifrovaný vrátí, jak je; co nejde rozšifrovat (jiný klíč), je prázdné a v logu. */
    public static String open(String stored) {
        return open(stored, KEY);
    }

    static String open(String stored, SecretKeySpec key) {
        if (!isSealed(stored)) return stored;
        if (key == null) {
            LOG.warning("Zašifrovaný text, ale CHAT_KEY chybí.");
            return "";
        }
        try {
            byte[] all = Base64.getDecoder().decode(stored.substring(PREFIX.length()));
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, all, 0, IV_BYTES));
            return new String(cipher.doFinal(all, IV_BYTES, all.length - IV_BYTES), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            LOG.log(Level.WARNING, "Text nejde rozšifrovat: {0}", e.getClass().getSimpleName());
            return "";
        }
    }
}
