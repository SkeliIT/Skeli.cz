package com.github.skeliit;

import com.github.skeliit.dao.SongDao;
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
import java.nio.file.Files;
import java.sql.SQLException;
import java.util.Iterator;

/**
 * Upload or clear a song's preview image (Open Graph + YouTube placeholder).
 * Client typically crops to 16:9 via Cropper.js; server still normalizes to 1280×720 JPEG.
 */
@WebServlet(name = "AdminSongPreviewServlet", urlPatterns = { "/admin/songs/preview" })
@MultipartConfig(maxFileSize = 20L * 1024 * 1024, maxRequestSize = 20L * 1024 * 1024 + 64 * 1024)
public class AdminSongPreviewServlet extends HttpServlet {

    /** Phone photos often exceed 5 MB; stored preview is always resized to 1280×720 JPEG. */
    private static final long MAX_UPLOAD_BYTES = 20L * 1024 * 1024;
    private static final int OUT_W = 1280;
    private static final int OUT_H = 720;

    private final SongDao songs = new SongDao();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        boolean json = wantsJson(req);

        Object role = req.getSession().getAttribute("role");
        if (role == null || !"ADMIN".equals(role.toString())) {
            if (json) {
                writeJson(resp, 403, "{\"ok\":false,\"error\":\"forbidden\"}");
            } else {
                resp.setStatus(403);
                resp.getWriter().write("Forbidden");
            }
            return;
        }
        if (!CsrfFilter.isValid(req)) {
            if (json) {
                writeJson(resp, 403, "{\"ok\":false,\"error\":\"csrf\"}");
            } else {
                resp.setStatus(403);
                resp.getWriter().write("CSRF");
            }
            return;
        }

        int songId;
        try {
            songId = Integer.parseInt(req.getParameter("song_id"));
        } catch (Exception e) {
            if (json) {
                writeJson(resp, 400, "{\"ok\":false,\"error\":\"missing_song_id\"}");
            } else {
                resp.sendError(400, "missing song_id");
            }
            return;
        }

        String action = req.getParameter("action");
        String redirect = safeRedirect(req.getParameter("redirect"), req.getContextPath() + "/admin/songs");
        try {
            if ("delete".equals(action)) {
                deletePreview(songId);
                if (json) {
                    writeJson(resp, 200, "{\"ok\":true,\"deleted\":true}");
                } else {
                    resp.sendRedirect(withMsg(redirect, "preview_deleted"));
                }
                return;
            }

            Part part = req.getPart("preview");
            if (part == null || part.getSize() == 0) {
                fail(resp, json, redirect, "no_file", 400);
                return;
            }
            if (part.getSize() > MAX_UPLOAD_BYTES) {
                fail(resp, json, redirect, "too_large", 413);
                return;
            }

            BufferedImage src = WebUtils.readImage(part.getInputStream()); // null also when too big
            if (src == null) {
                fail(resp, json, redirect, "invalid_image", 400);
                return;
            }

            BufferedImage dst = fitCover(src, OUT_W, OUT_H);

            File dir = SongPreviewFileServlet.previewDir(getServletContext());
            if (!dir.exists()) {
                dir.mkdirs();
            }
            String filename = songId + ".jpg";
            File outFile = new File(dir, filename);
            writeJpeg(dst, outFile);

            String relUrl = req.getContextPath() + "/uploads/song-previews/" + filename;
            relUrl = relUrl + "?v=" + outFile.lastModified();
            songs.updatePreviewImageUrl(songId, relUrl);

            if (json) {
                writeJson(resp, 200, "{\"ok\":true,\"url\":\"" + jsonEscape(relUrl) + "\"}");
            } else {
                resp.sendRedirect(withMsg(redirect, "preview_saved"));
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    private static boolean wantsJson(HttpServletRequest req) {
        String accept = req.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) return true;
        String xrw = req.getHeader("X-Requested-With");
        return xrw != null && "XMLHttpRequest".equalsIgnoreCase(xrw);
    }

    private static void fail(HttpServletResponse resp, boolean json, String redirect, String code, int status)
            throws IOException {
        if (json) {
            writeJson(resp, status, "{\"ok\":false,\"error\":\"" + code + "\"}");
        } else {
            resp.sendRedirect(withMsg(redirect, code));
        }
    }

    private static void writeJson(HttpServletResponse resp, int status, String body) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json; charset=UTF-8");
        resp.getWriter().write(body);
    }

    private static String jsonEscape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    /** Only allow same-origin relative redirects under /admin. */
    private static String safeRedirect(String raw, String fallback) {
        if (raw == null || raw.isBlank()) return fallback;
        String r = raw.trim();
        if (!r.startsWith("/") || r.startsWith("//") || r.contains("://")) return fallback;
        if (!r.startsWith("/admin")) return fallback;
        return r;
    }

    private static String withMsg(String redirect, String msg) {
        return redirect + (redirect.contains("?") ? "&" : "?") + "msg=" + msg;
    }

    private void deletePreview(int songId) throws SQLException, IOException {
        String old = songs.getPreviewImageUrl(songId);
        songs.updatePreviewImageUrl(songId, null);
        File dir = SongPreviewFileServlet.previewDir(getServletContext());
        File file = new File(dir, songId + ".jpg");
        if (file.isFile()) {
            Files.deleteIfExists(file.toPath());
        }
        if (old != null) {
            String name = old.replaceFirst("^.*/", "").replaceFirst("\\?.*$", "");
            if (name.matches("[A-Za-z0-9_-]+\\.(jpg|jpeg|png|webp)")) {
                Files.deleteIfExists(new File(dir, name).toPath());
            }
        }
    }

    /** Scale + center-crop into target aspect ratio. */
    static BufferedImage fitCover(BufferedImage src, int tw, int th) {
        double scale = Math.max((double) tw / src.getWidth(), (double) th / src.getHeight());
        int sw = (int) Math.round(src.getWidth() * scale);
        int sh = (int) Math.round(src.getHeight() * scale);
        BufferedImage scaled = new BufferedImage(sw, sh, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = scaled.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(src, 0, 0, sw, sh, null);
        g.dispose();

        int x = Math.max(0, (sw - tw) / 2);
        int y = Math.max(0, (sh - th) / 2);
        BufferedImage out = new BufferedImage(tw, th, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2 = out.createGraphics();
        g2.drawImage(scaled, 0, 0, tw, th, x, y, x + tw, y + th, null);
        g2.dispose();
        return out;
    }

    private static void writeJpeg(BufferedImage img, File outFile) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) {
            ImageIO.write(img, "jpg", outFile);
            return;
        }
        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        if (param.canWriteCompressed()) {
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(0.88f);
        }
        try (FileImageOutputStream fos = new FileImageOutputStream(outFile)) {
            writer.setOutput(fos);
            writer.write(null, new IIOImage(img, null, null), param);
            writer.dispose();
        }
    }
}
