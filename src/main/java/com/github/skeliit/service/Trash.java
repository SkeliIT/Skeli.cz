package com.github.skeliit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.skeliit.Db;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Koš v adminu (V94): těsně před smazáním písně, klipu, textu nebo komentáře si uložíme kopii všech řádků, které
 * smazání odnese – i těch navázaných (komentáře, hlasy, časy karaoke…). Co je na smazaném řádku závislé, zjistíme
 * z cizích klíčů v databázi, takže se nic nezapomene. „Obnovit“ řádky vloží zpátky ve stejném pořadí
 * (nejdřív rodiče, pak děti) se stejnými id. Po 30 dnech se kopie smaže natrvalo.
 */
public final class Trash {
    private Trash() {}

    private static final ObjectMapper JSON = new ObjectMapper();
    public static final int KEEP_DAYS = 30;

    /** Jedna položka koše pro admina. */
    public static class Item {
        public final int id;
        public final String kind, label, username, restoredBy;
        public final Timestamp deletedAt, restoredAt;

        Item(int id, String kind, String label, String username, Timestamp deletedAt, Timestamp restoredAt, String restoredBy) {
            this.id = id; this.kind = kind; this.label = label; this.username = username;
            this.deletedAt = deletedAt; this.restoredAt = restoredAt; this.restoredBy = restoredBy;
        }
        public int getId() { return id; }
        public String getKind() { return kind; }
        public String getLabel() { return label; }
        public String getUsername() { return username; }
        public boolean isRestored() { return restoredAt != null; }
        public String getRestoredBy() { return restoredBy; }
        public String getWhen() { return deletedAt == null ? "" : new java.text.SimpleDateFormat("d. M. yyyy HH:mm").format(deletedAt); }
        /** Za kolik dní zmizí natrvalo. */
        public long getDaysLeft() {
            if (deletedAt == null) return KEEP_DAYS;
            long age = (System.currentTimeMillis() - deletedAt.getTime()) / 86_400_000L;
            return Math.max(0, KEEP_DAYS - age);
        }
    }

    // ---------- co se ukládá před smazáním ----------

    /** Klip: řádek videa, jeho komentáře (s odpověďmi a hlasy) a časy karaoke. Obnovení ho vyndá i ze seznamu blokovaných. */
    public static void video(HttpServletRequest req, String youtubeId) throws SQLException {
        Snapshot s = new Snapshot();
        try (Connection c = Db.get()) {
            String title = one(c, "SELECT title FROM videos WHERE youtube_id = ?", youtubeId);
            s.capture(c, "videos", "youtube_id", youtubeId);
            List<Map<String, String>> comments = s.capture(c, "video_comments", "youtube_id", youtubeId);
            for (Map<String, String> row : comments) s.capture(c, "video_comment_votes", "comment_id", row.get("id"));
            s.capture(c, "karaoke_timings", "youtube_id", youtubeId);
            s.unblock = youtubeId;
            if (!s.rows.isEmpty()) store(req, "video", "Klip: " + (title == null ? youtubeId : com.github.skeliit.job.VideoTitles.display(title)), s);
        }
    }

    /** Píseň (smazat jde jen bez textu): řádek písně a co je na ní závislé; klipy se k ní po obnovení zase připojí. */
    public static void song(HttpServletRequest req, int songId) throws SQLException {
        Snapshot s = new Snapshot();
        try (Connection c = Db.get()) {
            String name = one(c, "SELECT name FROM songs WHERE id = ?", songId);
            s.capture(c, "songs", "id", String.valueOf(songId));
            if (!s.rows.isEmpty()) store(req, "song", "Píseň: " + name, s);
        }
    }

    /** Text písně v jednom jazyce, s komentáři pod ním a jejich hlasy. */
    public static void lyrics(HttpServletRequest req, int songId, String lang) throws SQLException {
        Snapshot s = new Snapshot();
        try (Connection c = Db.get()) {
            String lyricId = one(c, "SELECT id FROM lyrics WHERE song_id = ? AND lang = ?", songId, lang);
            if (lyricId == null) return;
            String name = one(c, "SELECT name FROM songs WHERE id = ?", songId);
            s.capture(c, "lyrics", "id", lyricId);
            store(req, "lyrics", "Text (" + lang.toUpperCase() + "): " + name, s);
        }
    }

    /** Komentář smazaný adminem (s odpověďmi; u klipů i s hlasy). Vlastní komentáře, které smaže autor, se neukládají. */
    public static void comment(HttpServletRequest req, String kind, int commentId) throws SQLException {
        boolean video = "video".equals(kind);
        String table = video ? "video_comments" : "comments";
        Snapshot s = new Snapshot();
        try (Connection c = Db.get()) {
            String text = one(c, "SELECT content FROM " + table + " WHERE id = ?", commentId);
            List<Map<String, String>> rows = s.capture(c, table, "id", String.valueOf(commentId));
            rows.addAll(s.capture(c, table, "parent_id", String.valueOf(commentId)));
            if (video) for (Map<String, String> row : rows) s.capture(c, "video_comment_votes", "comment_id", row.get("id"));
            if (text == null) return;
            String shortText = text.length() > 80 ? text.substring(0, 80) + "…" : text;
            store(req, "comment", "Komentář: „" + shortText.replace('\n', ' ') + "“", s);
        }
    }

