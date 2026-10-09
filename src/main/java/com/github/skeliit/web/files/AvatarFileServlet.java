package com.github.skeliit.web.files;

import com.github.skeliit.Config;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Serves uploaded avatars. Files live in UPLOAD_DIR/avatars when UPLOAD_DIR is set,
 * so they survive redeploys of the WAR; otherwise inside the webapp (legacy behaviour).
 */
@WebServlet(name = "AvatarFileServlet", urlPatterns = {"/uploads/avatars/*"})
public class AvatarFileServlet extends HttpServlet {

    public static File avatarDir(ServletContext ctx) {
        String uploadDir = Config.get("UPLOAD_DIR");
        if (uploadDir != null && !uploadDir.isBlank()) {
            return new File(uploadDir, "avatars");
        }
        String base = ctx.getRealPath("/uploads/avatars");
        if (base == null) {
            base = System.getProperty("java.io.tmpdir") + File.separator + "avatars";
        }
        return new File(base);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String name = req.getPathInfo();
        if (name == null || !name.matches("/[A-Za-z0-9_-]+\\.(jpg|png|gif)")) {
            resp.sendError(404);
            return;
        }
        Path file = avatarDir(getServletContext()).toPath().resolve(name.substring(1));
        if (!Files.isRegularFile(file)) {
            resp.sendError(404);
            return;
        }
        String ct = getServletContext().getMimeType(file.getFileName().toString());
        resp.setContentType(ct != null ? ct : "application/octet-stream");
        resp.setHeader("X-Content-Type-Options", "nosniff");
        resp.setHeader("Cache-Control", "public, max-age=300");
        resp.setContentLengthLong(Files.size(file));
        Files.copy(file, resp.getOutputStream());
    }
}
