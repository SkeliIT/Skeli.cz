package com.github.skeliit.web.files;

import com.github.skeliit.job.InstagramSync;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * GET  /uploads/social/{file}  serves images downloaded by InstagramSync.
 * GET  /admin/instagram-sync   runs a sync now (admins only, via AdminFilter on /admin/*).
 */
@WebServlet(name = "SocialImageServlet", urlPatterns = {"/uploads/social/*", "/admin/instagram-sync"})
public class SocialImageServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if ("/admin/instagram-sync".equals(req.getServletPath())) {
            resp.setContentType("text/plain; charset=UTF-8");
            PrintWriter out = resp.getWriter();
            try {
                out.println("Instagram: " + InstagramSync.run(getServletContext()) + " příspěvků synchronizováno.");
            } catch (Exception e) {
                getServletContext().log("Manual Instagram sync failed", e);
                out.println("Synchronizace selhala: " + e.getMessage());
            }
            return;
        }
        String name = req.getPathInfo();
        if (name == null || !name.matches("/ig_\\d{1,40}\\.jpg")) {
            resp.sendError(404);
            return;
        }
        Path file = InstagramSync.imageDir(getServletContext()).toPath().resolve(name.substring(1));
        if (!Files.isRegularFile(file)) {
            resp.sendError(404);
            return;
        }
        resp.setContentType("image/jpeg");
        resp.setHeader("X-Content-Type-Options", "nosniff");
        resp.setHeader("Cache-Control", "public, max-age=86400");
        resp.setContentLengthLong(Files.size(file));
        Files.copy(file, resp.getOutputStream());
    }
}
