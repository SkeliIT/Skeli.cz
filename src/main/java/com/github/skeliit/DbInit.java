package com.github.skeliit;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;

/** Registers the MariaDB driver when the site starts and closes the connection pool when it stops. */
public class DbInit implements ServletContextListener {
    @Override
    public void contextInitialized(ServletContextEvent sce) {
        try {
            // the container's DriverManager does not always see a driver inside the web app
            Class.forName("org.mariadb.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            sce.getServletContext().log("MariaDB driver not found", e);
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        Db.shutdown(); // no connections left behind on a restart or redeploy
    }
}
