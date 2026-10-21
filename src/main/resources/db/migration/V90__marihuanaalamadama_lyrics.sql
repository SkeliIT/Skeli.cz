-- Lyrics for Marihuanaalamadama (feat. Toxe Team, 2016): Skeli's part and the chorus as Skeli wrote them
-- (2026-10-21; only the spelling corrected; "Skelo" is on purpose, "katruju" = smoking). The Toxe Team part is in
-- Spanish and isn't known word for word, so it isn't here. Translated into en/de/uk/vi; the title stays as it is.
-- The song comes from V54 (found by name).

-- cs
INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'Musím si zabalit, jo, musím to zabalit,
potřebuju si dát další „dávku“,
jsem z toho celej nesvůj, jsem smažka, jsem totálně v píči,
nevydržím bez toho ani minutu.

Zdrávas, Marihuanaalamadama, indika, indika,
zdrávas, Marihuanaalamadama, sativa, sativa,
zdrávas, Marihuanaalamadama, indika, indika,
zdrávas, Marihuanaalamadama, sativa, sativa.

Karikatura na drátě, v kapse ten narvanej sáček,
no tak nedělejte drama, není plnej hnusných sraček.

Asi si mě s někým spletli, nebo se jenom přeřekli,
já si tu budu prestiž, jenom Skelo, no tak, kurva, věř mi,
no tak věř mi, no tak věř mi, křoví, že s tím neprolezu mezi dveřmi,
no tak věř mi, no tak věř mi, SKELOSQUAD rozezní teďko tvoje bedny.

A tak katruju ten Haze, nejdřív Bubblegum a potom Mary Jane,
every day ten weed, nej sem teď dej a stříhej, jsem jinej,
moře kouře, místo očí proužek.

Zdrávas, Marihuanaalamadama, indika, indika,
zdrávas, Marihuanaalamadama, sativa, sativa,
zdrávas, Marihuanaalamadama, indika, indika,
zdrávas, Marihuanaalamadama, sativa, sativa.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Marihuana%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;

-- en
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'Marihuanaalamadama', 'I gotta roll one, yeah, I gotta roll it up,
I need another "dose",
it''s got me all out of sorts, I''m a pothead, I''m totally fucked,
I can''t last a minute without it.

Hail, Marihuanaalamadama, indica, indica,
hail, Marihuanaalamadama, sativa, sativa,
hail, Marihuanaalamadama, indica, indica,
hail, Marihuanaalamadama, sativa, sativa.

A caricature on a wire, that stuffed bag in my pocket,
come on, don''t make a drama, it''s not full of nasty crap.

Guess they mixed me up with someone, or they just misspoke,
I''ll be my own prestige here, just Skelo, come on, damn it, believe me,
come on, believe me, come on, believe me, such a bush, I won''t get it through the door,
come on, believe me, come on, believe me, SKELOSQUAD''s gonna make your speakers boom now.

So I''m smoking that Haze, first Bubblegum and then Mary Jane,
every day that weed, the best, hand it over now and cut it, I''m different,
a sea of smoke, a slit instead of eyes.

Hail, Marihuanaalamadama, indica, indica,
hail, Marihuanaalamadama, sativa, sativa,
hail, Marihuanaalamadama, indica, indica,
hail, Marihuanaalamadama, sativa, sativa.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Marihuana%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;

-- de
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Marihuanaalamadama', 'Ich muss mir einen drehen, ja, ich muss ihn drehen,
ich brauch noch eine „Dosis“,
ich bin total durch den Wind, ich bin ein Kiffer, ich bin völlig im Arsch,
ich halt es ohne nicht mal eine Minute aus.

Gegrüßet seist du, Marihuanaalamadama, Indica, Indica,
gegrüßet seist du, Marihuanaalamadama, Sativa, Sativa,
gegrüßet seist du, Marihuanaalamadama, Indica, Indica,
gegrüßet seist du, Marihuanaalamadama, Sativa, Sativa.

Eine Karikatur am Draht, in der Tasche das vollgestopfte Tütchen,
na, macht kein Drama, es ist nicht voll mit ekligem Scheiß.

