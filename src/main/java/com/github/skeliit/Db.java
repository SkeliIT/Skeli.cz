package com.github.skeliit;

import io.github.cdimascio.dotenv.Dotenv;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public final class Db {
    private static final Dotenv dotenv;
    private static final String URL;
    private static final String USER;
    private static final String PASS;
    
    static {
        // Try to load .env file, with fallback to system environment variables
        Dotenv env = null;
        try {
            env = Dotenv.configure().ignoreIfMissing().load();
        } catch (Exception e) {
            // Fallback: will use system environment
        }
        dotenv = env;
        
        // Get credentials from .env or system environment
        URL = getEnv("DB_URL", "jdbc:mariadb://127.0.0.1:3306/skeliweb?useUnicode=true&characterEncoding=utf8mb4");
        USER = getEnv("DB_USER", "skeli");
        PASS = getEnv("DB_PASS", null);
    }
    
    private static String getEnv(String key, String defaultValue) {
        if (dotenv != null) {
            String val = dotenv.get(key);
            if (val != null) return val;
        }
        String val = System.getenv(key);
        if (val != null) return val;
        return defaultValue;
    }
    
    private Db() {}
    
    public static Connection get() throws SQLException { 
        return DriverManager.getConnection(URL, USER, PASS); 
    }
}
