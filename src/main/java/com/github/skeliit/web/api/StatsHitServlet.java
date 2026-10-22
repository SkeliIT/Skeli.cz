package com.github.skeliit.web.api;

import com.github.skeliit.service.MarketingStats;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Sem posílá js/presence.js drobné události pro statistiky (MarketingStats). Vždy odpoví 204 (bez obsahu).
 * GET /api/hit?k=visit&ref=<adresa webu, odkud přišel>&z=<štítek kampaně>   začátek návštěvy
 * GET /api/hit?k=out&t=spotify|apple|youtube|instagram|facebook|tiktok&p=<druh stránky>   kliknutí ven
 * GET /api/hit?k=search&q=<výraz>&f=1|0   hledání v Textech (f = našlo se něco)
 * GET místo POST: jde jen o počítadlo a prohlížeč ho pošle i ve chvíli, kdy člověk odchází ze stránky.
 */
@WebServlet(name = "StatsHitServlet", urlPatterns = {"/api/hit"})
public class StatsHitServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        switch (String.valueOf(req.getParameter("k"))) {
            case "visit" -> MarketingStats.visit(req, req.getParameter("ref"), req.getParameter("z"));
            case "out" -> MarketingStats.out(req, req.getParameter("t"), req.getParameter("p"));
            case "search" -> MarketingStats.search(req, req.getParameter("q"), "1".equals(req.getParameter("f")));
            default -> { }
        }
        resp.setHeader("Cache-Control", "no-store");
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }
}
