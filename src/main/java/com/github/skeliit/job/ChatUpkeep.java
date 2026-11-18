package com.github.skeliit.job;

import com.github.skeliit.dao.ChatDao;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

import java.sql.SQLException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Údržba zpráv: minutu po startu a pak jednou denně. Dosud nezašifrované zprávy a klíče 2FA zašifruje (jakmile je na serveru klíč)
 * a smaže zprávy starší než rok. Co se nesmaže hned, zůstane do dalšího dne, takže výpadek nevadí.
 */
@WebListener
public class ChatUpkeep implements ServletContextListener {
    private ScheduledExecutorService scheduler;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "chat-upkeep");
            t.setDaemon(true);
            return t;
        });
        scheduler.scheduleWithFixedDelay(() -> {
            try {
                ChatDao chat = new ChatDao();
                int sealed = chat.sealOldMessages() + new com.github.skeliit.dao.TwoFactorDao().sealOldSecrets();
                int removed = chat.deleteExpired();
                if (sealed > 0 || removed > 0) sce.getServletContext().log("Zprávy: zašifrováno " + sealed + ", smazáno starých " + removed);
            } catch (SQLException | RuntimeException e) {
                sce.getServletContext().log("Údržba zpráv se nepovedla", e);
            }
        }, 1, 24 * 60, TimeUnit.MINUTES);
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        if (scheduler != null) scheduler.shutdownNow();
    }
}
