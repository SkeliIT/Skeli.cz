package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.job.VideoTitles;
import com.github.skeliit.model.AccountSummary;
import com.github.skeliit.model.SongTitle;
import com.github.skeliit.model.UserComment;
import com.github.skeliit.model.UserProfile;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/** A signed-in user's own data: the settings they filled in, their comments and a few numbers. */
public class UserDao {

    /** Písma mota na profilu (CSS třída motto-<klíč>). */
    public static final java.util.List<String> MOTTO_FONTS = java.util.List.of("brush", "modern", "clean");

    /**
     * Výstavka na profilu: {uuid oblíbené písně, její název, moto, obrázek písně, písmo mota}; prázdné hodnoty = null
     * (písmo vždy jedno z MOTTO_FONTS). Obrázek = náhled nejnovějšího klipu, jinak náhledová fotka písně.
     */
    public String[] showcase(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT p.fav_song_uuid, s.name, p.motto, s.preview_image_url, "
                + "(SELECT v.youtube_id FROM videos v WHERE v.song_id = s.id ORDER BY v.published_at DESC, v.id DESC LIMIT 1), p.motto_font "
                + "FROM user_profiles p LEFT JOIN songs s ON BINARY s.uuid = BINARY p.fav_song_uuid WHERE p.user_id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return new String[] { null, null, null, null, "brush" };
                String name = rs.getString(2), motto = rs.getString(3), yt = rs.getString(5), font = rs.getString(6);
                String thumb = yt != null ? "/yt-thumb/" + yt + "/mqdefault.jpg" : rs.getString(4);
                return new String[] { name != null ? rs.getString(1) : null, name, motto != null && !motto.isBlank() ? motto : null,
                        name != null ? thumb : null, MOTTO_FONTS.contains(font) ? font : "brush" };
            }
        }
    }

    /** Písně pro výběr oblíbené: {uuid, název}, podle abecedy. */
    public List<String[]> songChoices() throws SQLException {
        List<String[]> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT uuid, name FROM songs WHERE uuid IS NOT NULL ORDER BY name");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) out.add(new String[] { rs.getString(1), rs.getString(2) });
        }
        return out;
    }

    /** The user's settings, or null when they never saved any. */
    public UserProfile profile(int userId) throws SQLException {
        String sql = "SELECT display_name, age, city, bio, theme, lang FROM user_profiles WHERE user_id=?";
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet r = ps.executeQuery()) {
                if (!r.next()) return null;
                return new UserProfile(r.getString("display_name"), (Integer) r.getObject("age"), r.getString("city"),
                        r.getString("bio"), r.getString("theme"), r.getString("lang"));
            }
        }
    }

    /** Who the user is and a few numbers about their comments (lyrics and clips together). */
    public AccountSummary summary(int userId) throws SQLException {
        AccountSummary a = new AccountSummary();
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement("SELECT username, email, created_at, role, is_artist FROM users WHERE id=?")) {
                ps.setInt(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) return null;
                    a.username = rs.getString(1);
                    a.email = rs.getString(2);
                    a.memberSince = rs.getTimestamp(3);
                    a.admin = "ADMIN".equals(rs.getString(4));
                    a.artist = rs.getBoolean(5);
                }
            }
            for (CommentDao.Kind k : CommentDao.Kind.values()) {
                try (PreparedStatement ps = c.prepareStatement("SELECT COUNT(*), COALESCE(SUM(hearted_at IS NOT NULL), 0) FROM "
                        + k.table + " WHERE user_id=?")) {
                    ps.setInt(1, userId);
                    try (ResultSet rs = ps.executeQuery()) { rs.next(); a.comments += rs.getInt(1); a.hearts += rs.getInt(2); }
                }
                try (PreparedStatement ps = c.prepareStatement("SELECT COUNT(*) FROM " + k.votesTable + " v JOIN " + k.table
                        + " cm ON cm.id = v.comment_id WHERE cm.user_id=? AND v.vote=1")) {
                    ps.setInt(1, userId);
                    try (ResultSet rs = ps.executeQuery()) { rs.next(); a.likes += rs.getInt(1); }
                }
            }
        }
        return a;
    }

    /** The user's comments under lyrics and under clips, newest first (at most 100). */
    public List<UserComment> comments(int userId) throws SQLException {
        String lyricSql = "SELECT c.id, c.content, c.created_at, c.parent_id IS NOT NULL, c.lyric_id, s.name, "
                + "(SELECT COUNT(*) FROM lyric_comment_votes v WHERE v.comment_id = c.id AND v.vote = 1) "
                + "FROM comments c JOIN lyrics l ON l.id=c.lyric_id JOIN songs s ON s.id=l.song_id "
                + "WHERE c.user_id=? ORDER BY c.created_at DESC LIMIT 100";
        // BINARY: videos and video_comments have different collations, IDs are plain ASCII
        String videoSql = "SELECT vc.id, vc.content, vc.created_at, vc.parent_id IS NOT NULL, vc.youtube_id, "
                + "(SELECT v.title FROM videos v WHERE BINARY v.youtube_id = BINARY vc.youtube_id LIMIT 1), "
                + "(SELECT COUNT(*) FROM video_comment_votes v WHERE v.comment_id = vc.id AND v.vote = 1) "
                + "FROM video_comments vc WHERE vc.user_id=? ORDER BY vc.created_at DESC LIMIT 100";
        List<UserComment> out = new ArrayList<>();
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement(lyricSql)) {
                ps.setInt(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        out.add(new UserComment("lyric", rs.getInt(1), rs.getString(2), rs.getTimestamp(3), rs.getBoolean(4),
                                SongTitle.of(rs.getString(6)).title, "/lyrics/" + rs.getInt(5) + "#comment-" + rs.getInt(1), rs.getInt(7)));
                    }
                }
            }
            try (PreparedStatement ps = c.prepareStatement(videoSql)) {
                ps.setInt(1, userId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        out.add(new UserComment("video", rs.getInt(1), rs.getString(2), rs.getTimestamp(3), rs.getBoolean(4),
                                VideoTitles.display(rs.getString(6)), "/music.jsp?clip=" + rs.getString(5) + "#comment-" + rs.getInt(1), rs.getInt(7)));
                    }
                }
            }
        }
        out.sort(java.util.Comparator.comparing((UserComment u) -> u.createdAt, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())));
        return out.size() > 100 ? new ArrayList<>(out.subList(0, 100)) : out;
    }
}
