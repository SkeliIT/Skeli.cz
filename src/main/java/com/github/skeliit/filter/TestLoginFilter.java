package com.github.skeliit.filter;

import com.github.skeliit.Config;
import com.github.skeliit.WebUtils;
import com.github.skeliit.dao.UserDao;
import com.github.skeliit.security.Tokens;
import com.github.skeliit.web.auth.LoginServlet;
import jakarta.servlet.*;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.SQLException;
import java.util.Locale;

/**
 * Jen testovací web: majitel chce hledat chyby i v adminu, aniž by se pořád přihlašoval.
 * Tajný odkaz /test-login?token=… uloží do prohlížeče cookie a od té doby je tenhle prohlížeč přihlášený jako
 * TEST_LOGIN_USER (výchozí skelimc). Odhlásit = cookie pryč, web se pak chová jako pro nepřihlášeného.
 * Ostatní návštěvníci testu nepoznají nic: bez cookie se nic neděje a adresa bez správného klíče vrací 404.
 *
 * Na www se to nesmí nikdy zapnout: běží jen s klíčem TEST_LOGIN_TOKEN v .env a jen když APP_BASE_URL míří na test
 * nebo na vlastní počítač (na www by tedy nezabral, ani kdyby se tam klíč omylem dostal).
 */
public class TestLoginFilter implements Filter {
    static final String COOKIE = "skeliTestLogin";
    private static final int YEAR = 60 * 60 * 24 * 365;

    private byte[] cookieValue;   // null = vypnuto
    private String username;

    /** Smí to běžet? Dlouhý klíč a web, který je opravdu testovací. */
    static boolean allowed(String token, String baseUrl) {
        if (token == null || token.length() < 32 || baseUrl == null) return false;
        try {
            String host = URI.create(baseUrl).getHost();
            if (host == null) return false;
            host = host.toLowerCase(Locale.ROOT);
            return host.equals("test.skeli.cz") || host.equals("localhost") || host.equals("127.0.0.1");
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /** Porovnání, ze kterého se podle času odpovědi nedá klíč uhodnout. */
    static boolean same(byte[] expected, String given) {
        return given != null && MessageDigest.isEqual(expected, given.getBytes(StandardCharsets.UTF_8));
    }

    @Override public void init(FilterConfig config) {
        String token = Config.get("TEST_LOGIN_TOKEN");
        if (allowed(token, WebUtils.baseUrl())) {
            cookieValue = Tokens.hash(token).getBytes(StandardCharsets.UTF_8);   // v prohlížeči je jen otisk klíče
            username = Config.get("TEST_LOGIN_USER", "skelimc");
        }
    }

    @Override public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        if (cookieValue == null) { chain.doFilter(request, response); return; }
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;
        String path = req.getRequestURI();
        if ("/test-login".equals(path)) {
            String token = req.getParameter("token");
            if (token != null && same(cookieValue, Tokens.hash(token))) {
                // přihlásit hned a napevno: staré sezení v prohlížeči nesmí překážet
                HttpSession old = req.getSession(false);
                if (old != null) old.invalidate();
                try { signIn(req); } catch (SQLException e) { throw new ServletException(e); }
                resp.addCookie(cookie(req, new String(cookieValue, StandardCharsets.UTF_8), YEAR));
                resp.sendRedirect("/test-login?stav=1");   // pryč z adresy s klíčem, výsledek je vidět
                return;
            }
            // stránka s výsledkem jen pro prohlížeč s cookie, ostatním 404 jako by tu nic nebylo
            if (req.getParameter("stav") != null && same(cookieValue, cookieOf(req))) { status(req, resp); return; }
            resp.sendError(404);
            return;
        }
        if (same(cookieValue, cookieOf(req))) {
            if ("/logout".equals(path) && "POST".equals(req.getMethod())) {
                resp.addCookie(cookie(req, "", 0));         // odhlášení platí: dál se hledají chyby jako nepřihlášený
            } else {
                try { keepSignedIn(req); } catch (SQLException e) { throw new ServletException(e); }
            }
        }
        chain.doFilter(request, response);
    }

    /** Přihlásí, když nikdo přihlášený není; adminovi obnoví čas přihlášení (jinak by ho AdminFilter po 12 h vyhodil). */
    private void keepSignedIn(HttpServletRequest req) throws SQLException {
        HttpSession session = req.getSession(false);
        if (session != null && session.getAttribute("userId") != null && session.getAttribute("username") != null) {
            if (session.getAttribute("testLogin") != null) session.setAttribute("signedInAt", System.currentTimeMillis());
            return;                                         // kdo se přihlásil jinak (jiným účtem), tomu se nic nemění
        }
        signIn(req);
    }

    private void signIn(HttpServletRequest req) throws SQLException {
        UserDao.SignInInfo u = new UserDao().signInInfo(username);
        if (u == null) return;
        LoginServlet.signIn(req, u.id, u.username, u.role, u.avatar, true).setAttribute("testLogin", Boolean.TRUE);
    }

    /** Krátká stránka pro majitele: co prohlížeč poslal a jestli je přihlášený (jen názvy cookies, ne hodnoty). */
    private void status(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {
        try { keepSignedIn(req); } catch (SQLException e) { throw new ServletException(e); }
        HttpSession s = req.getSession(false);
        Object user = s == null ? null : s.getAttribute("username"), role = s == null ? null : s.getAttribute("role");
        StringBuilder names = new StringBuilder();
        if (req.getCookies() != null) for (Cookie c : req.getCookies()) names.append(c.getName()).append(' ');
        resp.setContentType("text/html;charset=UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        resp.getWriter().write("<!DOCTYPE html><meta charset=utf-8><meta name=viewport content='width=device-width'><title>Přihlášení na testu</title>"
                + "<body style='font:18px sans-serif;background:#111;color:#eee;padding:24px'>"
                + "<h1 style='color:#ffd23f'>" + (user != null ? "Přihlášeno" : "Nepřihlášeno") + "</h1>"
                + "<p>Účet: " + WebUtils.escapeHtml(String.valueOf(user)) + " · role: " + WebUtils.escapeHtml(String.valueOf(role)) + "</p>"
                + "<p>Cookies v prohlížeči: " + WebUtils.escapeHtml(names.toString()) + "</p>"
                + "<p><a style='color:#ffd23f' href='/index.jsp'>Pokračovat na web</a> · <a style='color:#ffd23f' href='/uzivatel.jsp'>Můj profil</a> · <a style='color:#ffd23f' href='/admin.jsp'>Admin</a></p>");
    }

    private static String cookieOf(HttpServletRequest req) {
        Cookie[] all = req.getCookies();
        if (all != null) for (Cookie c : all) if (COOKIE.equals(c.getName())) return c.getValue();
        return null;
    }

    private static Cookie cookie(HttpServletRequest req, String value, int maxAge) {
        Cookie c = new Cookie(COOKIE, value);
        c.setHttpOnly(true);
        c.setSecure(req.isSecure() || "https".equalsIgnoreCase(req.getHeader("X-Forwarded-Proto")) || SecurityHeadersFilter.httpsOnly());
        c.setComment("__SAME_SITE_LAX__");                  // Jetty pošle SameSite=Lax
        c.setPath("/");
        c.setMaxAge(maxAge);
        return c;
    }
}
