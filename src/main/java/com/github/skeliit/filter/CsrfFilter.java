package com.github.skeliit.filter;

import com.github.skeliit.I18n;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Set;

/**
 * Ensures every session has a CSRF token (exposed as request attribute "csrf")
 * and rejects state-changing requests that do not carry it.
 *
 * Multipart requests cannot be parsed here (the multipart config belongs to the
 * target servlet), so servlets accepting multipart must call {@link #isValid}.
 */
public class CsrfFilter implements Filter {
    public static final String ATTR = "csrf";
    private static final String HEADER = "X-CSRF-Token";
    private static final SecureRandom RANDOM = new SecureRandom();
    /** Machine-to-machine endpoints authenticated by their own token. */
    private static final Set<String> EXEMPT = Set.of("/api/social-posts");

    @Override public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;
        String path = req.getRequestURI().substring(req.getContextPath().length());

        if (EXEMPT.contains(path)) {
            chain.doFilter(request, response);
            return;
        }

        String method = req.getMethod();
        boolean unsafe = !("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method));
        String contentType = req.getContentType();
        boolean multipart = contentType != null && contentType.toLowerCase().startsWith("multipart/");

        if (unsafe && !multipart && !isValid(req)) {
            // Obyčejný formulář (třeba přihlášení otevřené dlouho v záložce, mezitím vypršela relace):
            // místo holé chyby zpátky na tutéž stránku s čerstvým formulářem a slušnou hláškou nahoře.
            String back = formBack(req);
            if (back != null) {
                req.getSession(true);   // nová relace = nový token pro obnovenou stránku
                resp.setStatus(HttpServletResponse.SC_SEE_OTHER);
                resp.setHeader("Location", back);
                return;
            }
            // skripty na pozadí (fetch s hlavičkou X-CSRF-Token, JSON): krátká chyba
            resp.setStatus(400);
            resp.setContentType("text/plain; charset=UTF-8");
            resp.getWriter().write(I18n.getText(req, "error.csrf"));
            return;
        }

        // Don't create sessions for static assets; pages get the token via header.jsp
        HttpSession session = req.getSession(false);
        if (session != null) req.setAttribute(ATTR, token(session));
        chain.doFilter(request, response);
    }

    /**
     * Kam vrátit odmítnutý obyčejný formulář: cesta stránky, ze které přišel (Referer, jen z tohoto webu),
     * s parametrem csrf=expired (header.jsp ukáže hlášku). null = požadavek od skriptu (má hlavičku tokenu,
     * nechce HTML), ten dostane krátkou chybu.
     */
    static String formBack(HttpServletRequest req) {
        if (req.getHeader(HEADER) != null) return null;
        String accept = String.valueOf(req.getHeader("Accept"));
        if (!accept.contains("text/html")) return null;
        String path = "/";
        String ref = req.getHeader("Referer");
        if (ref != null) {
            try {
                java.net.URI u = java.net.URI.create(ref);
                // jen stejný web (jinak by šlo přesměrovat kamkoli)
                if (u.getHost() != null && sameSite(req, u.getHost()) && u.getRawPath() != null
                        && u.getRawPath().startsWith("/") && !u.getRawPath().startsWith("//")) {
                    String q = u.getRawQuery() == null ? "" : u.getRawQuery().replaceAll("(^|&)csrf=[^&]*", "").replaceAll("^&", "");
                    path = u.getRawPath() + (q.isEmpty() ? "" : "?" + q);
                }
            } catch (IllegalArgumentException e) {
                path = "/";
            }
        }
        return path + (path.contains("?") ? "&" : "?") + "csrf=expired";
    }

    /** Je adresa z tohoto webu? (Za Apachem se porovná i Host / X-Forwarded-Host a adresa z APP_BASE_URL.) */
    private static boolean sameSite(HttpServletRequest req, String host) {
        java.util.List<String> ours = new java.util.ArrayList<>();
        ours.add(req.getServerName());
        for (String h : new String[] { req.getHeader("Host"), req.getHeader("X-Forwarded-Host") }) {
            if (h != null) ours.add(h.split(",")[0].trim().replaceAll(":\\d+$", ""));
        }
        try { ours.add(java.net.URI.create(com.github.skeliit.WebUtils.baseUrl()).getHost()); } catch (Exception ignored) { }
        for (String o : ours) if (o != null && o.equalsIgnoreCase(host)) return true;
        return false;
    }

    /** Returns the session's CSRF token, creating one if needed. */
    public static String token(HttpSession session) {
        Object t = session.getAttribute(ATTR);
        if (t instanceof String s && !s.isEmpty()) return s;
        byte[] b = new byte[32];
        RANDOM.nextBytes(b);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(b);
        session.setAttribute(ATTR, token);
        return token;
    }

    /** Checks the token sent as form field "csrf" or header X-CSRF-Token against the session. */
    public static boolean isValid(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) return false;
        Object expected = session.getAttribute(ATTR);
        String actual = req.getHeader(HEADER);
        if (actual == null || actual.isBlank()) actual = req.getParameter(ATTR);
        // Multipart: Jetty sometimes omits text fields from getParameter until getParts()
        if ((actual == null || actual.isBlank()) && isMultipart(req)) {
            actual = readMultipartField(req, ATTR);
        }
        if (!(expected instanceof String) || actual == null || actual.isBlank()) return false;
        return MessageDigest.isEqual(
                ((String) expected).getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8));
    }

    private static boolean isMultipart(HttpServletRequest req) {
        String ct = req.getContentType();
        return ct != null && ct.toLowerCase().startsWith("multipart/");
    }

    private static String readMultipartField(HttpServletRequest req, String name) {
        try {
            jakarta.servlet.http.Part part = req.getPart(name);
            if (part == null) return null;
            try (java.io.InputStream in = part.getInputStream()) {
                return new String(in.readAllBytes(), StandardCharsets.UTF_8).trim();
            }
        } catch (Exception e) {
            return null;
        }
    }
}
