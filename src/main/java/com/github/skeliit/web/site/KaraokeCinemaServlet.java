package com.github.skeliit.web.site;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.skeliit.dao.KaraokeDao;
import com.github.skeliit.model.SongTitle;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Base64;

/**
 * GET /karaoke-kino: dřív samostatný seznam („hala kina“), teď přesměruje na Texty v režimu Karaoke
 * (texty.jsp?karaoke=1 – Kolotoč písní, playable() a canSing() používá i texty.jsp).
 * GET /karaoke-kino/{song uuid}: the karaoke cinema (a preview of the coming big karaoke, WEB-INF/views/kino.jsp).
 * The page gets everything in one object (window.KDATA): the newest clip, the Czech lines, when every line
 * and word is sung (as /api/karaoke: the admin's correction wins over karaoke/<id>.json) and the clip's
 * colours and bass (eq/<id>.json; without it a calm grey). 404 when the song has no clip, lyrics or timings.
 * Only signed-in visitors get into the cinema; the others go to the sign-in page and come back.
 */
@WebServlet(name = "KaraokeCinemaServlet", urlPatterns = {"/karaoke-kino", "/karaoke-kino/*"})
public class KaraokeCinemaServlet extends HttpServlet {
    private static final ObjectMapper JSON = new ObjectMapper();
    /** Karaoke for signed-in visitors only (false = open to everyone, e.g. while working on the cinema). */
    private static final boolean MEMBERS_ONLY = true;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        String uuid = path == null ? "" : path.substring(1);
        if (uuid.isEmpty()) { resp.sendRedirect("/texty.jsp?karaoke=1"); return; }
        if (!uuid.matches("[0-9a-fA-F-]{36}")) { resp.sendError(404); return; }
        if (!canSing(req)) { resp.sendRedirect("/login.jsp?next=" + URLEncoder.encode("/karaoke-kino/" + uuid, StandardCharsets.UTF_8)); return; }
        String[] song;
        String manual;
        try {
            KaraokeDao dao = new KaraokeDao();
            song = dao.cinemaSong(uuid);
            manual = song == null ? null : dao.manual(song[0]);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        if (song == null) { resp.sendError(404); return; }
        String yt = song[0];
        String[] lines = KaraokeDao.lines(song[3]);
        JsonNode timing = manual != null ? JSON.readTree(manual) : file(getServletContext(), "/karaoke/" + yt + ".json");
        if (timing == null || timing.path("lines").asInt() != lines.length) { resp.sendError(404); return; }

        SongTitle title = SongTitle.of(song[1]);
        ObjectNode data = JSON.createObjectNode();
        data.put("yt", yt);
        data.put("title", title.title);
        data.put("artist", title.credits == null || title.credits.isBlank() ? "Skeli" : title.credits);
        data.put("year", song[2] == null ? "" : song[2]);
        data.put("thumb", "/yt-thumb/" + yt + "/hqdefault.jpg");
        ArrayNode ls = data.putArray("lines");
        for (String l : lines) ls.add(l);
        data.set("times", timing.path("times"));
        data.set("words", timing.has("words") ? timing.get("words") : JSON.createArrayNode());
        JsonNode eq = file(getServletContext(), "/eq/" + yt + ".json");
        data.set("eq", eq != null ? eq : calmEq());

        // safe inside <script>: no "</script>", no line separators that end a JavaScript string
        String json = JSON.writeValueAsString(data).replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029");
        com.github.skeliit.service.VisitStats.countPlay(req, "karaoke", uuid);   // the admin's "what is played most"
        req.setAttribute("kinoJson", json);
        req.setAttribute("kinoTitle", title.title);
        // odznak „Na pódiu“: přihlášený otevřel karaoke kino
        jakarta.servlet.http.HttpSession visitor = req.getSession(false);
        if (visitor != null && visitor.getAttribute("user_id") instanceof Integer me) {
            try {
                new com.github.skeliit.dao.SiteBadgeDao().award(me, "s_karaoke");
            } catch (java.sql.SQLException e) {
                req.getServletContext().log("Odznak karaoke", e);   // kvůli odznaku se kino nesmí rozbít
            }
        }
        req.getRequestDispatcher("/WEB-INF/views/kino.jsp").forward(req, resp);
    }

    /**
     * Písně, které jdou opravdu zazpívat: mají klip, český text a časy pro každý řádek (ruční oprava z adminu
     * má přednost před karaoke/<id>.json). Nejnovější první. Používá Texty (texty.jsp) pro režim Karaoke.
     */
    public static java.util.List<com.github.skeliit.model.KaraokeSong> playable(jakarta.servlet.ServletContext ctx) throws IOException, SQLException {
        java.util.List<com.github.skeliit.model.KaraokeSong> songs = new java.util.ArrayList<>();
        KaraokeDao dao = new KaraokeDao();
        for (com.github.skeliit.model.KaraokeSong s : dao.cinemaSongs()) {
            String manual = dao.manual(s.youtubeId);
            JsonNode timing = manual != null ? JSON.readTree(manual) : file(ctx, "/karaoke/" + s.youtubeId + ".json");
            if (timing != null && timing.path("lines").asInt() == s.lines.length) songs.add(s);
        }
        return songs;
    }

    /** Smí návštěvník do kina? Karaoke je pro členy (MEMBERS_ONLY), text si přečte každý. */
    public static boolean canSing(HttpServletRequest req) {
        return !MEMBERS_ONLY || signedIn(req);
    }

    /** Karaoke is for members: only a signed-in visitor gets into the cinema. */
    private static boolean signedIn(HttpServletRequest req) {
        HttpSession s = req.getSession(false);
        return s != null && s.getAttribute("userId") instanceof Integer;
    }

    private static JsonNode file(jakarta.servlet.ServletContext ctx, String name) throws IOException {
        try (InputStream in = ctx.getResourceAsStream(name)) {
            return in == null ? null : JSON.readTree(in);
        }
    }

    /** A clip without eq data: one grey frame and no bass (the room is lit softly, the lights stay calm). */
    private static JsonNode calmEq() {
        ObjectNode e = JSON.createObjectNode();
        byte[] edge = new byte[16 * 3];
        java.util.Arrays.fill(edge, (byte) 70);
        String grey = Base64.getEncoder().encodeToString(edge);
        e.put("cfps", 4).put("rows", 12).put("cols", 16).put("cframes", 1).put("fps", 20).put("bands", 16).put("frames", 1);
        e.put("l", grey).put("r", grey).put("b", grey).put("energy", Base64.getEncoder().encodeToString(new byte[16]));
        return e;
    }
}
