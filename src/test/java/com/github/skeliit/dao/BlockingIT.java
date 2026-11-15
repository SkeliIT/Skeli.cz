package com.github.skeliit.dao;

import com.github.skeliit.model.CommentItem;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Blokování platí všude (audit 13. 11. 2026, nález C2): od zablokovaného nepřijde nic do zvonečku a ten, kdo
 * blokoval, jeho komentáře nevidí. Zablokovaný ani ostatní nic nepoznají (komentář vidí dál).
 * Jen proti lokální databázi, bez prohlížeče: {@code mvn test -Dtest=BlockingIT}. Po sobě uklidí.
 */
class BlockingIT {
    private Connection c;
    private int me, pest, lyricId;
    private final NotificationDao bell = new NotificationDao();

    @BeforeEach void setUp() throws SQLException {
        c = DriverManager.getConnection(System.getProperty("it.dbUrl", "jdbc:mariadb://localhost:3306/skeliweb"),
                System.getProperty("it.dbUser", "Skeli"), System.getProperty("it.dbPass", "skeli"));
        me = user();
        pest = user();
        try (Statement st = c.createStatement(); ResultSet rs = st.executeQuery("SELECT MIN(id) FROM lyrics")) {
            rs.next(); lyricId = rs.getInt(1);
        }
        assertTrue(lyricId > 0, "lokální databáze nemá žádný text písně");
    }

    @AfterEach void cleanUp() throws SQLException {
        for (int id : new int[] { me, pest }) {
            run("DELETE FROM notifications WHERE user_id = ? OR actor_id = ?", id, id);
            run("DELETE FROM user_blocks WHERE blocker_id = ? OR blocked_id = ?", id, id);
            run("DELETE FROM comments WHERE user_id = ?", id);
        }
        run("DELETE FROM users WHERE id IN (?, ?)", me, pest);
        c.close();
    }

    @Test void nothingReachesTheBellFromABlockedPerson() throws SQLException {
        int comment = comment(pest);
        block(me, pest);
        bell.add(me, "reply", CommentDao.Kind.LYRIC, comment, pest);
        bell.addFriend(me, pest, "friend_request");
        bell.addPassed(me, pest, "score|2|10|3");
        assertEquals(0, notificationsFor(me), "od zablokovaného se do zvonečku nic nezapíše");
        // ani opačným směrem: zablokovaný nedostane upozornění od toho, kdo ho blokoval
        bell.add(pest, "reply", CommentDao.Kind.LYRIC, comment(me), me);
        assertEquals(0, notificationsFor(pest));
    }

    @Test void olderNotificationsDisappearAfterTheBlock() throws SQLException {
        int comment = comment(pest);
        bell.add(me, "reply", CommentDao.Kind.LYRIC, comment, pest);
        assertEquals(1, bell.unread(me));
        block(me, pest);
        assertEquals(0, bell.unread(me), "počet ve zvonečku nepočítá zablokovaného");
        assertTrue(bell.latest(me, 20).isEmpty(), "ve zvonečku se zablokovaný neukáže");
    }

    @Test void onlyTheBlockerStopsSeeingTheComments() throws SQLException {
        int comment = comment(pest);
        block(me, pest);
        CommentDao dao = new CommentDao();
        String target = String.valueOf(lyricId);
        assertFalse(has(dao.threads(CommentDao.Kind.LYRIC, target, new CommentDao.Viewer(me, false, false), CommentDao.Sort.NEW), comment),
                "kdo blokoval, komentář zablokovaného nevidí");
        assertTrue(has(dao.threads(CommentDao.Kind.LYRIC, target, new CommentDao.Viewer(pest, false, false), CommentDao.Sort.NEW), comment),
                "zablokovaný svůj komentář vidí dál – nic nepozná");
        assertTrue(has(dao.threads(CommentDao.Kind.LYRIC, target, CommentDao.Viewer.ANONYMOUS, CommentDao.Sort.NEW), comment),
                "ostatní komentář vidí");
    }

    // --- pomocné ---

    private static boolean has(List<CommentItem> threads, int id) {
        for (CommentItem t : threads) {
            if (t.id == id) return true;
            for (CommentItem r : t.replies) if (r.id == id) return true;
        }
        return false;
    }

    private int user() throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(
                "INSERT INTO users (username, email, password_hash, role, created_at, email_verified_at) VALUES (?, ?, '$2a$12$x', 'USER', NOW(), NOW())",
                Statement.RETURN_GENERATED_KEYS)) {
            String u = "blok_" + UUID.randomUUID().toString().substring(0, 8);
            ps.setString(1, u);
            ps.setString(2, u + "@example.com");
            ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) { k.next(); return k.getInt(1); }
        }
    }

    private int comment(int author) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(
                "INSERT INTO comments (lyric_id, user_id, content, created_at) VALUES (?, ?, 'zkouška blokování', NOW())",
                Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, lyricId);
            ps.setInt(2, author);
            ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) { k.next(); return k.getInt(1); }
        }
    }

    private void block(int blocker, int blocked) throws SQLException {
        run("INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)", blocker, blocked);
    }

    private int notificationsFor(int user) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("SELECT COUNT(*) FROM notifications WHERE user_id = ?")) {
            ps.setInt(1, user);
            try (ResultSet rs = ps.executeQuery()) { rs.next(); return rs.getInt(1); }
        }
    }

    private void run(String sql, int... args) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            for (int i = 0; i < args.length; i++) ps.setInt(i + 1, args[i]);
            ps.executeUpdate();
        }
    }
}
