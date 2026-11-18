package com.github.skeliit.model;

import java.sql.Timestamp;

/**
 * Jedna karta na časové ose profilu.
 * kind: badge (arg = klíč odznaku), win (arg = obtížnost 1–3), track (arg = název), comment (arg = úryvek), friend (arg = jméno).
 * Doplňky pro velké karty (cokoli může být null): title = název písně nebo videa u komentáře, thumb = náhled,
 * link = kam karta vede (komentář přímo na místě, profil přítele), avatar = fotka přítele,
 * ms / you / kevin = délka a skóre vyhraného zápasu.
 */
public class ActivityItem {
    public final String kind;
    public final String arg;
    public final Timestamp at;
    public String title, thumb, link, avatar;
    public int ms, you, kevin;

    public ActivityItem(String kind, String arg, Timestamp at) {
        this.kind = kind;
        this.arg = arg;
        this.at = at;
    }
}
