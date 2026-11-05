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
    /** Co potřebuje přihlášení bez hesla (jen testovací web, filter/TestLoginFilter). */
    public static final class SignInInfo {
        public final int id;
        public final String username, role, avatar;
        SignInInfo(int id, String username, String role, String avatar) { this.id = id; this.username = username; this.role = role; this.avatar = avatar; }
    }

    /** Účet podle jména; smazaný účet se nepřihlásí nikdy. */
    public SignInInfo signInInfo(String username) throws SQLException {
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement("SELECT id, username, role, avatar_url FROM users WHERE username = ? AND role <> 'DELETED'")) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? new SignInInfo(rs.getInt(1), rs.getString(2), rs.getString(3), rs.getString(4)) : null;
            }
        }
    }


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
                        name != null ? thumb : null, font != null && MOTTO_FONTS.contains(font) ? font : "brush" };   // Set.of(...).contains(null) by spadlo
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

    /** Id hráče s veřejným profilem podle jména (/hrac/jméno); null = neexistuje, je smazaný nebo profil skryl. */
    public Integer publicPlayerId(String username) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT id FROM users WHERE username = ? AND profile_public = 1 AND role <> 'DELETED' AND blocked_at IS NULL")) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getInt(1) : null; }
        }
    }

    /** Fotka hráče (bezpečná adresa) nebo výchozí obrázek. */
    public String avatar(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT avatar_url FROM users WHERE id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return com.github.skeliit.WebUtils.safeUrl(rs.next() ? rs.getString(1) : null, "/img/avatar-default.svg");
            }
        }
    }

    /** Moje záhlaví profilu (bezpečná adresa), null = žádné nemám. Vidím ho vždy, i když ho ostatním neukazuju. */
    public String cover(int userId) throws SQLException {
        return coverQuery("SELECT cover_url FROM users WHERE id = ?", userId);
    }

    /** Záhlaví, jak ho vidí ostatní: null, když žádné není, nebo když ho hráč vypnul. */
    public String coverForOthers(int userId) throws SQLException {
        return coverQuery("SELECT cover_url FROM users WHERE id = ? AND cover_public = 1", userId);
    }

    private String coverQuery(String sql, int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return com.github.skeliit.WebUtils.safeUrl(rs.next() ? rs.getString(1) : null, null);
            }
        }
    }

    public void setCover(int userId, String url) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE users SET cover_url = ? WHERE id = ?")) {
            ps.setString(1, url);
            ps.setInt(2, userId);
            ps.executeUpdate();
        }
    }

    /** Ukazovat moje záhlaví ostatním (users.cover_public)? */
    public boolean coverPublic(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT cover_public FROM users WHERE id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) { return !rs.next() || rs.getBoolean(1); }
        }
    }

    public void setCoverPublic(int userId, boolean on) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE users SET cover_public = ? WHERE id = ?")) {
            ps.setBoolean(1, on);
            ps.setInt(2, userId);
            ps.executeUpdate();
        }
    }

    /** Smí mi lidé posílat žádosti o přátelství (users.friend_requests)? */
    public boolean friendRequests(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT friend_requests FROM users WHERE id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) { return !rs.next() || rs.getBoolean(1); }
        }
    }

    public void setFriendRequests(int userId, boolean on) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE users SET friend_requests = ? WHERE id = ?")) {
            ps.setBoolean(1, on);
            ps.setInt(2, userId);
            ps.executeUpdate();
        }
    }

    /** Co člověk ukazuje ostatním navíc: {pár slov o sobě, město, písně se srdcem, přátelé, stav online}. Výchozí je všechno vypnuté. */
    public boolean[] sharing(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT about_public, city_public, likes_public, friends_public, online_public FROM users WHERE id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? new boolean[] { rs.getBoolean(1), rs.getBoolean(2), rs.getBoolean(3), rs.getBoolean(4), rs.getBoolean(5) } : new boolean[5];
            }
        }
    }

    public void setSharing(int userId, boolean about, boolean city, boolean likes, boolean friends, boolean online) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "UPDATE users SET about_public = ?, city_public = ?, likes_public = ?, friends_public = ?, online_public = ? WHERE id = ?")) {
            ps.setBoolean(1, about);
            ps.setBoolean(2, city);
            ps.setBoolean(3, likes);
            ps.setBoolean(4, friends);
            ps.setBoolean(5, online);
            ps.setInt(6, userId);
            ps.executeUpdate();
        }
    }

    /** Vitrína: klíče odznaků v pořadí, jak si je člověk vybral. */
    public List<String> showcaseBadges(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT showcase_badges FROM user_profiles WHERE user_id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                String raw = rs.next() ? rs.getString(1) : null;
                return raw == null || raw.isBlank() ? List.of() : List.of(raw.split(","));
            }
        }
    }

    public void setShowcaseBadges(int userId, List<String> keys) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO user_profiles (user_id, showcase_badges) VALUES (?, ?) ON DUPLICATE KEY UPDATE showcase_badges = VALUES(showcase_badges)")) {
            ps.setInt(1, userId);
            ps.setString(2, keys.isEmpty() ? null : String.join(",", keys));
            ps.executeUpdate();
        }
    }

    /** Písně, kterým člověk dal srdce (srdce platí pro celou píseň, ve všech jazycích), nejnovější nahoře. */
    public List<com.github.skeliit.model.LikedSong> likedSongs(int userId) throws SQLException {
        List<com.github.skeliit.model.LikedSong> out = new ArrayList<>();
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT s.uuid, s.name, s.preview_image_url, "
                + "(SELECT v.youtube_id FROM videos v WHERE v.song_id = s.id ORDER BY v.published_at DESC, v.id DESC LIMIT 1) "
                + "FROM songs s WHERE s.uuid IS NOT NULL AND s.id IN "
                + "(SELECT l.song_id FROM lyrics_votes lv JOIN lyrics l ON l.id = lv.lyric_id WHERE lv.user_id = ? AND lv.vote = 1) "
                + "ORDER BY s.year DESC, s.id DESC LIMIT 60")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String yt = rs.getString(4);
                    out.add(new com.github.skeliit.model.LikedSong(rs.getString(1), rs.getString(2),
                            yt != null ? "/yt-thumb/" + yt + "/mqdefault.jpg" : rs.getString(3)));
                }
            }
        }
        return out;
    }

    /** Ukazovat můj profil přihlášeným (users.profile_public)? */
    public boolean profilePublic(int userId) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("SELECT profile_public FROM users WHERE id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) { return !rs.next() || rs.getBoolean(1); }
        }
    }

    public void setProfilePublic(int userId, boolean on) throws SQLException {
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement("UPDATE users SET profile_public = ? WHERE id = ?")) {
            ps.setBoolean(1, on);
            ps.setInt(2, userId);
            ps.executeUpdate();
        }
    }
}
