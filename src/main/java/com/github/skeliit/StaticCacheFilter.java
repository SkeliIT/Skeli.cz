package com.github.skeliit;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Browser caching for the site's own static files. A file linked with ?v=… (assetVersion) changes its
 * address whenever it changes, so the browser may keep it for a year; anything else for a day.
 */
@WebFilter(urlPatterns = {"/css/*", "/js/*", "/img/*", "/fonts/*", "/vendor/*", "/favicon.ico", "/favicon.svg", "/apple-touch-icon.png"})
public class StaticCacheFilter implements Filter {

    static String cacheControl(String query) {
        boolean versioned = query != null && (query.startsWith("v=") || query.contains("&v="));
        return versioned ? "public, max-age=31536000, immutable" : "public, max-age=86400";
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        if ("GET".equals(req.getMethod()) || "HEAD".equals(req.getMethod())) {
            ((HttpServletResponse) response).setHeader("Cache-Control", cacheControl(req.getQueryString()));
        }
        chain.doFilter(request, response);
    }
}
