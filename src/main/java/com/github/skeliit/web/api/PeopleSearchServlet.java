package com.github.skeliit.web.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.skeliit.dao.FriendDao;
import com.github.skeliit.model.Friend;
import com.github.skeliit.security.RequestLimiter;
import jakarta.servlet.ServletException;
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

/**
 * Našeptávač přátel: GET /api/people?q=začátek jména, jen pro přihlášené. Pravidla jako FriendDao.search: veřejné profily podle začátku
 * jména, soukromé jen podle celého jména, zablokovaní se neukážou, nikdy e-mail. Nejvýš 60 dotazů za minutu.
 */
@WebServlet(name = "PeopleSearchServlet", urlPatterns = {"/api/people"})
public class PeopleSearchServlet extends HttpServlet {
    private static final ObjectMapper JSON = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession s = req.getSession(false);
        Integer me = s == null ? null : (Integer) s.getAttribute("user_id");
        resp.setHeader("Cache-Control", "no-store");
        resp.setContentType("application/json; charset=UTF-8");
        if (me == null) { resp.setStatus(401); resp.getWriter().write("[]"); return; }
        String q = req.getParameter("q");
        q = q == null ? "" : q.strip();
        if (q.length() < 2 || q.length() > 50) { resp.getWriter().write("[]"); return; }
        if (!RequestLimiter.tryAcquire("people-search", me, 60, RequestLimiter.MINUTE)) { resp.setStatus(429); resp.getWriter().write("[]"); return; }
        try {
            FriendDao friends = new FriendDao();
            List<Map<String, Object>> out = new ArrayList<>();
            for (Friend f : friends.search(me, q)) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("name", f.username);
                row.put("avatar", f.avatarUrl);
                row.put("pub", f.pub);
                row.put("rel", friends.relation(me, f.id).name());
                out.add(row);
            }
            JSON.writeValue(resp.getOutputStream(), out);
        } catch (SQLException e) {
            throw new ServletException(e);
        }
    }
}
