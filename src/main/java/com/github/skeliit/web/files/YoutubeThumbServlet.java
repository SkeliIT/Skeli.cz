package com.github.skeliit.web.files;

import com.github.skeliit.Config;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Náhledy klipů přes náš server: {@code /yt-thumb/<id>/<name>.jpg}. Prohlížeč návštěvníka se kvůli obrázku
 * nikdy neptá Googlu (soukromí: YouTube nedostane IP adresu před souhlasem); server obrázek stáhne
 * z i.ytimg.com jednou, týden ho drží na disku a posílá ho sám. Když velká verze neexistuje, pošle menší.
 */
@WebServlet(name = "YoutubeThumbServlet", urlPatterns = {"/yt-thumb/*"})
public class YoutubeThumbServlet extends HttpServlet {
    private static final Pattern ID = Pattern.compile("[A-Za-z0-9_-]{6,20}");
    private static final Set<String> NAMES = Set.of("default", "mqdefault", "hqdefault", "sddefault", "maxresdefault",
            "hq1", "hq2", "hq3", "maxres1", "maxres2", "maxres3");   // snímky z klipu (admin: obrázek v Diskografii)
    private static final long MAX_AGE_MS = 7L * 24 * 3600 * 1000;
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4)).followRedirects(HttpClient.Redirect.NORMAL).build();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String[] parts = parse(req.getPathInfo());
        if (parts == null) {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        File file = new File(cacheDir(), parts[0] + "-" + parts[1] + ".jpg");
        if (!file.isFile() || System.currentTimeMillis() - file.lastModified() > MAX_AGE_MS) {
            if (!fetch(parts[0], parts[1], file) && !fetchSmaller(parts[0], parts[1], file) && !file.isFile()) {
                resp.sendError(HttpServletResponse.SC_NOT_FOUND);
                return;
            }
        }
        resp.setContentType("image/jpeg");
        resp.setHeader("Cache-Control", "public, max-age=604800");
        resp.setContentLengthLong(file.length());
        Files.copy(file.toPath(), resp.getOutputStream());
    }

    /** {id, jméno} z "/<id>/<jméno>.jpg", pro cokoli jiného null. */
    static String[] parse(String pathInfo) {
        if (pathInfo == null) return null;
        String[] p = pathInfo.split("/");
        if (p.length != 3 || !ID.matcher(p[1]).matches() || !p[2].endsWith(".jpg")) return null;
        String name = p[2].substring(0, p[2].length() - 4);
        return NAMES.contains(name) ? new String[]{p[1], name} : null;
    }

    private boolean fetch(String id, String name, File file) {
        try {
            HttpResponse<java.io.InputStream> r = HTTP.send(
                    HttpRequest.newBuilder(URI.create("https://i.ytimg.com/vi/" + id + "/" + name + ".jpg"))
                            .timeout(Duration.ofSeconds(8)).GET().build(),
                    HttpResponse.BodyHandlers.ofInputStream());
            if (r.statusCode() != 200) {
                r.body().close();
                return false;
            }
            File tmp = new File(file.getPath() + ".part");
            try (var in = r.body()) {
                Files.copy(in, tmp.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }
            Files.move(tmp.toPath(), file.toPath(), StandardCopyOption.REPLACE_EXISTING);
            return true;
        } catch (IOException | InterruptedException e) {
            getServletContext().log("YouTube thumbnail " + id + "/" + name + ": " + e.getMessage());
            return false;
        }
    }

    /**
     * Menší náhradní verze, když YouTube velký obrázek nemá (starší klipy nahrané ve slabší kvalitě:
     * maxresdefault ani maxres1–3 pro ně neexistují). Bez náhrady by na webu zůstal prázdný rámeček.
     */
    static List<String> smaller(String name) {
        return switch (name) {
            case "maxresdefault" -> List.of("sddefault", "hqdefault");
            case "sddefault" -> List.of("hqdefault");
            case "maxres1", "maxres2", "maxres3" -> List.of("sd" + name.charAt(6), "hq" + name.charAt(6));
            default -> List.of();
        };
    }

    /** Stáhne první existující menší verzi, ořízne z ní černé pruhy a uloží ji pod původním jménem. */
    private boolean fetchSmaller(String id, String name, File file) {
        for (String alt : smaller(name)) {
            File tmp = new File(file.getPath() + ".alt");
            if (!fetch(id, alt, tmp)) continue;
            try {
                BufferedImage img = ImageIO.read(tmp);
                BufferedImage cut = img == null ? null : cropBars(img);
                if (cut != null && cut != img) writeJpeg(cut, tmp);
                Files.move(tmp.toPath(), file.toPath(), StandardCopyOption.REPLACE_EXISTING);
                return true;
            } catch (IOException e) {
                getServletContext().log("YouTube thumbnail " + id + "/" + alt + ": " + e.getMessage());
                tmp.delete();
            }
        }
        return false;
    }

    /**
     * Menší verze z YouTube mají formát 4:3, takže klip 16:9 v nich má černé pruhy nahoře a dole.
     * Ořízneme je: stejně vysoké pruhy nahoře i dole, nejvýš osminu výšky (víc 16:9 ve 4:3 nedá),
     * aby tmavá scéna v klipu nepřišla o kus obrazu.
     */
    static BufferedImage cropBars(BufferedImage img) {
        int h = img.getHeight(), max = h / 8 + 2;
        int top = 0, bottom = 0;
        while (top < max && darkRow(img, top)) top++;
        while (bottom < max && darkRow(img, h - 1 - bottom)) bottom++;
        int cut = Math.min(top, bottom);
        return cut < 4 ? img : img.getSubimage(0, cut, img.getWidth(), h - 2 * cut);
    }

    private static boolean darkRow(BufferedImage img, int y) {
        for (int x = 0; x < img.getWidth(); x += 3) {
            int rgb = img.getRGB(x, y);
            if (((rgb >> 16) & 255) > 28 || ((rgb >> 8) & 255) > 28 || (rgb & 255) > 28) return false;
        }
        return true;
    }

    private static void writeJpeg(BufferedImage img, File out) throws IOException {
        BufferedImage rgb = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_INT_RGB);
        rgb.getGraphics().drawImage(img, 0, 0, null);
        ImageWriter w = ImageIO.getImageWritersByFormatName("jpg").next();
        ImageWriteParam p = w.getDefaultWriteParam();
        p.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        p.setCompressionQuality(0.92f);
        try (ImageOutputStream os = ImageIO.createImageOutputStream(out)) {
            w.setOutput(os);
            w.write(null, new IIOImage(rgb, null, null), p);
        } finally {
            w.dispose();
        }
    }

    private File cacheDir() {
        String upload = Config.get("UPLOAD_DIR");
        File dir = upload != null && !upload.isBlank()
                ? new File(upload, "yt-thumbs")
                : new File(System.getProperty("java.io.tmpdir"), "skeli-yt-thumbs");
        if (!dir.isDirectory() && !dir.mkdirs()) getServletContext().log("Can't create " + dir);
        return dir;
    }
}
