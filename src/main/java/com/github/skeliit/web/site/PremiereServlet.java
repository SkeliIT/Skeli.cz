package com.github.skeliit.web.site;

import com.github.skeliit.I18n;
import com.github.skeliit.dao.PremiereDao;
import com.github.skeliit.model.Premiere;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.text.Normalizer;
import java.util.Locale;

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
        // simulace (?pmSim=sekund do startu) jen lokálně a na testu: ukázka čekárny bez nastavené premiéry, nic neukládá
        String host = req.getServerName();
        if (req.getParameter("pmSim") != null && ("localhost".equals(host) || host.startsWith("test."))) {
            long sec = 3 * 24 * 3600;
            try { sec = Long.parseLong(req.getParameter("pmSim")); } catch (NumberFormatException e) { /* výchozí 3 dny */ }
            p = new Premiere(0, "sim", "Musíš odejít", "clip", null, System.currentTimeMillis() + sec * 1000);
        }
        if (p == null) { resp.sendRedirect("/"); return; }
        // stav se mění v čase: nikdy ze staré mezipaměti
        resp.setHeader("Cache-Control", "no-store");
        req.setAttribute("premiere", p);
        req.setAttribute("songHref", I18n.songPath(req, p.uuid, 0));
        req.setAttribute("serverNow", System.currentTimeMillis());
        req.setAttribute("pageTitle", I18n.bundle(req).getProperty("pm.title") + ": " + p.name);
        req.setAttribute("pageDescription", I18n.bundle(req).getProperty("pm.desc").replace("{when}", p.getWhen()));
        // náhled pro sociální sítě: vlastní obrázek premiéry (tools/premiera-og.py), jinak náhled klipu;
        // vždy celá adresa, relativní cestu Facebook ani WhatsApp nenačtou
        String og = ogImage(p.name, I18n.current(req));
        if (og == null && p.thumb != null && p.thumb.startsWith("/")) og = p.thumb;
        if (og != null) req.setAttribute("pageImage", LyricRouterServlet.absoluteImage(og));
        req.setAttribute("teaser", teaser(getServletContext(), p.name));
        req.setAttribute("pmBackground", background(getServletContext(), p.name));
        req.getRequestDispatcher("/WEB-INF/views/premiera.jsp").forward(req, resp);
    }

    /** /img/premiera/og-<název bez diakritiky>-<jazyk>.jpg, když existuje (jinak česká verze, jinak null). */
    String ogImage(String name, String lang) throws IOException {
        String slug = slug(name);
        if (slug.isEmpty()) return null;
        for (String l : new String[] {lang, "cs"}) {
            String path = "/img/premiera/og-" + slug + "-" + l + ".jpg";
            if (getServletContext().getResource(path) != null) return path + "?v=1";
        }
        return null;
    }

    /**
     * Upoutávka (short) k premiéře: {video, fotka} z /img/premiera/short-<název bez diakritiky>.mp4 a .jpg,
     * když obojí existuje, jinak null. Ukazuje ji karta na úvodu i stránka /premiera (js/upoutavka.js).
     */
    public static String[] teaser(ServletContext ctx, String name) {
        String slug = slug(name);
        if (slug.isEmpty()) return null;
        String base = "/img/premiera/short-" + slug;
        try {
            if (ctx.getResource(base + ".mp4") == null || ctx.getResource(base + ".jpg") == null) return null;
        } catch (java.net.MalformedURLException e) {
            return null;
        }
        return new String[] {base + ".mp4?v=1", base + ".jpg?v=1"};
    }

    /** Pozadí stránky premiéry: rozmazaná úvodní fotka klipu /img/premiera/pozadi-<název>.webp, jinak null (pak fotka ulice). */
    public static String background(ServletContext ctx, String name) {
        String slug = slug(name);
        if (slug.isEmpty()) return null;
        String path = "/img/premiera/pozadi-" + slug + ".webp";
        try {
            return ctx.getResource(path) != null ? path + "?v=2" : null;   // v: po změně obrázku zvýšit (prohlížeče ho drží v paměti)
        } catch (java.net.MalformedURLException e) {
            return null;
        }
    }

    /** „Musíš odejít“ → „musis-odejit“. */
    static String slug(String name) {
        if (name == null) return "";
        String s = Normalizer.normalize(name, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
        return s.replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
