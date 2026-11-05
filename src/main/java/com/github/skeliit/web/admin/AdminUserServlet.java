package com.github.skeliit.web.admin;

import com.github.skeliit.Db;
import com.github.skeliit.security.AccountDeletion;
import com.github.skeliit.security.SessionRegistry;
import com.github.skeliit.service.ProfileImages;
import com.github.skeliit.service.ProfileImages.Kind;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.*;

/**
 * Správa uživatelů (admin_users.jsp): role, smazání a odebrání nevhodné fotky nebo záhlaví.
 * Admin nemůže smazat sám sebe a web nesmí zůstat bez posledního admina.
 */
@WebServlet(name = "AdminUserServlet", urlPatterns = { "/admin/users" })
public class AdminUserServlet extends HttpServlet {
    private boolean isAdmin(HttpSession s) {
        return s != null && "ADMIN".equals(s.getAttribute("role"));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (!isAdmin(session)) {
            resp.sendError(403);
            return;
        }
        String action = req.getParameter("action");
        int id;
        try {
            id = Integer.parseInt(String.valueOf(req.getParameter("user_id")));
        } catch (NumberFormatException e) {
            resp.sendRedirect("/admin_users.jsp");
            return;
        }
        boolean self = Integer.valueOf(id).equals(session.getAttribute("userId"));
        String msg = "";
        try (Connection conn = Db.get()) {
            if ("role".equals(action)) {
                String role = req.getParameter("role");
                if ("USER".equals(role) && isLastAdmin(conn, id)) {
                    msg = "?msg=last_admin";
                } else if ("ADMIN".equals(role) || "USER".equals(role)) {
                    try (PreparedStatement ps = conn.prepareStatement("UPDATE users SET role=? WHERE id=?")) {
                        ps.setString(1, role);
                        ps.setInt(2, id);
                        ps.executeUpdate();
                    }
                }
            } else if ("delete".equals(action)) {
                if (self) {
                    msg = "?msg=self";
                } else if (isLastAdmin(conn, id)) {
                    msg = "?msg=last_admin";
                } else {
                    // spamer zmizí úplně, i s komentáři; odhlásí se všude
                    AccountDeletion.purge(conn, id, getServletContext());
                    SessionRegistry.signOut(id, null);
                }
            } else if ("remove_avatar".equals(action)) {
                msg = removeImage(conn, id, Kind.AVATAR, self);
            } else if ("remove_cover".equals(action)) {
                msg = removeImage(conn, id, Kind.COVER, self);
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect("/admin_users.jsp" + msg);
    }

    /**
     * Odebere nevhodný obrázek. Fotka je v relaci, proto se daný člověk odhlásí, jinak by v hlavičce dál viděl
     * nefunkční obrázek. Vlastní obrázek admina nikoho neodhlašuje, ten si ho v relaci srovná sám.
     */
    private String removeImage(Connection conn, int id, Kind kind, boolean self) throws SQLException {
        String url = null;
        try (PreparedStatement ps = conn.prepareStatement("SELECT " + kind.column + " FROM users WHERE id=?")) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) { if (rs.next()) url = rs.getString(1); }
        }
        if (url == null) return "";
        try (PreparedStatement ps = conn.prepareStatement("UPDATE users SET " + kind.column + " = NULL WHERE id=?")) {
            ps.setInt(1, id);
            ps.executeUpdate();
        }
        ProfileImages.delete(getServletContext(), kind, url);
        if (kind == Kind.AVATAR && !self) SessionRegistry.signOut(id, null);
        return "?msg=image_removed";
    }

    private static boolean isLastAdmin(Connection conn, int id) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT (SELECT role FROM users WHERE id = ?) = 'ADMIN' AND (SELECT COUNT(*) FROM users WHERE role = 'ADMIN') <= 1")) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() && rs.getBoolean(1); }
        }
    }
}
