package com.github.skeliit;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SearchTest {

    @Test
    void findsTheLineWithoutCaseOrAccents() {
        String text = "Cejtíš ten chlad\nTělo bez duše a duše bez těla\nkonec";
        assertEquals("Tělo bez duše a duše bez těla", SearchServlet.matchingLine(text, "telo bez DUSE"));
        assertEquals("Tělo bez duše a duše bez těla", SearchServlet.matchingLine(text.replace("\n", "\\n"), "duše bez"));
    }

    @Test
    void nothingWhenTheTextDoesNotContainIt() {
        assertNull(SearchServlet.matchingLine("jen jeden řádek", "jiný"));
        assertNull(SearchServlet.matchingLine(null, "x"));
        assertNull(SearchServlet.matchingLine("text", " "));
    }
}
