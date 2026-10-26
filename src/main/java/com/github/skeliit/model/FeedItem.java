package com.github.skeliit.model;

import java.time.Instant;

/**
 * Jedna položka RSS/Atom feedu (/{lang}/feed/*). Record smí být, feed nekreslí JSP.
 *
 * @param id        stálé tag: URI; stejné video/short má stejné id ve všech feedech
 * @param title     prostý text
 * @param link      absolutní adresa stránky položky
 * @param summary   prostý text, může chybět
 * @param imageUrl  absolutní adresa náhledu, může chybět
 * @param published první zveřejnění, může chybět (řadí se na konec)
 * @param updated   poslední změna, jinak published
 * @param category  song | video | short | instagram | facebook …
 * @param videoId   YouTube id pro media:player, může chybět
 */
public record FeedItem(String id, String title, String link, String summary, String imageUrl,
                       Instant published, Instant updated, String category, String videoId) {

    public Instant updatedOrPublished() {
        return updated != null ? updated : published;
    }
}
