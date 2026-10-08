-- Czech lyrics checked by Skeli (generated from work/texty-koncepty.md).
-- A song that already has Czech lyrics is left alone.

INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'Začalo to nevinně, takhle jednou po víně,
sedíme, zevlíme, o světě vůbec nevíme,
sotva patnáct let, holt kluci neznalí,
svou první zelenou cigaretu zamotají,
stav houpavý se dostaví, když to brčko odpálíš,
s chutí do života vrhám se do víru poznání,
v puse nemám ani slinu, v tomhle dýmu se rozplynu,
inu, tuhle rostlinu od tý doby každou hodinu.
Jídlo, pití chutná líp, v práci se dá líp přežít,
celý den je veselej, tak nedělej, že seš nesmělej,
do kroužku sedej, nebuď jelen, život máš jenom jeden, tak si ho pořádně užívej.

Je to ganja, mocný čaroděj jménem ganja,
spasitel a lék na smutek a vztek,
málokdo to pochopí, lidi nejsou ochotní žít životy svobodný.
(2×)

Hnedka ráno, co vstanu, zamotám si půl gramu,
další půl gramu nechám na dýl na programu,
všude zákazy, rostliny ilegální, mi nezabrání
ve vyhledávání ideálních míst, kam si zalízt a nechat se svíst grandiózních palic,
už stačí jen zabalit, na záda se svalit,
užívat si dokonalý stavy bez práce, bez námahy.
Jo, to mám rád, tak mě to baví, zdravím všechny přátele, který dělají to samý,
jsme očarovaný mocným kouzlem mírumilovným,
nedá se to srovnat s chlastem.

