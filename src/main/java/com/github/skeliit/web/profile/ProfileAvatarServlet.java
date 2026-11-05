package com.github.skeliit.web.profile;

import com.github.skeliit.Db;
import com.github.skeliit.WebUtils;
import com.github.skeliit.filter.CsrfFilter;
import com.github.skeliit.service.ProfileImages;
import com.github.skeliit.service.ProfileImages.Kind;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.sql.*;

@WebServlet(name = "ProfileAvatarServlet", urlPatterns = { "/profile/avatar" })
@MultipartConfig(maxFileSize = 5 * 1024 * 1024) // 5 MB
public class ProfileAvatarServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json; charset=UTF-8");
        Object uidObj = req.getSession().getAttribute("userId");
        if (uidObj == null) {
            resp.setStatus(401);
            resp.getWriter().write("{\"error\":\"unauthorized\"}");
            return;
        }
        int userId = (uidObj instanceof Integer) ? (Integer) uidObj : Integer.parseInt(uidObj.toString());

        // Multipart requests are not checked by CsrfFilter, so verify here
        if (!CsrfFilter.isValid(req)) {
            resp.setStatus(403);
            resp.getWriter().write("{\"error\":\"forbidden\"}");
            return;
        }

        Part part = req.getPart("avatar");
        if (part == null || part.getSize() == 0) {
            resp.setStatus(400);
            resp.getWriter().write("{\"error\":\"no_file\"}");
            return;
        }
        if (part.getSize() > 5 * 1024 * 1024) {
            resp.setStatus(413);
            resp.getWriter().write("{\"error\":\"too_large\"}");
            return;
        }

        BufferedImage src = WebUtils.readImage(part.getInputStream()); // null also when too big
        if (src == null) {
            resp.setStatus(400);
            resp.getWriter().write("{\"error\":\"invalid_image\"}");
            return;
        }

        // Ensure square and max 512x512 (client already crops, but we enforce)
        int size = Math.min(Math.min(src.getWidth(), src.getHeight()), 512);
        BufferedImage dst = new BufferedImage(512, 512, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = dst.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        int sx = (src.getWidth() - size) / 2;
        int sy = (src.getHeight() - size) / 2;
        g.drawImage(src, 0, 0, 512, 512, sx, sy, sx + size, sy + size, null);
        g.dispose();

        // každé nahrání má nový náhodný název (service/ProfileImages), starý soubor se smaže až po uložení nového
        String relUrl = ProfileImages.store(getServletContext(), Kind.AVATAR, dst, 0.9f);
        String old = null;
        try (Connection c = Db.get()) {
            try (PreparedStatement ps = c.prepareStatement("SELECT avatar_url FROM users WHERE id=?")) {
                ps.setInt(1, userId);
                try (ResultSet rs = ps.executeQuery()) { if (rs.next()) old = rs.getString(1); }
            }
            try (PreparedStatement ps = c.prepareStatement("UPDATE users SET avatar_url=? WHERE id=?")) {
                ps.setString(1, relUrl);
                ps.setInt(2, userId);
                ps.executeUpdate();
            }
        } catch (SQLException e) {
            ProfileImages.delete(getServletContext(), Kind.AVATAR, relUrl);
            resp.setStatus(500);
            resp.getWriter().write("{\"error\":\"db_error\"}");
            return;
        }
        ProfileImages.delete(getServletContext(), Kind.AVATAR, old);

        req.getSession().setAttribute("avatar_url", relUrl);
        resp.getWriter().write("{\"ok\":true,\"url\":\"" + relUrl + "\"}");
    }
}
