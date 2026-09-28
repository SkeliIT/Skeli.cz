package com.github.skeliit;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class EscapeJsTest {
    @Test
    void escapesQuotesAndHtml() {
        String out = WebUtils.escapeJs("I don't <b>\"x\"</b> & `y`");
        assertFalse(out.contains("'"));
        assertFalse(out.contains("\""));
        assertFalse(out.contains("<"));
        assertFalse(out.contains("&"));
        assertFalse(out.contains("`"));
        assertEquals("I don\\u0027t", WebUtils.escapeJs("I don't"));
    }

    @Test
    void escapesBackslashAndNewline() {
        assertEquals("a\\\\b\\nc", WebUtils.escapeJs("a\\b\nc"));
    }

    @Test
    void nullSafe() {
        assertEquals("", WebUtils.escapeJs(null));
    }
}
