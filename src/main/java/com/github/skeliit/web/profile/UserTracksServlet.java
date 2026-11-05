package com.github.skeliit.web.profile;

import com.github.skeliit.dao.UserTrackDao;
import com.github.skeliit.job.VideoTitles;
import com.github.skeliit.model.UserTrack;
import com.github.skeliit.security.RequestLimiter;
import com.github.skeliit.service.MusicLinks;
import com.github.skeliit.web.auth.EmailVerification;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.time.Year;
import java.util.HashMap;
import java.util.Map;

/**
 * POST /profile/tracks: action = save (id prázdné = nová skladba) | delete. Skladby se přidávají jen odkazem, nic se nenahrává.
 * „Já“ je vždy ze session, CSRF hlídá CsrfFilter. Nejvýš 20 skladeb na účet a 20 uložení za hodinu, jen s ověřeným e-mailem.
 */
@WebServlet(name = "UserTracksServlet", urlPatterns = {"/profile/tracks"})
public class UserTracksServlet extends HttpServlet {
    private final UserTrackDao tracks = new UserTrackDao();

    private static void back(HttpServletResponse resp, String code) throws IOException {
        resp.sendRedirect("/nastaveni.jsp?tracks=" + code + "#tvorba");
    }

    /** Vyplněný odkaz, který neznám: chyba; prázdný je v pořádku. */
    private static boolean bad(String raw, String parsed) {
        return raw != null && !raw.isBlank() && parsed == null;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession s = req.getSession(false);
        Integer me = s == null ? null : (Integer) s.getAttribute("user_id");
        if (me == null) { resp.sendRedirect("/login.jsp?next=%2Fnastaveni.jsp%23tvorba"); return; }
        if (!EmailVerification.isVerified(s)) { back(resp, "verify"); return; }
        try {
            if ("delete".equals(req.getParameter("action"))) {
                tracks.delete(me, parseId(req.getParameter("id")));
                back(resp, "deleted");
                return;
            }
            int id = parseId(req.getParameter("id"));
            String code = save(req, me, id);
            if (!"saved".equals(code) && id <= 0) {   // formulář nové skladby se po chybě vyplní znovu, ať se nepíše celý
                Map<String, String> draft = new HashMap<>();
                for (String k : new String[] { "title", "year", "youtube", "spotify", "apple", "soundcloud" }) draft.put(k, req.getParameter(k));
                s.setAttribute("tracksDraft", draft);
            }
            back(resp, code);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }

    private String save(HttpServletRequest req, int me, int id) throws SQLException {
        if (req.getParameter("rights") == null) return "rights";
        if (!RequestLimiter.tryAcquire("user-tracks", me, 20, RequestLimiter.HOUR)) return "limit";
        if (id <= 0 && tracks.count(me) >= UserTrackDao.MAX_PER_USER) return "limit";

        String ytRaw = req.getParameter("youtube"), spRaw = req.getParameter("spotify"), apRaw = req.getParameter("apple"), scRaw = req.getParameter("soundcloud");
        UserTrack t = new UserTrack();
        t.youtubeId = MusicLinks.youtube(ytRaw);
        t.spotify = MusicLinks.spotify(MusicLinks.expandShort(spRaw));
        t.apple = MusicLinks.apple(apRaw);
        t.soundcloud = MusicLinks.soundcloud(MusicLinks.expandShort(scRaw));
        if (bad(ytRaw, t.youtubeId) || bad(spRaw, t.spotify) || bad(apRaw, t.apple) || bad(scRaw, t.soundcloud)) return "link";
        if (t.youtubeId == null && t.spotify == null && t.apple == null && t.soundcloud == null) return "nolink";

        String title = req.getParameter("title");
        title = title == null ? "" : title.strip();
        if (title.isEmpty() && t.youtubeId != null) {          // z YouTube se název doplní sám (jako u Skeliho songů)
            String found = VideoTitles.fetch(t.youtubeId);
            if (found != null) title = VideoTitles.unescape(found).strip();
        }
        if (title.isEmpty()) return "title";
        t.title = title.length() > 120 ? title.substring(0, 120) : title;

        String y = req.getParameter("year");
        if (y != null && y.matches("[0-9]{4}")) {
            int year = Integer.parseInt(y);
            if (year >= 1950 && year <= Year.now().getValue() + 1) t.year = year;
        }
        if (id > 0) return tracks.update(me, id, t) ? "saved" : "fail";
        tracks.add(me, t);
        return "saved";
    }

    private static int parseId(String raw) {
        return raw != null && raw.matches("[0-9]{1,9}") ? Integer.parseInt(raw) : 0;
    }
}
