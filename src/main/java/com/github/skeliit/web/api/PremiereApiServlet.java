package com.github.skeliit.web.api;

import com.github.skeliit.dao.PremiereDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;

/**
 * Stav premiéry pro otevřenou stránku: GET /api/premiere?song={uuid} →
 * {"now": čas serveru v ms, "at": okamžik premiéry nebo null, "out": true/false, "yt": id videa nebo null}.
 * Video (yt) se vrací až po premiéře a zveřejnění – nikdy dřív, ani adminovi (ten ho vidí v administraci).
 * "now" umožní stránce počítat odpočet podle serveru, i když má návštěvník špatně nastavené hodiny.
 * Nikdy se neukládá do mezipaměti (no-store), aby po premiéře nezůstala stará odpověď.
 */
@WebServlet(name = "PremiereApiServlet", urlPatterns = {"/api/premiere"})
public class PremiereApiServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        String uuid = req.getParameter("song");
        if (uuid == null || !uuid.matches("[0-9a-fA-F-]{8,40}")) { resp.setStatus(400); resp.getWriter().write("{\"error\":\"song\"}"); return; }
        try {
            PremiereDao dao = new PremiereDao();
            dao.publishDue();   // kdyby job zaspal: zveřejní, pokud už je čas (jen jednou, viz publishDue)
            PremiereDao.State s = dao.state(uuid);
            if (s == null) { resp.setStatus(404); resp.getWriter().write("{\"error\":\"song\"}"); return; }
            resp.getWriter().write("{\"now\":" + System.currentTimeMillis()
                    + ",\"at\":" + (s.at == null ? "null" : s.at)
                    + ",\"out\":" + s.out
                    + ",\"yt\":" + (s.youtubeId == null ? "null" : "\"" + s.youtubeId.replaceAll("[^A-Za-z0-9_-]", "") + "\"") + "}");
        } catch (SQLException e) {
            // výpadek databáze: stránka ukáže „chvilku strpení“ a zeptá se znovu, žádná chybová zpráva serveru ven
            resp.setStatus(503);
            resp.getWriter().write("{\"error\":\"busy\"}");
        }
    }
}
