-- Farri - Kalba (feat. Skeli & Babar, 2016): text dopsal Skeli (2026-11-05), opravený jen pravopis, slang zůstává.
-- Překlady en/de/uk/vi i s názvem. Na www je zatím jen video bez písně, tady dostane píseň. Refrény jsou rozepsané
-- (karaoke i kontrola počtu řádků v překladech počítají s každým řádkem zvlášť).

INSERT INTO `songs` (`uuid`, `name`, `year`)
SELECT UUID(), 'Farri - Kalba ft. Skeli, Babar', 2016 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `songs` s WHERE LOWER(s.`name`) LIKE '%kalba%');

DELETE FROM `video_blocklist` WHERE `youtube_id` = 'auNofZzBIFA';
INSERT INTO `videos` (`youtube_id`, `title`, `published_at`, `song_id`)
SELECT 'auNofZzBIFA', 'Farri - Kalba (feat. Skeli & Babar)', '2016-01-07 13:15:50', s.`id`
FROM `songs` s WHERE LOWER(s.`name`) LIKE '%kalba%' ORDER BY s.`id` LIMIT 1
ON DUPLICATE KEY UPDATE `song_id` = VALUES(`song_id`);

-- cs
INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'Probírám se na zemi, nevím, co se dělo, hlavně že jsem doma, netuším, jak se jelo,
pomalu se zvedám, hlava mi třeští, asi to vypadá, že jsem dostal pěstí,
takhle to nejde, už přestávám pít, jsem dost starej, už bych mohl rozum mít.
Po obědě volá Skeli, že dneska zase party,
no už to vypadá, že osud rozdal karty,
přijedou i buchty, takže večer bude cool,
jasný, že dorazím, už mám nabitou hůl.
Pořád je mi blbě a večer už se blíží,
včerejší whisky mi na žaludku tíží,
u příchodu hnedka panák mezi dveřma,
po hodině už chytám do nohou revma,
ráno vedle na posteli leží cizí dáma,
jenže já nic nevím, mám okno jako kráva.

Jdeme si to svoje, jako každej week,
chlastáme, felíme, kouříme weed,
občas nás trochu větší rapl zhostí,
to pak sousedi řvou neskonalou zlostí.
Další den nevěříme, cože jsme to dělali,
bez slušnosti, bez zábran, pěkně jsme se ožrali,
žijeme v Čechách, takže to nebude už jiný,
nechápu, proč se lidi kolem pořád diví.

Vstávat je ráno, v hlavě vymrdáno,
ze včerejška okno, no ty krávo, to je dramo,
na paměti závoj, co bylo to za nápoj,
co mě vystřelilo do vesmíru jako náboj,
jak vraženej nástroj, flašku za flaškou,
mažu svou paměť krátkou, nehnete se mnou ani pákou,
panáky se lámou, chutě furt neslábnou,
kombinuju to i s trávou, neřídím se správnou
životosprávou, pivo, brko, pivo, blunt, pivo, vodka,
a jsem tam, pak se plazím jak potkan, ale pořád nic nemám,
připadám si jako loutka, co se na provázkách houpá,
kolem sebe koukám a doufám, že jsem nenápadnej jako moucha,
co si troufá dát si dalšího douška,
pak šeptám slečnám do ouška, jakýho mám pěknýho papouška.

Jdeme si to svoje, jako každej week,
chlastáme, felíme, kouříme weed,
občas nás trochu větší rapl zhostí,
to pak sousedi řvou neskonalou zlostí.
Další den nevěříme, cože jsme to dělali,
bez slušnosti, bez zábran, pěkně jsme se ožrali,
žijeme v Čechách, takže to nebude už jiný,
nechápu, proč se lidi kolem pořád diví.

Saju jako Olda Kaiser, Jägermeister,
v puse mám vajgl, nejsem ten typ, co celou noc cucá jeden cider,
zatímco ty bliješ, já jedu jako Knight Rider, jako sniper,
spozorním, když vidím buchtu, co mi těžce připomíná Michelle Pfeiffer.
What''s your name, girl? Chci tvý number,
super prdel, baby, než bych na to šel hr,
jsem temnej hajzl a.k.a. Darth Vader,
v kapse mám nějakej haze, tak mi dej paper,
pošlu to do kola, vypnu všechny,
chvilku mám strach, že bude potřeba lifesaver,
a druhej den je fakt motherfucker,
člověk na masakr jak po šichtě starej fotr,
chceš čumět jako kapr, celej den mít na prd,
Raptor letí na bar jak Charlie Watts.

