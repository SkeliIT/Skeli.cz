package com.github.skeliit.filter;

import com.github.skeliit.Db;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Záznam změn v adminu (V94, admin → Záznam změn a koš): po každém odeslaném formuláři v adminu (POST) zapíše,
 * kdo co udělal a u čeho. Funguje sám pro všechny stránky adminu, takže se na nic nezapomene. Jména písní a klipů
 * zjistí ještě před úkonem (po smazání by už nebyla). Hesla ani texty se nezapisují, jen co se dělo.
 * Mapování ve web.xml: /admin/* a /api/comments (tam jen když admin maže nebo připíná).
 */
public class AdminAuditFilter implements Filter {

    /** Adresa#akce → čitelný popis. */
    private static final Map<String, String> WHAT = Map.ofEntries(
            Map.entry("/admin/song#save", "Úprava písně"),
            Map.entry("/admin/song#link_video", "Připojení klipu k písni"),
            Map.entry("/admin/song#unlink_video", "Odpojení klipu od písně"),
            Map.entry("/admin/song#delete_video", "Smazání klipu"),
            Map.entry("/admin/song#delete_song", "Smazání písně"),
            Map.entry("/admin/song#delete_text", "Smazání textu"),
            Map.entry("/admin/song#save_release", "Premiéra nastavená"),
            Map.entry("/admin/song#clear_release", "Premiéra zrušená"),
            Map.entry("/admin/song#save_art", "Obrázek v seznamu Texty"),
            Map.entry("/admin/song#save_poster", "Plakát v Karaoke"),
            Map.entry("/admin/song#save_locale", "Úprava překladu / SEO"),
            Map.entry("/admin/song#translate_locale", "Automatický překlad"),
            Map.entry("/admin/song#save_help", "Výzva „Pomoz dopsat text“"),
            Map.entry("/admin/song#delete_help", "Smazání návrhu textu od návštěvníka"),
            Map.entry("/admin/songs/preview#", "Náhledový obrázek písně"),
            Map.entry("/admin/lyrics#save", "Uložení textu písně"),
            Map.entry("/admin/lyrics#delete_text", "Smazání textu"),
            Map.entry("/admin/lyrics#hide_video", "Smazání klipu bez písně"),
            Map.entry("/admin/lyrics#new_song", "Nová píseň"),
            Map.entry("/admin/lyrics#from_video", "Píseň z klipu"),
            Map.entry("/admin/users#role", "Změna role uživatele"),
            Map.entry("/admin/users#delete", "Smazání uživatele"),
            Map.entry("/admin/comment#delete", "Smazání komentáře"),
            Map.entry("/admin/comment#", "Smazání komentáře"),
            Map.entry("/admin/comment#dismiss", "Zamítnutí nahlášení komentáře"),
            Map.entry("/admin/feedback#heart", "Vzkaz jako reference na úvod"),
            Map.entry("/admin/feedback#unheart", "Vzkaz pryč z úvodu"),
            Map.entry("/admin/feedback#delete", "Smazání vzkazu o webu"),
            Map.entry("/admin/feedback#delete_report", "Vyřízení nahlášeného problému"),
            Map.entry("/admin/quotes#add", "Nový citát na úvod"),
            Map.entry("/admin/quotes#save", "Úprava citátu"),
            Map.entry("/admin/quotes#delete", "Smazání citátu"),
            Map.entry("/admin/newsletter#send", "Rozeslání novinek e-mailem"),
            Map.entry("/admin/newsletter#test", "Zkušební e-mail novinek"),
            Map.entry("/admin/newsletter#", "Úprava odběratelů novinek"),
            Map.entry("/admin/track#", "Přidání tracku z YouTube"),
            Map.entry("/admin/video#", "Ruční úprava songu a videa"),
            Map.entry("/admin/karaoke#", "Úprava časů karaoke"),
            Map.entry("/admin/stats-reset#", "Vynulování statistik"),
            Map.entry("/admin/todo#", "Odškrtnutí v „Co čeká“"),
            Map.entry("/admin/history#restore", "Obnovení z koše"),
            Map.entry("/admin/sync#", "Synchronizace s YouTube"),
            Map.entry("/admin/apple-sync#", "Synchronizace s Apple Music"),
            Map.entry("/api/comments#delete", "Smazání komentáře"),
            Map.entry("/api/comments#pin", "Připnutí komentáře"),
            Map.entry("/api/comments#heart", "Srdíčko u komentáře"));

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpSession s = req.getSession(false);
        boolean admin = s != null && "ADMIN".equals(s.getAttribute("role"));
        if (!admin || !"POST".equals(req.getMethod())) { chain.doFilter(request, response); return; }
        String path = req.getServletPath() + (req.getPathInfo() != null ? req.getPathInfo() : "");
        // nahrávání souborů (multipart) nečteme předem – mohlo by to servletu rozbít čtení souboru
        boolean upload = String.valueOf(req.getContentType()).startsWith("multipart/");
        String action = upload ? null : req.getParameter("action");
        String what = WHAT.get(path + "#" + (action == null ? "" : action));
        if (what == null && path.startsWith("/api/")) { chain.doFilter(request, response); return; }   // lajky a odpovědi admina nezapisujeme
        if (what == null) what = path + (action != null ? " (" + action + ")" : "");
        String target = upload ? "" : target(req);   // ještě před úkonem: po smazání by jméno už nebylo
        chain.doFilter(request, response);
        if (((HttpServletResponse) response).getStatus() >= 400) return;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "INSERT INTO admin_log (user_id, username, action, target) VALUES (?, ?, ?, ?)")) {
            Object uid = s.getAttribute("userId");
            if (uid instanceof Integer i) ps.setInt(1, i); else ps.setNull(1, java.sql.Types.INTEGER);
            ps.setString(2, String.valueOf(s.getAttribute("username")));
            ps.setString(3, what.length() > 120 ? what.substring(0, 120) : what);
            ps.setString(4, target.length() > 250 ? target.substring(0, 250) + "…" : target);
            ps.executeUpdate();
        } catch (SQLException e) {
            req.getServletContext().log("Admin log", e);   // záznam nesmí shodit samotný úkon
        }
    }

    /** U čeho se to dělo: píseň, klip, jazyk, uživatel, komentář – podle toho, co formulář posílá. */
    private static String target(HttpServletRequest req) {
        List<String> out = new ArrayList<>();
        try (Connection c = Db.get()) {
            String song = first(req, "song_id", "uuid");
            if (song == null && "/admin/song".equals(req.getServletPath())) song = req.getParameter("id");
            if (song != null) {
                String name = song.matches("\\d{1,10}") ? one(c, "SELECT name FROM songs WHERE id = ?", Integer.parseInt(song))
                        : one(c, "SELECT name FROM songs WHERE uuid = ?", song);
                if (name != null) out.add("píseň „" + name + "“");
            }
            String yt = first(req, "youtube_id", "yt");
            if (yt != null) {
                String title = one(c, "SELECT title FROM videos WHERE youtube_id = ?", yt);
                out.add("klip „" + (title != null ? com.github.skeliit.job.VideoTitles.display(title) : yt) + "“");
            }
            String lang = req.getParameter("lang");
            if (lang != null && lang.matches("[a-z]{2}")) out.add("jazyk " + lang.toUpperCase());
            String user = req.getParameter("user_id");
            if (user != null && user.matches("\\d{1,10}")) {
                String name = one(c, "SELECT username FROM users WHERE id = ?", Integer.parseInt(user));
                out.add("uživatel " + (name != null ? name : "#" + user));
            }
            String role = req.getParameter("role");
            if (role != null && role.matches("[A-Z]{3,10}")) out.add("na " + role);
            String comment = first(req, "comment_id");
            if (comment == null && req.getServletPath().startsWith("/api/comments")) comment = req.getParameter("id");
            if (comment != null && comment.matches("\\d{1,10}")) out.add("komentář #" + comment);
        } catch (SQLException e) {
            // bez popisu cíle, úkon se zapíše i tak
        }
        return String.join(" · ", out);
    }

    private static String first(HttpServletRequest req, String... names) {
        for (String n : names) {
            String v = req.getParameter(n);
            if (v != null && !v.isBlank()) return v.trim();
        }
        return null;
    }

    private static String one(Connection c, String sql, Object arg) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setObject(1, arg);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getString(1) : null; }
        }
    }
}
