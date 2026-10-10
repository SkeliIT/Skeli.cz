package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.WebUtils;
import com.github.skeliit.model.CommentItem;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Comments under lyrics and under clips: one set of rules for both (votes, replies one level
 * deep, a pinned comment, a heart from the artist). They live in two tables, so every query
 * takes the {@link Kind}; "target" is the lyric id or the YouTube id of the clip.
 */
public class CommentDao {

    public enum Kind {
        LYRIC("lyric", "comments", "lyric_id", "lyric_comment_votes"),
        VIDEO("video", "video_comments", "youtube_id", "video_comment_votes");

        public final String code, table, targetCol, votesTable;

        Kind(String code, String table, String targetCol, String votesTable) {
            this.code = code;
            this.table = table;
            this.targetCol = targetCol;
            this.votesTable = votesTable;
        }

        /** "lyric" or "video", anything else null. */
        public static Kind of(String code) {
            for (Kind k : values()) if (k.code.equals(code)) return k;
            return null;
        }

        /** A lyric id is a number, a clip a YouTube id. */
        public boolean validTarget(String target) {
            if (target == null) return false;
            return this == LYRIC ? target.matches("\\d{1,10}") : target.matches("[A-Za-z0-9_-]{6,20}");
        }
    }

    public enum Sort { TOP, NEW }

    /** Who is looking: decides the edit / pin / heart / report buttons and the own vote. */
    public record Viewer(Integer userId, boolean admin, boolean artist) {
        public static final Viewer ANONYMOUS = new Viewer(null, false, false);
    }

