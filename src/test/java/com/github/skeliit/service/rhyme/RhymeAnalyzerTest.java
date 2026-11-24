package com.github.skeliit.service.rhyme;

import com.github.skeliit.model.RhymeReport;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Rozbor rýmů: výslovnost, páry veršů a kalibrace skóre na ukázkách (Máj a Vodník jsou volná díla, rap je vlastní). */
class RhymeAnalyzerTest {

    private static final String MAJ = """
            Byl pozdní večer – první máj –
            večerní máj – byl lásky čas.
            Hrdliččin zval ku lásce hlas,
            kde borový zaváněl háj.
            O lásce šeptal tichý mech;
            květoucí strom lhal lásky žel,
            svou lásku slavík růži pěl,
            růžinu jevil vonný vzdech.
            """;

    private static final String RAP = """
            [Sloka 1]
            Za to všechno, co jsem prožil, to za to stálo,
            i když lidi kolem říkali, že je to málo.
            Nesu v sobě oheň, co mi nikdo neuhasí,
            píšu dál, i když mi řeknou, že to nemá smysl asi.
            Stojím na kraji a koukám dolů na město,
            v ruce držím sny, co kynou pomalu jak těsto.
            Kdo mě zná, ten ví, že nikdy nejdu zpátky,
            i když život někdy rozdá karty, co jsou krátký.
            Ráno vstávám, makám, nečekám na zázrak,
            večer sedím sám a v hlavě nosím mrak.
            """;

    private static final String PROSA = """
            Dnes jsem šel ráno do obchodu koupit chleba.
            Prodavačka mi řekla, že už ho nemají.
            Tak jsem si vzal rohlíky a mléko.
            Cestou domů začalo pršet a já neměl deštník.
            Doma jsem uvařil kafe a přečetl noviny.
            Odpoledne přijela sestra s dětmi na návštěvu.
            Večer jsme hráli karty a smáli se.
            Pak jsem šel spát, protože jsem byl unavený.
            """;

    private static final String IDENTICKE = """
            Jdu po ulici sám
            a nevím, kde to mám.
            Mám v hlavě jenom tmu,
            a v srdci zase tmu.
            Svítí lampa nad cestou,
            jdu dál svou cestou.
            Kdo ví, kam to vede dál,
            já to nevím, šel jsem dál.
            """;

    @Test
    void vyslovnost() {
        assertEquals(List.of("v", "z", "d", "u", "ch"), CzechPhonetics.phonemes("vzduch"));
        assertEquals(List.of("b", "ú", "ch"), CzechPhonetics.phonemes("bůh"));
        assertEquals(List.of("g", "d", "e"), CzechPhonetics.phonemes("kde"));
        assertEquals(List.of("s", "v", "j", "e", "t"), CzechPhonetics.phonemes("svět"));
        assertEquals(List.of("ď", "í", "ť", "e"), CzechPhonetics.phonemes("dítě"));
        assertEquals(List.of("m", "ň", "e", "s", "t", "o"), CzechPhonetics.phonemes("město"));
        assertEquals(List.of("s", "m", "R", "t"), CzechPhonetics.phonemes("smrt"));
        assertEquals(2, CzechPhonetics.syllables(CzechPhonetics.phonemes("nesl")));
    }

    @Test
    void zvukNePismena() {
        // rýmuje se výslovnost: y/i, ů/ú, koncové h = ch
        assertTrue(RhymeAnalyzer.quality("tak tady byl", "a pak jsem pil") >= 0.68);
        // Bůh ~ vzduch: konec zní stejně (ch), jen délka ú/u se liší → přibližný rým
        assertTrue(RhymeAnalyzer.quality("věřím, že je Bůh", "nadechnu se vzduch") >= RhymeAnalyzer.RHYME_MIN);
        assertTrue(RhymeAnalyzer.quality("věřím, že je Bůh", "nadechnu se vzduch")
                > RhymeAnalyzer.quality("věřím, že je Bůh", "nadechnu se vzdor"));
    }

