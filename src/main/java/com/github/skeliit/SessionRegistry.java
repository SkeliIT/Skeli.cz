package com.github.skeliit;

import jakarta.servlet.annotation.WebListener;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpSessionAttributeListener;
import jakarta.servlet.http.HttpSessionBindingEvent;
import jakarta.servlet.http.HttpSessionEvent;
import jakarta.servlet.http.HttpSessionListener;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Which sessions belong to which signed-in user (the "userId" session attribute), so a user
 * can be signed out on every device at once: "sign out everywhere", after a password change
 * or reset, when the account is deleted. Sessions live in this one Jetty's memory, so does this.
 */
@WebListener
public class SessionRegistry implements HttpSessionListener, HttpSessionAttributeListener {
    private static final Map<Integer, Set<HttpSession>> BY_USER = new ConcurrentHashMap<>();

    @Override
    public void attributeAdded(HttpSessionBindingEvent e) {
        if ("userId".equals(e.getName())) add(e.getValue(), e.getSession());
    }

    @Override
    public void attributeReplaced(HttpSessionBindingEvent e) {
        if (!"userId".equals(e.getName())) return;
        remove(e.getValue(), e.getSession());                     // the old value
        add(e.getSession().getAttribute("userId"), e.getSession());
    }

    @Override
    public void attributeRemoved(HttpSessionBindingEvent e) {
        if ("userId".equals(e.getName())) remove(e.getValue(), e.getSession());
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent e) {
        BY_USER.values().forEach(set -> set.remove(e.getSession()));
    }

    /**
     * Invalidates every session of the user except {@code keep} (null = all of them).
     * Returns how many were signed out.
     */
    public static int signOut(int userId, HttpSession keep) {
        Set<HttpSession> sessions = BY_USER.get(userId);
        if (sessions == null) return 0;
        int n = 0;
        for (HttpSession s : Set.copyOf(sessions)) {
            if (s == keep || (keep != null && s.getId().equals(keep.getId()))) continue;
            try {
                s.invalidate();
                n++;
            } catch (IllegalStateException alreadyGone) {
                // expired meanwhile
            }
            sessions.remove(s);
        }
        return n;
    }

    private static void add(Object userId, HttpSession s) {
        if (userId instanceof Integer id) BY_USER.computeIfAbsent(id, k -> ConcurrentHashMap.newKeySet()).add(s);
    }

    private static void remove(Object userId, HttpSession s) {
        if (userId instanceof Integer id) {
            Set<HttpSession> set = BY_USER.get(id);
            if (set != null) set.remove(s);
        }
    }
}
