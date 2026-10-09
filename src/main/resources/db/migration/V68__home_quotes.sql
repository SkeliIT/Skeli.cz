-- Two lines from Skeli's own lyrics on the home page, one picked at random on every visit
-- (chosen by Skeli 2026-10-09: strong thoughts, no swearing or drugs). The song gives the link.
CREATE TABLE IF NOT EXISTS `home_quotes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `song_id` INT UNSIGNED NOT NULL,
  `line1` VARCHAR(200) NOT NULL,
  `line2` VARCHAR(200) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_home_quotes_song` (`song_id`),
  CONSTRAINT `fk_home_quotes_song` FOREIGN KEY (`song_id`) REFERENCES `songs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `home_quotes` (`song_id`, `line1`, `line2`)
SELECT s.`id`, q.`line1`, q.`line2`
FROM (
  SELECT 'Tisíc kousků%' AS song, 'Nevím, co vše ze mě zbylo, jestli jsem to ještě já,' AS line1, 'tělo bez duše a duše bez těla.' AS line2
  UNION ALL SELECT 'Tisíc kousků%', 'A čas plyne a já vím, že promarněnej čas už nijak nevrátím,', 'dveře, co jsem otevřel, jsou už skoro zavřený.'
  UNION ALL SELECT 'Tisíc kousků%', 'Zahodil jsem kompas, co mi ukazoval správnej směr,', 'nechal jsem se unášet proudem jako loďka bez vesel.'
  UNION ALL SELECT 'Tisíc kousků%', 'Dveře, co jsem otevřel, jsou už skoro zavřený,', 'snad mám šanci ještě uspět, snad to není ztracený.'
  UNION ALL SELECT 'Tik Tak%', 'Možná už jste zapomněli, ale stále jsem tu,', 'pereme se se životem, klestíme si cestu.'
  UNION ALL SELECT 'Tik Tak%', 'Sežere to tvoji duši, sežere to tvoji tvář,', 'co si zasadíš, to pak máš.'
  UNION ALL SELECT 'Musíš odejít%', 'Jak je to složitý, na všechno tu sama být.', 'Zatni zuby, postav se a neboj se zase dál jít.'
  UNION ALL SELECT 'Musíš odejít%', 'Teď jsi silnější, než jsi byla kdykoli dřív,', 'chtělo to odvahu se mu vzepřít.'
  UNION ALL SELECT 'Musíš odejít%', 'Teď si píšeš scénář sama,', 'on už nemusí tě trápit.'
  UNION ALL SELECT 'Fajn', 'Z vrcholu pyramidy musí svět vypadat fajn,', 'ale co ten zbytek, co musí v jejím stínu stát.'
  UNION ALL SELECT 'Fajn', 'Beru to do vlastních rukou a půjdu cestou svou,', 'už mě nebaví vydělávat na cizí sny.'
  UNION ALL SELECT 'Fajn', 'A ty karty máme dávno rozdaný,', 'natahujeme ruce pro ty věci, co nás postaví.'
  UNION ALL SELECT 'Nechápu', 'Nechápu, kde se to zlo v nás bere,', 'nechápu, proč se to furt v nás pere.'
  UNION ALL SELECT 'Nechápu', 'Milujeme sebe, oba nás žere sedět vedle sebe,', 'krmíme se medem a v něm ten jed.'
  UNION ALL SELECT 'Nechápu', 'Falešný iluze, pravdivý lži,', 'při snídani řešíme ty dny, kdy byli jsme tým.'
  UNION ALL SELECT 'Jdi', 'Každej z nás zná svoje hodnoty, každej z nás je prototyp,', 'proto chci poprosit o trochu pokory.'
  UNION ALL SELECT 'Jdi', 'Každej z nás má svoje nesplněný sny,', 'sníme o nich po nocích, jdem za nimi celý dny.'
  UNION ALL SELECT 'Já už vím', 'Chtěl bych umět lítat, tak jako lítá pták,', 'jen zamávat křídlama, udělat pápá.'
  UNION ALL SELECT 'Já už vím', 'Musím mít nervy pevnější, než má ocel tank,', 'koukám na to s nadhledem, jak bych stál na vrchol Mont Blanc.'
  UNION ALL SELECT 'Já už vím', 'Osud mi vše oplácí, nonstop na to doplácím,', 'ale on přijde čas, kdy tu kartu obrátím.'
  UNION ALL SELECT '%Úplně vzadu%', 'Můžeš prosit, můžeš klečet, můžeš brečet dál,', 'nikoho to nezajímá, na všechno jsi tady sám.'
  UNION ALL SELECT '%Úplně vzadu%', 'Všechny problémy ti v mžiku před očima proběhnou,', 'však každej kráčí svou cestou trnitou.'
  UNION ALL SELECT 'Trosky%', 'Jak si to usteleš, tak si lehneš na dno,', 'dá se padnout na dno, je to jako bahno.'
  UNION ALL SELECT '%Divná planeta%', 'Chovejme se tak, jak maj se chovat hosti,', 'pozdě budem prosit, až tu zbudou trosky.'
  UNION ALL SELECT '%Divná planeta%', 'Krok za krokem procházíš životem,', 'rveš se o svý místo pod sluncem.'
  UNION ALL SELECT '%Divná planeta%', 'Lidi spěchaj neustále, i když neví kam,', 'život pomalu a jistě ztrácí svůj význam.'
  UNION ALL SELECT '%Divná planeta%', 'Že pravda s láskou zvítězí, nikdo už nevěří,', 'není místo na pocity, budujeme kariéry.'
) q
JOIN `songs` s ON s.`id` = (SELECT MIN(s2.`id`) FROM `songs` s2 WHERE s2.`name` LIKE q.`song`)
WHERE NOT EXISTS (SELECT 1 FROM `home_quotes` h WHERE h.`line1` = q.`line1`);
