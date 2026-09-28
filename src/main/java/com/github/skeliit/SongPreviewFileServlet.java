package com.github.skeliit;

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
 * Serves uploaded song preview images. Files live in UPLOAD_DIR/song-previews when
 * UPLOAD_DIR is set; otherwise under the webapp (legacy / local behaviour).
 */
@WebServlet(name = "SongPreviewFileServlet", urlPatterns = {"/uploads/song-previews/*"})
public class SongPreviewFileServlet extends HttpServlet {

    public static File previewDir(ServletContext ctx) {
        String uploadDir = Config.get("UPLOAD_DIR");
        if (uploadDir != null && !uploadDir.isBlank()) {
            return new File(uploadDir, "song-previews");
        }
        String base = ctx.getRealPath("/uploads/song-previews");
        if (base == null) {
            base = System.getProperty("java.io.tmpdir") + File.separator + "song-previews";
        }
        return new File(base);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String name = req.getPathInfo();
        if (name == null || !name.matches("/[A-Za-z0-9_-]+\\.(jpg|jpeg|png|webp)")) {
            resp.sendError(404);
            return;
        }
        Path file = previewDir(getServletContext()).toPath().resolve(name.substring(1));
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
