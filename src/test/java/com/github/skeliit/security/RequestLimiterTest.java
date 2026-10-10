package com.github.skeliit.security;

import com.github.skeliit.EmailUtil;
import com.github.skeliit.WebUtils;
import com.github.skeliit.web.auth.EmailVerification;
import static org.junit.jupiter.api.Assertions.*;

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
}