Jdeme si to svoje, jako každej week,
chlastáme, felíme, kouříme weed,
občas nás trochu větší rapl zhostí,
to pak sousedi řvou neskonalou zlostí.
Další den nevěříme, cože jsme to dělali,
bez slušnosti, bez zábran, pěkně jsme se ožrali,
žijeme v Čechách, takže to nebude už jiný,
nechápu, proč se lidi kolem pořád diví.', 0
FROM `songs` s
WHERE LOWER(s.`name`) LIKE '%kalba%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;

-- en
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'The Bender', 'I come to on the floor, no idea what went down, at least I''m home, no clue how wild it got,
slowly getting up, my head is splitting, looks like somebody punched me,
this can''t go on, I''m quitting drinking, I''m old enough, I could have some sense by now.
After lunch Skeli calls, there''s a party again tonight,
well, it looks like fate has dealt the cards,
the chicks are coming too, so the evening''s gonna be cool,
of course I''ll show up, my stick is already loaded.
I still feel sick and the evening''s getting close,
yesterday''s whisky weighs down on my stomach,
right on arrival a shot in the doorway,
after an hour I''m already getting rheumatism in my legs,
in the morning a strange lady''s lying next to me in bed,
but I know nothing, I''ve got a blackout the size of a cow.

We do our own thing, like every week,
we booze, we go wild, we smoke weed,
sometimes a bit of a bigger fit takes hold of us,
then the neighbours roar with endless anger.
The next day we can''t believe what we did,
no manners, no limits, we got properly wasted,
we live in Czechia, so it won''t ever be any different,
I don''t get why people around us keep being surprised.

Getting up in the morning, my head all fucked up,
a blackout from yesterday, holy cow, what a drama,
a veil over my memory, what kind of drink was that,
that shot me into space like a bullet,
like a tool rammed in, bottle after bottle,
I''m wiping my short memory, you won''t move me even with a lever,
the shots go down, the cravings never weaken,
I mix it with weed too, I don''t follow a proper
healthy lifestyle, beer, spliff, beer, blunt, beer, vodka,
and I''m there, then I crawl like a rat, but I still have nothing,
I feel like a puppet swinging on its strings,
I look around and hope I''m as unnoticeable as a fly
that dares to take another sip,
then I whisper in the girls'' ears what a nice parrot I''ve got.

We do our own thing, like every week,
we booze, we go wild, we smoke weed,
sometimes a bit of a bigger fit takes hold of us,
then the neighbours roar with endless anger.
The next day we can''t believe what we did,
no manners, no limits, we got properly wasted,
we live in Czechia, so it won''t ever be any different,
I don''t get why people around us keep being surprised.

I suck it down like Olda Kaiser, Jägermeister,
a butt in my mouth, I''m not the type who sips one cider all night,
while you''re puking, I ride like Knight Rider, like a sniper,
I perk up when I see a chick who strongly reminds me of Michelle Pfeiffer.
What''s your name, girl? I want your number,
super fun, baby, before I''d rush right into it,
I''m a dark bastard a.k.a. Darth Vader,
I''ve got some haze in my pocket, so give me a paper,
I send it round the circle, I knock everyone out,
for a moment I''m scared a lifesaver will be needed,
and the next day is a real motherfucker,
a person wrecked like an old man after a shift,
you wanna stare like a carp, feel like crap all day,
Raptor flies to the bar like Charlie Watts.

We do our own thing, like every week,
we booze, we go wild, we smoke weed,
sometimes a bit of a bigger fit takes hold of us,
then the neighbours roar with endless anger.
The next day we can''t believe what we did,
no manners, no limits, we got properly wasted,
we live in Czechia, so it won''t ever be any different,
I don''t get why people around us keep being surprised.', 0
FROM `songs` s
WHERE LOWER(s.`name`) LIKE '%kalba%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;

