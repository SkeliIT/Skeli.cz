package com.github.skeliit;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.util.UUID;

@WebServlet(name = "UploadAvatarServlet", urlPatterns = {"/profile/avatar-legacy"})
@MultipartConfig(maxFileSize = 10 * 1024 * 1024, maxRequestSize = 15 * 1024 * 1024)
public class UploadAvatarServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        Integer userId = (session != null) ? (Integer) session.getAttribute("userId") : null;
        if (userId == null) { resp.sendRedirect("/login.jsp"); return; }
        Part file = req.getPart("avatar");
        if (file == null || file.getSize() == 0) { resp.sendRedirect("/profile.jsp"); return; }
        String ext = guessExt(file.getSubmittedFileName());
        String fname = UUID.randomUUID().toString().replace("-","") + ext;
        String base = getServletContext().getRealPath("/");
        Path uploadDir;
        if (base != null) {
            uploadDir = Path.of(base, "uploads", "avatars");
        } else {
            uploadDir = Path.of(System.getProperty("java.io.tmpdir"), "skeli_uploads", "avatars");
        }
        Files.createDirectories(uploadDir);
        Path target = uploadDir.resolve(fname);
        try (InputStream in = file.getInputStream(); FileOutputStream out = new FileOutputStream(target.toFile())) {
            in.transferTo(out);
        }
        String relPath = "/uploads/avatars/" + fname;
        try (Connection conn = Db.get(); PreparedStatement ps = conn.prepareStatement("UPDATE users SET avatar_url=? WHERE id=?")) {
            ps.setString(1, relPath);
            ps.setInt(2, userId);
            ps.executeUpdate();
        } catch (SQLException e) { throw new ServletException(e); }
        resp.sendRedirect(req.getContextPath() + "/profile.jsp");
    }

    private static String guessExt(String name) {
        if (name == null) return ".png";
        String n = name.toLowerCase();
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return ".jpg";
        if (n.endsWith(".gif")) return ".gif";
        return ".png";
    }
}