Je to ganja, mocný čaroděj jménem ganja,
spasitel a lék na smutek a vztek,
málokdo to pochopí, lidi nejsou ochotní žít životy svobodný.
(3×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Ganja%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;

INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'No ty vole, koukni, jak se žije dole,
alespoň na chvíli se vžít do mojí role,
potí se mi koule z toho, jak musím dřít,
a je mi špatně z toho, že vím, jak málo za to budu mít.
Sedíte si na uších v kravatách, nafintěný, navoněný, peněženky přeplněný,
tlačí vás do prdelí a furt vám to nestačí,
nejsem slepej, blbej a ani nejmladší,
ale mám svůj plán, kterej mě zachrání,
naše CD bude všude dobře k sehnání.
Ukážem ti věci, co ti byly dodnes neznámý,
neřeším, že dělám věci, co nejsou legální,
zakázaný ovoce je tu všude k sehnání,
a proto se skrz mou ves chlupatý rádi prohání,
asi jim to nepřijde úplně normální,
že za to, co dělám, daně neodvádím.

Plány a taktika mi prej nic neříká,
divím se, když zaslechnu, že mi to lidi vytýkaj,
včera dělal jsem to, co dělám dneska,
od rána do večera visel jsem u Tesca,
musím furt chlastat, beztak nechci přestat,
žiju a profituju pouze z darů města,
mockrát jsem musel na chodníku přespat,
jsem socka, čpí ze mě rozklad,
já a můj gang zaujmeme pozice,
den co den prachy po všech kolem chcem,
posadím se na zem s hladovým čoklem,
vidíš pracku s kloboukem, obcházíš mě obloukem,
koleduju si, mám monokl pod vokem,
nepohnu se z místa, jsem tam, kde jsem byl před rokem,
jsem línej šmejd, ta nálepka nejde smejt,
mým plánem je celý život beton hubou rejt.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Skeli a Babar - No ty vole%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;

INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'Zhostí se tě divnej pocit, když otevřeš svoje oči,
máme v tom prsty, nesnažte se viny zprostit,
chovejme se tak, jak maj se chovat hosti,
pozdě budem prosit, až tu zbudou trosky.
(2×)

Šinu si to sám cestou temnou a dlouhou,
kráčím s hlavou sklopenou, zkalenou, zmatenou,
plnou myšlenek, který tak neodejdou,
jen lidi odcházejí, krásný vzpomínky si berou s sebou,
přitom si vemou cenu pro mě nesnesitelnou,
je to fake jak kérka hennou,
chvilku jsou a pak se smejou,
holt na divný planetě se divný věci dějou.
Mířím do nečasu, kde všichni hledí na krásu,
holky měří vztah podle délky ocasů,
kam poděl se elán, dřív ho měl každej pán,
gentleman na každém rohu dveře dámám otvíral, a dnes,
kam se kouknu, někdo někoho unes,
je to děs, běs, všude vykácenej les,
na naší planetě může jenom průmysl kvést,
a ta planeta je jako klec, ze který nemůžeš utéct,
války, rasismus, drogy, vrazi,
mnoho pastí, co lidi na kolena srazí,
odražená kulka, co zabila malýho kluka,
pro rodinu jsou to nepředstavitelný muka,
za volantem alkohol, v ulicích fet,
vedle silnice bordel, kam to spěje tenhle svět,
nad tím, co se děje, mi začíná rozum stát,
páč stojím s váma na lodi, co brzo ztroskotá.

A co to je? A kde to jsem?
Je to skutečnost, nebo jenom blbej sen?
Jsem snad kretén, nebo máš taky ten dojem,
že žene se před nosem do záhuby naše zem?

Krok za krokem procházíš životem,
rveš se o svý místo pod sluncem,
nechceš bejt otrokem, strachuješ se o budoucnost,
ale nemáš moc vědět, co stane se za rohem,
podívej se, tvoje plány můžou rychle zdechnout,
ve chvíli je všechno jinak, nestihneš se ani hnout,
tahle divná planeta s osudama zametá,
smrt jako zmrd přijde, podřízne ti krk.
Lidstvo se nepoučí, nevraživost vládne světu,
malý děti tisknou prsty na spoušť kulometu,
celou věčnost vidíme to tu,
zavíráme oči, prosedíme celý hodiny na netu,
pracujeme, přispíváme k rozkvětu,
skurveně zabíjíme většinu času,
vyhlížíš to datum, kdy zabereš výplatu,
divíš se, robote, že nenacpal sis kapsu.
Lidi spěchaj neustále, i když neví kam,
život pomalu a jistě ztrácí svůj význam,
život a kvalita měří se dnes v penězích,
že pravda s láskou zvítězí, nikdo už nevěří,
není místo na pocity, budujeme kariéry,
devastujeme krajinu, pokládáme bariéry,
bezohledně vypouštíme sračky do atmosféry,
copak asi budou dejchat naši synové a dcery.
Nesnažím se hrát si na Armádu spásy,
sere mě jen, jak si člověk větev pod prdelí kácí,
fakta a problém ignorovat se nevyplácí,
nepomohou ani svatí, všechno se nám vrátí.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Divná planeta%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;

INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'Prej se mám usmívat, se stádem ubírat,
lidem lízt do zadku, nejspíš ho i utírat,
měl bych se prej krotit a přestat to tak hrotit,
a smířit se s tím, jak to je, nohama šoupat, hlavu sklopit.
Tohle neřeš, s tímhle nehneš, nemůžeš nic dělat,
nepřemýšlej, vypni mozek, makej do roztrhání těla,
svůj názor si nech nejlíp na druhej břeh,
nejsi tu proto, abys změnil nepříznivých věcí běh.

Jsi obyčejnej člověk, úděl srát se v hovnech,
účet splácet celej život, nechat sebou vláčet,
ujel ti vláček už ten moment, kdy jsi spatřil svět,
tak zavři hubu, srovnej krok a zapůj zpět.
(2×)

Jsem malej zmrd, mám skoro metr a půl,
vystrkuju z davu hlavu, chtěj mě napíchnout na kůl,
utržil jsem tvrdý rány, do nich mi sypou sůl,
nespočet ran ještě schytám,
letí ze všech stran, a nedělám věci jenom proto, že by byly cool,
nemám stejný záliby jako každej druhej vůl,
za povahu neustále po zásluze pykám,
je to průser, že průměru se úspěšně vymykám,
pod průměrem, nad průměrem nikdo nesmí stát,
nech si svý sny pro sebe, koukej si je kurva vzát,
musíš jenom makat, spát, makat, spát, makat, spát,
vydělávat hovno, hovno rovnou do hajzlu srát, dík, nemám zájem
kráčet se stádem, fakt nejsem blázen, řídím se svým plánem,
svůj názor si nech nejlépe na druhej břeh,
pojedu podle sebe, dokud mi vystačí dech.

Jsi obyčejnej člověk, úděl srát se v hovnech,
účet splácet celej život, nechat sebou vláčet,
ujel ti vláček už ten moment, kdy jsi spatřil svět,
tak zavři hubu, srovnej krok a zapůj zpět.
(2×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Obyčejnej člověk%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;

INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'No ty vole, no ty vole,
takže chápej, jedu na sto procent,
rok po roce mrdám všechno, mrdám tebe, mrdám všechno v dnešní době,
promiňte, že jsem takový, arogantní, makový,
nedokážou pochopit, že mrdám český zákony.
Česká politika a. k. a. tlustá fanatika,
vyjebaná pointa tady toho světa,
nechci se už toho týkat, vidím semafory blikat,
proto pokračujem dál, není, more, na co čekat.
Jedu v formaci jak kryptonit, vybouchnu jak dynamit,
cítíš se jak superhero, chceš nás, more, zastavit,
jsi zdrojem naší potravy, podělanej wannabe,
hejter stále netuší, že končí stupeň kariéry,
vaší sféry, vaší rozehraný strany, o čistotě rasy,
vaší trasy, náboženský spásy,
pro mě vyjebaný kecy, jedu na sto procent k věci.

Nemůžeš jít, homie, dál, bez toho fakt nejsi high,
nevíš sám kudy kam, taktika, vlastní plán.
(2×)

Česká republika vhodná tak pro notorika,
že tu žijeme, tak to zrovna není velká klika,
tunely, úplatky, to je naše vládní hra,
rychle všechno zdražit, kde na to kurva máme brát.
První v chlastu, první v drogách, každej balí jointa,
je to tady prohnilý, v tom je celá pointa,
už jsem na to zvyklej, a už se o to nestarám,
buď si, kámo, jistej, že o kvalitní rap se postarám,
rap je pro mě život a ten je zase krátkej,
jednou hore, jednou dole, no, je tak trochu vrtkej,
tohle je můj styl, tak tím si buď jistý,
a fakt je mi jedno, kámo, co si o mně myslíš,
mám prostě svou cestu, cestu vyvolenou,
i když je mi jasný, že to mnozí nepoberou,
dávám tak, jak dávám, žiju tam, kde žiju,
nic s tím nenadělám, jo, už to takhle beru.

Nemůžeš jít, homie, dál, bez toho fakt nejsi high,
nevíš sám kudy kam, taktika, vlastní plán.
(2×)

No ty vole, koukni, jak se žije dole,
alespoň na chvíli se vžít do mojí role,
potí se mi koule z toho, jak musím dřít,
a je mi špatně z toho, že vím, jak málo za to budu mít.
Sedíte si na uších v kravatách, nafintěný, navoněný, peněženky přeplněný,
tlačí vás do prdelí a furt vám to nestačí,
nejsem slepej, blbej a ani nejmladší,
ale mám svůj plán, kterej mě zachrání,
naše CD bude všude dobře k sehnání.
Ukážem ti věci, co ti byly dodnes neznámý,
neřeším, že dělám věci, co nejsou legální,
zakázaný ovoce je tu všude k sehnání,
a proto se skrz mou ves chlupatý rádi prohání,
asi jim to nepřijde úplně normální,
že za to, co dělám, daně neodvádím.

Plány a taktika mi prej nic neříká,
divím se, když zaslechnu, že mi to lidi vytýkaj,
včera dělal jsem to, co dělám dneska,
od rána do večera visel jsem u Tesca,
musím furt chlastat, beztak nechci přestat,
žiju a profituju pouze z darů města,
mockrát jsem musel na chodníku přespat,
jsem socka, čpí ze mě rozklad,
já a můj gang zaujmeme pozice,
den co den prachy po všech kolem chcem,
posadím se na zem s hladovým čoklem,
vidíš pracku s kloboukem, obcházíš mě obloukem,
koleduju si, mám monokl pod vokem,
nepohnu se z místa, jsem tam, kde jsem byl před rokem,
jsem línej šmejd, ta nálepka nejde smejt,
mým plánem je celý život beton hubou rejt.

Nemůžeš jít, homie, dál, bez toho fakt nejsi high,
nevíš sám kudy kam, taktika, vlastní plán.', 0
FROM `songs` s
WHERE s.`name` LIKE 'JML - No ty vole%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;

INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'Chci drahokam, nechci Pamela hoe,
ale jestli chce, můžu ti dát kouř,
klidně mi nastaví pyramidu, dám ho tam, potom odjedu,
přijde brácha, převezme štafetu, nedělej na mě, že si byla na fetu,
nevěřím ti ani slovo, zase ti prší do bot, v hubě nejeden kokot,
na tom si děláš promo, na mě nehraj nevinnou,
RDM nebo Zoom, pak tě pošlem dalším psům, pak tě pošlem dalším psům,
RDM a nebo Zoom, pak tě pošlem dalším psům.

Vzala ho do huby tady a támhle,
naštěkat do boudy, ke dnu tě stáhne,
jediný friends jen na OnlyFans,
nemá ty zábrany, rozdá se všem.

Kabelky, botičky a nový fáro,
pohoní, pokouří, je vyděláno,
nejstarší řemeslo živí tě teď,
to tvoje fotky zaplavily net.

Tělo je v oběhu, hlava je offline,
dávají ruce pryč, hned co tě poznaj,
nulový hodnoty, ty nejsi dáma,
co říká na tvoji pičku tvá máma?

Pošli jí pozdravy, zamávej dildem,
došel ti charakter, řešíš to pilsem,
každej si vezme z tebe jen kousek,
databáze už nesmažou se.

Neřešíš to, hlavně že ty prachy vyděláváš,
easy money za svý tělo, důstojnosti pápá.
Neřešíš to, hlavně že ty prachy vyděláváš,
easy money za svý tělo, důstojnosti pápá.

Děvka si myslí, že může podělat mě, ale to se jí nepovede,
chtěla po mně, jak se o ní udělám, ale říkám jí: čupko, ne, ne, ne, ne,
s takovou bych nebyl, nejsem blázen, nikdy bych nezradil sebe.
Mě by zajímalo, kam zmizela vaše hodnota,
to zmizelo, když se za prachy honili kokota,
takže slovo „žena“ vám nic neříká,
a to, že se dobře obléká, to nic neznamená.

Zoom, zoom, zoom, zoom,
zoom, zoom, zoom, zoom,
zoom, zoom, zoom, zoom,
let''s go, zoom, zoom,
pusťte to na show a ať to všichni slyší, ať bouchnou bedny,
tenhle track není sweet, není candy, fakt není candy,
čuzo, ty drž hubu, nemáš slovo, teď mluví čerti,
ta druhá ať jde stranou a počká na mě do večera,
čuza dává weed, myslí, že to nikdo neví, myslí, že to zatají,
řeklo mi to její okolí, bude každýmu dávat, bude z ní debilní kráva,
ale jednou ji spálí láva, já budu tančit tango a vals.

Je to debilní kráva a ráda dělá drama,
demony, hastiny, je fu na vlně, dělaj záda,
na chlastu se láme, každýho si dá,
a sebeúcta zmizela, už není tak hodná.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Zoom - Drama%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;

INSERT INTO `lyrics` (`song_id`, `lang`, `words`, `score`)
SELECT s.`id`, 'cs', 'I když to bolí, my musíme jít,
čas rány hojí, víš, musíme žít.

I když to včera stálo za hovno,
dneska mě čeká novej den,
ať je přede mnou cokoli,
nevěřim tomu, že něco nejde.
Nejsem furt pozitivní typ,
taky sem si vobčas sáhnul na dno,
ale mě se jen tak nezbavíte,
sem něco jako Sauron.
I když nejsou prachy, ve škole to stojí za píču,
sice sem furt v práci,
ale ani sem se nepřiblížil k míčům,
tak to v životě nevzdám,
budu makat do tý doby,
dokavaď ze mě nebude star,
chtěl bych lítat na vobloze,
ale nepatřit do letectva.
Boom, todle je přesně ten zvuk, jak si za tim du,
dovopravdy na něčem makám,
zatimco ty to píšeš na Facebook,
nedostal sem nic vod táty,
mámě bych to chtěl všechno vrátit,
nic ti nespadne samo do klína,
musíš bejt vochotnej jít dál i za svým cílem.
Kamaráde, já vim moc dobře, co to znamená
žít v bídě, jak lapenej do sítě,
přijde ti, že všechno de do píče,
ale vo tom je ten příběh,
nebuď rozmazlenej jak dítě.

I když to bolí, my musíme jít (musíme jít),
čas rány hojí, víš, musíme žít (musíme žít).
I když to bolí, my musíme jít (musíme jít),
čas rány hojí, víš, musíme žít (musíme žít).

Mockrát sem už selhal a prohrál,
ale neptal sem se, proč já,
jen sem se zved a šel dál,
moc rád bych vyhrával každej zápas
a slavil jak Dán, ale to bych pak nikdy
neměl pokoru, jakou teď mám.
Projít se peklem je lepší
než mít všechno pod nosem
a žít jen jako povrchní komik nebo píča,
co neví nic o životě,
smích, je to spíš k pláči,
páč bez bolesti nepoznáš, co je to štěstí.
A já si nabil zobák tolikrát,
že už to radši nepočítám,
a spíš myslim na to, kolik dám,
než na to, kolik měl bych brát,
vim, že lepší je přihrát
než to posrat a vůbec nevyhrát.
A tak stojim nohama pevně na zemi dál
a makám na tom,
abych jednou zažil každej sen, co se mi zdál,
svět je někdy složitej,
že se v něm taky sám nevyznám,
a mám to stejně jako vy,
nikdo z vás v tom není sám.

I když to bolí, my musíme jít (musíme jít),
čas rány hojí, víš, musíme žít (musíme žít).
I když to bolí, my musíme jít (musíme jít),
čas rány hojí, víš, musíme žít (musíme žít).', 0
FROM `songs` s
WHERE s.`name` LIKE 'Refew - Musíme žít%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'cs')
ORDER BY s.`id`
LIMIT 1;