-- de
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Die Sause', 'Ich komme am Boden zu mir, keine Ahnung, was los war, Hauptsache zu Hause, keine Ahnung, wie es lief,
langsam steh ich auf, mir platzt der Schädel, sieht wohl aus, als hätt ich eine Faust kassiert,
so geht das nicht, ich hör auf zu trinken, ich bin alt genug, ich könnte langsam Verstand haben.
Nach dem Mittagessen ruft Skeli an, heute wieder Party,
tja, sieht so aus, als hätte das Schicksal die Karten verteilt,
die Mädels kommen auch, also wird der Abend cool,
klar komm ich, mein Stock ist schon geladen.
Mir ist immer noch schlecht und der Abend rückt näher,
der Whisky von gestern liegt mir schwer im Magen,
gleich beim Ankommen ein Kurzer in der Tür,
nach einer Stunde krieg ich schon Rheuma in die Beine,
am Morgen liegt neben mir im Bett eine fremde Dame,
doch ich weiß von nichts, ich hab einen Filmriss wie eine Kuh.

Wir ziehen unser Ding durch, wie jede Woche,
wir saufen, wir drehen auf, wir rauchen Weed,
manchmal packt uns ein etwas größerer Koller,
dann brüllen die Nachbarn vor grenzenloser Wut.
Am nächsten Tag glauben wir nicht, was wir getan haben,
ohne Anstand, ohne Hemmungen, wir haben uns ordentlich besoffen,
wir leben in Tschechien, also wird es nie anders sein,
ich versteh nicht, warum sich die Leute ringsum immer noch wundern.

Aufstehen am Morgen, im Kopf alles zerfickt,
von gestern ein Filmriss, ach du Scheiße, was für ein Drama,
ein Schleier über der Erinnerung, was war das für ein Getränk,
das mich wie eine Patrone ins All geschossen hat,
wie ein eingerammtes Werkzeug, Flasche um Flasche,
ich lösche mein Kurzzeitgedächtnis, mich bewegt ihr nicht mal mit einem Hebel,
die Kurzen gehen runter, die Lust lässt nie nach,
ich kombiniere es auch mit Gras, ich halte mich nicht an eine richtige
gesunde Lebensweise, Bier, Tüte, Bier, Blunt, Bier, Wodka,
und ich bin da, dann krieche ich wie eine Ratte, aber hab immer noch nichts,
ich fühle mich wie eine Marionette, die an ihren Fäden schaukelt,
ich schaue mich um und hoffe, dass ich unauffällig bin wie eine Fliege,
die sich traut, noch einen Schluck zu nehmen,
dann flüstere ich den Mädels ins Ohr, was für einen hübschen Papagei ich habe.

Wir ziehen unser Ding durch, wie jede Woche,
wir saufen, wir drehen auf, wir rauchen Weed,
manchmal packt uns ein etwas größerer Koller,
dann brüllen die Nachbarn vor grenzenloser Wut.
Am nächsten Tag glauben wir nicht, was wir getan haben,
ohne Anstand, ohne Hemmungen, wir haben uns ordentlich besoffen,
wir leben in Tschechien, also wird es nie anders sein,
ich versteh nicht, warum sich die Leute ringsum immer noch wundern.

Ich zieh rein wie Olda Kaiser, Jägermeister,
im Mund eine Kippe, ich bin nicht der Typ, der die ganze Nacht an einem Cider nuckelt,
während du kotzt, fahr ich wie Knight Rider, wie ein Sniper,
ich werde aufmerksam, wenn ich ein Mädel sehe, das mich stark an Michelle Pfeiffer erinnert.
What''s your name, girl? Ich will deine Number,
super Spaß, Baby, bevor ich gleich loslege,
ich bin ein finsterer Mistkerl a.k.a. Darth Vader,
in der Tasche hab ich etwas Haze, also gib mir ein Paper,
ich schick es in die Runde, ich schalte alle aus,
kurz hab ich Angst, dass ein Lifesaver nötig wird,
und der nächste Tag ist ein echter Motherfucker,
man ist fertig wie ein alter Vater nach der Schicht,
willst du glotzen wie ein Karpfen, dich den ganzen Tag beschissen fühlen,
Raptor fliegt zur Bar wie Charlie Watts.

Wir ziehen unser Ding durch, wie jede Woche,
wir saufen, wir drehen auf, wir rauchen Weed,
manchmal packt uns ein etwas größerer Koller,
dann brüllen die Nachbarn vor grenzenloser Wut.
Am nächsten Tag glauben wir nicht, was wir getan haben,
ohne Anstand, ohne Hemmungen, wir haben uns ordentlich besoffen,
wir leben in Tschechien, also wird es nie anders sein,
ich versteh nicht, warum sich die Leute ringsum immer noch wundern.', 0
FROM `songs` s
WHERE LOWER(s.`name`) LIKE '%kalba%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;

