package com.github.skeliit.model;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * A song name split for lists: the title itself and a smaller credits line.
 * "JML - No ty vole ft. Farri, Skeli, Babaraptor" → "No ty vole" + "JML · ft. Farri, Skeli, Babaraptor";
 * "Trosky (feat. Babar)" → "Trosky" + "ft. Babar"; "Skeli - Ježíšku panáčku" → "Ježíšku panáčku" + "".
 * A class, not a record: the JSP compiler cannot handle records.
 */
public final class SongTitle {
    public final String title;
    public final String credits;

    private SongTitle(String title, String credits) {
        this.title = title;
        this.credits = credits;
    }

    public String getTitle() { return title; }
    public String getCredits() { return credits; }

    private static final Pattern PROD = Pattern.compile("(?i)\\s*[(\\[]\\s*prod\\.?[^)\\]]*[)\\]]");
    private static final Pattern FEAT = Pattern.compile("(?i)\\s*[(\\[]?\\s*\\b(?:ft|feat)(?:\\.\\s*|\\s+)([^)\\]]+?)\\s*[)\\]]?\\s*$");

    public static SongTitle of(String name) {
        if (name == null || name.isBlank()) return new SongTitle(name == null ? "" : name.trim(), "");
        String rest = PROD.matcher(name).replaceAll("").trim();
        String artist = null;
        int dash = rest.indexOf(" - ");
        if (dash > 0) {
            artist = rest.substring(0, dash).trim();
            rest = rest.substring(dash + 3).trim();
            if (artist.equalsIgnoreCase("skeli")) artist = null;
        }
        String feat = null;
        Matcher m = FEAT.matcher(rest);
        if (m.find() && m.start() > 0) {
            feat = m.group(1).trim();
            rest = rest.substring(0, m.start()).trim();
        }
        if (rest.isEmpty()) return new SongTitle(name.trim(), "");
        StringBuilder credits = new StringBuilder();
        if (artist != null && !artist.isEmpty()) credits.append(artist);
        if (feat != null && !feat.isEmpty()) {
            if (credits.length() > 0) credits.append(" · ");
            credits.append("ft. ").append(feat);
        }
        return new SongTitle(rest, credits.toString());
    }
}
