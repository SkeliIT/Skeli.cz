package com.github.skeliit.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Výsledek rozboru rýmů jednoho textu (service/rhyme/RhymeAnalyzer). Obyčejná třída s gettery, aby ji JSP přečetlo.
 * Skóre 0–100, úroveň odznaku (null = zatím nic) a rozpis po verších pro zobrazení „proč“.
 */
public class RhymeReport {

    /** Druh rýmu dvou veršů, od nejlepšího. Klíč překladu je „rhyme.kind.“ + name().toLowerCase(). */
    public enum Kind { BOHATY, CISTY, PRIBLIZNY, ASONANCE, GRAMATICKY, IDENTICKY, ZADNY }

    /** Jeden verš a jeho nejlepší rýmový partner. */
    public static class Line {
        private final int index;
        private final String text;
        private String letter = "";
        private int partner = -1;
        private double quality;
        private int depth;
        private Kind kind = Kind.ZADNY;
        private boolean internalRhyme;
        private boolean repeated;

        public Line(int index, String text) {
            this.index = index;
            this.text = text;
        }

        public int getIndex() { return index; }
        public String getText() { return text; }
        /** Písmeno ve schématu (A, B, …); prázdné u opakovaných veršů. */
        public String getLetter() { return letter; }
        /** Index verše, se kterým se rýmuje nejlépe, nebo -1. */
        public int getPartner() { return partner; }
        /** Kvalita rýmu s partnerem 0–1. */
        public double getQuality() { return quality; }
        /** Kolik slabik od konce se shoduje (samohláskou). */
        public int getDepth() { return depth; }
        public Kind getKind() { return kind; }
        public String getKindKey() { return "rhyme.kind." + kind.name().toLowerCase(java.util.Locale.ROOT); }
        public boolean isInternalRhyme() { return internalRhyme; }
        /** Doslova opakovaný verš (refrén) – do skóre se nepočítá. */
        public boolean isRepeated() { return repeated; }
        public boolean isRhymed() { return kind != Kind.ZADNY && quality >= 0.45; }

        public void setLetter(String letter) { this.letter = letter; }
        public void setPartner(int partner) { this.partner = partner; }
        public void setQuality(double quality) { this.quality = quality; }
        public void setDepth(int depth) { this.depth = depth; }
        public void setKind(Kind kind) { this.kind = kind; }
        public void setInternalRhyme(boolean internalRhyme) { this.internalRhyme = internalRhyme; }
        public void setRepeated(boolean repeated) { this.repeated = repeated; }
    }

    private final List<Line> lines = new ArrayList<>();
    private final List<String> hints = new ArrayList<>();
    private int score;
    private String badge;
    private int countedLines;
    private double coverage;
    private double avgQuality;
    private double richness;
    private double internalRate;
    private double variety = 1;

    public List<Line> getLines() { return lines; }
    /** Klíče překladů s radami, co zlepšit („rhyme.hint.…“). */
    public List<String> getHints() { return hints; }
    public int getScore() { return score; }
    /** Klíč odznaku ze SiteBadges („s_rhyme“, „s_rhyme_master“) nebo null. */
    public String getBadge() { return badge; }
    public int getCountedLines() { return countedLines; }
    /** Podíl veršů, které se s něčím rýmují. */
    public double getCoverage() { return coverage; }
    public double getAvgQuality() { return avgQuality; }
    /** Bohatost rýmů 0–1 (vícezvukové a víceslabičné shody). */
    public double getRichness() { return richness; }
    /** Podíl veršů s vnitřním rýmem. */
    public double getInternalRate() { return internalRate; }
    /** Pestrost rýmů 0–1 (1 = nerýmuje se pořád na totéž). */
    public double getVariety() { return variety; }

    /** Schéma, např. „AABB CCDD“ (mezera po každé čtveřici započtených veršů). */
    public String getScheme() {
        StringBuilder sb = new StringBuilder();
        int n = 0;
        for (Line l : lines) {
            if (l.isRepeated()) continue;
            if (n > 0 && n % 4 == 0) sb.append(' ');
            sb.append(l.getLetter().isEmpty() ? "-" : l.getLetter());
            n++;
        }
        return sb.toString();
    }

    public void setScore(int score) { this.score = score; }
    public void setBadge(String badge) { this.badge = badge; }
    public void setCountedLines(int countedLines) { this.countedLines = countedLines; }
    public void setCoverage(double coverage) { this.coverage = coverage; }
    public void setAvgQuality(double avgQuality) { this.avgQuality = avgQuality; }
    public void setRichness(double richness) { this.richness = richness; }
    public void setInternalRate(double internalRate) { this.internalRate = internalRate; }
    public void setVariety(double variety) { this.variety = variety; }
}
