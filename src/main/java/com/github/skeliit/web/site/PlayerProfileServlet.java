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
            var player = users.summary(id);
            req.setAttribute("player", player);
            req.setAttribute("playerAvatar", users.avatar(id));
            req.setAttribute("playerCover", users.coverForOthers(id));
            req.setAttribute("playerShowcase", users.showcase(id));
            req.setAttribute("playerPong", new PongDao().profile(id));
            req.setAttribute("pageTitle", player.username);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        req.getRequestDispatcher("/WEB-INF/views/player.jsp").forward(req, resp);
    }
}
