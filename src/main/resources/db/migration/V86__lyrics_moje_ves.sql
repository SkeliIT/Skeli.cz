-- Lyrics for Moje ves (2015), written down by Skeli (2026-10-21; only the spelling corrected), with translations
-- into en/de/uk/vi and the translated title. On www the song is already there ("Moje Ves", made in the admin) and gets
-- the text; where it isn't (test, local), it is made. Its only clip: REJl7xDN8v0.

INSERT INTO `songs` (`uuid`, `name`, `year`)
SELECT UUID(), 'Moje ves', 2015 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `songs` s WHERE LOWER(s.`name`) = 'moje ves');

DELETE FROM `video_blocklist` WHERE `youtube_id` = 'REJl7xDN8v0';
INSERT INTO `videos` (`youtube_id`, `title`, `song_id`)
SELECT 'REJl7xDN8v0', 'Moje ves', s.`id` FROM `songs` s WHERE LOWER(s.`name`) = 'moje ves' ORDER BY s.`id` LIMIT 1
ON DUPLICATE KEY UPDATE `song_id` = VALUES(`song_id`);

-- cs
INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'Bydlet v týhle vesnici je těžší, než se zdá,
boty non-stop od bahna, v práci špatná výplata,
zvířata skáčou tady z knajpy rovnou do auta,
dvanáctiletý smradi se tu skládaj na jointa.
Rozkopaná zastávka, nejlepší shop Vietnamec,
nové fotbalové hřiště, které nás nikam nedostane,
silnice tak děravý, že si můžu vyhonit,
a lidi tak příjemný, že si to spíš půjdu hodit.
Nebudu se zlobit, když alespoň jeden den
nebudete na můj chodník drobit drby, co vylezly jiným z huby ven.
Jsem na sto pro přesvědčen, že jsem to nebyl já, ale můj černej pes Ben,
že jsem to nebyl já, ale můj černej pes Ben.

Nic se tady neděje, zastavil se čas,
nekonečná smyčka, co dokáže zlomit vaz,
nuda na tebe číhá za každým rohem,
benzínce s non-stop provozem řekni rovnou sbohem.
Nechoď tudy rovnou za nosem, padl bys smradem,
bioelektrárna tady všude vládne.
Kdo se mnou povstane, kdo se mnou povstane?
Já volám do zbraně, já volám do zbraně.

Všude kamery, všude prozíravý tváře,
jeden druhýmu klacky pod nohy hází,
občané počestný policisty potěší,
dodávají informace, ale co je pravda, neřeší.
Švitoří jak vlaštovky a nezavřeš jim hubu,
strašně bych si přál ovládat umění vúdú.
Máme tady velice úrodnou půdu, ale k čemu mi to je,
když sklizeň jde na jinou půdu.
Pokoutně pěstovaný palice z mojí samice
si nácí zmrdi z týhle vesnice cpou do svý vodnice
a jejich hlavice je prázdnější než kartonová krabice.

Nic se tady neděje, zastavil se čas,
nekonečná smyčka, co dokáže zlomit vaz,
nuda na tebe číhá za každým rohem,
benzínce s non-stop provozem řekni rovnou sbohem,
řekni rovnou sbohem, řekni rovnou sbohem.', 0
FROM `songs` s
WHERE LOWER(s.`name`) = 'moje ves'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;

-- en
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'My Village', 'Living in this village is harder than it seems,
boots non-stop in mud, lousy pay at work,
animals jump straight from the pub into the car,
twelve-year-old brats chip in here for a joint.
A smashed bus stop, the best shop''s the Vietnamese one,
a new football pitch that won''t get us anywhere,
roads so full of holes I could jerk off,
and people so pleasant I''d rather go hang myself.
I won''t get mad if at least for one day
you don''t crumble gossip on my pavement that fell out of other people''s mouths.
I''m a hundred percent sure it wasn''t me, it was my black dog Ben,
it wasn''t me, it was my black dog Ben.

Nothing''s happening here, time has stopped,
an endless loop that can break your neck,
boredom lurks for you around every corner,
the petrol station open non-stop, just say goodbye to it.
Don''t walk straight ahead this way, you''d drop from the stench,
the biogas plant rules everywhere here.
Who will rise up with me, who will rise up with me?
I''m calling to arms, I''m calling to arms.

