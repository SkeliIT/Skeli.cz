package com.github.skeliit.web.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.skeliit.WebUtils;
import com.github.skeliit.dao.CommentDao;
import com.github.skeliit.dao.CommentDao.Kind;
import com.github.skeliit.dao.CommentDao.Viewer;
import com.github.skeliit.dao.PremiereDao;
import com.github.skeliit.model.CommentItem;
import com.github.skeliit.security.RequestLimiter;
import com.github.skeliit.service.PremiereLive;
import com.github.skeliit.web.auth.EmailVerification;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Živá místnost premiéry (kinosál na /premiera, js/premiera-sal.js). Je otevřená pořád, co je premiéra nastavená (ve čt 30 min předem se otevře všem sama).
 * <p>GET ?song=uuid&k=klíč&po=posledníIdZprávy → {now, otevreno, lidi, reakce:{f1:…}, chat:[…], pin, vyp:{chat,reakce,efekty}, ja:{…}}
 * – zároveň počítá prohlížeč „v sále“ (klíč k = náhodný řetězec z prohlížeče, ne účet). Prohlížeč se ptá ~každé 3 s,
 * ve schované záložce vůbec.
 * <p>POST action=chat&song&text – zpráva do chatu (jen přihlášený s ověřeným e-mailem, 1 za 5 s, max 200 znaků, bez odkazů).
 * Zprávy jsou komentáře videa premiéry (CommentDao VIDEO), takže po premiéře zůstanou pod klipem a platí pro ně
 * nahlášení, mazání, blokace i mazání účtu jako u komentářů. Id videa se do prohlížeče nikdy neposílá.
 * <p>POST action=react&song&k&r – smajlík (jen součty v paměti, kdo klikl se nepamatuje), nejvýš 6 za sekundu.
 * <p>Simulace (?song=sim&simAt=ms) jen na localhostu a testu: chat se ukládá pod falešné video „pmSimChat01“.
 */
@WebServlet(name = "PremiereLiveServlet", urlPatterns = {"/api/premiere/live"})
public class PremiereLiveServlet extends HttpServlet {
    private static final ObjectMapper JSON = new ObjectMapper();
    static final long CHAT_AFTER_MS = 6 * 3600 * 1000L;          // psát jde ještě 6 h po startu
    static final int CHAT_MAX = 200;
    private static final Pattern KEY = Pattern.compile("[A-Za-z0-9]{12,40}");
    /** Odkazy v chatu nechceme (spam, podvody): adresa, www. nebo „něco.cz“. */
    static final Pattern LINK = Pattern.compile("(?i)(https?://|www\\.|\\b[a-z0-9-]{2,}\\.(cz|sk|com|net|org|eu|io|me|ly|gg|tv|to|app|xyz|info|ru|de|link|site|online|shop)\\b)");

    private record Room(long at, String target) {}

