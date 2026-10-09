package com.github.skeliit.web.admin;

import com.github.skeliit.dao.QuoteDao;
import com.github.skeliit.dao.SongDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;

/**
 * The quotes on the home page: two lines from a song, one shown at random on every visit.
 * GET  /admin/quotes
 * POST action=add|save|delete
 */
@WebServlet(name = "AdminQuotesServlet", urlPatterns = { "/admin/quotes" })
public class AdminQuotesServlet extends HttpServlet {

    /** Each line has to fit the column in home_quotes. */
    static final int MAX_LINE = 200;

    private final QuoteDao quotes = new QuoteDao();
    private final SongDao songs = new SongDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }
        try {
            req.setAttribute("quotes", quotes.list());
            req.setAttribute("songs", songs.listAll());
            req.getRequestDispatcher("/WEB-INF/views/admin/quotes.jsp").forward(req, resp);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }
        String action = req.getParameter("action");
        Integer id = parseInt(req.getParameter("id")), songId = parseInt(req.getParameter("song_id"));
        String line1 = line(req.getParameter("line1")), line2 = line(req.getParameter("line2"));
        String msg;
        try {
            if ("delete".equals(action) && id != null) {
                quotes.delete(id);
                msg = "deleted";
            } else if (songId == null || line1 == null || line2 == null) {
                msg = "missing";
            } else if ("save".equals(action) && id != null) {
                quotes.update(id, songId, line1, line2);
                msg = "saved";
            } else if ("add".equals(action)) {
                quotes.add(songId, line1, line2);
                msg = "added";
            } else {
                msg = "missing";
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect("/admin/quotes?msg=" + msg + (id != null && "save".equals(action) ? "#q" + id : ""));
    }

    /** A line as typed, without the quotation marks (the page adds its own), cut to the column's length. */
    static String line(String v) {
        if (v == null) return null;
        String s = v.strip().replaceAll("^[„\"“”]+|[„\"“”]+$", "").strip();
        if (s.isEmpty()) return null;
        return s.length() > MAX_LINE ? s.substring(0, MAX_LINE) : s;
    }

    private static boolean isAdmin(HttpServletRequest req) {
        Object role = req.getSession().getAttribute("role");
        return role != null && "ADMIN".equals(role.toString());
    }

    private static Integer parseInt(String v) {
        try { return v == null || v.isBlank() ? null : Integer.valueOf(v.trim()); } catch (NumberFormatException e) { return null; }
    }
}
