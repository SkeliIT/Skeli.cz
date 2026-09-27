-- "Já už vím" (clip S3BFk-qmXAY, published 14 Aug 2016): song, link to its clip and Czech lyrics.
START TRANSACTION;

INSERT IGNORE INTO `songs` (`uuid`, `name`, `year`) VALUES (UUID(), 'Já už vím', 2016);

UPDATE `videos` v
JOIN `songs` s ON s.`name` = 'Já už vím' AND s.`year` = 2016
SET v.`song_id` = s.`id`,
    v.`published_at` = COALESCE(v.`published_at`, '2016-08-14 16:20:10')
WHERE v.`youtube_id` = 'S3BFk-qmXAY';

INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'Chtěl bych umět lítat, tak jako lítá pták,
jen zamávat křídlama, udělat pápá,
z výšky na to všechno srát, k srdci už si nic nebrát
a se zbylou nadějí táhnout někam dál.

Chtěl bych umět lítat, tak jako lítá pták,
jen zamávat křídlama, udělat pápá,
z výšky na to všechno srát, k srdci už si nic nebrát
a se zbylou nadějí táhnout někam dál,

někam tam,
kde nevládne pýcha, blbej klam
a neznaj lidi jenom hamty hamt.
Musím mít nervy pevnější, než má ocel tank,
koukám na to s nadhledem, jak bych stál
na vrchol Mont Blanc.
Jing a Jang už dávno neplatí,
vždy vše dobré, co udělám, se v špatné obrací,
osud mi vše oplácí, nonstop na to doplácím,
ale on přijde čas, kdy tu kartu obrátím.

Já už vím, co se stalo, má se stát,
všechno je to osud, nemá cenu se s tím kurva prát.
Já už vím, je to někdy těžší, než se zdá,
je to vážně hnus, co ti osud občas přichystá.

Život mi dává na prdel, fakt na plný pecky,
kouty mýho života jsem navštívil snad všechny,
vymet jsem každý hovno, co mi tu kdo připravil,
na co jsem sáhnul, to jsem vždycky pokazil.

Sny se proměnily v prach, v mých očích zbyl samej strach,
co teď bude dál, čekám, kdy přijde další krach,
co se zase pokazí, kdo mě zase podrazí,
jsou tu mezi náma tací, co mi kudlu do zad zarazí.

Já už vím, co se stalo, má se stát,
všechno je to osud, nemá cenu se s tím kurva prát.
Já už vím, je to někdy těžší, než se zdá,
je to vážně hnus, co ti osud občas přichystá.

Zrada, bolest,
špatnej konec,
město nebo obec,
samej blbec, sobec,
chtěj mě vidět shořet,
chtěj mě vidět dole,
tak si vyliž, vole.', 0
FROM `songs` s
WHERE s.`name` = 'Já už vím' AND s.`year` = 2016
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs');

COMMIT;