    /** All comments on a lyric or clip: top-level ones sorted, each with its replies oldest first. */
    public List<CommentItem> threads(Kind k, String target, Viewer viewer, Sort sort) throws SQLException {
        String sql = "SELECT c.id, c.parent_id, c.user_id, c.content, c.created_at, c.updated_at, c.pinned_at, c.hearted_at, "
                + "u.username, u.avatar_url, u.role, u.is_artist, "
                + "COALESCE(SUM(v.vote = 1), 0) AS up, COALESCE(SUM(v.vote = -1), 0) AS down, "
                + "COALESCE(MAX(CASE WHEN v.user_id = ? THEN v.vote END), 0) AS my "
                + "FROM " + k.table + " c LEFT JOIN users u ON u.id = c.user_id "
                + "LEFT JOIN " + k.votesTable + " v ON v.comment_id = c.id "
                + "WHERE c." + k.targetCol + " = ? GROUP BY c.id ORDER BY c.created_at, c.id";
        List<CommentItem> all = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            if (viewer.userId() == null) ps.setNull(1, Types.INTEGER); else ps.setInt(1, viewer.userId());
            ps.setString(2, target);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) all.add(read(rs, viewer));
            }
        }
        return nest(all, sort);
    }

    private static CommentItem read(ResultSet rs, Viewer viewer) throws SQLException {
        CommentItem it = new CommentItem();
        it.id = rs.getInt("id");
        int parent = rs.getInt("parent_id");
        it.parentId = rs.wasNull() ? null : parent;
        it.userId = rs.getInt("user_id");
        // a deleted account: no name, no photo
        boolean gone = rs.getString("username") == null || "DELETED".equals(rs.getString("role"));
        it.user = gone ? null : rs.getString("username");
        it.avatar = gone ? "" : WebUtils.safeUrl(rs.getString("avatar_url"), "");
        it.artist = !gone && rs.getBoolean("is_artist");
        it.content = rs.getString("content");
        it.created = millis(rs.getTimestamp("created_at"));
        Timestamp edited = rs.getTimestamp("updated_at");
        it.edited = edited == null ? null : edited.getTime();
        it.pinned = rs.getTimestamp("pinned_at") != null;
        it.hearted = rs.getTimestamp("hearted_at") != null;
        it.up = rs.getInt("up");
        it.down = rs.getInt("down");
        it.my = rs.getInt("my");
        boolean mine = viewer.userId() != null && viewer.userId() == it.userId;
        it.canEdit = mine || viewer.admin();
        it.canPin = it.parentId == null && (viewer.artist() || viewer.admin());
        it.canHeart = viewer.artist();
        it.canReport = viewer.userId() != null && !mine;
        return it;
    }

    private static long millis(Timestamp ts) { return ts == null ? 0 : ts.getTime(); }

    /** Puts the replies (input oldest first) under their comment and sorts the top level. */
    public static List<CommentItem> nest(List<CommentItem> oldestFirst, Sort sort) {
        Map<Integer, CommentItem> top = new LinkedHashMap<>();
        for (CommentItem it : oldestFirst) if (it.parentId == null) top.put(it.id, it);
        for (CommentItem it : oldestFirst) {
            if (it.parentId == null) continue;
            CommentItem parent = top.get(it.parentId);
            if (parent != null) parent.replies.add(it);
        }
        List<CommentItem> out = new ArrayList<>(top.values());
        Collections.reverse(out); // newest first
        Comparator<CommentItem> order = Comparator.comparing((CommentItem it) -> !it.pinned); // pinned on top
        if (sort == Sort.TOP) order = order.thenComparing(Comparator.comparingDouble(CommentItem::score).reversed());
        out.sort(order); // stable: equal ones stay newest first
        return out;
    }

    /** The artist's photo, for the small heart under a comment he liked. */
    public String artistAvatar() throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT avatar_url FROM users WHERE is_artist = 1 AND role <> 'DELETED' ORDER BY id LIMIT 1");
             ResultSet rs = ps.executeQuery()) {
            return rs.next() ? WebUtils.safeUrl(rs.getString(1), "") : "";
        }
    }

    public boolean isArtist(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT is_artist FROM users WHERE id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() && rs.getBoolean(1); }
        }
    }

    /** Does the lyric or clip exist (comments only go under real ones). */
    public boolean targetExists(Kind k, String target) throws SQLException {
        String sql = k == Kind.LYRIC ? "SELECT 1 FROM lyrics WHERE id = ?" : "SELECT 1 FROM videos WHERE youtube_id = ?";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, target);
            try (ResultSet rs = ps.executeQuery()) { return rs.next(); }
        }
    }

    /** The author of a comment and where it is, or null when it doesn't exist. */
    public record Ref(int id, int userId, Integer parentId, String target) {}

    public Ref find(Kind k, int id) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT user_id, parent_id, " + k.targetCol + " FROM " + k.table + " WHERE id = ?")) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                int parent = rs.getInt(2);
                Integer parentId = rs.wasNull() ? null : parent;
                return new Ref(id, rs.getInt(1), parentId, rs.getString(3));
            }
        }
    }

    /**
     * Adds a comment; a reply goes under the top-level comment of the one answered (one level deep).
     * A parent from another lyric or clip is ignored. Returns the new id.
     */
    public int add(Kind k, String target, int userId, Integer answering, String content) throws SQLException {
        Integer parentId = null;
        if (answering != null) {
            Ref p = find(k, answering);
            if (p != null && p.target().equals(target)) parentId = p.parentId() != null ? p.parentId() : p.id();
        }
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO " + k.table + " (" + k.targetCol + ", user_id, parent_id, content) VALUES (?, ?, ?, ?)",
                PreparedStatement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, target);
            ps.setInt(2, userId);
            if (parentId == null) ps.setNull(3, Types.INTEGER); else ps.setInt(3, parentId);
            ps.setString(4, content);
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) { return rs.next() ? rs.getInt(1) : 0; }
        }
    }

    public void edit(Kind k, int id, String content) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE " + k.table + " SET content = ?, updated_at = NOW() WHERE id = ?")) {
            ps.setString(1, content);
            ps.setInt(2, id);
            ps.executeUpdate();
        }
    }

    /** Deletes a comment with its replies, their votes and reports. */
    public void delete(Kind k, int id) throws SQLException {
        try (Connection c = Db.get()) {
            List<Integer> ids = new ArrayList<>();
            ids.add(id);
            try (PreparedStatement ps = c.prepareStatement("SELECT id FROM " + k.table + " WHERE parent_id = ?")) {
                ps.setInt(1, id);
                try (ResultSet rs = ps.executeQuery()) { while (rs.next()) ids.add(rs.getInt(1)); }
            }
            for (int one : ids) {
                // lyric comment votes go with the comment (foreign key); clip comment votes don't
                if (k == Kind.VIDEO) {
                    try (PreparedStatement ps = c.prepareStatement("DELETE FROM video_comment_votes WHERE comment_id = ?")) {
                        ps.setInt(1, one);
                        ps.executeUpdate();
                    }
                }
                try (PreparedStatement ps = c.prepareStatement("DELETE FROM comment_reports WHERE kind = ? AND comment_id = ?")) {
                    ps.setString(1, k.code);
                    ps.setInt(2, one);
                    ps.executeUpdate();
                }
            }
            // the replies go with it (foreign key ON DELETE CASCADE); naming them here too makes InnoDB fail
            try (PreparedStatement ps = c.prepareStatement("DELETE FROM " + k.table + " WHERE id = ?")) {
                ps.setInt(1, id);
                ps.executeUpdate();
            }
        }
    }

    /** Thumbs up (1) or down (-1); the same vote again takes it back. Returns the new counts. */
    public int[] vote(Kind k, int id, int userId, int vote) throws SQLException {
        try (Connection c = Db.get()) {
            Integer old = null;
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT vote FROM " + k.votesTable + " WHERE comment_id = ? AND user_id = ?")) {
                ps.setInt(1, id);
                ps.setInt(2, userId);
                try (ResultSet rs = ps.executeQuery()) { if (rs.next()) old = rs.getInt(1); }
            }
            if (old != null && old == vote) {
                try (PreparedStatement ps = c.prepareStatement(
                        "DELETE FROM " + k.votesTable + " WHERE comment_id = ? AND user_id = ?")) {
                    ps.setInt(1, id);
                    ps.setInt(2, userId);
                    ps.executeUpdate();
                }
                vote = 0;
            } else {
                try (PreparedStatement ps = c.prepareStatement(
                        "INSERT INTO " + k.votesTable + " (comment_id, user_id, vote) VALUES (?, ?, ?) "
                                + "ON DUPLICATE KEY UPDATE vote = VALUES(vote)")) {
                    ps.setInt(1, id);
                    ps.setInt(2, userId);
                    ps.setInt(3, vote);
                    ps.executeUpdate();
                }
            }
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT COALESCE(SUM(vote = 1), 0), COALESCE(SUM(vote = -1), 0) FROM " + k.votesTable + " WHERE comment_id = ?")) {
                ps.setInt(1, id);
                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    return new int[] { rs.getInt(1), rs.getInt(2), vote };
                }
            }
        }
    }

    /**
     * Pins a top-level comment (only one per lyric or clip, the previous one is unpinned) or unpins it.
     * "updated_at = updated_at" keeps the clip table's ON UPDATE from marking it as edited.
     */
    public void pin(Kind k, Ref ref, boolean on) throws SQLException {
        try (Connection c = Db.get()) {
            if (on) {
                try (PreparedStatement ps = c.prepareStatement("UPDATE " + k.table
                        + " SET pinned_at = NULL, updated_at = updated_at WHERE " + k.targetCol + " = ? AND pinned_at IS NOT NULL")) {
                    ps.setString(1, ref.target());
                    ps.executeUpdate();
                }
            }
            try (PreparedStatement ps = c.prepareStatement("UPDATE " + k.table
                    + " SET pinned_at = " + (on ? "NOW()" : "NULL") + ", updated_at = updated_at WHERE id = ? AND parent_id IS NULL")) {
                ps.setInt(1, ref.id());
                ps.executeUpdate();
            }
        }
    }

    public void heart(Kind k, int id, boolean on) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE " + k.table
                + " SET hearted_at = " + (on ? "NOW()" : "NULL") + ", updated_at = updated_at WHERE id = ?")) {
            ps.setInt(1, id);
            ps.executeUpdate();
        }
    }

    public boolean isPinned(Kind k, int id) throws SQLException { return flag(k, id, "pinned_at"); }

    public boolean isHearted(Kind k, int id) throws SQLException { return flag(k, id, "hearted_at"); }

    private boolean flag(Kind k, int id, String col) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT " + col + " IS NOT NULL FROM " + k.table + " WHERE id = ?")) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() && rs.getBoolean(1); }
        }
    }
}
