# Rozbor rýmů (prototyp)

Analyzátor kvality českých rýmů pro budoucí odznak za verše. Zatím **není zapojený** do webu: nemá migraci,
servlet, JSP ani překlady. Je to samostatná knihovna s testy, aby se na ní dalo dál stavět.

## Co je hotové

- `service/rhyme/CzechPhonetics` – převod psané češtiny na výslovnost (di/ti/ni, mě/bě, ch, ou, slabikotvorné r/l,
  spodoba znělosti, ztráta znělosti na konci slova). Rýmy se porovnávají podle zvuku: byl ~ pil, Bůh ~ vzduch.
- `service/rhyme/RhymeAnalyzer` – porovná konce veršů (hloubka shody v slabikách, přesnost souhlásek, opěrná
  souhláska), pozná identický a gramatický rým, rýmové schéma (AABB, ABBA…), vnitřní rýmy a pestrost.
  Výsledek je skóre 0–100 a případně klíč odznaku.
- `model/RhymeReport` – výsledek pro JSP: skóre, odznak, rozpis po verších (partner, kvalita, druh rýmu)
  a rady jako klíče překladů `rhyme.hint.*` a `rhyme.kind.*`.
- `RhymeAnalyzerTest` – výslovnost, páry veršů a kalibrace prahů na ukázkách.

Ruční zkouška (po `mvn compile`):

```bash
java -cp target/classes com.github.skeliit.service.rhyme.RhymeAnalyzer moje-verse.txt
```

## Prahy (zatím odhad na pár ukázkách)

| Text | Skóre |
|---|---|
| Rap s víceslabičnými rýmy | 84 → `s_rhyme_master` (≥ 80) |
| Průměrný rap | 74 → `s_rhyme` (≥ 60) |
| Mácha, Máj (čisté, ale jednoslabičné rýmy) | 69 → `s_rhyme` |
| Próza / rýmy na stejné slovo | 35 / 34 → nic |

Odznak vyžaduje aspoň 8 započtených veršů (`MIN_LINES_FOR_BADGE`). Před spuštěním je potřeba prahy ověřit na
skutečných textech z webu.

## Otevřené rozhodnutí: odkud se verše vezmou

### A) Komentáře pod písněmi
- Napojení: `CommentDao` (oba druhy komentářů – pod texty i pod klipy, viz AGENTS.md) → `RhymeAnalyzer.analyze`
  → odznak přes `SiteBadgeDao.award(userId, "s_rhyme")`, nebo nový sloupec s nejlepším skóre a výpočet v `sync()`.
- Plus: nic nového v UI, lidé už komentují. Minus: komentáře jsou většinou krátké (pod 8 veršů), analyzátor
  by běžel na každý komentář a lákalo by to ke spamu „rýmovaček“ pod písněmi.

### B) Nová sekce „Rhyme battle“
- Vlastní tabulka příspěvků (verše, skóre, čas), stránka se zadáním/tématem, výsledek rozboru se ukáže hned
  (rozpis po verších z `RhymeReport.getLines()`), případně hlasování ostatních.
- Plus: prostor na delší texty, soutěžní motivace, odznak dává smysl. Minus: víc práce (migrace, servlet, JSP,
  moderace, mazání a export dat uživatele).

V obou případech platí pravidla z AGENTS.md: nová tabulka s uživatelskými daty patří do `AccountDeletion`,
`ProfileExportServlet` a textu o soukromí; nové odznaky do `SiteBadges.ALL` a všechny texty (`site.badge.s_rhyme*`,
`rhyme.kind.*`, `rhyme.hint.*`) do všech pěti `messages_*.properties`.

## Známá omezení

- Výjimky cizích slov fonetika nezná (diktát → „ďiktát“); na rýmy to má malý vliv.
- Seznam gramatických koncovek je ruční a neúplný.
- Analyzátor jde „přelstít“ záměrně vyrobenými rýmy – odznak je lepší vázat na příspěvky, které vidí ostatní
  (hlasování, moderace), ne jen na automatické skóre.