    @Test
    void parVersu() {
        assertTrue(RhymeAnalyzer.quality("na topole nad jezerem", "seděl vodník pod večerem") >= 0.8, "víceslabičný rým");
        assertTrue(RhymeAnalyzer.quality("mám v hlavě zlato", "stálo to za to") >= 0.8, "rým přes hranici slov");
        assertTrue(RhymeAnalyzer.quality("tekla voda", "to je škoda") >= 0.8, "ženský rým");
        assertTrue(RhymeAnalyzer.quality("byl první máj", "zaváněl háj") >= 0.68, "čistý mužský rým");
        assertTrue(RhymeAnalyzer.quality("šel jsem lesem do les", "a v ruce nesu led") < RhymeAnalyzer.RHYME_MIN,
                "jiná koncová souhláska je jen asonance");
        assertTrue(RhymeAnalyzer.quality("přišla žena", "chytil rybu, rybka ryba") < RhymeAnalyzer.RHYME_MIN,
                "shoda jen v poslední samohlásce není rým");
        assertTrue(RhymeAnalyzer.quality("přijela", "sestra") < 0.68, "u otevřeného konce rozhodují souhlásky mezi samohláskami");
    }

    @Test
    void identickyRym() {
        RhymeReport r = RhymeAnalyzer.analyze(IDENTICKE);
        assertEquals(RhymeReport.Kind.IDENTICKY, r.getLines().get(2).getKind());
        assertEquals(RhymeReport.Kind.IDENTICKY, r.getLines().get(6).getKind(), "kam to vede dál / šel jsem dál");
        assertTrue(r.getHints().contains("rhyme.hint.identical"));
        assertNull(r.getBadge());
        // stejné slovo na konci, ale před ním se rýmuje i zbytek: to už identický rým není
        assertTrue(RhymeAnalyzer.quality("v hlavě mám to", "ty to dáš? dám to") >= RhymeAnalyzer.RHYME_MIN);
    }

    @Test
    void schemaANadpisy() {
        assertEquals("ABBA CDDC", RhymeAnalyzer.analyze(MAJ).getScheme());
        RhymeReport r = RhymeAnalyzer.analyze(RAP);
        assertEquals(10, r.getCountedLines(), "[Sloka 1] není verš");
        assertEquals("AABB CCDD EE", r.getScheme());
        assertTrue(r.getLines().get(8).isInternalRhyme(), "vstávám, makám, nečekám");
    }

    @Test
    void refrenSeNepocita() {
        String t = "Jdu ulicí a svítí den,\nnesu v sobě dávný sen.\nJdu ulicí a svítí den,\nJdu ulicí a svítí den (2x)\n";
        RhymeReport r = RhymeAnalyzer.analyze(t);
        assertEquals(2, r.getCountedLines());
        assertTrue(r.getLines().get(2).isRepeated());
    }

    @Test
    void kalibraceOdznaku() {
        RhymeReport maj = RhymeAnalyzer.analyze(MAJ);
        RhymeReport rap = RhymeAnalyzer.analyze(RAP);
        RhymeReport prosa = RhymeAnalyzer.analyze(PROSA);
        assertEquals("s_rhyme", maj.getBadge(), "Máj: všude čisté, ale jednoduché rýmy (" + maj.getScore() + ")");
        assertEquals("s_rhyme_master", rap.getBadge(), "rap s víceslabičnými rýmy (" + rap.getScore() + ")");
        assertNull(prosa.getBadge(), "próza (" + prosa.getScore() + ")");
        assertTrue(prosa.getScore() < 45);
        assertTrue(rap.getScore() > maj.getScore());
    }

    @Test
    void kratkyTextOdznakNedostane() {
        RhymeReport r = RhymeAnalyzer.analyze("Na topole nad jezerem\nseděl vodník pod večerem");
        assertNull(r.getBadge());
        assertTrue(r.getHints().contains("rhyme.hint.short"));
    }

    @Test
    void prazdnyText() {
        assertEquals(0, RhymeAnalyzer.analyze("").getScore());
        assertEquals(0, RhymeAnalyzer.analyze(null).getCountedLines());
        assertEquals(0, RhymeAnalyzer.analyze("123\n...\n[Refrén]").getCountedLines());
    }
}
