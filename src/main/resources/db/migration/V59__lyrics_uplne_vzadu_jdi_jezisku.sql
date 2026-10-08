-- Czech lyrics for "Úplně vzadu" (2016), "Jdi" (2017) and "Ježíšku panáčku" (2016), checked by Skeli.
-- The songs come from V40/V54; a song that already has Czech lyrics is left alone.
INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'Můžeš prosit, můžeš klečet, můžeš brečet dál,
nikoho to nezajímá, na všechno jsi tady sám.
Všechny problémy ti v mžiku před očima proběhnou,
však každej kráčí svou cestou trnitou.
(4×)

Topíš se v dluzích, zlepšení nehrozí,
dvanáct hodin v kuse v práci, občané nebozí,
na děti nemaj čas, musí makat, spát, ráno vstát,
mnohokrát si přesčas brát, aby to jakž takž utáh.
Zažil jsi toho tolik, že už tě nic nepřekvapí,
nečekaný podepsání výpovědi v zaměstnání,
zaměstnání tě dohání až k doznání o posrání při poznání sociální mzdy,
za kterou máš cálovat složenky.
Zbývaj oči pro pláč, už nezbyl ani drobák,
zbyl jen další somrák, co to daleko nedotáh,
i tak každý další ráno poslušná ovce doplňuje stádo,
někdo pro žrádlo, někdo pro párno,
nechá ze sebe i kůži stáhnout.
Hromada fází, jak se sny ztrácí, někde tam v dáli ty stromy přání, co se furt kácí,
i když se bráníš, i když máš zdání, že to doháníš,
může nastat zvrat, a jak pak vstát s pocitem, že není o co stát.
Bylo to OK, teďka na práškách v bílym hávu, úplně vzadu,
postupně slábne, postupně sáhne po tom, co zdá se v tu chvíli správné,
za čórky drogy a chlast, rodina stranou, jde z něj strach,
už to není ten chlap, už to bohužel vzdal,
už to bylo fakt moc, našli ho na stromě minulou noc,
na papír napsal poslední sloh a nakonec, že dělal, co moh.

Můžeš prosit, můžeš klečet, můžeš brečet dál,
nikoho to nezajímá, na všechno jsi tady sám.
Všechny problémy ti v mžiku před očima proběhnou,
však každej kráčí svou cestou trnitou.
(2×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%vzadu%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;

INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'Vidím ty dětský sny, slyším ty hlasy, co říkaly „jdi“,
říkaly mi výklady, co se týkaly mý přípravy unést ty dny,
a tak jsem šel, příběh made in hell, pro ten sen jsem dřel.
Po stokách a roky furt plynuly, říkám si stokrát, už to nesmím dovolit, už to nesmím dovolit,
jít ve svých stopách a dokázat cokoliv, vzpříma jako topoly,
mlád nebo o holi,
každej z nás zná svoje hodnoty, každej z nás je prototyp,
proto chci poprosit o trochu pokory.
Každej z nás má svoje nesplněný sny,
sníme o nich po nocích, jdem za nimi celý dny,
každá tvář zná, když slzy po ní stékají,
když si smůla se šancí zase ty ruce podají.

Vidím ty dětský sny, slyším ty hlasy, co říkaj „jdi“.
Vidím ty dětský sny, slyším ty hlasy, co říkaj „jdi“.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Jdi%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;

INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'Ježíšku panáčku, co mi neseš za krásu,
Ježíšku panáčku, dej mi to tamhle do sáčku,
Ježíšku panáčku, z toho budu pěkně na sračku,
Ježíšku panáčku, dones mi k tomu dvanáctku.

Dvacátýho čtvrtýho dvanáctý, není nic lepšího než bejt navátý,
nevím, kam mám jít, nevím, co má být, tak jen bafám weed, drobet zkouším pít,
abych poznal líp ty kouzla vánoční,
kapr na mě čumí z vany, já mu říkám „mír“,
jednou ranou na týl mu to celý vysvětlím,
bohužel se předtím ale šestkrát netrefím.
Koledy kolem rozhlasu se rozjely, dobrej čas zase se vodstřelit,
válet se po zemi, panáky, pojďte mi,
vánoční náladu posiluju kouřením, ocením sousedy, donesli mi jmelí,
děkuju, na shledanou, šťastný a veselý,
jsem celý nadšený, jmelí letí na smetí a já letím na ten weed.

Ježíšku panáčku, co mi neseš za krásu,
Ježíšku panáčku, dej mi to tamhle do sáčku,
Ježíšku panáčku, z toho budu pěkně na sračku,
Ježíšku panáčku, dones mi k tomu dvanáctku.

Ježíšek pod stromek mi nasral, na lístek napsal, že jsem prej bastard,
že hulím a chlastám, pařím a šoustám, doma se flákám a honím si ptáka.
Já na to bla bla, ať si plácá, jsem kráva, haha, ať žije tráva,
málokomu se to stává, že mu Ježíšek nadává, psychicky to nedávám,
tak si dávám páva, z očí teče láva, sápu se po cukroví,
z toho, jak je rumový, si pamatuju kulový, šance nulový
udržet všechno v útrobí, házím šavle metrový.
Druhý den ráno sbírám se ze země, nožky, neste mě rovnou do postele,
dneska to nepůjde, dneska mě nechte být,
včera večer Ježíšek byl na mě hrozně zlej.

Ježíšku panáčku, co mi neseš za krásu,
Ježíšku panáčku, dej mi to tamhle do sáčku,
Ježíšku panáčku, z toho budu pěkně na sračku,
Ježíšku panáčku, dones mi k tomu dvanáctku.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Ježíšku panáčku%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;
