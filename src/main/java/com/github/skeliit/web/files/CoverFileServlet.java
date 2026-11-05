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
 * Vydává nahraná záhlaví profilů. Soubory leží v UPLOAD_DIR/covers, když je UPLOAD_DIR nastavený,
 * jinak uvnitř aplikace (stejně jako avatary) – obojí přežije nasazení. Jen názvy, které ukládá
 * ProfileCoverServlet (číslo uživatele + .jpg), takže se tudy nedá dostat k ničemu jinému.
 */
@WebServlet(name = "CoverFileServlet", urlPatterns = {"/uploads/covers/*"})
public class CoverFileServlet extends HttpServlet {

    public static File coverDir(ServletContext ctx) {
        String uploadDir = Config.get("UPLOAD_DIR");
        if (uploadDir != null && !uploadDir.isBlank()) {
            return new File(uploadDir, "covers");
        }
        String base = ctx.getRealPath("/uploads/covers");
        if (base == null) {
            base = System.getProperty("java.io.tmpdir") + File.separator + "covers";
        }
        return new File(base);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String name = req.getPathInfo();
        if (name == null || !name.matches("/[0-9]+\\.jpg")) {
            resp.sendError(404);
            return;
        }
        Path file = coverDir(getServletContext()).toPath().resolve(name.substring(1));
        if (!Files.isRegularFile(file)) {
            resp.sendError(404);
            return;
        }
        resp.setContentType("image/jpeg");
        resp.setHeader("X-Content-Type-Options", "nosniff");
        resp.setHeader("Cache-Control", "public, max-age=300");
        resp.setContentLengthLong(Files.size(file));
        Files.copy(file, resp.getOutputStream());
    }
}
