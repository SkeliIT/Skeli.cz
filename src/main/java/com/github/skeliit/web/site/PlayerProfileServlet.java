package com.github.skeliit.web.site;

import com.github.skeliit.dao.PongDao;
import com.github.skeliit.dao.UserDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;

/**
 * Veřejný profil hráče /hrac/{jméno} – kam vede klik na jméno v tabulkách CatSmash a mezi šampiony.
 * Vidí ho jen přihlášení (nepřihlášený jde na přihlášení a pak zpět). Ukazuje jen věci určené k vystavení:
 * fotku s rámečkem, jméno, moto, oblíbený song, od kdy je členem, výhry, rekordy a získané odznaky – nic osobního
 * (e-mail, město, věk, komentáře ne). Kdo si profil v Nastavení skryl (users.profile_public = 0), nebo účet neexistuje,
 * dostane stejnou stránku „profil není veřejný“ (404). Vlastní jméno vede na Můj profil (s ?nahled ukáže, jak mě vidí ostatní).
 */
@WebServlet(name = "PlayerProfileServlet", urlPatterns = {"/hrac/*"})
public class PlayerProfileServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        String name = path == null || path.length() < 2 ? "" : path.substring(1);
        if (name.isEmpty() || name.length() > 60 || name.contains("/")) { resp.sendError(404); return; }
        HttpSession s = req.getSession(false);
        Integer me = s == null ? null : (Integer) s.getAttribute("user_id");
        if (me == null) {
            resp.sendRedirect("/login.jsp?next=" + URLEncoder.encode("/hrac/" + URLEncoder.encode(name, StandardCharsets.UTF_8), StandardCharsets.UTF_8));
            return;
        }
        resp.setHeader("X-Robots-Tag", "noindex");       // profily nepatří do vyhledávačů
        req.setAttribute("pageNoIndex", Boolean.TRUE);
        try {
            UserDao users = new UserDao();
            Integer id = users.publicPlayerId(name);
            if (id != null && id.equals(me) && req.getParameter("nahled") == null) { resp.sendRedirect("/uzivatel.jsp"); return; }   // ?nahled = jak mě vidí ostatní
            if (id == null) {
                resp.setStatus(404);
                req.getRequestDispatcher("/WEB-INF/views/player.jsp").forward(req, resp);
                return;
            }
            // kdo mě zablokoval, ten můj profil nevidí: stejná stránka jako u skrytého
            com.github.skeliit.dao.FriendDao.Rel rel = id.equals(me) ? null : new com.github.skeliit.dao.FriendDao().relation(me, id);
            if (rel == com.github.skeliit.dao.FriendDao.Rel.BLOCKS_ME) {
                resp.setStatus(404);
                req.getRequestDispatcher("/WEB-INF/views/player.jsp").forward(req, resp);
                return;
            }
            req.setAttribute("playerRel", rel);
            var player = users.summary(id);
            req.setAttribute("player", player);
            req.setAttribute("playerAvatar", users.avatar(id));
            req.setAttribute("playerCover", users.coverForOthers(id));
            req.setAttribute("playerShowcase", users.showcase(id));
            req.setAttribute("playerPong", new PongDao().profile(id));
            // jen to, co si člověk v Nastavení sám zapnul
            boolean[] sharing = users.sharing(id);
            var details = users.profile(id);
            if (sharing[0] && details != null) req.setAttribute("playerBio", details.bio);
            if (sharing[1] && details != null) req.setAttribute("playerCity", details.city);
            if (sharing[2]) req.setAttribute("playerLikes", users.likedSongs(id));
            if (sharing[3]) req.setAttribute("playerFriends", new com.github.skeliit.dao.FriendDao().friendsShownTo(id, me));
            req.setAttribute("playerOnline", sharing[4] && com.github.skeliit.service.OnlineUsers.isOnline(id));
            req.setAttribute("playerShownBadges", users.showcaseBadges(id));
            // skladby: ostatní jen když je majitel ukazuje; admin vždy a i skryté, kvůli nahlášením
            boolean admin = "ADMIN".equals(s.getAttribute("role"));
            if (sharing[5] || admin) req.setAttribute("playerTracks", new com.github.skeliit.dao.UserTrackDao().list(id, admin));
            req.setAttribute("pageTitle", player.username);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        req.getRequestDispatcher("/WEB-INF/views/player.jsp").forward(req, resp);
    }
}