Wohl haben sie mich mit jemandem verwechselt oder sich nur versprochen,
ich bin hier mein eigenes Prestige, nur Skelo, na komm, verdammt, glaub mir,
na glaub mir, na glaub mir, so ein Busch, damit komm ich nicht durch die Tür,
na glaub mir, na glaub mir, SKELOSQUAD lässt jetzt deine Boxen dröhnen.

Also rauch ich das Haze, erst Bubblegum und dann Mary Jane,
every day das Weed, das Beste, gib''s jetzt her und schneid, ich bin anders,
ein Meer aus Rauch, statt Augen nur ein Schlitz.

Gegrüßet seist du, Marihuanaalamadama, Indica, Indica,
gegrüßet seist du, Marihuanaalamadama, Sativa, Sativa,
gegrüßet seist du, Marihuanaalamadama, Indica, Indica,
gegrüßet seist du, Marihuanaalamadama, Sativa, Sativa.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Marihuana%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;

-- uk
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Marihuanaalamadama', 'Мушу скрутити, так, мушу це скрутити,
мені треба ще одна «доза»,
я від цього сам не свій, я накурений, мені повний пиздець,
я без цього не витримаю й хвилини.

Радуйся, Marihuanaalamadama, індика, індика,
радуйся, Marihuanaalamadama, сатива, сатива,
радуйся, Marihuanaalamadama, індика, індика,
радуйся, Marihuanaalamadama, сатива, сатива.

Карикатура на дроті, в кишені той набитий пакетик,
ну годі вам драми, він не повний гидкого лайна.

Мабуть, мене з кимось сплутали або просто обмовилися,
я тут сам собі престиж, тільки Skelo, ну, курва, повір мені,
ну повір мені, ну повір мені, такий кущ — я з ним не пролізу в двері,
ну повір мені, ну повір мені, SKELOSQUAD зараз розкачає твої колонки.

Тож я курю той Haze, спершу Bubblegum, а потім Mary Jane,
every day той weed, найкращий, давай сюди і ріж, я інший,
море диму, замість очей — щілинка.

Радуйся, Marihuanaalamadama, індика, індика,
радуйся, Marihuanaalamadama, сатива, сатива,
радуйся, Marihuanaalamadama, індика, індика,
радуйся, Marihuanaalamadama, сатива, сатива.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Marihuana%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;

-- vi
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Marihuanaalamadama', 'Phải cuốn một điếu, ừ, phải cuốn nó lại,
tôi cần thêm một "liều" nữa,
tôi bứt rứt không yên, tôi là dân phê cỏ, tôi tiêu đời hoàn toàn rồi,
không có nó tôi chẳng chịu nổi một phút.

Kính chào Marihuanaalamadama, indica, indica,
kính chào Marihuanaalamadama, sativa, sativa,
kính chào Marihuanaalamadama, indica, indica,
kính chào Marihuanaalamadama, sativa, sativa.

Bức biếm họa trên sợi dây, trong túi là cái bao căng phồng,
thôi đừng làm quá lên, nó không đầy thứ rác rưởi kinh tởm đâu.

Chắc họ nhầm tôi với ai đó, hoặc chỉ lỡ lời thôi,
ở đây tôi là uy tín của chính mình, chỉ Skelo thôi, chết tiệt, tin tôi đi,
tin tôi đi, tin tôi đi, bụi cây to thế này tôi chẳng lách qua cửa nổi,
tin tôi đi, tin tôi đi, SKELOSQUAD giờ sẽ làm loa của bạn rền vang.

Thế nên tôi rít Haze, trước là Bubblegum rồi đến Mary Jane,
every day cỏ đó, ngon nhất, đưa đây ngay và cắt đi, tôi khác rồi,
biển khói mịt mù, mắt chỉ còn một khe hẹp.

Kính chào Marihuanaalamadama, indica, indica,
kính chào Marihuanaalamadama, sativa, sativa,
kính chào Marihuanaalamadama, indica, indica,
kính chào Marihuanaalamadama, sativa, sativa.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Marihuana%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
