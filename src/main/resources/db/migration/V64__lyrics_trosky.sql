-- Lyrics for Trosky (feat. Babar, 2016), checked by Skeli, with translations into en/de/uk/vi
-- and the translated title. Generated from work/texty-koncepty.md and work/skeli-texty-nastroje/preklady.

INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'Vy hlavy dutý, jste dávno vypnutý, vaše existence pochybný,
nechutně vyhublý, držky propadlý, odpadlíci, co se sami zahubí,
vysmažený nátury s celým životem naruby, vyschlej jako dromedár,
tváří se jak topstar, přitom seš troska top kár, co si život pojebal,
probodaný žíly dodávaj ti další síly, žiješ jenom pro tu chvíli, kdy se nafutruješ bílým.
Trosky s nevyvinutými mozky, vybílí byt pro bílý, bez matra by nepřežili,
vykradou vlastní rodiny, během hodiny rozbili roky, kdy pro ně rodiny ruce do ohně vložily.
Hromada ostudy za vychovaný žaludy,
přeludy bez budoucnosti, kterou si sami pohřbili,
nepochopili, kam to vlastně vstoupili,
že už z toho nejde tak ven, že nejsou jenom opilí.
Jste špatný jak tvý blbý zažívání,
savci, co to sajou bez přestání,
vaše fetiš klání vás dohání až k pobodání při nedostání další dávky,
tyhle kroky nejdou vzít zpátky,
stal se vrahem pro kus skurvený hromádky,
krev z rukou už nejde smýt,
teď nevíš, jak s tímhle činem žít,
teď teprv si procit, bodá tě pocit bezmoci,
od rána do noci přemýšlíš, kdo jsi, jsi zlosyn,
vole, jsi v koncích, v krimu si na tvou prdel zuby už brousí,
ještě než se z toho zhroutíš, malátně po cimře bloudíš,
delirium končí a v pytli už prázdno,
všechno vysáto, v hlavě vymazáno, ano, máš vyděláno.
Bereš nohy na ramena, utíkáš jak dítě,
nechceš za mříže, stejně to přijde,
boží mlýny melou, tebe berou s sebou,
upadlo ti mýdlo, teď jebou tě ve dvou,
za tvý činy na deset let úděl maminy,
pěkný program už si tam pro tebe připravili,
s tvou vyhublou postavou nemůžeš se bránit,
každej den každej tě může v klidu klátit,
už si nemůžeš ani sednout, chtěl bys radši zhebnout,
než si s tebou přijdou zase jebnout,
usínáš každou noc s depkou, že ses stal fetkou, že ses dal na cestu opravdu nepěknou.

Měl jsem buchtu, co si hrála na to, že je vážně třída,
ale víš jak, po pár týdnech registruju, že jí dávno předtím, než jsme se poznali, zachutnala křída,
prej jí párno obstarává křídla a jí se chce lítat,
přestal sem ji líbat, nechtěl sem ji svlíkat, lízat, píchat, vydat,
taky ne, protože je píča, píča, píča.
Měl jsem kamaráda, co mi říkal bráško, věřil jsem mu, věděl o mně téměř všechno,
pak poznal blbý lidi, chytil se jich, v něm se to přeplo,
z rypáku mu piko teklo, denně vidím peklo,
na ulici kdekdo, často malý děcka, co nemůžou přestat,
je jich plný město, jsou na pest, a mám pro ně jenom jedno gesto.

Ať si kdo chce, co chce, bere, smažky mi jsou u prdele,
jak si to usteleš, tak si lehneš na dno,
dá se padnout na dno, vydal ses cestou špatnou,
je to jako bahno, který když tě chytí, většinou tě nepustí,
schopnej věcí, co ti ani nejbližší neodpustí.
Vykašli se na fet, věta, kterou už ti nikdo nehustí,
jseš v tom po uši, stejně tak tví kámoši,
odvykací kúra, no stress, prej pedikúra,
pokud nechceš sám, hned čeká tě noční můra,
za plotem na tebe třese se dílerů fůra,
raz dva se ženeš na šňůru,
pak se nediv, že je v noci celej barák vzhůru,
nediv se, že detox tvoří ještě větší stvůry,
otevřou se vrata Bohnic, utíkaj pro bůra,
psago čistý jak natura.

