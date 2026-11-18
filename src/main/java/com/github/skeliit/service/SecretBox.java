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
 * Šifrování textu v databázi (zprávy, klíče 2FA; AES-256-GCM) klíčem DATA_KEY z .env. Kdo získá jen databázi nebo její zálohu, nepřečte je.
 * Správce serveru, který má i .env, by je přečíst uměl: není to šifrování mezi dvěma telefony.
 * Bez platného klíče se citlivý text NEULOŽÍ (seal vyhodí chybu) – nikdy ne potichu jako čitelný text (audit B2).
 * Starý nezašifrovaný text z doby před klíčem jde číst dál a job/ChatUpkeep ho dodatečně zašifruje.
 * {@link #health()} ověří i to, že klíč je ten správný (kontrolní text v app_settings); /healthz to hlásí a nasazení
 * bez klíče nebo se špatným klíčem se vrátí zpět.
 * Pozor: když se klíč ztratí, zašifrované zprávy už nikdo nepřečte. Klíč proto patří i mimo server.
 */
public final class SecretBox {
    private static final Logger LOG = Logger.getLogger(SecretBox.class.getName());
    static final String PREFIX = "gcm1:";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final SecretKeySpec KEY = readKey(Config.get("DATA_KEY"));

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
        LOG.severe("DATA_KEY nemá 32 bajtů v base64, zprávy se nešifrují.");
        return null;
    }

    public static boolean enabled() {
        return KEY != null;
    }

    /** Text, který se při prvním startu s klíčem zašifruje do app_settings; jiný klíč ho pak nepřečte. */
    static final String CHECK_TEXT = "skeli-data-key-ok";
    private static volatile String health;   // null = ještě nezjištěno, "ok" = v pořádku, jinak důvod

    /**
     * Je šifrování v pořádku? "ok", "missing" (klíč chybí nebo nemá 32 bajtů) nebo "mismatch" (klíč je jiný než ten,
     * kterým se šifrovalo dřív – staré zprávy by nešly přečíst). Výsledek se pamatuje; chyba databáze se nepamatuje.
     */
    public static String health() {
        String h = health;
        if (h != null) return h;
        if (KEY == null) return health = "missing";
        try (java.sql.Connection c = com.github.skeliit.Db.get()) {
            return health = check(c, KEY, "data_key_check");
        } catch (java.sql.SQLException e) {
            LOG.log(Level.WARNING, "Kontrola DATA_KEY: databáze nejde přečíst: {0}", e.getMessage());
            return "db";
        }
    }

    /** Porovná klíč s kontrolním textem v app_settings (první start s klíčem ho tam uloží). */
    static String check(java.sql.Connection c, SecretKeySpec key, String name) throws java.sql.SQLException {
        String stored = null;
        try (java.sql.PreparedStatement ps = c.prepareStatement("SELECT v FROM app_settings WHERE k = ?")) {
            ps.setString(1, name);
            try (java.sql.ResultSet rs = ps.executeQuery()) {
                if (rs.next()) stored = rs.getString(1);
            }
        }
        if (stored == null) {
            try (java.sql.PreparedStatement ps = c.prepareStatement("INSERT IGNORE INTO app_settings (k, v) VALUES (?, ?)")) {
                ps.setString(1, name);
                ps.setString(2, seal(CHECK_TEXT, key));
                ps.executeUpdate();
            }
            return "ok";
        }
        if (CHECK_TEXT.equals(open(stored, key))) return "ok";
        LOG.severe("DATA_KEY nesedí s klíčem, kterým se dřív šifrovalo – staré zprávy by nešly přečíst.");
        return "mismatch";
    }

    public static boolean isSealed(String stored) {
        return stored != null && stored.startsWith(PREFIX);
    }

    /** Zašifruje text. Prázdný text (smazaná zpráva) zůstane prázdný. Bez klíče chyba: citlivý text se neuloží čitelně. */
    public static String seal(String plain) {
        return seal(plain, KEY);
    }

    static String seal(String plain, SecretKeySpec key) {
        if (plain == null || plain.isEmpty()) return plain;
        if (key == null) throw new IllegalStateException("DATA_KEY chybí nebo je špatný: citlivý text se neuloží nešifrovaně");
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
            LOG.warning("Zašifrovaný text, ale DATA_KEY chybí.");
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