    // ---------- pro admina ----------

    /** Položky koše za posledních 30 dní, nejnovější první (starší se tu smažou natrvalo). */
    public static List<Item> list() throws SQLException {
        List<Item> out = new ArrayList<>();
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement("DELETE FROM admin_trash WHERE deleted_at < NOW() - INTERVAL " + KEEP_DAYS + " DAY")) {
                ps.executeUpdate();
            }
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT id, kind, label, username, deleted_at, restored_at, restored_by FROM admin_trash ORDER BY deleted_at DESC, id DESC LIMIT 200");
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    out.add(new Item(rs.getInt(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getTimestamp(5),
                            rs.getTimestamp(6), rs.getString(7)));
                }
            }
        }
        return out;
    }

    /** Vrátí smazané zpátky. Řádky, které mezitím vznikly znovu (stejné id), přeskočí. Vrací název položky, nebo null. */
    public static String restore(int trashId, String byWhom) throws Exception {
        try (Connection c = Db.get()) {
            String label, payload;
            try (PreparedStatement ps = c.prepareStatement("SELECT label, payload FROM admin_trash WHERE id = ? AND restored_at IS NULL")) {
                ps.setInt(1, trashId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) return null;
                    label = rs.getString(1);
                    payload = rs.getString(2);
                }
            }
            Snapshot s = JSON.readValue(payload, Snapshot.class);
            c.setAutoCommit(false);
            try {
                for (Snapshot.Row row : s.rows) insert(c, row.t, row.v);
                for (Snapshot.Link l : s.links) {
                    try (PreparedStatement ps = c.prepareStatement(
                            "UPDATE `" + l.t + "` SET `" + l.col + "` = ? WHERE `" + l.pk + "` = ? AND `" + l.col + "` IS NULL")) {
                        ps.setString(1, l.val);
                        ps.setString(2, l.pkVal);
                        ps.executeUpdate();
                    }
                }
                if (s.unblock != null) {
                    try (PreparedStatement ps = c.prepareStatement("DELETE FROM video_blocklist WHERE youtube_id = ?")) {
                        ps.setString(1, s.unblock);
                        ps.executeUpdate();
                    }
                }
                try (PreparedStatement ps = c.prepareStatement("UPDATE admin_trash SET restored_at = NOW(), restored_by = ? WHERE id = ?")) {
                    ps.setString(1, byWhom);
                    ps.setInt(2, trashId);
                    ps.executeUpdate();
                }
                c.commit();
            } catch (SQLException e) {
                c.rollback();
                throw e;
            } finally {
                c.setAutoCommit(true);
            }
            return label;
        }
    }

    // ---------- uvnitř ----------

    /** Kopie smazaných řádků: řádky v pořadí pro vložení zpět, odkazy, které smazání vynulovalo, a klip k odblokování. */
    public static class Snapshot {
        public static class Row { public String t; public Map<String, String> v; }
        public static class Link { public String t, col, val, pk, pkVal; }
        public List<Row> rows = new ArrayList<>();
        public List<Link> links = new ArrayList<>();
        public String unblock;
        private final transient Set<String> seen = new HashSet<>();

        /** Uloží řádky tabulky, kde sloupec = hodnota, a (rekurzivně) všechno, co na nich závisí. Vrací ty řádky. */
        List<Map<String, String>> capture(Connection c, String table, String column, String value) throws SQLException {
            List<Map<String, String>> found = new ArrayList<>();
            if (value == null) return found;
            Set<String> generated = generatedColumns(c, table);
            String pk = primaryKey(c, table);
            // odpovědi až po komentářích, na které odpovídají
            String order = hasColumn(c, table, "parent_id") ? " ORDER BY parent_id IS NOT NULL" + (pk != null ? ", `" + pk + "`" : "") : "";
            try (PreparedStatement ps = c.prepareStatement("SELECT * FROM `" + table + "` WHERE `" + column + "` = ?" + order)) {
                ps.setString(1, value);
                try (ResultSet rs = ps.executeQuery()) {
                    ResultSetMetaData md = rs.getMetaData();
                    while (rs.next()) {
                        Map<String, String> v = new LinkedHashMap<>();
                        for (int i = 1; i <= md.getColumnCount(); i++) {
                            String col = md.getColumnLabel(i);
                            if (!generated.contains(col)) v.put(col, rs.getString(i));
                        }
                        String key = table + ":" + (pk != null ? v.get(pk) : v.toString());
                        if (seen.add(key)) {
                            Row r = new Row();
                            r.t = table;
                            r.v = v;
                            rows.add(r);
                            found.add(v);
                        }
                    }
                }
            }
            // co na těch řádcích závisí (cizí klíče): smazané spolu s nimi (CASCADE) uložíme celé,
            // vynulované odkazy (SET NULL) si zapamatujeme, ať je obnovení zase připojí
            for (String[] fk : references(c, table)) {
                String child = fk[0], childCol = fk[1], parentCol = fk[2], rule = fk[3];
                for (Map<String, String> row : found) {
                    String parentVal = row.get(parentCol);
                    if ("CASCADE".equals(rule)) {
                        capture(c, child, childCol, parentVal);
                    } else if ("SET NULL".equals(rule)) {
                        String childPk = primaryKey(c, child);
                        if (childPk == null) continue;
                        try (PreparedStatement ps = c.prepareStatement("SELECT `" + childPk + "` FROM `" + child + "` WHERE `" + childCol + "` = ?")) {
                            ps.setString(1, parentVal);
                            try (ResultSet rs = ps.executeQuery()) {
                                while (rs.next()) {
                                    Link l = new Link();
                                    l.t = child; l.col = childCol; l.val = parentVal; l.pk = childPk; l.pkVal = rs.getString(1);
                                    links.add(l);
                                }
                            }
                        }
                    }
                }
            }
            return found;
        }
    }

    private static void store(HttpServletRequest req, String kind, String label, Snapshot s) throws SQLException {
        String payload;
        try {
            payload = JSON.writeValueAsString(s);
        } catch (Exception e) {
            throw new SQLException("Trash snapshot", e);
        }
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO admin_trash (username, kind, label, payload) VALUES (?, ?, ?, ?)")) {
            ps.setString(1, who(req));
            ps.setString(2, kind);
            ps.setString(3, label.length() > 250 ? label.substring(0, 250) + "…" : label);
            ps.setString(4, payload);
            ps.executeUpdate();
        }
    }

    private static void insert(Connection c, String table, Map<String, String> v) throws SQLException {
        List<String> cols = new ArrayList<>(v.keySet());
        StringBuilder sql = new StringBuilder("INSERT IGNORE INTO `").append(table).append("` (");
        for (int i = 0; i < cols.size(); i++) sql.append(i > 0 ? ", " : "").append('`').append(cols.get(i)).append('`');
        sql.append(") VALUES (").append("?, ".repeat(cols.size())).setLength(sql.length() - 2);
        sql.append(')');
        try (PreparedStatement ps = c.prepareStatement(sql.toString())) {
            for (int i = 0; i < cols.size(); i++) ps.setString(i + 1, v.get(cols.get(i)));
            ps.executeUpdate();
        }
    }

    static String who(HttpServletRequest req) {
        HttpSession s = req.getSession(false);
        Object u = s == null ? null : s.getAttribute("username");
        return u == null ? "?" : u.toString();
    }

    private static String one(Connection c, String sql, Object... args) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            for (int i = 0; i < args.length; i++) ps.setObject(i + 1, args[i]);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getString(1) : null; }
        }
    }

    /** Tabulky, které na danou tabulku odkazují: {tabulka, její sloupec, sloupec v rodiči, pravidlo při smazání}. */
    private static List<String[]> references(Connection c, String table) throws SQLException {
        List<String[]> out = new ArrayList<>();
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT k.TABLE_NAME, k.COLUMN_NAME, k.REFERENCED_COLUMN_NAME, r.DELETE_RULE "
                        + "FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r "
                        + "ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME AND r.TABLE_NAME = k.TABLE_NAME "
                        + "WHERE k.REFERENCED_TABLE_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_NAME = ?")) {
            ps.setString(1, table);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) out.add(new String[] { rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4) });
            }
        }
        return out;
    }

    private static String primaryKey(Connection c, String table) throws SQLException {
        return one(c, "SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() "
                + "AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY' ORDER BY ORDINAL_POSITION LIMIT 1", table);
    }

    private static boolean hasColumn(Connection c, String table, String column) throws SQLException {
        return one(c, "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                table, column) != null;
    }

    /** Vypočítané sloupce se nevkládají (databáze je dopočítá sama). */
    private static Set<String> generatedColumns(Connection c, String table) throws SQLException {
        Set<String> out = new HashSet<>();
        try (PreparedStatement ps = c.prepareStatement("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() "
                + "AND TABLE_NAME = ? AND (EXTRA LIKE '%GENERATED%' OR EXTRA LIKE '%VIRTUAL%' OR EXTRA LIKE '%PERSISTENT%' OR EXTRA LIKE '%STORED%')")) {
            ps.setString(1, table);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) out.add(rs.getString(1)); }
        }
        return out;
    }

}