-- uk
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Гулянка', 'Приходжу до тями на підлозі, не знаю, що було, головне, що вдома, гадки не маю, як усе пішло,
повільно підводжуся, голова розколюється, схоже, що я отримав кулаком,
так не можна, я кидаю пити, я вже досить старий, міг би мати розум.
Після обіду дзвонить Skeli, сьогодні знову паті,
ну, схоже, що доля роздала карти,
приїдуть і дівчата, тож вечір буде класний,
ясно, що прийду, у мене вже заряджена палиця.
Мені досі зле, а вечір уже наближається,
учорашнє віскі тисне мені на шлунок,
одразу з порога чарка у дверях,
за годину вже ловлю в ногах ревматизм,
зранку поруч у ліжку лежить чужа пані,
та я нічого не знаю, у мене провал, як у корови.

Ми йдемо своїм шляхом, як кожного тижня,
бухаємо, відриваємося, куримо weed,
часом нас охоплює трохи більший сказ,
тоді сусіди ревуть із безмежної злості.
Наступного дня не віримо, що ж ми таке робили,
без пристойності, без гальм, ми добряче напилися,
живемо в Чехії, тож інакше вже не буде,
не розумію, чому люди довкола досі дивуються.

Вставати зранку, у голові все потрахане,
від учорашнього провал, ну ти корова, оце так драма,
на пам''яті завіса, що то був за напій,
який вистрелив мене в космос, як набій,
як забитий інструмент, пляшка за пляшкою,
стираю свою коротку пам''ять, мене й важелем не зрушите,
чарки йдуть одна за одною, бажання ніяк не слабне,
поєдную це ще й із травою, не дотримуюсь правильного
здорового способу життя, пиво, косяк, пиво, блант, пиво, горілка,
і я там, потім повзу, як пацюк, але досі нічого не маю,
почуваюся, наче маріонетка, що гойдається на мотузках,
дивлюся довкола і сподіваюся, що я непомітний, як муха,
яка наважується зробити ще один ковток,
потім шепочу дівчатам на вушко, якого гарного маю папугу.

Ми йдемо своїм шляхом, як кожного тижня,
бухаємо, відриваємося, куримо weed,
часом нас охоплює трохи більший сказ,
тоді сусіди ревуть із безмежної злості.
Наступного дня не віримо, що ж ми таке робили,
без пристойності, без гальм, ми добряче напилися,
живемо в Чехії, тож інакше вже не буде,
не розумію, чому люди довкола досі дивуються.

Смокчу, як Олда Кайзер, Jägermeister,
у роті бичок, я не той, хто цілу ніч смокче один сидр,
поки ти блюєш, я мчу, як Knight Rider, як снайпер,
насторожуюся, коли бачу дівчину, що дуже нагадує мені Мішель Пфайффер.
What''s your name, girl? Хочу твій number,
супер кайф, бебі, перш ніж я кинуся до справи,
я темний покидьок a.k.a. Дарт Вейдер,
у кишені маю трохи haze, тож дай мені paper,
пускаю по колу, вимикаю всіх,
на мить мені страшно, що знадобиться lifesaver,
а наступний день — справжній motherfucker,
людина розбита, як старий батько після зміни,
хочеш витріщатися, як короп, цілий день почуватися паршиво,
Raptor летить до бару, як Чарлі Воттс.

Ми йдемо своїм шляхом, як кожного тижня,
бухаємо, відриваємося, куримо weed,
часом нас охоплює трохи більший сказ,
тоді сусіди ревуть із безмежної злості.
Наступного дня не віримо, що ж ми таке робили,
без пристойності, без гальм, ми добряче напилися,
живемо в Чехії, тож інакше вже не буде,
не розумію, чому люди довкола досі дивуються.', 0
FROM `songs` s
WHERE LOWER(s.`name`) LIKE '%kalba%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;

-- vi
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Cuộc nhậu', 'Tôi tỉnh lại trên sàn, chẳng biết chuyện gì đã xảy ra, may là đang ở nhà, không hiểu đêm qua thế nào,
từ từ gượng dậy, đầu đau như búa bổ, trông như vừa ăn một cú đấm,
cứ thế này không được, tôi bỏ rượu đây, tôi đủ già rồi, đáng lẽ phải biết khôn ra.
Sau bữa trưa Skeli gọi, hôm nay lại có tiệc,
chà, xem ra số phận đã chia bài,
mấy em cũng đến, nên tối nay sẽ vui,
tất nhiên tôi sẽ đến, cây gậy của tôi đã nạp đạn sẵn.
Tôi vẫn còn khó chịu mà trời đã sắp tối,
rượu whisky hôm qua vẫn đè nặng trong bụng,
vừa đến nơi đã có ly rượu ngay giữa cửa,
sau một tiếng chân tôi đã bắt đầu thấp khớp,
sáng ra bên cạnh trên giường là một quý cô lạ,
nhưng tôi chẳng biết gì, tôi mất trí nhớ như một con bò.

