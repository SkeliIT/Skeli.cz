package com.github.skeliit.web.admin;

import com.github.skeliit.dao.SongDao;
import com.github.skeliit.dao.SongNoteDao;
import com.github.skeliit.model.SongNote;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Date;
import java.sql.SQLException;

/**
 * Admin → Hudba → Poznámky: nastříkaná poznámka u písně („Videoklip už brzy na YouTube“).
 * GET seznam a formulář (?song=číslo otevře úpravu), POST action=save|delete.
 * Přístup hlídá AdminFilter, CSRF token CsrfFilter.
 */
@WebServlet(name = "AdminNotesServlet", urlPatterns = {"/admin/notes"})
public class AdminNotesServlet extends HttpServlet {
    static final int MAX_LENGTH = 80;
    private final SongNoteDao notes = new SongNoteDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            Integer song = number(req.getParameter("song"));
            SongNote edit = song == null ? null : notes.find(song);
            if (edit == null) {
                edit = new SongNote();
                if (song != null) edit.songId = song;
            }
            req.setAttribute("note", edit);
            req.setAttribute("notes", notes.list());
            req.setAttribute("songs", new SongDao().listAll());
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        req.getRequestDispatcher("/WEB-INF/views/admin/notes.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        Integer song = number(req.getParameter("song_id"));
        String msg;
        try {
            if (song == null) {
                msg = "missing";
            } else if ("delete".equals(req.getParameter("action"))) {
                notes.delete(song);
                msg = "deleted";
            } else {
                SongNote n = new SongNote();
                n.songId = song;
                n.textCs = text(req.getParameter("text_cs"));
                n.textEn = text(req.getParameter("text_en"));
                n.textDe = text(req.getParameter("text_de"));
                n.textUk = text(req.getParameter("text_uk"));
                n.textVi = text(req.getParameter("text_vi"));
                n.showSong = req.getParameter("show_song") != null;
                n.showLyrics = req.getParameter("show_lyrics") != null;
                n.showMusic = req.getParameter("show_music") != null;
                String until = req.getParameter("until");
                boolean badDate = false;
                if (until != null && !until.isBlank()) {
                    try {
                        n.until = Date.valueOf(until.trim());
                    } catch (IllegalArgumentException e) {
                        badDate = true;
                    }
                }
                if (n.textCs.isEmpty()) {
                    msg = "missing";
                } else if (badDate) {
                    msg = "bad_date";
                } else {
                    notes.save(n);
                    msg = "saved";
                }
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect("/admin/notes?msg=" + msg);
    }

    /** Text bez okrajových mezer a řádků, nejvýš 80 znaků (sloupec i formulář). */
    static String text(String v) {
        if (v == null) return "";
        String t = v.replaceAll("\\s+", " ").trim();
        return t.codePointCount(0, t.length()) > MAX_LENGTH ? t.substring(0, t.offsetByCodePoints(0, MAX_LENGTH)) : t;
    }

    private static Integer number(String v) {
        return v != null && v.matches("\\d{1,9}") ? Integer.valueOf(v) : null;
    }
}
