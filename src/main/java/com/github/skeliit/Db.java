package com.github.skeliit;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public final class Db {
    private static final String URL = Config.get("DB_URL", "jdbc:mariadb://127.0.0.1:3306/skeliweb?useUnicode=true&characterEncoding=utf8mb4");
    private static final String USER = Config.get("DB_USER", "skeli");
    private static final String PASS = Config.get("DB_PASS");

    private Db() {}

    public static Connection get() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASS);
    }
}
