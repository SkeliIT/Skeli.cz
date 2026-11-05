package com.github.skeliit.web.profile;

import com.github.skeliit.WebUtils;
import com.github.skeliit.dao.UserDao;
import com.github.skeliit.filter.CsrfFilter;
import com.github.skeliit.web.files.CoverFileServlet;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.FileImageOutputStream;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.sql.SQLException;

/**
 * POST /profile/cover – záhlaví profilu: pole „cover“ = nový obrázek, action=remove = zpět na neutrální pozadí.
 * Prohlížeč posílá už ořezaný výřez (js/avatar-editor.js), server ho přesto vždy znovu vykreslí:
 * poměr je pak jistě 3:1 a ze souboru zmizí všechno kromě obrazu (GPS, údaje o fotoaparátu).
 */
@WebServlet(name = "ProfileCoverServlet", urlPatterns = {"/profile/cover"})
@MultipartConfig(maxFileSize = ProfileCoverServlet.MAX_BYTES)
public class ProfileCoverServlet extends HttpServlet {
    static final long MAX_BYTES = 8 * 1024 * 1024;
    private static final int MAX_WIDTH = 1500;

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json; charset=UTF-8");
        HttpSession s = req.getSession(false);
        Integer me = s == null ? null : (Integer) s.getAttribute("user_id");
        if (me == null) { fail(resp, 401, "unauthorized"); return; }
        // formuláře s obrázkem CsrfFilter nekontroluje, proto tady
        if (!CsrfFilter.isValid(req)) { fail(resp, 403, "forbidden"); return; }

        File file = new File(CoverFileServlet.coverDir(getServletContext()), me + ".jpg");
        try {
            if ("remove".equals(req.getParameter("action"))) {
                new UserDao().setCover(me, null);
                if (file.isFile() && !file.delete()) log("Záhlaví profilu: nejde smazat " + file);
                resp.getWriter().write("{\"ok\":true,\"url\":null}");
                return;
            }
            Part part = req.getPart("cover");
            if (part == null || part.getSize() == 0) { fail(resp, 400, "no_file"); return; }
            BufferedImage src = WebUtils.readImage(part.getInputStream());   // null = není to obrázek nebo je moc velký
            if (src == null) { fail(resp, 400, "invalid_image"); return; }

            file.getParentFile().mkdirs();
            writeJpeg(cropWide(src), file);
            // soubor si drží název, proto nové ?v= – jinak by prohlížeč ukazoval starý obrázek
            String url = req.getContextPath() + "/uploads/covers/" + file.getName() + "?v=" + System.currentTimeMillis();
            new UserDao().setCover(me, url);
            resp.getWriter().write("{\"ok\":true,\"url\":\"" + url + "\"}");
        } catch (SQLException e) {
            fail(resp, 500, "db_error");
        } catch (IllegalStateException e) {   // soubor přes limit (MultipartConfig)
            fail(resp, 413, "too_large");
        }
    }

    /** Výřez 3:1 ze středu obrázku, nejvýš 1500 px široký (menší obrázek se nezvětšuje). */
    static BufferedImage cropWide(BufferedImage src) {
        int cropW = Math.min(src.getWidth(), src.getHeight() * 3);
        int cropH = Math.max(1, cropW / 3);
        int outW = Math.min(cropW, MAX_WIDTH);
        int outH = Math.max(1, outW / 3);
        int x = (src.getWidth() - cropW) / 2, y = (src.getHeight() - cropH) / 2;
        BufferedImage out = new BufferedImage(outW, outH, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(src, 0, 0, outW, outH, x, y, x + cropW, y + cropH, null);
        g.dispose();
        return out;
    }

    private static void writeJpeg(BufferedImage img, File file) throws IOException {
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(0.86f);
        try (FileImageOutputStream out = new FileImageOutputStream(file)) {
            writer.setOutput(out);
            writer.write(null, new IIOImage(img, null, null), param);
        } finally {
            writer.dispose();
        }
    }

    private static void fail(HttpServletResponse resp, int status, String code) throws IOException {
        resp.setStatus(status);
        resp.getWriter().write("{\"error\":\"" + code + "\"}");
    }
}
