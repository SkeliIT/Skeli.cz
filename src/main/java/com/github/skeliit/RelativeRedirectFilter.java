package com.github.skeliit;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;

import java.io.IOException;

/**
 * Redirects keep the visitor on the same scheme and host. Behind Apache the app only sees
 * plain http from 127.0.0.1, so Jetty turned {@code sendRedirect("index.jsp")} into
 * {@code http://skeli.cz/index.jsp}: after signing in the browser left https for a moment,
 * the Secure session cookie was not sent and the page still looked signed out. Here a
 * redirect inside the site goes out as a path ({@code Location: /index.jsp}), which the
 * browser resolves against the https address it is on.
 */
public class RelativeRedirectFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain) throws IOException, ServletException {
        if (!(req instanceof HttpServletRequest hreq) || !(resp instanceof HttpServletResponse hresp)) {
            chain.doFilter(req, resp);
            return;
        }
        chain.doFilter(req, new HttpServletResponseWrapper(hresp) {
            @Override
            public void sendRedirect(String location) throws IOException {
                String path = sitePath(hreq.getRequestURI(), location);
                if (path == null) {
                    super.sendRedirect(location);
                    return;
                }
                if (isCommitted()) throw new IllegalStateException("Response already committed");
                resetBuffer();
                setStatus(SC_FOUND);
                setHeader("Location", path);
            }
        });
    }

    /**
     * The path to send for a redirect to {@code location} from {@code requestUri}, or null when
     * the location already names a scheme or a host (another site: left as it is).
     */
    static String sitePath(String requestUri, String location) {
        if (location == null || location.startsWith("//") || location.matches("(?i)^[a-z][a-z0-9+.-]*:.*")) return null;
        if (location.startsWith("/")) return location;
        String uri = requestUri == null || requestUri.isEmpty() ? "/" : requestUri;
        String dir = uri.substring(0, uri.lastIndexOf('/') + 1);
        if (location.isEmpty()) return uri;
        if (location.startsWith("?") || location.startsWith("#")) return uri + location;
        return dir + location;
    }
}