    private Room room(HttpServletRequest req) throws SQLException {
        String song = req.getParameter("song");
        if ("sim".equals(song)) {
            String host = req.getServerName();
            if (!"localhost".equals(host) && !host.startsWith("test.")) return null;
            try { return new Room(Long.parseLong(req.getParameter("simAt")), "pmSimChat01"); } catch (Exception e) { return null; }
        }
        if (song == null || !song.matches("[0-9a-fA-F-]{8,40}")) return null;
        PremiereDao.Live live = new PremiereDao().live(song);
        return live == null ? null : new Room(live.at, live.videoId);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setHeader("Cache-Control", "no-store");
        try {
            Room room = room(req);
            if (room == null) { write(resp, 404, Map.of("error", "song")); return; }
            long now = System.currentTimeMillis();
            boolean open = true;                                  // sál je otevřený pořád (domluva 23. 11.)
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("now", now);
            out.put("otevreno", open);
            Map<String, Boolean> vyp = new LinkedHashMap<>();
            for (String s : PremiereLive.SWITCHES) vyp.put(s, PremiereLive.off(s));
            out.put("vyp", vyp);
            if (!open) { write(resp, 200, out); return; }

            String k = req.getParameter("k");
            if (k != null && KEY.matcher(k).matches()) PremiereLive.seen(k);
            out.put("lidi", PremiereLive.people());
            out.put("reakce", PremiereLive.counts());

            HttpSession s = req.getSession(false);
            Viewer viewer = CommentsApiServlet.viewer(s);
            if (!vyp.get("chat")) {
                int after = 0;
                try { after = Integer.parseInt(req.getParameter("po")); } catch (Exception e) { /* první dotaz: posledních 40 */ }
                CommentDao dao = new CommentDao();
                List<Map<String, Object>> chat = new ArrayList<>();
                for (CommentItem it : dao.recent(Kind.VIDEO, room.target, viewer, after, after > 0 ? 60 : 40, false)) chat.add(item(req, it));
                out.put("chat", chat);
                List<CommentItem> pin = dao.recent(Kind.VIDEO, room.target, viewer, 0, 1, true);
                out.put("pin", pin.isEmpty() ? null : item(req, pin.get(0)));
            }
            Map<String, Object> ja = new LinkedHashMap<>();
            ja.put("prihlasen", viewer.userId() != null);
            ja.put("overen", viewer.userId() != null && EmailVerification.isVerified(s));
            ja.put("skeli", viewer.artist() || viewer.admin());
            out.put("ja", ja);
            write(resp, 200, out);
        } catch (SQLException e) {
            write(resp, 503, Map.of("error", "busy"));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setHeader("Cache-Control", "no-store");
        try {
            Room room = room(req);
            if (room == null) { write(resp, 404, Map.of("error", "song")); return; }
            long now = System.currentTimeMillis();
            String action = String.valueOf(req.getParameter("action"));
            if ("react".equals(action)) {
                if (PremiereLive.off("reakce")) { write(resp, 409, Map.of("error", "off")); return; }
                String k = req.getParameter("k");
                if (k == null || !KEY.matcher(k).matches()) { write(resp, 400, Map.of("error", "k")); return; }
                // na jeden prohlížeč 6 za sekundu, na jednu IP 30 za sekundu (proti zahlcení)
                if (!RequestLimiter.tryAcquire("pmreact", k, 6, 1000) || !RequestLimiter.tryAcquire("pmreactip", req.getRemoteAddr(), 30, 1000)) {
                    write(resp, 429, Map.of("error", "slow")); return;
                }
                if (!PremiereLive.react(req.getParameter("r"))) { write(resp, 400, Map.of("error", "r")); return; }
                write(resp, 200, Map.of("ok", true));
                return;
            }
            if ("chat".equals(action)) {
                if (PremiereLive.off("chat")) { write(resp, 409, Map.of("error", "off")); return; }
                if (now > room.at + CHAT_AFTER_MS) { write(resp, 409, Map.of("error", "closed")); return; }
                if (WebUtils.isBot(req)) { write(resp, 200, Map.of("ok", true)); return; }   // past na roboty: tváří se, že prošlo
                HttpSession s = req.getSession(false);
                Viewer viewer = CommentsApiServlet.viewer(s);
                if (viewer.userId() == null) { write(resp, 401, Map.of("error", "login")); return; }
                if (!EmailVerification.isVerified(s)) { write(resp, 403, Map.of("error", "verify")); return; }
                String text = WebUtils.cleanComment(req.getParameter("text"));
                if (text == null) { write(resp, 400, Map.of("error", "empty")); return; }
                text = text.replace('\n', ' ');
                if (text.codePointCount(0, text.length()) > CHAT_MAX) { write(resp, 400, Map.of("error", "long")); return; }
                if (LINK.matcher(text).find()) { write(resp, 400, Map.of("error", "link")); return; }
                // pomalý režim: 1 zpráva za 5 s (Skeli a admin bez omezení)
                if (!(viewer.artist() || viewer.admin()) && !RequestLimiter.tryAcquire("pmchat", viewer.userId(), 1, 5000)) {
                    write(resp, 429, Map.of("error", "slow")); return;
                }
                int id = new CommentDao().add(Kind.VIDEO, room.target, viewer.userId(), null, text);
                write(resp, 200, Map.of("ok", true, "id", id));
                return;
            }
            write(resp, 400, Map.of("error", "action"));
        } catch (SQLException e) {
            write(resp, 503, Map.of("error", "busy"));
        }
    }

    /** Zpráva pro prohlížeč: jen to, co chat ukazuje (text se v prohlížeči vždy vkládá jako čistý text). */
    private static Map<String, Object> item(HttpServletRequest req, CommentItem it) {
        CommentsApiServlet.nameTitle(req, it);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", it.id);
        m.put("jmeno", it.user);            // null = smazaný účet
        m.put("foto", it.avatar);
        m.put("skeli", it.artist);
        m.put("text", it.content);
        m.put("cas", it.created);
        m.put("smazat", it.canEdit);        // autor nebo admin
        m.put("nahlasit", it.canReport);
        m.put("pripnout", it.canPin);
        m.put("pripnuto", it.pinned);
        return m;
    }

    private static void write(HttpServletResponse resp, int status, Object body) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json; charset=UTF-8");
        JSON.writeValue(resp.getWriter(), body);
    }
}