Chúng tôi cứ đi con đường của mình, như mọi tuần,
nốc rượu, quậy tới bến, hút weed,
đôi khi một cơn điên lớn hơn chút ập đến với chúng tôi,
rồi hàng xóm gào lên trong cơn giận vô bờ.
Hôm sau chúng tôi không tin nổi mình đã làm gì,
chẳng lịch sự, chẳng giữ gìn, chúng tôi say bí tỉ,
sống ở Séc mà, nên sẽ chẳng khác đi đâu,
tôi không hiểu sao người xung quanh cứ mãi ngạc nhiên.

Sáng phải dậy, đầu óc nát bét,
mất trí nhớ từ hôm qua, trời đất ơi, đúng là bi kịch,
một tấm màn che ký ức, thứ đồ uống gì thế không biết,
đã bắn tôi lên vũ trụ như một viên đạn,
như dụng cụ bị đóng lút, hết chai này đến chai khác,
tôi xóa đi trí nhớ ngắn của mình, dùng đòn bẩy cũng chẳng lay được tôi,
từng ly cứ trôi xuống, cơn thèm chẳng hề giảm,
tôi còn kết hợp với cỏ, tôi chẳng theo một
lối sống lành mạnh đúng đắn nào, bia, điếu cần, bia, blunt, bia, vodka,
và tôi đã phê, rồi bò lê như con chuột, nhưng vẫn chẳng có gì,
tôi thấy mình như con rối đu đưa trên dây,
tôi nhìn quanh và hy vọng mình kín đáo như một con ruồi
dám nhấp thêm một ngụm nữa,
rồi tôi thì thầm vào tai các cô, rằng tôi có con vẹt đẹp đến thế nào.

Chúng tôi cứ đi con đường của mình, như mọi tuần,
nốc rượu, quậy tới bến, hút weed,
đôi khi một cơn điên lớn hơn chút ập đến với chúng tôi,
rồi hàng xóm gào lên trong cơn giận vô bờ.
Hôm sau chúng tôi không tin nổi mình đã làm gì,
chẳng lịch sự, chẳng giữ gìn, chúng tôi say bí tỉ,
sống ở Séc mà, nên sẽ chẳng khác đi đâu,
tôi không hiểu sao người xung quanh cứ mãi ngạc nhiên.

Tôi rít như Olda Kaiser, Jägermeister,
trên môi là mẩu thuốc, tôi không phải loại mút một ly cider cả đêm,
trong lúc bạn nôn, tôi lao đi như Knight Rider, như tay bắn tỉa,
tôi chú ý khi thấy một em làm tôi nhớ đến Michelle Pfeiffer.
What''s your name, girl? Tôi muốn number của em,
vui hết nấc, baby, trước khi tôi lao vào việc,
tôi là thằng khốn u tối a.k.a. Darth Vader,
trong túi có ít haze, nên đưa tôi tờ paper,
tôi chuyền vòng quanh, tôi hạ gục tất cả,
có lúc tôi sợ sẽ cần đến lifesaver,
và ngày hôm sau đúng là motherfucker,
người rã rời như ông bố già sau ca làm,
muốn trố mắt như cá chép, cả ngày thấy tệ hại,
Raptor bay tới quầy bar như Charlie Watts.

Chúng tôi cứ đi con đường của mình, như mọi tuần,
nốc rượu, quậy tới bến, hút weed,
đôi khi một cơn điên lớn hơn chút ập đến với chúng tôi,
rồi hàng xóm gào lên trong cơn giận vô bờ.
Hôm sau chúng tôi không tin nổi mình đã làm gì,
chẳng lịch sự, chẳng giữ gìn, chúng tôi say bí tỉ,
sống ở Séc mà, nên sẽ chẳng khác đi đâu,
tôi không hiểu sao người xung quanh cứ mãi ngạc nhiên.', 0
FROM `songs` s
WHERE LOWER(s.`name`) LIKE '%kalba%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
