package com.github.skeliit;

import com.github.skeliit.dao.LyricDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Exports lyrics as TTML files in a zip archive, ready for submission
 * to Apple Music via DistroKid, TuneCore, or Musixmatch.
 *
 * GET /admin/lyrics-export          — all songs, all languages
 * GET /admin/lyrics-export?lang=cs  — filter by language
 * GET /admin/lyrics-export?timed=1  — only songs that have timed (TTML) lyrics
 */
@WebServlet(name = "LyricsExportServlet", urlPatterns = {"/admin/lyrics-export"})
public class LyricsExportServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Object role = req.getSession().getAttribute("role");
        if (role == null || !"ADMIN".equals(role.toString())) {
            resp.setStatus(403);
            resp.getWriter().write("Forbidden");
            return;
        }

        String langFilter = req.getParameter("lang");
        boolean timedOnly = "1".equals(req.getParameter("timed"));

        List<LyricDao.LyricExportRow> rows;
        try {
            rows = new LyricDao().listForExport();
        } catch (Exception e) {
            throw new ServletException(e);
        }

        resp.setContentType("application/zip");
        resp.setHeader("Content-Disposition", "attachment; filename=\"skeli-lyrics-export.zip\"");

        try (ZipOutputStream zip = new ZipOutputStream(resp.getOutputStream(), StandardCharsets.UTF_8)) {
            for (LyricDao.LyricExportRow row : rows) {
                if (langFilter != null && !langFilter.isBlank() && !langFilter.equals(row.lang())) continue;
                if (timedOnly && (row.timedLyrics() == null || row.timedLyrics().isBlank())) continue;

                String ttml = row.timedLyrics() != null && !row.timedLyrics().isBlank()
                        ? row.timedLyrics()
                        : buildSimpleTtml(row);

                String filename = sanitize(row.songName()) + "_" + row.lang() + ".ttml";
                zip.putNextEntry(new ZipEntry(filename));
                zip.write(ttml.getBytes(StandardCharsets.UTF_8));
                zip.closeEntry();
            }
        }
    }

    /** Wraps plain-text lyrics in minimal valid TTML for distributor submission. */
    private static String buildSimpleTtml(LyricDao.LyricExportRow row) {
        String year = row.year() != null ? String.valueOf(row.year()) : String.valueOf(LocalDate.now().getYear());
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<tt xmlns=\"http://www.w3.org/ns/ttml\"\n");
        sb.append("    xmlns:ttm=\"http://www.w3.org/ns/ttml#metadata\"\n");
        sb.append("    xml:lang=\"").append(escapeXml(row.lang())).append("\">\n");
        sb.append("  <head>\n    <metadata>\n");
        sb.append("      <ttm:title>").append(escapeXml(row.songName())).append("</ttm:title>\n");
        sb.append("      <ttm:copyright>© ").append(year).append(" Skeli</ttm:copyright>\n");
        sb.append("    </metadata>\n  </head>\n");
        sb.append("  <body>\n    <div>\n");
        if (row.words() != null) {
            for (String line : row.words().split("\n")) {
                String trimmed = line.trim();
                if (!trimmed.isEmpty()) {
                    sb.append("      <p>").append(escapeXml(trimmed)).append("</p>\n");
                }
            }
        }
        sb.append("    </div>\n  </body>\n</tt>\n");
        return sb.toString();
    }

    private static String sanitize(String name) {
        return name == null ? "unknown" : name.replaceAll("[^a-zA-Z0-9_\\-]", "_");
    }

    private static String escapeXml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
