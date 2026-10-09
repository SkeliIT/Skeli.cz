package com.github.skeliit.web.api;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class KevinBarsTest {

    @Test
    void picksTwoNeighbouringRealLines() {
        String text = "Refrén:\nhledám sebe sám a nevím kde mám začít\nnevím, co vše ze mě zbylo, jestli jsem to ještě já\n\nkrátké";
        List<String> bars = KevinBarsServlet.pickBars(text);
        assertEquals(List.of("hledám sebe sám a nevím kde mám začít", "nevím, co vše ze mě zbylo, jestli jsem to ještě já"), bars);
    }

    @Test
    void skipsRepeatsLabelsAndEscapedNewlines() {
        assertTrue(KevinBarsServlet.pickBars("stejný řádek se opakuje\nstejný řádek se opakuje").isEmpty());
        assertTrue(KevinBarsServlet.pickBars("[Sloka 1]\nčtrnáct znaků a víc tady").isEmpty());
        assertEquals(2, KevinBarsServlet.pickBars("první řádek je dost dlouhý\\ndruhý řádek taky dost dlouhý").size());
        assertTrue(KevinBarsServlet.pickBars(null).isEmpty());
    }
}
