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
            if (token == null || !same(cookieValue, Tokens.hash(token))) { resp.sendError(404); return; }
            resp.addCookie(cookie(req, new String(cookieValue, StandardCharsets.UTF_8), YEAR));
            resp.sendRedirect("/index.jsp");               // pryč z adresy s klíčem
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
        if (session != null && session.getAttribute("userId") != null) {
            if (session.getAttribute("testLogin") != null) session.setAttribute("signedInAt", System.currentTimeMillis());
            return;                                         // kdo se přihlásil jinak (jiným účtem), tomu se nic nemění
        }
        UserDao.SignInInfo u = new UserDao().signInInfo(username);
        if (u == null) return;
        LoginServlet.signIn(req, u.id, u.username, u.role, u.avatar, true).setAttribute("testLogin", Boolean.TRUE);
    }

    private static String cookieOf(HttpServletRequest req) {
        Cookie[] all = req.getCookies();
        if (all != null) for (Cookie c : all) if (COOKIE.equals(c.getName())) return c.getValue();
        return null;
    }

    private static Cookie cookie(HttpServletRequest req, String value, int maxAge) {
        Cookie c = new Cookie(COOKIE, value);
        c.setHttpOnly(true);
        c.setSecure(req.isSecure() || "https".equalsIgnoreCase(req.getHeader("X-Forwarded-Proto")));
        c.setComment("__SAME_SITE_LAX__");                  // Jetty pošle SameSite=Lax
        c.setPath("/");
        c.setMaxAge(maxAge);
        return c;
    }
}
