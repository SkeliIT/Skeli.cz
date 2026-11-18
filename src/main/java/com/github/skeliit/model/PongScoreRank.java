package com.github.skeliit.model;

/** Řádek tabulky skóre CatSmash (podle délky zápasu). */
public class PongScoreRank {
    public int place, score, difficulty, you, kevin, len;   // len = délka zápasu (jen u šampionů na úvodu)
    public String username, avatarUrl, frame, mark;   // mark = legendární znak u jména nebo null
    public boolean me;
    public boolean anon;                                // hráč nechce jméno v tabulkách: bez jména, fotky, odkazu, rámečku i znaku
    public boolean pub;                                 // má veřejný profil (jméno v tabulce = odkaz na /hrac/jméno)

    /** Ikona legendárního znaku (pro JSP), nebo null. */
    public String getMarkIcon() { return mark == null ? null : PongBadges.icon(mark); }
}
