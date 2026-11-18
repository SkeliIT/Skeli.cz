package com.github.skeliit.service;

import com.github.skeliit.Config;
import com.github.skeliit.EmailUtil;

import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Naléhavé nahlášení (nelegální obsah, ohrožení dítěte): v adminu jde nahoru a přijde na něj e-mail.
 * Text ani jména v e-mailu záměrně nejsou, jen odkaz do adminu. E-mail neprojde přes jiné ruce a neleží ve schránce.
 */
public final class UrgentReports {
    private static final Logger LOG = Logger.getLogger(UrgentReports.class.getName());
    private static final Set<String> URGENT = Set.of("illegal", "child");

    private UrgentReports() { }

    public static boolean isUrgent(String reason) {
        return reason != null && URGENT.contains(reason);
    }

    /** Pošle se na pozadí, aby na e-mail nečekal ten, kdo hlásí. Bez nastaveného SMTP jen záznam do logu. */
    public static void tellAdmin(String reason, String anchor) {
        if (!isUrgent(reason)) return;
        String to = Config.get("REPORT_EMAIL", "skelimc@seznam.cz");
        String base = Config.get("APP_BASE_URL", "https://www.skeli.cz");
        String text = "Někdo na " + base + " poslal naléhavé nahlášení: " + ("child".equals(reason) ? "ohrožení dítěte" : "nelegální obsah") + ".\n\n"
                + "Otevři to co nejdřív:\n" + base + "/admin_users.jsp#" + anchor + "\n\n"
                + "Text ani jména v e-mailu schválně nejsou. Postup je na té stránce.";
        Thread t = new Thread(() -> {
            try {
                if (EmailUtil.isConfigured()) EmailUtil.sendMail(to, "Skeli.cz: naléhavé nahlášení", text);
                else LOG.warning("Naléhavé nahlášení, ale SMTP není nastavené.");
            } catch (Exception e) {
                LOG.log(Level.SEVERE, "E-mail o naléhavém nahlášení se neodeslal", e);
            }
        }, "urgent-report-mail");
        t.setDaemon(true);
        t.start();
    }
}
