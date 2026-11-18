package com.github.skeliit.job;

import com.github.skeliit.dao.PremiereDao;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

import java.sql.SQLException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Premiéry: každých 15 s zkontroluje, jestli nenastal čas některé premiéry, a její video zveřejní
 * (PremiereDao.publishDue). Hned po startu taky – kdyby se server restartoval přesně v čas premiéry,
 * zveřejní se při startu. Stejnou kontrolu dělá i /api/premiere, takže zpoždění jobu nevadí.
 */
@WebListener
public class PremiereJob implements ServletContextListener {
    private ScheduledExecutorService scheduler;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "premiere");
            t.setDaemon(true);
            return t;
        });
        scheduler.scheduleWithFixedDelay(() -> {
            try {
                int n = new PremiereDao().publishDue();
                if (n > 0) sce.getServletContext().log("Premiéra: zveřejněno videí " + n);
            } catch (SQLException | RuntimeException e) {
                sce.getServletContext().log("Premiéra: zveřejnění se nepovedlo, zkusí se znovu", e);
            }
        }, 3, 15, TimeUnit.SECONDS);
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        if (scheduler != null) scheduler.shutdownNow();
    }
}
