package com.github.skeliit.web.site;

import com.github.skeliit.I18n;
import com.github.skeliit.dao.PremiereDao;
import com.github.skeliit.model.Premiere;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;

/**
 * GET /premiera (i /premiere): stránka premiéry (WEB-INF/views/premiera.jsp). Před startem čekárna s odpočtem
 * podle hodin serveru, v okamžiku premiéry se všem naráz pustí klip od stejné vteřiny (js/premiera.js se ptá
 * /api/premiere, video dostane až po zveřejnění – nikdy dřív). Po premiéře zůstane jako přehrání klipu.
 * Video ID se do HTML nikdy nevypisuje: stránka ho dostane jen z /api/premiere, a to až po startu.
 * Když premiéra žádná není, přesměruje na úvod.
 */
@WebServlet(name = "PremiereServlet", urlPatterns = {"/premiera", "/premiere"})
public class PremiereServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Premiere p;
        try {
            p = new PremiereDao().forPage();
        } catch (SQLException e) {
            throw new ServletException(e);
        }
        if (p == null) { resp.sendRedirect("/"); return; }
        // stav se mění v čase: nikdy ze staré mezipaměti
        resp.setHeader("Cache-Control", "no-store");
        req.setAttribute("premiere", p);
        req.setAttribute("songHref", I18n.songPath(req, p.uuid, 0));
        req.setAttribute("serverNow", System.currentTimeMillis());
        req.setAttribute("pageTitle", I18n.bundle(req).getProperty("pm.title") + ": " + p.name);
        req.setAttribute("pageDescription", I18n.bundle(req).getProperty("pm.desc").replace("{when}", p.getWhen()));
        if (p.thumb != null && p.thumb.startsWith("/")) req.setAttribute("pageImage", p.thumb);
        req.getRequestDispatcher("/WEB-INF/views/premiera.jsp").forward(req, resp);
    }
}
