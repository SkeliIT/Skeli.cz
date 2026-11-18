package com.github.skeliit.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Denní otisky návštěv (V140 + VisitStats.rollUp): uzavřené dny se změní na počet lidí a otisky zmizí, počty po dnech
 * zůstanou přesně stejné. MAŽE historické otisky – spouštět jen proti KOPII databáze:
 * {@code mvn test -Dtest=VisitRollUpIT -Dit.dbUrl=jdbc:mariadb://localhost:3306/skeliweb_kopie}. Bez it.dbUrl s „kopie“ se nespustí.
 */
class VisitRollUpIT {
    private static final String URL = System.getProperty("it.dbUrl", "");
    private Connection c;
    private final LocalDate today = LocalDate.now(ZoneId.of("Europe/Prague"));

    @BeforeEach void open() throws SQLException {
        assertTrue(URL.contains("kopie"), "test maže otisky – spouštěj jen proti kopii databáze (-Dit.dbUrl=…skeliweb_kopie)");
        c = DriverManager.getConnection(URL, System.getProperty("it.dbUser", "Skeli"), System.getProperty("it.dbPass", "skeli"));
    }

    @AfterEach void close() throws SQLException { c.close(); }

    private Map<LocalDate, Long> peopleByDay() throws SQLException {
        Map<LocalDate, Long> out = new TreeMap<>();
        try (PreparedStatement ps = c.prepareStatement("SELECT day, SUM(n) FROM " + VisitStats.PEOPLE_BY_DAY + " p GROUP BY day");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) out.put(rs.getObject(1, LocalDate.class), rs.getLong(2));
        }
        return out;
    }

    private long count(String sql) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setObject(1, today.minusDays(1));
            try (ResultSet rs = ps.executeQuery()) { rs.next(); return rs.getLong(1); }
        }
    }

    private void visitor(LocalDate day, String id) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("INSERT IGNORE INTO visit_days (day, visitor) VALUES (?, ?)")) {
            ps.setObject(1, day);
            ps.setString(2, id);
            ps.executeUpdate();
        }
    }

    @Test void closedDaysBecomeCountsAndNothingIsLost() throws Exception {
        // k historickým otiskům z kopie přidat dny se známým počtem, včetně dneška a včerejška
        for (int i = 0; i < 3; i++) visitor(today.minusDays(40), "test-a" + i);
        for (int i = 0; i < 2; i++) visitor(today.minusDays(2), "test-b" + i);
        visitor(today.minusDays(1), "test-y");
        visitor(today, "test-t");
        Map<LocalDate, Long> before = peopleByDay();
        long yesterdayRows = count("SELECT COUNT(*) FROM visit_days WHERE day = ?");

        VisitStats.rollUp(c, today);

        assertEquals(before, peopleByDay(), "počet lidí po dnech je po úklidu stejný");
        assertEquals(0, count("SELECT COUNT(*) FROM visit_days WHERE day < ?"), "otisky uzavřených dnů jsou pryč");
        assertEquals(yesterdayRows, count("SELECT COUNT(*) FROM visit_days WHERE day = ?"), "včerejšek zůstává jako otisky");
        assertTrue(before.get(today) >= 1, "dnešek zůstává");
        assertEquals(3L, before.get(today.minusDays(40)), "známý počet");

        // opakované spuštění (třeba po restartu) nic nezmění
        VisitStats.rollUp(c, today);
        assertEquals(before, peopleByDay(), "druhý úklid nic nezměnil");
    }

    @Test void lateVisitorsOfAClosedDayAreAdded() throws Exception {
        LocalDate day = today.minusDays(20);
        for (int i = 0; i < 4; i++) visitor(day, "test-l" + i);
        VisitStats.rollUp(c, today);
        long closed = peopleByDay().get(day);
        // pozdní otisky do už uzavřeného dne (požadavek přes půlnoc, změna hodin) se přičtou, nepřepíšou součet
        visitor(day, "test-pozde1");
        visitor(day, "test-pozde2");
        assertEquals(closed + 2, peopleByDay().get(day), "před úklidem: součet + pozdní otisky");
        VisitStats.rollUp(c, today);
        assertEquals(closed + 2, peopleByDay().get(day), "po úklidu se pozdní otisky přičetly");
        VisitStats.rollUp(c, today);
        assertEquals(closed + 2, peopleByDay().get(day), "další úklid nic nezměnil");
    }

    @Test void concurrentRollUpsKeepTheCounts() throws Exception {
        for (int i = 0; i < 5; i++) visitor(today.minusDays(10), "test-c" + i);
        Map<LocalDate, Long> before = peopleByDay();
        ExecutorService pool = Executors.newFixedThreadPool(3);
        try {
            Future<?>[] runs = new Future<?>[3];
            for (int i = 0; i < runs.length; i++) runs[i] = pool.submit(() -> {
                try (Connection own = DriverManager.getConnection(URL, System.getProperty("it.dbUser", "Skeli"), System.getProperty("it.dbPass", "skeli"))) {
                    VisitStats.rollUp(own, today);
                }
                return null;
            });
            for (Future<?> f : runs) f.get();
        } finally {
            pool.shutdownNow();
        }
        assertEquals(before, peopleByDay(), "souběžné úklidy počty nezměnily");
    }
}
