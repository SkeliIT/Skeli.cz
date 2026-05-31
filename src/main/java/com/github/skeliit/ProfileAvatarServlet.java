package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.FileImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.sql.*;
import java.util.Iterator;

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

        // CSRF basic check (optional)
        String csrfSession = (String) req.getSession().getAttribute("csrf");
        String csrfForm = req.getParameter("csrf");
        if (csrfSession != null && (csrfForm == null || !csrfSession.equals(csrfForm))) {
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

        BufferedImage src = ImageIO.read(part.getInputStream());
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

        // Resolve uploads dir
        String base = getServletContext().getRealPath("/uploads/avatars");
        if (base == null) {
            base = System.getProperty("java.io.tmpdir") + File.separator + "avatars";
        }
        File dir = new File(base);
        if (!dir.exists())
            dir.mkdirs();
        String filename = userId + ".jpg";
        File outFile = new File(dir, filename);

        // Write JPEG with quality 0.9
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) {
            ImageIO.write(dst, "jpg", outFile);
        } else {
            ImageWriter writer = writers.next();
            ImageWriteParam param = writer.getDefaultWriteParam();
            if (param.canWriteCompressed()) {
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(0.9f);
            }
            try (FileImageOutputStream fos = new FileImageOutputStream(outFile)) {
                writer.setOutput(fos);
                writer.write(null, new IIOImage(dst, null, null), param);
                writer.dispose();
            }
        }

        String relUrl = req.getContextPath() + "/uploads/avatars/" + filename;
        try (Connection c = Db.get();
                PreparedStatement ps = c.prepareStatement("UPDATE users SET avatar_url=? WHERE id=?")) {
            ps.setString(1, relUrl);
            ps.setInt(2, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            resp.setStatus(500);
            resp.getWriter().write("{\"error\":\"db_error\"}");
            return;
        }

        req.getSession().setAttribute("avatar_url", relUrl);
        resp.getWriter().write("{\"ok\":true,\"url\":\"" + relUrl + "\"}");
    }
}
