package com.github.skeliit.security;

import com.github.skeliit.EmailUtil;
import com.github.skeliit.WebUtils;
import com.github.skeliit.model.CommentView;
import com.github.skeliit.web.auth.EmailVerification;
import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

class RequestLimiterTest {

    @Test
    void allowsUpToTheLimitPerKey() {
        RequestLimiter.clear();
        for (int i = 0; i < 3; i++) assertTrue(RequestLimiter.tryAcquire("t", "a", 3, RequestLimiter.MINUTE));
        assertFalse(RequestLimiter.tryAcquire("t", "a", 3, RequestLimiter.MINUTE));
        assertTrue(RequestLimiter.tryAcquire("t", "b", 3, RequestLimiter.MINUTE), "other keys are counted separately");
        assertTrue(RequestLimiter.tryAcquire("other", "a", 3, RequestLimiter.MINUTE), "other buckets too");
    }

    @Test
    void verificationIsOnlyRequiredWithSmtp() {
        // without SMTP nobody could receive the link, so nobody is blocked
        org.junit.jupiter.api.Assumptions.assumeFalse(EmailUtil.isConfigured(), "SMTP is configured here");
        assertFalse(EmailVerification.isRequired());
        assertTrue(EmailVerification.isVerified(null));
    }

    @Test
    void localAddresses() {
        assertTrue(WebUtils.isLocalAddress("127.0.0.1"));
        assertTrue(WebUtils.isLocalAddress("0:0:0:0:0:0:0:1"));
        assertTrue(WebUtils.isLocalAddress("[0:0:0:0:0:0:0:1]"), "Jetty reports IPv6 in brackets");
        assertTrue(WebUtils.isLocalAddress("::1"));
        assertFalse(WebUtils.isLocalAddress("203.0.113.9"));
        assertFalse(WebUtils.isLocalAddress("localhost"), "host names are not trusted");
        assertFalse(WebUtils.isLocalAddress(null));
    }

    private static CommentView c(int id, Integer parent) {
        CommentView v = new CommentView();
        v.id = id;
        v.parentId = parent;
        return v;
    }

    @Test
    void repliesAreNestedOldestFirst() {
        // DAO order: newest first
        List<CommentView> rows = new ArrayList<>(List.of(c(5, 1), c(4, null), c(3, 1), c(2, 99), c(1, null)));
        List<CommentView> threads = com.github.skeliit.dao.LyricDaoAccess.threads(rows);
        assertEquals(List.of(4, 1), threads.stream().map(v -> v.id).toList());
        assertEquals(List.of(3, 5), threads.get(1).replies.stream().map(v -> v.id).toList());
        assertTrue(threads.get(0).replies.isEmpty());
    }
}
