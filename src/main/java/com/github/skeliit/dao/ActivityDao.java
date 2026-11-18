package com.github.skeliit.dao;

import com.github.skeliit.Db;
import com.github.skeliit.WebUtils;
import com.github.skeliit.job.VideoTitles;
import com.github.skeliit.model.ActivityItem;
import com.github.skeliit.model.SongTitle;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Časová osa na profilu: co se člověku poslední dobou povedlo, jako velké karty (komentář s náhledem písně,
 * odznak, nový přítel s fotkou, výhra v CatSmash s časem, nová skladba).
 * Každý druh zvlášť a spojení až v Javě: tabulky mají různé collation.
 * Ostatní (forOthers) vidí jen odznaky, výhry a skladby. Komentáře a přátelé jsou jen pro majitele.
 */
public class ActivityDao {
    private static final int EACH = 6;
    private static final String YT = "[A-Za-z0-9_-]{6,20}";

    @FunctionalInterface
    private interface Row { ActivityItem read(ResultSet rs) throws SQLException; }

    private static void read(Connection c, List<ActivityItem> out, String sql, Row row, int... args) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            for (int i = 0; i < args.length; i++) ps.setInt(i + 1, args[i]);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) out.add(row.read(rs));
            }
        }
    }

    private static String ytThumb(String id) {
        return id != null && id.matches(YT) ? "/yt-thumb/" + id + "/mqdefault.jpg" : null;
    }

    public List<ActivityItem> recent(int userId, boolean forOthers, int limit) throws SQLException {
        List<ActivityItem> out = new ArrayList<>();
        try (Connection c = Db.get()) {
            // výhra pro ostatní: čas a skóre jen u toho, kdo má jméno v tabulkách CatSmash zapnuté (jinak by šel spárovat s anonymním řádkem)
            boolean winDetails = !forOthers;
            if (forOthers) try (PreparedStatement ps = c.prepareStatement("SELECT pong_public FROM users WHERE id = ?")) {
                ps.setInt(1, userId);
                try (ResultSet rs = ps.executeQuery()) { winDetails = rs.next() && rs.getBoolean(1); }
            }
            final boolean showWin = winDetails;
            Row badge = rs -> new ActivityItem("badge", rs.getString(1), rs.getTimestamp(2));
            read(c, out, "SELECT badge, earned_at FROM site_badges WHERE user_id = ? ORDER BY earned_at DESC LIMIT " + EACH, badge, userId);
            read(c, out, "SELECT badge, earned_at FROM pong_badges WHERE user_id = ? ORDER BY earned_at DESC LIMIT " + EACH, badge, userId);
            // výhra nad Kevinem: ukládají se jen výhry, takže skóre je délka zápasu : Kevinovy góly
            read(c, out, "SELECT difficulty, created_at, duration_ms, match_len, kevin_goals FROM pong_results WHERE user_id = ? ORDER BY created_at DESC LIMIT " + EACH, rs -> {
                ActivityItem a = new ActivityItem("win", rs.getString(1), rs.getTimestamp(2));
                if (showWin) { a.ms = rs.getInt(3); a.you = rs.getInt(4); a.kevin = rs.getInt(5); }
                return a;
            }, userId);
            read(c, out, "SELECT title, created_at FROM user_tracks WHERE user_id = ? AND hidden_at IS NULL ORDER BY created_at DESC LIMIT " + EACH,
                    rs -> new ActivityItem("track", rs.getString(1), rs.getTimestamp(2)), userId);
            if (!forOthers) {
                // komentář u textu: název písně, náhled jejího nejnovějšího videa (jinak fotka písně), odkaz přímo na komentář
                read(c, out, "SELECT c.id, LEFT(c.content, 160), c.created_at, c.lyric_id, s.name, s.preview_image_url, "
                        + "(SELECT v.youtube_id FROM videos v WHERE v.song_id = s.id ORDER BY v.published_at DESC LIMIT 1) "
                        + "FROM comments c JOIN lyrics l ON l.id = c.lyric_id JOIN songs s ON s.id = l.song_id "
                        + "WHERE c.user_id = ? ORDER BY c.created_at DESC LIMIT " + EACH, rs -> {
                    ActivityItem a = new ActivityItem("comment", rs.getString(2), rs.getTimestamp(3));
                    a.link = "/lyrics/" + rs.getInt(4) + "#comment-" + rs.getInt(1);
                    a.title = rs.getString(5) == null ? null : SongTitle.of(rs.getString(5)).title;
                    String yt = ytThumb(rs.getString(7));
                    a.thumb = yt != null ? yt : WebUtils.safeUrl(rs.getString(6), null);
                    return a;
                }, userId);
                // komentář u videa: BINARY kvůli různé collation tabulek videos a video_comments
                read(c, out, "SELECT c.id, LEFT(c.content, 160), c.created_at, c.youtube_id, v.title "
                        + "FROM video_comments c LEFT JOIN videos v ON BINARY v.youtube_id = BINARY c.youtube_id "
                        + "WHERE c.user_id = ? ORDER BY c.created_at DESC LIMIT " + EACH, rs -> {
                    ActivityItem a = new ActivityItem("comment", rs.getString(2), rs.getTimestamp(3));
                    String yt = rs.getString(4);
                    if (yt != null && yt.matches(YT)) a.link = "/music.jsp?clip=" + yt + "#comment-" + rs.getInt(1);
                    a.title = rs.getString(5) == null ? null : VideoTitles.display(rs.getString(5));
                    a.thumb = ytThumb(yt);
                    return a;
                }, userId);
                // nový přítel: fotka a odkaz na profil, jen když ho má veřejný
                read(c, out, "SELECT u.username, f.accepted_at, u.avatar_url, u.profile_public FROM friendships f JOIN users u ON u.id = IF(f.user_a = ?, f.user_b, f.user_a) "
                        + "WHERE (f.user_a = ? OR f.user_b = ?) AND f.status = 'accepted' AND f.accepted_at IS NOT NULL AND u.role <> 'DELETED' AND u.blocked_at IS NULL "
                        + "ORDER BY f.accepted_at DESC LIMIT " + EACH, rs -> {
                    ActivityItem a = new ActivityItem("friend", rs.getString(1), rs.getTimestamp(2));
                    a.avatar = WebUtils.safeUrl(rs.getString(3), null);
                    if (rs.getBoolean(4)) a.link = "/hrac/" + java.net.URLEncoder.encode(rs.getString(1), java.nio.charset.StandardCharsets.UTF_8);
                    return a;
                }, userId, userId, userId);
            }
        }
        out.removeIf(a -> a.at == null);
        out.sort(Comparator.comparing((ActivityItem a) -> a.at).reversed());
        return out.size() > limit ? new ArrayList<>(out.subList(0, limit)) : out;
    }
}
