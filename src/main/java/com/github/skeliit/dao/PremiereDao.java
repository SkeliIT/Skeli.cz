package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.model.Premiere;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;

/** Premiéry písní a klipů (V95): nastavení v adminu a co ukázat na webu. */
public class PremiereDao {
    /** Jak dlouho po premiéře ještě úvod hlásí „Venku!“ (3 dny). */
    public static final long SHOW_AFTER_MS = 3L * 24 * 3600 * 1000;

    private static final String SELECT = "SELECT s.id, s.uuid, s.name, s.release_kind, "
            // obrázek: nejnovější klip, jinak vlastní obrázek písně
            + "COALESCE((SELECT CONCAT('/yt-thumb/', v.youtube_id, '/mqdefault.jpg') FROM videos v WHERE v.song_id = s.id "
            + "ORDER BY v.published_at DESC, v.id DESC LIMIT 1), s.preview_image_url), s.release_at FROM songs s ";

    /** Premiéra pro úvod: nejbližší budoucí, jinak ta, která vyšla v posledních 3 dnech; nebo null. */
    public Premiere forHome() throws SQLException {
        long now = System.currentTimeMillis();
        try (Connection c = Db.get()) {
            Premiere p = one(c, SELECT + "WHERE s.release_at >= ? ORDER BY s.release_at ASC LIMIT 1", now);
            return p != null ? p : one(c, SELECT + "WHERE s.release_at >= ? ORDER BY s.release_at DESC LIMIT 1", now - SHOW_AFTER_MS);
        }
    }

    /**
     * Premiéra pro stránku /premiera: nejbližší budoucí, jinak poslední proběhlá (bez omezení stáří –
     * stránka pak slouží jako záznam); nebo null, když žádná premiéra nikdy nebyla.
     */
    public Premiere forPage() throws SQLException {
        long now = System.currentTimeMillis();
        try (Connection c = Db.get()) {
            Premiere p = one(c, SELECT + "WHERE s.release_at >= ? ORDER BY s.release_at ASC LIMIT 1", now);
            return p != null ? p : one(c, SELECT + "WHERE s.release_at IS NOT NULL AND s.release_at < ? ORDER BY s.release_at DESC LIMIT 1", now);
        }
    }

