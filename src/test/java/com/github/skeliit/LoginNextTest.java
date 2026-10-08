package com.github.skeliit;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LoginNextTest {

    @Test
    void onlyPagesOfThisSiteAreAllowed() {
        assertEquals("/admin.jsp", LoginServlet.safeNext("/admin.jsp"));
        assertEquals("/admin/songs?id=3", LoginServlet.safeNext("/admin/songs?id=3"));
        assertNull(LoginServlet.safeNext(null));
        assertNull(LoginServlet.safeNext("https://evil.example/"));
        assertNull(LoginServlet.safeNext("//evil.example/"));
        assertNull(LoginServlet.safeNext("/\\evil.example"));
        assertNull(LoginServlet.safeNext("/a\"><script>"));
        assertNull(LoginServlet.safeNext("admin.jsp"));
    }
}
