package com.github.skeliit;

import io.github.cdimascio.dotenv.Dotenv;

/** Reads configuration from a .env file, falling back to system environment variables. */
public final class Config {
    private static final Dotenv dotenv;

    static {
        Dotenv env = null;
        try {
            env = Dotenv.configure().ignoreIfMissing().load();
        } catch (Exception e) {
            // Fallback: will use system environment
        }
        dotenv = env;
    }

    private Config() {}

    public static String get(String key, String defaultValue) {
        if (dotenv != null) {
            String val = dotenv.get(key);
            if (val != null) return val;
        }
        String val = System.getenv(key);
        if (val != null) return val;
        return defaultValue;
    }

    public static String get(String key) {
        return get(key, null);
    }
}
