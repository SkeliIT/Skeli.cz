package com.github.skeliit.web.files;

import com.github.skeliit.Db;
import com.github.skeliit.service.ProfileImages;
import com.github.skeliit.service.ProfileImages.Kind;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Vydává obrázky uživatelů, jen pod náhodnými názvy (service/ProfileImages).
 * Fotka je veřejná, protože je vidět u komentářů. Záhlaví je jen na profilech pro přihlášené a jde vypnout, proto ho
 * server hlídá i tady: vidí ho majitel a admin, ostatní přihlášení jen když je profil i záhlaví zapnuté. Jinak 404.
 */
@WebServlet(name = "ProfileImageServlet", urlPatterns = {"/uploads/avatars/*", "/uploads/covers/*"})
public class ProfileImageServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Kind kind = req.getServletPath().endsWith("covers") ? Kind.COVER : Kind.AVATAR;
        String path = req.getPathInfo();
        String name = path == null || path.length() < 2 ? null : path.substring(1);
        if (!ProfileImages.isRandomName(name)) {
            resp.sendError(404);
            return;
        }
        try {
            if (kind == Kind.COVER && !mayShowCover(req, kind.prefix() + name)) {
                resp.sendError(404);
                return;
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        Path file = ProfileImages.dir(getServletContext(), kind).toPath().resolve(name);
        if (!Files.isRegularFile(file)) {
            resp.sendError(404);
            return;
        }
        String type = getServletContext().getMimeType(name);
        resp.setContentType(type != null ? type : "application/octet-stream");
        resp.setHeader("X-Content-Type-Options", "nosniff");
        // nové nahrání = nový název, takže se dá držet déle; záhlaví závisí na tom, kdo se dívá
        resp.setHeader("Cache-Control", kind == Kind.COVER ? "private, max-age=300" : "public, max-age=86400");
        resp.setContentLengthLong(Files.size(file));
        Files.copy(file, resp.getOutputStream());
    }

    private static boolean mayShowCover(HttpServletRequest req, String url) throws SQLException {
        HttpSession s = req.getSession(false);
        Object me = s == null ? null : s.getAttribute("userId");
        if (!(me instanceof Integer viewer)) return false;
        try (Connection c = Db.get(); PreparedStatement ps = c.prepareStatement(
                "SELECT id, cover_public, profile_public FROM users WHERE cover_url = ?")) {
            ps.setString(1, url);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return false;
                return rs.getInt(1) == viewer || "ADMIN".equals(s.getAttribute("role")) || rs.getBoolean(2) && rs.getBoolean(3);
            }
        }
    }
}
