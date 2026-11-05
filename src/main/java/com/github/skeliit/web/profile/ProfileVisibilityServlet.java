package com.github.skeliit.web.profile;

import com.github.skeliit.dao.PongDao;
import com.github.skeliit.dao.UserDao;
import com.github.skeliit.model.PongBadges;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.Set;

/**
 * POST /profile/visibility – karta „Co o mně vidí ostatní“ v Nastavení → Soukromí, vše najednou:
 * pub=1 (veřejný profil /hrac/jméno pro přihlášené), cover=1 (záhlaví profilu), champ=1 (rámeček šampiona měsíce), f (rámeček kolem fotky –
 * jen získaný odznak z PongBadges.FRAMES, prázdné = bez), m (legendární znak u jména – jen získaný, prázdné = neukazovat).
 * Zaškrtávátka chybí = vypnuto; rámeček / znak chybí úplně (hráč ještě nemá z čeho vybírat) = beze změny.
 * Zpět na nastaveni.jsp?vis=1 (uloženo) nebo vis=0 (rámeček / znak nesedí – nic se neuložilo).
 */
@WebServlet(name = "ProfileVisibilityServlet", urlPatterns = {"/profile/visibility"})
public class ProfileVisibilityServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession s = req.getSession(false);
        Integer me = s == null ? null : (Integer) s.getAttribute("user_id");
        if (me == null) { resp.sendRedirect("/login.jsp?next=%2Fnastaveni.jsp"); return; }
        String f = req.getParameter("f"), m = req.getParameter("m");
        boolean ok;
        try {
            PongDao pong = new PongDao();
            Set<String> earned = pong.earned(me);
            boolean frameOk = f == null || f.isBlank() || PongBadges.isFrame(f) && earned.contains(f);
            boolean markOk = m == null || m.isBlank() || PongBadges.isMark(m) && earned.contains(m);
            ok = frameOk && markOk;
            if (ok) {
                new UserDao().setProfilePublic(me, "1".equals(req.getParameter("pub")));
                new UserDao().setCoverPublic(me, "1".equals(req.getParameter("cover")));
                new UserDao().setFriendRequests(me, "1".equals(req.getParameter("friends")));
                pong.setChampOn(me, "1".equals(req.getParameter("champ")));
                if (f != null) pong.setFrame(me, f.isBlank() ? null : f);
                if (m != null) pong.setMark(me, m.isBlank() ? null : m);
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        resp.sendRedirect("/nastaveni.jsp?vis=" + (ok ? 1 : 0) + "#soukromi");
    }
}
