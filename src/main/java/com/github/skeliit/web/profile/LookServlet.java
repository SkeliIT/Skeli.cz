package com.github.skeliit.web.profile;

import com.github.skeliit.dao.ChatDao;
import com.github.skeliit.dao.PongDao;
import com.github.skeliit.dao.RewardDao;
import com.github.skeliit.model.ChatPrefs;
import com.github.skeliit.model.PongBadges;
import com.github.skeliit.model.Rewards;
import com.github.skeliit.service.PongChampions;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;

/**
 * POST /profile/look – volba v záložce Nastavení → Vzhled (a zkratky v kině). Parametry slot + value:
 * kstyle / profile / kfont / kanim = katalog model/Rewards (prázdné value = zpět na základní),
 * frame = rámeček fotky (jen získaný odznak z PongBadges.FRAMES, nebo „champ“), chatDark / chatLight = vzhled chatu (vybírá se v chatu), mottoFont = písmo mota na profilu.
 * Kdo co smí, rozhoduje vždy server. S json=1 vrátí {"ok":true|false}, jinak přesměruje zpět na #vzhled.
 */
@WebServlet(name = "LookServlet", urlPatterns = {"/profile/look"})
public class LookServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession s = req.getSession(false);
        Integer me = s == null ? null : (Integer) s.getAttribute("user_id");
        boolean json = "1".equals(req.getParameter("json"));
        if (me == null) {
            if (json) { resp.setStatus(401); write(resp, false); } else resp.sendRedirect("/login.jsp?next=%2Fnastaveni.jsp%23vzhled");
            return;
        }
        String slot = req.getParameter("slot"), value = req.getParameter("value");
        if (value == null) value = "";
        boolean ok = false;
        try {
            if (RewardDao.SLOTS.contains(slot)) {
                RewardDao rewards = new RewardDao();
                if (value.isBlank()) {
                    rewards.setLook(me, slot, null);
                    ok = true;
                } else {
                    Rewards.Item it = Rewards.find(slot, value);
                    if (it != null && rewards.have(me, "ADMIN".equals(s.getAttribute("role"))).open(it)) {
                        rewards.setLook(me, slot, value);
                        ok = true;
                    }
                }
            } else if ("frame".equals(slot)) {
                PongDao pong = new PongDao();
                if (value.isBlank() || PongChampions.CHOICE.equals(value) || PongBadges.isFrame(value) && pong.earned(me).contains(value)) {
                    pong.setFrame(me, value.isBlank() ? null : value);
                    ok = true;
                }
            } else if ("lang".equals(slot) || "theme".equals(slot)) {
                // Web a jazyk: jazyk webu (platí hned, session) a režim (přepíná prohlížeč, tady se jen zapamatuje)
                boolean isLang = "lang".equals(slot);
                if (isLang ? com.github.skeliit.I18n.isSupported(value) : "dark".equals(value) || "light".equals(value)) {
                    try (java.sql.Connection c = com.github.skeliit.Db.get();
                         java.sql.PreparedStatement ps = c.prepareStatement(isLang
                                 ? "INSERT INTO user_profiles (user_id, lang) VALUES (?, ?) ON DUPLICATE KEY UPDATE lang = VALUES(lang)"
                                 : "INSERT INTO user_profiles (user_id, theme) VALUES (?, ?) ON DUPLICATE KEY UPDATE theme = VALUES(theme)")) {
                        ps.setInt(1, me);
                        ps.setString(2, value);
                        ps.executeUpdate();
                    }
                    if (isLang) s.setAttribute("lang", value);
                    ok = true;
                }
                if (!json) { resp.sendRedirect("/nastaveni.jsp" + (ok ? "?saved=true" : "") + "#web"); return; }
            } else if ("mottoFont".equals(slot)) {
                // písmo mota na profilu: jen jedno ze tří povolených
                if (com.github.skeliit.dao.UserDao.MOTTO_FONTS.contains(value)) {
                    try (java.sql.Connection c = com.github.skeliit.Db.get();
                         java.sql.PreparedStatement ps = c.prepareStatement("INSERT INTO user_profiles (user_id, motto_font) VALUES (?, ?) ON DUPLICATE KEY UPDATE motto_font = VALUES(motto_font)")) {
                        ps.setInt(1, me);
                        ps.setString(2, value);
                        ps.executeUpdate();
                        ok = true;
                    }
                }
            } else if ("chatDark".equals(slot) || "chatLight".equals(slot)) {
                ChatDao chat = new ChatDao();
                ChatPrefs p = chat.prefs(me);
                if ("chatDark".equals(slot)) p.lookDark = value; else p.lookLight = value;
                ok = chat.savePrefs(me, p);   // savePrefs sám odmítne neznámý vzhled
            }
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        if (json) write(resp, ok);
        else resp.sendRedirect("/nastaveni.jsp?look=" + (ok ? 1 : 0) + "#vzhled");
    }

    private static void write(HttpServletResponse resp, boolean ok) throws IOException {
        resp.setContentType("application/json;charset=UTF-8");
        resp.getWriter().write("{\"ok\":" + ok + "}");
    }
}