Cameras everywhere, shrewd faces everywhere,
they throw sticks under each other''s feet,
honest citizens make the police happy,
they pass on information, but don''t care what''s true.
They chirp like swallows and you can''t shut them up,
I''d so love to master the art of voodoo.
We''ve got very fertile soil here, but what''s it good for
when the harvest goes onto someone else''s ground.
Buds secretly grown from my female plant
the Nazi scumbags from this village stuff into their bongs,
and their heads are emptier than a cardboard box.

Nothing''s happening here, time has stopped,
an endless loop that can break your neck,
boredom lurks for you around every corner,
the petrol station open non-stop, just say goodbye to it,
just say goodbye to it, just say goodbye to it.', 0
FROM `songs` s
WHERE LOWER(s.`name`) = 'moje ves'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;

-- de
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Mein Dorf', 'In diesem Dorf zu wohnen ist härter, als es scheint,
Schuhe nonstop voller Schlamm, schlechter Lohn bei der Arbeit,
Tiere springen hier direkt aus der Kneipe ins Auto,
zwölfjährige Gören legen hier für einen Joint zusammen.
Eine kaputte Haltestelle, der beste Laden ist der Vietnamese,
ein neuer Fußballplatz, der uns nirgendwohin bringt,
Straßen so voller Löcher, dass ich mir einen runterholen könnte,
und die Leute so nett, dass ich mich lieber aufhänge.
Ich werd nicht sauer, wenn ihr wenigstens einen Tag
auf meinem Gehweg keine Gerüchte krümelt, die anderen aus dem Maul gefallen sind.
Ich bin hundertpro überzeugt, dass ich es nicht war, sondern mein schwarzer Hund Ben,
dass ich es nicht war, sondern mein schwarzer Hund Ben.

Hier passiert nichts, die Zeit ist stehen geblieben,
eine endlose Schleife, die dir das Genick brechen kann,
die Langeweile lauert hinter jeder Ecke,
der Tankstelle mit Nonstop-Betrieb sag gleich Lebewohl.
Geh hier nicht der Nase nach, du würdest vom Gestank umfallen,
das Biogaskraftwerk herrscht hier überall.
Wer steht mit mir auf, wer steht mit mir auf?
Ich rufe zu den Waffen, ich rufe zu den Waffen.

Überall Kameras, überall scharfsinnige Gesichter,
einer wirft dem anderen Knüppel zwischen die Beine,
ehrbare Bürger machen der Polizei eine Freude,
sie liefern Informationen, aber was wahr ist, kümmert sie nicht.
Sie zwitschern wie Schwalben und du kriegst ihr Maul nicht zu,
ich würde so gern die Kunst des Voodoo beherrschen.
Wir haben hier sehr fruchtbaren Boden, aber was bringt mir das,
wenn die Ernte auf fremden Boden geht.
Heimlich gezogene Buds von meiner Weibchenpflanze
stopfen sich die Nazi-Arschlöcher aus diesem Dorf in ihre Bongs,
und ihre Köpfe sind leerer als ein Pappkarton.

Hier passiert nichts, die Zeit ist stehen geblieben,
eine endlose Schleife, die dir das Genick brechen kann,
die Langeweile lauert hinter jeder Ecke,
der Tankstelle mit Nonstop-Betrieb sag gleich Lebewohl,
sag gleich Lebewohl, sag gleich Lebewohl.', 0
FROM `songs` s
WHERE LOWER(s.`name`) = 'moje ves'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;

-- uk
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Моє село', 'Жити в цьому селі важче, ніж здається,
черевики нон-стоп у багнюці, на роботі погана зарплата,
звірі стрибають тут із кнайпи просто в авто,
дванадцятирічні шмаркачі тут скидаються на джойнт.
Розбита зупинка, найкращий магазин — у в''єтнамця,
нове футбольне поле, яке нас нікуди не приведе,
дороги такі діряві, що можна й подрочити,
а люди такі приємні, що я радше піду повішуся.
Я не сердитимусь, якщо хоч один день
ви не кришитимете на мій тротуар плітки, що вилізли з чужих пащ.
Я на сто відсотків певен, що це був не я, а мій чорний пес Бен,
що це був не я, а мій чорний пес Бен.

