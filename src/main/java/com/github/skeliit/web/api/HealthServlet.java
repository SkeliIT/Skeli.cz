package com.github.skeliit.web.api;

import com.github.skeliit.service.SecretBox;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Běží web v pořádku? 200 "ok", jinak 503 a krátký důvod (bez tajných hodnot):
 * "encryption: missing" = chybí DATA_KEY, "encryption: mismatch" = DATA_KEY je jiný než dřív, "encryption: db" = nejde DB.
 * Kontroluje ho smoke test při nasazení (deploy/remote-deploy.sh): web bez šifrování se nenasadí, vrátí se předchozí verze.
 */
@WebServlet("/healthz")
public class HealthServlet extends HttpServlet {
    @Override protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("text/plain; charset=UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        String crypto = SecretBox.health();
        if (!"ok".equals(crypto)) {
            resp.setStatus(503);
            resp.getWriter().println("encryption: " + crypto);
            return;
        }
        resp.getWriter().println("ok");
    }
}
