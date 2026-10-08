package com.github.skeliit;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.sql.Connection;
import java.sql.SQLException;

/**
 * Database connections from a pool (HikariCP): a connection is reused instead of opened for every
 * query, and when many people come at once they wait a moment for a free one instead of
 * overloading MariaDB. Callers close connections as before (try-with-resources) – that returns
 * them to the pool.
 */
public final class Db {
    private static final String URL = Config.get("DB_URL", "jdbc:mariadb://127.0.0.1:3306/skeliweb?useUnicode=true&characterEncoding=utf8mb4");
    private static final String USER = Config.get("DB_USER", "skeli");
    private static final String PASS = Config.get("DB_PASS");

    private static volatile HikariDataSource pool;

    private Db() {}

    public static Connection get() throws SQLException {
        HikariDataSource p = pool;
        if (p == null) {
            synchronized (Db.class) {
                if (pool == null) pool = create();
                p = pool;
            }
        }
        return p.getConnection();
    }

    private static HikariDataSource create() {
        HikariConfig c = new HikariConfig();
        c.setPoolName("skeli-db");
        c.setDriverClassName("org.mariadb.jdbc.Driver");
        c.setJdbcUrl(URL);
        c.setUsername(USER);
        c.setPassword(PASS);
        c.setMaximumPoolSize(Integer.parseInt(Config.get("DB_POOL_SIZE", "12")));
        c.setMinimumIdle(2);
        c.setConnectionTimeout(10_000);        // wait at most 10 s for a free connection
        c.setMaxLifetime(25 * 60_000L);        // renew before the database would drop idle ones
        c.setLeakDetectionThreshold(60_000);   // log code that keeps a connection over a minute
        // the database may still be starting with the app: don't fail here, the first query will tell
        c.setInitializationFailTimeout(-1);
        return new HikariDataSource(c);
    }

    /** Closes the pool when the web app stops (DbInit), so a redeploy leaves no connections behind. */
    static void shutdown() {
        HikariDataSource p = pool;
        pool = null;
        if (p != null) p.close();
    }
}
