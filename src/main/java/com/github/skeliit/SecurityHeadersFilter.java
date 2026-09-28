package com.github.skeliit;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.annotation.WebListener;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Security headers on every response, and a Secure session cookie on HTTPS deployments.
 *
 * <p>The app sits behind Apache, which terminates TLS, so Jetty itself only sees plain HTTP and
 * cannot tell on its own. {@code HTTPS_ONLY} (default {@code true}) says the site is served over
 * HTTPS: the session cookie gets the Secure flag and HSTS is sent. Local development over
 * http://localhost sets {@code HTTPS_ONLY=false} in .env, otherwise the browser would drop the
 * session cookie and nobody could log in.
 */
@WebFilter(urlPatterns = "/*")
public class SecurityHeadersFilter implements Filter {

    /** Only restrictions that cannot break the page: the inline scripts, YouTube and Spotify stay allowed. */
    static final String CSP = "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";

    static boolean httpsOnly() {
        return !"false".equalsIgnoreCase(Config.get("HTTPS_ONLY", "true").trim());
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse resp = (HttpServletResponse) response;
        resp.setHeader("X-Content-Type-Options", "nosniff");
        resp.setHeader("X-Frame-Options", "SAMEORIGIN");
        resp.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        resp.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
        resp.setHeader("Content-Security-Policy", CSP);
        if (httpsOnly()) {
            // one year; subdomains are left out on purpose (test.skeli.cz decides for itself)
            resp.setHeader("Strict-Transport-Security", "max-age=31536000");
        }
        chain.doFilter(request, response);
    }

    /** The session cookie can only be configured while the web app starts. */
    @WebListener
    public static class SessionCookieSetup implements ServletContextListener {
        @Override
        public void contextInitialized(ServletContextEvent sce) {
            sce.getServletContext().getSessionCookieConfig().setSecure(httpsOnly());
        }
    }
}