Ať si kdo chce, co chce, bere, smažky mi jsou u prdele,
jak si to usteleš, tak si lehneš na dno,
dá se padnout na dno, je to jako bahno,
už cítíš to chladno.
(4×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Trosky%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;

-- en
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'Wrecks', 'You hollow heads, you switched off long ago, your existence is dubious,
disgustingly skinny, sunken faces, dropouts who''ll finish themselves off,
fried natures with your whole life inside out, dried up like a dromedary,
acting like a top star, while you''re the wreck of a top car who fucked up his life,
pierced veins give you more strength, you only live for the moment you stuff yourself with white.
Wrecks with undeveloped brains, they''ll clear out a flat for the white, without the stuff they wouldn''t survive,
they rob their own families, in an hour they smashed the years when their families put their hands in the fire for them.
A pile of shame for well-raised acorns,
illusions without a future, which they buried themselves,
they never understood what they actually stepped into,
that there''s no easy way out, that they''re not just drunk.
You''re as bad as your stupid digestion,
mammals who suck it up without a break,
your fetish contest drives you all the way to stabbing when you don''t get the next dose,
these steps can''t be taken back,
he became a killer for a piece of a fucking little pile,
the blood can''t be washed off your hands anymore,
now you don''t know how to live with this deed,
only now you''ve woken up, the feeling of helplessness stabs you,
from morning till night you wonder who you are, you''re a villain,
dude, you''re done for, in jail they''re already sharpening their teeth on your ass,
before you even break down, you wander around the cell in a daze,
the delirium ends and the bag is already empty,
everything sucked up, your head wiped, yes, you''ve earned it.
You take to your heels, you run like a child,
you don''t want to go behind bars, it''ll come anyway,
God''s mills grind, they take you with them,
you dropped the soap, now two of them are fucking you,
for your deeds ten years as the mommy,
they''ve already prepared a nice program for you in there,
with your skinny frame you can''t defend yourself,
every day anyone can bang you at their leisure,
you can''t even sit down anymore, you''d rather croak
than have them come to fuck you again,
every night you fall asleep depressed that you became a junkie, that you took a really ugly road.

I had a chick who acted like she was real class,
but you know how it goes, after a few weeks I notice that long before we met she got a taste for chalk,
they say the crank gives her wings and she wants to fly,
I stopped kissing her, didn''t want to undress her, lick her, fuck her, give in to her,
no way, because she''s a bitch, a bitch, a bitch.
I had a friend who called me bro, I trusted him, he knew almost everything about me,
then he met stupid people, latched onto them, something flipped in him,
crank was running out of his snout, every day I see hell,
anyone on the street, often little kids who can''t stop,
the city is full of them, they''re wasted, and I only have one gesture for them.

Let anyone take whatever they want, I don''t give a shit about junkies,
you made your bed, now you''ll lie on the bottom,
you can hit the bottom, you took the wrong road,
it''s like mud that, once it catches you, mostly won''t let you go,
capable of things even your closest won''t forgive you for.
Quit the drugs, a line nobody drills into you anymore,
you''re in it up to your ears, and so are your buddies,
rehab, no stress, a pedicure, they say,
if you don''t want it yourself, a nightmare''s waiting for you right away,
behind the fence a whole load of dealers is waiting for you,
in no time you''re rushing to the line,
then don''t be surprised the whole building is awake at night,
don''t be surprised that detox creates even bigger monsters,
the gates of Bohnice open, they run for bůra,
psago clean as nature.

Let anyone take whatever they want, I don''t give a shit about junkies,
you made your bed, now you''ll lie on the bottom,
you can hit the bottom, it''s like mud,
now you feel the cold.
(4×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Trosky%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Trosky%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Wrecks' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');

-- de
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Wracks', 'Ihr hohlen Köpfe, ihr seid längst abgeschaltet, eure Existenz ist zweifelhaft,
widerlich abgemagert, eingefallene Fressen, Aussteiger, die sich selbst zugrunde richten,
verbrutzelte Naturen mit dem ganzen Leben auf links, ausgetrocknet wie ein Dromedar,
tut wie ein Topstar, dabei bist du das Wrack einer Topkarre, das sein Leben verkackt hat,
durchstochene Venen geben dir neue Kraft, du lebst nur für den Moment, in dem du dich mit Weißem vollstopfst.
Wracks mit unterentwickelten Hirnen, räumen die Wohnung fürs Weiße leer, ohne den Stoff würden sie nicht überleben,
sie bestehlen die eigenen Familien, in einer Stunde zerstören sie die Jahre, in denen die Familien für sie die Hand ins Feuer legten.
Ein Haufen Schande für wohlerzogene Eicheln,
Trugbilder ohne Zukunft, die sie selbst begraben haben,
sie haben nie kapiert, worauf sie sich eigentlich eingelassen haben,
dass man da nicht so leicht rauskommt, dass sie nicht nur besoffen sind.
Ihr seid so schlecht wie deine blöde Verdauung,
Säugetiere, die das ohne Pause ziehen,
euer Fetisch-Wettkampf treibt euch bis zum Messerstich, wenn die nächste Dosis ausbleibt,
diese Schritte kann man nicht zurücknehmen,
er wurde zum Mörder für ein Stück von einem verfickten Häufchen,
das Blut lässt sich nicht mehr von den Händen waschen,
jetzt weißt du nicht, wie du mit dieser Tat leben sollst,
erst jetzt wachst du auf, das Gefühl der Ohnmacht sticht dich,
von morgens bis nachts grübelst du, wer du bist, du bist ein Verbrecher,
Alter, du bist am Ende, im Knast wetzen sie schon die Zähne an deinem Arsch,
noch bevor du zusammenbrichst, irrst du benommen durch die Zelle,
das Delirium endet und das Tütchen ist schon leer,
alles weggezogen, im Kopf gelöscht, ja, das hast du dir verdient.
Du nimmst die Beine in die Hand, rennst weg wie ein Kind,
du willst nicht hinter Gitter, es kommt trotzdem,
Gottes Mühlen mahlen, sie nehmen dich mit,
dir ist die Seife runtergefallen, jetzt ficken dich zwei,
für deine Taten zehn Jahre als Mamachen,
ein nettes Programm haben sie dort schon für dich vorbereitet,
mit deiner abgemagerten Figur kannst du dich nicht wehren,
jeden Tag kann dich jeder in aller Ruhe durchnehmen,
du kannst nicht mal mehr sitzen, du würdest lieber verrecken,
bevor sie wieder kommen, um dich zu ficken,
jede Nacht schläfst du deprimiert ein, weil du ein Junkie geworden bist, weil du einen wirklich üblen Weg genommen hast.

Ich hatte eine Braut, die so tat, als wäre sie echt Klasse,
aber du weißt ja, nach ein paar Wochen merke ich, dass ihr lange bevor wir uns kannten die Kreide geschmeckt hat,
angeblich verleiht ihr das Crystal Flügel und sie will fliegen,
ich hörte auf, sie zu küssen, wollte sie nicht ausziehen, lecken, ficken, mich ihr nicht hingeben,
auch nicht, weil sie eine Schlampe ist, eine Schlampe, eine Schlampe.
Ich hatte einen Kumpel, der mich Bruder nannte, ich vertraute ihm, er wusste fast alles über mich,
dann lernte er blöde Leute kennen, hängte sich an sie, in ihm hat es umgeschaltet,
aus dem Rüssel lief ihm das Crystal, täglich sehe ich die Hölle,
auf der Straße jeder Zweite, oft kleine Kinder, die nicht aufhören können,
die Stadt ist voll von ihnen, sie sind fertig, und ich habe für sie nur eine Geste.

Soll doch jeder nehmen, was er will, Junkies sind mir scheißegal,
wie man sich bettet, so liegt man – ganz unten,
man kann ganz unten landen, du hast den falschen Weg genommen,
es ist wie Schlamm, der dich, wenn er dich packt, meistens nicht mehr loslässt,
fähig zu Dingen, die dir nicht mal die Nächsten verzeihen.
Scheiß auf die Drogen, ein Satz, den dir keiner mehr einhämmert,
du steckst bis zum Hals drin, genau wie deine Kumpels,
Entzugskur, kein Stress, angeblich Pediküre,
wenn du es nicht selbst willst, wartet sofort der Albtraum auf dich,
hinterm Zaun wartet schon eine Fuhre Dealer auf dich,
im Nu jagst du zur nächsten Line,
dann wunder dich nicht, dass nachts das ganze Haus wach ist,
wunder dich nicht, dass der Entzug noch größere Monster schafft,
die Tore von Bohnice gehen auf, sie rennen nach bůra,
psago rein wie die Natur.

Soll doch jeder nehmen, was er will, Junkies sind mir scheißegal,
wie man sich bettet, so liegt man – ganz unten,
man kann ganz unten landen, es ist wie Schlamm,
jetzt spürst du schon die Kälte.
(4×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Trosky%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Trosky%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Wracks' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');

-- uk
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Уламки', 'Ви, порожні голови, ви давно вимкнені, ваше існування сумнівне,
огидно схудлі, запалі пики, відщепенці, що самі себе занапастять,
підсмажені натури з усім життям навиворіт, висохлі, як верблюд,
корчиш із себе топзірку, а сам — уламок топової тачки, що просрав своє життя,
проколоті вени дають тобі нові сили, живеш лише заради миті, коли напхаєшся білим.
Уламки з недорозвиненим мозком, винесуть усе з квартири заради білого, без дурі не вижили б,
обкрадають власні родини, за годину зруйнували роки, коли родини клали за них руку у вогонь.
Купа ганьби за виховані жолуді,
марева без майбутнього, яке самі ж і поховали,
так і не зрозуміли, куди насправді вступили,
що звідти вже так просто не вийти, що вони не просто п''яні.
Ви погані, як твоє дурне травлення,
ссавці, що смокчуть це без упину,
ваше фетиш-змагання доводить вас аж до ножа, коли не дістанете чергової дози,
ці кроки вже не повернеш назад,
став убивцею за шматок клятої купки,
кров із рук уже не змити,
тепер не знаєш, як жити з цим вчинком,
тільки тепер ти прокинувся, тебе колить відчуття безсилля,
з ранку до ночі думаєш, хто ти, ти лиходій,
чуваче, тобі кінець, у тюрязі на твою дупу вже гострять зуби,
ще до того, як зламаєшся, ти мляво блукаєш камерою,
делірій закінчується, і в пакетику вже порожньо,
усе висмоктано, у голові стерто, так, ти це заробив.
Береш ноги в руки, тікаєш, як дитина,
не хочеш за ґрати, все одно це прийде,
Божі млини мелють, тебе беруть із собою,
тобі впало мило, тепер тебе трахають удвох,
за твої вчинки на десять років доля «мамки»,
гарну програму там для тебе вже підготували,
з твоєю худою статурою ти не можеш захиститися,
щодня будь-хто може спокійно тебе трахнути,
ти вже навіть сісти не можеш, волів би здохнути,
ніж вони знову прийдуть тебе трахнути,
щоночі засинаєш у депресії, що став наркоманом, що пішов дуже поганою дорогою.

Була в мене дівка, що вдавала, ніби вона справжній клас,
але знаєш, як буває, за кілька тижнів помічаю, що задовго до нашого знайомства їй засмакувала крейда,
кажуть, фен дає їй крила, і їй хочеться літати,
я перестав її цілувати, не хотів її роздягати, лизати, трахати, піддаватися їй,
теж ні, бо вона сука, сука, сука.
Був у мене друг, що звав мене братиком, я йому вірив, він знав про мене майже все,
потім зійшовся з дурними людьми, вчепився за них, у ньому щось перемкнуло,
з носа в нього текла дурь, щодня бачу пекло,
на вулиці будь-хто, часто малі діти, що не можуть зупинитися,
ними повне місто, вони пропащі, і в мене для них лише один жест.

Хай хто хоче бере що хоче, на наркош мені начхати,
як постелиш, так і ляжеш на дно,
можна впасти на дно, ти пішов поганою дорогою,
це як болото, яке, коли тебе схопить, здебільшого не відпускає,
здатний на речі, яких тобі не пробачать навіть найближчі.
Кинь наркоту — фраза, яку тобі вже ніхто не втовкмачує,
ти в цьому по вуха, так само як твої кореші,
курс відвикання, без стресу, мовляв, педикюр,
якщо сам не хочеш, одразу на тебе чекає жах,
за парканом на тебе чекає ціла купа дилерів,
раз-два — і ти мчиш до доріжки,
то не дивуйся, що вночі весь будинок не спить,
не дивуйся, що детокс творить ще більших потвор,
відчиняються ворота Богниць, біжать по bůra,
psago чисте, як природа.

Хай хто хоче бере що хоче, на наркош мені начхати,
як постелиш, так і ляжеш на дно,
можна впасти на дно, це як болото,
вже відчуваєш цей холод.
(4×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Trosky%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Trosky%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Уламки' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');

-- vi
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Những kẻ tàn tạ', 'Lũ đầu rỗng, tụi mày đã tắt máy từ lâu, sự tồn tại của tụi mày thật đáng ngờ,
gầy rộc đến ghê tởm, mặt mũi hốc hác, lũ bỏ đi tự hủy hoại chính mình,
những bản chất cháy khét với cả cuộc đời lộn ngược, khô quắt như lạc đà,
làm bộ như ngôi sao hàng đầu, trong khi mày là đống sắt vụn của một chiếc xe xịn, kẻ đã phá nát đời mình,
những mạch máu đầy vết kim cho mày thêm sức, mày chỉ sống vì khoảnh khắc được nhồi đầy thứ bột trắng.
Lũ tàn tạ với bộ não chưa phát triển, dọn sạch căn hộ để đổi lấy bột trắng, không có hàng thì chẳng sống nổi,
chúng trộm cả gia đình mình, trong một giờ phá nát bao năm gia đình sẵn sàng đặt tay vào lửa vì chúng.
Một đống ô nhục thay cho những hạt sồi được dạy dỗ tử tế,
những ảo ảnh không tương lai mà chính chúng đã chôn vùi,
chúng chẳng hiểu mình thực sự đã bước vào cái gì,
rằng chẳng dễ gì thoát ra, rằng chúng không chỉ say rượu.
Tụi mày tệ như cái hệ tiêu hóa ngu ngốc của mày,
lũ động vật có vú hút nó không ngừng nghỉ,
cuộc đua nghiện ngập đẩy tụi mày tới chỗ đâm dao khi không có liều tiếp theo,
những bước này không thể rút lại,
hắn thành kẻ giết người vì một nhúm bột chết tiệt,
máu trên tay không thể rửa sạch nữa,
giờ mày không biết sống sao với tội ác này,
giờ mày mới tỉnh ra, cảm giác bất lực đâm vào mày,
từ sáng tới đêm mày nghĩ mình là ai, mày là kẻ ác,
mày tiêu rồi, thằng kia, trong tù người ta đã mài răng chờ cái mông mày,
trước cả khi gục ngã, mày lờ đờ lang thang trong phòng giam,
cơn mê sảng kết thúc và túi đã trống trơn,
tất cả hút sạch, trong đầu bị xóa trắng, đúng rồi, mày đáng bị vậy.
Mày co giò chạy, chạy như một đứa trẻ,
mày không muốn vào sau song sắt, nhưng đằng nào nó cũng đến,
cối xay của Chúa vẫn nghiền, chúng mang mày theo,
mày đánh rơi xà phòng, giờ hai đứa chơi mày,
vì tội của mày, mười năm làm "mẹ" trong đó,
một chương trình thú vị đã được chuẩn bị sẵn cho mày,
với thân hình gầy gò, mày không thể tự vệ,
ngày nào ai cũng có thể thoải mái chơi mày,
mày còn chẳng ngồi nổi nữa, mày thà chết quách
còn hơn để chúng lại đến chơi mày,
đêm nào mày cũng ngủ trong trầm cảm vì đã thành con nghiện, vì đã đi một con đường thật tồi tệ.

Tao từng có một em ra vẻ mình đẳng cấp lắm,
nhưng mày biết đấy, vài tuần sau tao nhận ra từ lâu trước khi bọn tao quen nhau nó đã nghiện "phấn",
nghe nói đá cho nó đôi cánh và nó muốn bay,
tao thôi hôn nó, chẳng muốn cởi đồ, liếm, chơi hay chiều theo nó,
cũng không, vì nó là đồ khốn, đồ khốn, đồ khốn.
Tao từng có một thằng bạn gọi tao là anh em, tao tin nó, nó biết gần hết mọi thứ về tao,
rồi nó quen đám người ngu, bám lấy chúng, trong nó có gì đó bị đảo ngược,
đá chảy ra từ mũi nó, ngày nào tao cũng thấy địa ngục,
ngoài phố ai cũng thế, thường là những đứa trẻ con không thể dừng lại,
thành phố đầy chúng, chúng tàn rồi, và tao chỉ có một cử chỉ dành cho chúng.

Ai muốn dùng gì thì dùng, bọn nghiện tao cóc quan tâm,
mày trải giường thế nào thì nằm dưới đáy thế ấy,
có thể rơi xuống đáy, mày đã đi sai đường,
nó như bùn lầy, một khi đã tóm được mày thì thường chẳng buông,
khiến mày làm những chuyện mà ngay cả người thân nhất cũng không tha thứ.
Bỏ ma túy đi, câu mà chẳng ai còn nhồi vào đầu mày nữa,
mày ngập đến tận tai, đám bạn mày cũng vậy,
cai nghiện, không căng thẳng, nghe nói như đi làm móng chân,
nếu chính mày không muốn, ác mộng chờ mày ngay,
sau hàng rào cả đống tay buôn đang chờ mày,
chớp mắt mày đã lao tới vệt bột,
rồi đừng ngạc nhiên khi cả tòa nhà thức trắng đêm,
đừng ngạc nhiên khi cai nghiện tạo ra những con quái vật còn lớn hơn,
cổng Bohnice mở ra, chúng chạy đi tìm bůra,
psago sạch như thiên nhiên.

Ai muốn dùng gì thì dùng, bọn nghiện tao cóc quan tâm,
mày trải giường thế nào thì nằm dưới đáy thế ấy,
có thể rơi xuống đáy, nó như bùn lầy,
giờ mày đã thấy cái lạnh rồi.
(4×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Trosky%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Trosky%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Những kẻ tàn tạ' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
