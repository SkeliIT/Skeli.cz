package com.github.skeliit;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Clip thumbnails through our own server: {@code /yt-thumb/<id>/<name>.jpg}. The visitor's browser
 * never talks to Google for a picture (privacy: no IP address to YouTube before consent); the
 * server fetches the image from i.ytimg.com once, keeps it on disk for a week and serves it.
 */
@WebServlet(name = "YoutubeThumbServlet", urlPatterns = {"/yt-thumb/*"})
public class YoutubeThumbServlet extends HttpServlet {
    private static final Pattern ID = Pattern.compile("[A-Za-z0-9_-]{6,20}");
    private static final Set<String> NAMES = Set.of("default", "mqdefault", "hqdefault", "sddefault", "maxresdefault");
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
            if (!fetch(parts[0], parts[1], file) && !file.isFile()) {
                resp.sendError(HttpServletResponse.SC_NOT_FOUND);
                return;
            }
        }
        resp.setContentType("image/jpeg");
        resp.setHeader("Cache-Control", "public, max-age=604800");
        resp.setContentLengthLong(file.length());
        Files.copy(file.toPath(), resp.getOutputStream());
    }

    /** {id, name} from "/<id>/<name>.jpg", or null for anything else. */
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

    private File cacheDir() {
        String upload = Config.get("UPLOAD_DIR");
        File dir = upload != null && !upload.isBlank()
                ? new File(upload, "yt-thumbs")
                : new File(System.getProperty("java.io.tmpdir"), "skeli-yt-thumbs");
        if (!dir.isDirectory() && !dir.mkdirs()) getServletContext().log("Can't create " + dir);
        return dir;
    }
}