    /** Premiéra jedné písně (i už proběhlá), nebo null. */
    public Premiere forSong(int songId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(SELECT + "WHERE s.id = ? AND s.release_at IS NOT NULL")) {
            ps.setInt(1, songId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? map(rs) : null; }
        }
    }

    /** Admin: nastaví premiéru (at = epoch ms, kind clip|song), nebo ji zruší (at = null). */
    public void set(int songId, Long at, String kind) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE songs SET release_at = ?, release_kind = ? WHERE id = ?")) {
            if (at == null) { ps.setNull(1, Types.BIGINT); ps.setNull(2, Types.VARCHAR); }
            else { ps.setLong(1, at); ps.setString(2, "song".equals(kind) ? "song" : "clip"); }
            ps.setInt(3, songId);
            ps.executeUpdate();
        }
    }

    // ---------- premiérové video (V143): do premiéry jen v songs.premiere_video_id, nikde veřejně ----------

    /** Admin: uloží odkaz na neveřejné video, které se v okamžiku premiéry objeví u písně (null = odebrat). */
    public void setVideo(int songId, String youtubeId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE songs SET premiere_video_id = ?, premiere_video_done = 0 WHERE id = ?")) {
            ps.setString(1, youtubeId);
            ps.setInt(2, songId);
            ps.executeUpdate();
        }
    }

    /** Admin: video čekající na premiéru (ještě nezveřejněné), nebo null. Nikdy nepoužívat pro veřejné stránky. */
    public String pendingVideo(int songId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT premiere_video_id FROM songs WHERE id = ? AND premiere_video_done = 0")) {
            ps.setInt(1, songId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getString(1) : null; }
        }
    }

    /**
     * Čeká tohle video na premiéru? Každé místo, které přidává videa do tabulky videos (synchronizace YouTube,
     * Přidat track, ruční formulář, píseň z videa), ho pak přeskočí – jinak by se ukázalo dřív.
     */
    public static boolean isPendingVideo(Connection c, String youtubeId) throws SQLException {
        if (youtubeId == null) return false;
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT 1 FROM songs WHERE premiere_video_id = ? AND premiere_video_done = 0 LIMIT 1")) {
            ps.setString(1, youtubeId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next(); }
        }
    }

    /** Totéž s vlastním spojením (pro místa bez otevřeného spojení). */
    public static boolean isPendingVideo(String youtubeId) throws SQLException {
        try (Connection c = Db.get()) { return isPendingVideo(c, youtubeId); }
    }

    /**
     * Zveřejní premiérová videa, jejichž čas už nastal: přesune je do tabulky videos k písni. Každé jen jednou –
     * „UPDATE … WHERE premiere_video_done = 0“ v transakci vyhraje jen jeden z naráz běžících požadavků; když
     * vložení selže, transakce se vrátí a zkusí se to při dalším běhu. Vrací počet zveřejněných.
     */
    public int publishDue() throws SQLException {
        long now = System.currentTimeMillis();
        int done = 0;
        try (Connection c = Db.get()) {
            java.util.List<Object[]> due = new java.util.ArrayList<>();
            try (PreparedStatement ps = c.prepareStatement("SELECT id, premiere_video_id, release_at, name FROM songs "
                    + "WHERE premiere_video_id IS NOT NULL AND premiere_video_done = 0 AND release_at IS NOT NULL AND release_at <= ?")) {
                ps.setLong(1, now);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) due.add(new Object[] { rs.getInt(1), rs.getString(2), rs.getLong(3), rs.getString(4) });
                }
            }
            for (Object[] d : due) {
                boolean auto = c.getAutoCommit();
                c.setAutoCommit(false);
                try {
                    int claimed;
                    try (PreparedStatement ps = c.prepareStatement("UPDATE songs SET premiere_video_done = 1 WHERE id = ? AND premiere_video_done = 0")) {
                        ps.setInt(1, (Integer) d[0]);
                        claimed = ps.executeUpdate();
                    }
                    if (claimed == 1) {
                        try (PreparedStatement ps = c.prepareStatement("DELETE FROM video_blocklist WHERE youtube_id = ?")) {
                            ps.setString(1, (String) d[1]);
                            ps.executeUpdate();
                        }
                        try (PreparedStatement ps = c.prepareStatement("INSERT INTO videos (youtube_id, title, published_at, song_id) VALUES (?, ?, ?, ?) "
                                // video už v tabulce bylo (přišlo z YouTube dřív, než se nastavila premiéra): bez názvu
                                // nebo jen s kódem videa dostane název písně
                                + "ON DUPLICATE KEY UPDATE song_id = VALUES(song_id), published_at = VALUES(published_at), "
                                + "title = IF(title IS NULL OR title = '' OR title = youtube_id, VALUES(title), title)")) {
                            ps.setString(1, (String) d[1]);
                            ps.setString(2, (String) d[3]);
                            ps.setTimestamp(3, new java.sql.Timestamp((Long) d[2]));
                            ps.setInt(4, (Integer) d[0]);
                            ps.executeUpdate();
                        }
                        done++;
                    }
                    c.commit();
                } catch (SQLException e) {
                    c.rollback();
                    throw e;
                } finally {
                    c.setAutoCommit(auto);
                }
            }
        }
        return done;
    }

    /** Stav premiéry jedné písně pro stránku (api/premiere): čas, jestli je venku, a video až po zveřejnění. */
    public static final class State {
        public final Long at;
        public final boolean out;
        public final String youtubeId;   // jen když je venku a video už je zveřejněné
        State(Long at, boolean out, String youtubeId) { this.at = at; this.out = out; this.youtubeId = youtubeId; }
    }

    /** Stav podle uuid písně; null = píseň neexistuje. Video se vrací jen po zveřejnění (nikdy dřív). */
    public State state(String uuid) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT release_at, premiere_video_id, premiere_video_done FROM songs WHERE BINARY uuid = BINARY ?")) {
            ps.setString(1, uuid);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                long at = rs.getLong(1);
                Long when = rs.wasNull() ? null : at;
                boolean out = when == null || System.currentTimeMillis() >= when;
                String yt = out && rs.getInt(3) == 1 ? rs.getString(2) : null;
                return new State(when, out, yt);
            }
        }
    }

    private static Premiere one(Connection c, String sql, long from) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, from);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? map(rs) : null; }
        }
    }

    private static Premiere map(ResultSet rs) throws SQLException {
        return new Premiere(rs.getInt(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getString(5), rs.getLong(6));
    }
}
