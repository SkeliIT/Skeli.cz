package com.github.skeliit.web.admin;

import com.github.skeliit.Db;
import com.github.skeliit.service.Trash;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * Admin → Záznam změn a koš (V94).
 * GET  /admin/history[?who=jméno]  koš (posledních 30 dní) a záznam změn (posledních 300, případně jen jednoho admina)
 * POST action=restore, id           vrátí položku z koše
 */
@WebServlet(name = "AdminHistoryServlet", urlPatterns = { "/admin/history" })
public class AdminHistoryServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }
        String who = req.getParameter("who");
        if (who != null && (who.isBlank() || who.length() > 100)) who = null;
        try (Connection c = Db.get()) {
            // záznamy starší než rok pryč
            try (PreparedStatement ps = c.prepareStatement("DELETE FROM admin_log WHERE at < NOW() - INTERVAL 1 YEAR")) {
                ps.executeUpdate();
            }
            List<String[]> log = new ArrayList<>();
            try (PreparedStatement ps = c.prepareStatement("SELECT at, username, action, target FROM admin_log "
                    + (who != null ? "WHERE username = ? " : "") + "ORDER BY at DESC, id DESC LIMIT 300")) {
                if (who != null) ps.setString(1, who);
                try (ResultSet rs = ps.executeQuery()) {
                    java.text.SimpleDateFormat f = new java.text.SimpleDateFormat("d. M. yyyy HH:mm");
                    while (rs.next()) log.add(new String[] { f.format(rs.getTimestamp(1)), rs.getString(2), rs.getString(3), rs.getString(4) });
                }
            }
            List<String> people = new ArrayList<>();
            try (PreparedStatement ps = c.prepareStatement("SELECT DISTINCT username FROM admin_log ORDER BY username");
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) people.add(rs.getString(1));
            }
            req.setAttribute("log", log);
            req.setAttribute("people", people);
            req.setAttribute("who", who);
            req.setAttribute("trash", Trash.list());
            req.setAttribute("keepDays", Trash.KEEP_DAYS);
            req.getRequestDispatcher("/WEB-INF/views/admin/history.jsp").forward(req, resp);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }
        String msg = "error";
        if ("restore".equals(req.getParameter("action"))) {
            try {
                int id = Integer.parseInt(String.valueOf(req.getParameter("id")));
                msg = Trash.restore(id, String.valueOf(req.getSession().getAttribute("username"))) != null ? "restored" : "gone";
            } catch (NumberFormatException e) {
                msg = "error";
            } catch (Exception e) {
                getServletContext().log("Trash restore", e);
                msg = "error";
            }
        }
        resp.sendRedirect("/admin/history?msg=" + msg + "#trash");
    }

    private static boolean isAdmin(HttpServletRequest req) {
        Object role = req.getSession().getAttribute("role");
        return role != null && "ADMIN".equals(role.toString());
    }
}
