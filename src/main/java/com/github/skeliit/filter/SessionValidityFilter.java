package com.github.skeliit.filter;

import com.github.skeliit.Db;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

/**
 * Ends sign-ins that were cut off while the server wasn't holding them in memory: sessions are kept
 * in files across restarts, so SessionRegistry (memory only) can miss them. The account's
 * users.sessions_valid_after says since when sign-ins count; an older session is invalidated here.
 * The value is read from the database once per user and kept in memory (SessionRegistry updates it).
 * Registered in web.xml, right after RelativeRedirectFilter and before AdminFilter.
 */
public class SessionValidityFilter implements Filter {

    private static final Logger LOG = Logger.getLogger(SessionValidityFilter.class.getName());
    private static final Map<Integer, Long> VALID_AFTER = new ConcurrentHashMap<>();

    /** True when a sign-in made at {@code signedInAt} no longer counts. */
    static boolean isStale(Object signedInAt, long validAfter) {
        long at = signedInAt instanceof Long t ? t : 0L;   // sessions from before this check: time 0
        return validAfter > 0 && at < validAfter;
    }

    /** Sign-ins of this user made before now end (called by SessionRegistry.signOut). */
    public static long cutOff(int userId) {
        long now = System.currentTimeMillis();
        VALID_AFTER.put(userId, now);
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement("UPDATE users SET sessions_valid_after = ? WHERE id = ?")) {
            ps.setLong(1, now);
            ps.setInt(2, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            // the in-memory value still covers this run of the server
            LOG.warning("could not store the sign-out cut-off for user " + userId + ": " + e.getMessage());
        }
        return now;
    }

    private static long validAfter(int userId) throws SQLException {
        Long cached = VALID_AFTER.get(userId);
        if (cached != null) return cached;
        long v = 0;
        try (Connection c = Db.get();
             PreparedStatement ps = c.prepareStatement("SELECT sessions_valid_after FROM users WHERE id = ?")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) v = rs.getLong(1);   // NULL -> 0: no cut-off yet
            }
        }
        VALID_AFTER.put(userId, v);
        return v;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpSession s = ((HttpServletRequest) request).getSession(false);
        if (s != null && s.getAttribute("userId") instanceof Integer uid) {
            try {
                if (isStale(s.getAttribute("signedInAt"), validAfter(uid))) s.invalidate();
            } catch (SQLException | IllegalStateException e) {
                // database unreachable or the session already gone: let the request go on
            }
        }
        chain.doFilter(request, response);
    }
}
