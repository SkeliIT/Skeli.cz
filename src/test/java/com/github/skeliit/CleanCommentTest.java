package com.github.skeliit;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class CleanCommentTest {

    @Test
    void trimsAndNormalizesLineBreaks() {
        assertEquals("první\ndruhý", WebUtils.cleanComment("  první\r\ndruhý \r\n"));
    }

    @Test
    void rejectsEmptyAndTooLong() {
        assertNull(WebUtils.cleanComment("   \r\n "));
        assertNull(WebUtils.cleanComment(null));
        assertNull(WebUtils.cleanComment("x".repeat(WebUtils.COMMENT_MAX_LENGTH + 1)));
        assertNotNull(WebUtils.cleanComment("x".repeat(WebUtils.COMMENT_MAX_LENGTH)));
    }
}