Тут нічого не відбувається, час зупинився,
нескінченна петля, що може зламати шию,
нудьга чигає на тебе за кожним рогом,
заправці з цілодобовою роботою одразу скажи «прощавай».
Не йди сюди прямо за носом, упав би від смороду,
біогазова станція тут усюди панує.
Хто зі мною повстане, хто зі мною повстане?
Я кличу до зброї, я кличу до зброї.

Усюди камери, усюди прозорливі обличчя,
один одному палиці під ноги кидають,
чесні громадяни тішать поліцію,
передають інформацію, а що правда — їм байдуже.
Щебечуть, як ластівки, і рота їм не закриєш,
я б страшенно хотів володіти мистецтвом вуду.
Маємо тут дуже родючу землю, та що мені з того,
коли врожай іде на чужу землю.
Потай вирощені шишки з моєї самиці
нацистські покидьки з цього села пхають у свої бонги,
а їхні голови порожніші за картонну коробку.

Тут нічого не відбувається, час зупинився,
нескінченна петля, що може зламати шию,
нудьга чигає на тебе за кожним рогом,
заправці з цілодобовою роботою одразу скажи «прощавай»,
одразу скажи «прощавай», одразу скажи «прощавай».', 0
FROM `songs` s
WHERE LOWER(s.`name`) = 'moje ves'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;

-- vi
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Làng tôi', 'Sống ở ngôi làng này khó hơn ta tưởng,
giày lúc nào cũng dính bùn, ở chỗ làm lương thì bèo,
thú vật ở đây nhảy thẳng từ quán nhậu vào xe,
lũ nhóc mười hai tuổi ở đây góp tiền mua điếu cần.
Trạm xe buýt nát bươm, cửa hàng tốt nhất là của người Việt,
sân bóng mới chẳng đưa chúng tôi đi đến đâu,
đường thủng lỗ chỗ đến mức tôi có thể tự sướng,
và người thì dễ chịu đến mức tôi thà đi treo cổ.
Tôi sẽ không giận nếu ít nhất một ngày
các người không rắc lên vỉa hè của tôi những lời đồn chui ra từ miệng kẻ khác.
Tôi tin chắc trăm phần trăm rằng đó không phải tôi, mà là con chó đen Ben của tôi,
rằng đó không phải tôi, mà là con chó đen Ben của tôi.

Ở đây chẳng có gì xảy ra, thời gian đã ngừng trôi,
một vòng lặp bất tận có thể bẻ gãy cổ,
sự buồn chán rình bạn ở mọi góc phố,
cây xăng mở cửa suốt ngày đêm, cứ nói lời tạm biệt luôn đi.
Đừng đi thẳng theo mũi đường này, bạn sẽ ngã vì mùi hôi,
nhà máy điện sinh học ở đây thống trị khắp nơi.
Ai sẽ cùng tôi đứng lên, ai sẽ cùng tôi đứng lên?
Tôi kêu gọi cầm vũ khí, tôi kêu gọi cầm vũ khí.

Khắp nơi là camera, khắp nơi là những gương mặt tinh tường,
kẻ này ném gậy vào chân kẻ kia,
những công dân lương thiện làm cảnh sát hài lòng,
họ cung cấp thông tin, nhưng sự thật là gì thì chẳng quan tâm.
Họ líu lo như chim én và bạn không bịt được miệng họ,
tôi rất muốn làm chủ được nghệ thuật vu-đu.
Ở đây chúng tôi có đất rất màu mỡ, nhưng để làm gì chứ,
khi mùa thu hoạch lại về đất của người khác.
Những búp hoa trồng lén từ cây cái của tôi
lũ phát xít khốn nạn của làng này nhét vào điếu bong của chúng,
và đầu của chúng còn rỗng hơn cái hộp các-tông.

Ở đây chẳng có gì xảy ra, thời gian đã ngừng trôi,
một vòng lặp bất tận có thể bẻ gãy cổ,
sự buồn chán rình bạn ở mọi góc phố,
cây xăng mở cửa suốt ngày đêm, cứ nói lời tạm biệt luôn đi,
cứ nói lời tạm biệt luôn đi, cứ nói lời tạm biệt luôn đi.', 0
FROM `songs` s
WHERE LOWER(s.`name`) = 'moje ves'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
