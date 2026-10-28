// Kevinovy hlášky – čeština. Stránka načte jen soubor svého jazyka (includes/footer.jsp).
// Povaha: Skeliho kocour, trochu otrávený, sebevědomý, zvědavý, občas líný; Skeliho (Radka) má rád, ale nikdy to neřekne.
// Bez sprostých slov, nikdy „šéf“, pohlaví návštěvníka nikdy nepředpokládat. Rap (/api/kevin/bars) zůstává česky.
// {t} = název, {n} = číslo, {name} = jméno, {time} = čas; množné číslo = [1, 2–4, 5+] v češtině, jinde [1, víc].
// surprise = jedna hláška na každý pohyb (js/kevin-model.js ACTS). Texty hry CatSmash jsou v catsmash-cs.js.
(window.KEVIN_LINES = window.KEVIN_LINES || {}).cs = {
  "ui": {
    "call": "Kevin – klikni na mě",
    "hide": "Schovat Kevina",
    "show": "Zavolat Kevina",
    "sound": "Zvuk po kliknutí",
    "fullLyrics": "Celý text →"
  },
  "greet": {
    "morning": [
      "Dobré ráno. Kdo z nás dvou dneska vstává dobrovolně?",
      "Už je ráno? Já ještě ani nedosnil.",
      "Ranní ptáče dál doskáče. Já si počkám na snídani.",
      "Dobré ráno. Kafe nemám, takže dneska neručím za své názory.",
      "Tak vzhůru do nového dne. Nebo si ještě lehni. Já tě soudit nebudu.",
      "Dobré ráno. Proč jsi vzhůru?"
    ],
    "day": [
      "Nazdar. Rozhlídni se, máme tu docela hezky. Teda díky mně.",
      "Vítej. Hudba je tamhle, obdivné pohledy na mě můžeš posílat rovnou.",
      "Čau. Jestli hledáš něco zajímavého, zkus Hudbu. Jestli něco dokonalého, právě se na to díváš.",
      "Vítej na webu. Boty si zouvat nemusíš. Tlapky taky ne."
    ],
    "evening": [
      "Dobrej večer. Ideální čas pustit si něco dobrýho.",
      "Večer, klid a hudba. Už tomu chybí jen plná miska.",
      "Tak co, dáme nějaký track, nebo tu budeme jen tak existovat?",
      "Vítej. Já už mám po náročném dni. Spal jsem jen šest hodin.",
      "Večerní program začíná. Hlavní hvězda už tu sedí."
    ],
    "night": [
      "Taky nemůžeš spát? To už začíná být podezřelé.",
      "Noční návštěva. Buď máš dobrý vkus, nebo rozbitý režim.",
      "Pst. Všichni spí. Teda kromě nás dvou a ledničky.",
      "V tuhle hodinu se dějí zvláštní věci. Třeba že tu ještě pořád sedím.",
      "Vítej v noční směně. Placená není, ale výhled mám dobrej."
    ],
    "three": [
      "Tři hodiny. Čas běhat po bytě jako splašenej. Přidáš se?",
      "{time}. Ty nespíš? Já taky ne.",
      "Radek tvrdí, že v tuhle dobu vznikají nejlepší texty. Já tvrdím, že nejlepší spánek."
    ]
  },
  "first": [
    "Nazdar. Já jsem Kevin. Skeliho kocour, hlavní odborník na všechno a neplacený zaměstnanec tohohle webu."
  ],
  "back": {
    "news": [
      "Jsi zpátky. A něco se tu mezitím dělo.",
      "Zatímco tu nikdo nebyl, web nezamrzl. Skoro zázrak.",
      "Mám pro tebe novinky. Tentokrát nejde o mou misku.",
      "Něco přibylo. Já bych ti to řekl už dřív, ale nikdo se mě neptal."
    ],
    "plain": [
      "Á, stará známá tvář. Teda aspoň podle historie návštěv.",
      "Už zase ty? Výborně. Aspoň nemusím vysvětlovat, kde co je.",
      "Tak pokračujeme tam, kde jsme skončili. Pokud si to ještě pamatuješ."
    ]
  },
  "page": {
    "home": [
      "Tak tady to všechno začíná. Slušný místo, co říkáš?",
      "Nikam nespěchej. Hudba nikam neuteče. Já taky ne, bohužel.",
      "Rozhlídni se. Radek tomu říká web. Já tomu říkám pracoviště.",
      "Nevíš, co pustit? To je v pořádku. Já taky občas nevím, co se sebou.",
      "Jestli jsi tu kvůli hudbě, jsi správně. Jestli kvůli mně, máš výborný úsudek."
    ],
    "music": [
      "Tady najdeš všechno, co Skeli vypustil do světa. Něco i několikrát.",
      "Vyber si track. Já už mám svoje oblíbené. Všechny, kde je ticho.",
      "Pusť si něco. A jestli se ti to zalíbí, můžeš mu to říct. Je na to zvědavej.",
      "Tolik hudby a pořád mi nikdo nenahrál ukolébavku.",
      "Klidně poslouchej nahlas. Já za sousedy neručím.",
      "Tady si můžeš pustit Skeliho. A jestli se ti to nelíbí, problém je samozřejmě v tobě."
    ],
    "lyrics": [
      "Tady jsou slova, která Radek poskládal místo toho, aby spal.",
      "Některý řádky vznikly rychle. Jiný tak dlouho, že jsem si stihl zdřímnout.",
      "Najdi si svůj oblíbený řádek. Já si hledám oblíbený polštář.",
      "Čti pozorně. Možná v tom najdeš něco, co autor ani nezamýšlel.",
      "Texty jsou tady. Zpívat ti je nebudu. Mám svou důstojnost.",
      "Některý dávají smysl. Některý vznikly ve tři ráno. Hodně štěstí."
    ],
    "song": [
      "Tak tady máš celý text. Zpívat můžeš, ale za intonaci neručím.",
      "Tenhle znám skoro nazpaměť. Skoro je důležité slovo.",
      "Klidně si text zvětši přes Aa. Já si mezitím zvětším porci.",
      "Pozor, některý řádky se ti můžou zaseknout v hlavě. Mně už se to stalo.",
      "Přečti si to celé. Autor by byl rád. Já bych byl rád za tuňáka.",
      "Skeli tvrdí, že tenhle track je dobrej. Já jsem kočka. Já hudbu neposuzuju."
    ],
    "about": [
      "Tady se dozvíš něco o Radkovi. Na mě je tu bohužel málo místa.",
      "Hudbu si dělá sám. Web si udělal sám. Misku mi ale pořád plní někdo jiný.",
      "Samouk, hudebník, tvůrce webu. A člověk, který si myslí, že vstávám rád.",
      "Mohl bych ti o něm něco prozradit, ale pak by mi zrušil přístup k počítači.",
      "Je to docela schopnej člověk. Na kocoura, jako jsem já, samozřejmě nemá.",
      "Proč tohle píše Radek, když jsem tady jednoznačně důležitější já, nevím.",
      "Jo jo, to je můj páníček. Doplňuje mi misku… ale panička ji sype plnější."
    ],
    "news": [
      "Novinky z první tlapky. Teda z první ruky.",
      "Tady se dozvíš, co se děje. Já většinou vím všechno, ale nikdo mi nevěří.",
      "Nový příspěvky, nový informace. Já mám pořád stejný granule.",
      "Mrkni, co je nového. A pak mi pověz, jestli už je čas na večeři."
    ],
    "register": [
      "Nový účet? Fajn. Jen si pamatuj, že jméno kocoura není bezpečnostní strategie.",
      "Vyplň, co je potřeba. Já bych to za tebe udělal, ale mám krátké tlapky.",
      "Vítej mezi registrovanými. Čeká tě velká zodpovědnost. Třeba nezapomenout heslo.",
      "Silné heslo, prosím. Nechci, aby se ti sem dostal nějaký cizí kocour.",
      "Jo, vím. Další účet. Ale aspoň ti nebudu posílat 48 e-mailů denně."
    ],
    "login": [
      "Tak pojď dál. Dveře jsou otevřený, ale boty si nech.",
      "Nemůžeš se přihlásit? To je nepříjemný. Zkusíme to bez paniky.",
      "Zapomenuté heslo? To znám. Já zapomínám, proč jsem přišel do místnosti."
    ],
    "loginBack": [
      "Zase zpátky? Za chvíli tu budeš mít vlastní pelíšek."
    ],
    "donate": [
      "Líbí se ti, co tu Skeli dělá? Tady můžeš pomoct, aby mohl pokračovat.",
      "Každá podpora se počítá. I já bych ocenil pravidelný příspěvky. V konzervách.",
      "Hudba nevzniká sama. Na rozdíl ode mě, když mám volný odpoledne.",
      "Jestli chceš podpořit další tvorbu, tudy vede cesta. Já tě nebudu přemlouvat. Moc."
    ],
    "error": [
      "Tady nic není. A věř mi, hledal jsem.",
      "404. Stránka se někam zatoulala. Kočky to dělají pořád.",
      "Tak tohle nevyšlo. Zkusíme jinou cestu?",
      "Prázdno. Skoro jako moje miska po snídani.",
      "Stránka zmizela. Kdybych měl ocas jako detektor, už bych ji našel.",
      "Tuhle stránku jsem shodil ze stolu. Z principu."
    ]
  },
  "tips": [
    "Líbí se ti písnička? Dej jí ❤. Skeli to vidí. Já taky, ale dělám, že ne.",
    "Nahoře si můžeš přepnout světlý a tmavý režim. Já jsem zlatej v obou.",
    "Přihlas se a můžeš se zapojit do komentářů. Slušně, prosím. Já si rýpu jen profesionálně.",
    "U textu písně najdeš Aa. Konečně tlačítko, který chápu i bez manuálu.",
    "Nevíš, co poslouchat? Klikni na mě. Vyberu ti něco podle nálady. Tvoje nálada mě sice nezajímá, ale pokusím se.",
    "Komentáře: napiš něco chytrýho. A kdyby někdo zlobil, admin má tlačítko Smazat."
  ],
  "idle": [
    "Ten scroll je plynulej. Skoro jako já, když se snažím nespadnout ze stolu.",
    "Ta zlatá tlapka nahoře? To není tlačítko na krmení. Už jsem to zkoušel.",
    "Klikni na mě. Nekoušu. Bez důvodu.",
    "Mám devět životů. Osm jsem prospal.",
    "Kdybych dostal korunu za každý klik, už bych měl vlastní konzervárnu.",
    "Dělám tu důležitou práci. Hlídám, aby se tu nikdo nenudil.",
    "Jestli mě hledáš, jsem tady. Jestli hledáš smysl života, zkus Aktuality.",
    "Vypadám, že něco vím. To je základ úspěchu.",
    "Mohl bych ti poradit. Ale pak by sis zvykl.",
    "Na stole stojí sklenička. Zatím.",
    "Spím šestnáct hodin denně. Zbytek času koukám, jak scrolluješ.",
    "Krabice je nejlepší nábytek. Tenhle web to nikdy nepochopí.",
    "Kdyby Skeli napsal song o mně, byl by platinovej. A hodně o jídle.",
    "Ten červenej laserovej puntík… ne, nic. Nemluvme o tom.",
    "Okurka za mnou? Ani to nezkoušej."
  ],
  "mobile": [
    "Na mobilu jsem menší. Ego mám pořád stejně velký."
  ],
  "sleep": [
    "Zzz… jen zavírám oči, abych líp přemýšlel.",
    "Odpočinek je důležitý. Hlavně když nemusíš pracovat.",
    "Kdyby něco, jsem vzhůru. Jen zvenku to tak nevypadá.",
    "Režim úspory energie. Tlapky vypnuty.",
    "Ticho, prosím. Právě nic nedělám."
  ],
  "wake": [
    "Co? Už? Vždyť jsem se teprve pohodlně uvelebil.",
    "Já nespal. Jen jsem kontroloval vnitřní stranu víček.",
    "Jsem tady. Jen jsem na chvíli vypnul svět.",
    "No konečně nějaká akce. Už jsem málem začal uklízet.",
    "Vítej zpátky. O čem jsme to mluvili? Aha, o ničem."
  ],
  "pw": {
    "weak": [
      "Tohle heslo by uhodla i rybička.",
      "Zkus něco, co není napsaný na první stránce tvého deníčku.",
      "Trochu přitvrď. Tohle neochrání ani prázdnou misku.",
      "Tvoje heslo potřebuje posilu. Zavolej mu kamaráda.",
      "Tohle je heslo, nebo pozdrav pro sousedy?"
    ],
    "invalid": [
      "Heslo se nám nějak rozuteklo. Zkus ho napsat bez ozdob.",
      "Emoji jsou hezký, ale tady jim pelíšek neuděláme.",
      "Něco se sem vloudilo navíc. Zkus to ještě jednou.",
      "Heslo není vánoční stromeček. Nemusí na něm být všechno."
    ],
    "mismatch": [
      "Dvě hesla, dva různé názory.",
      "Zkus je seznámit. Zatím si moc nerozumí.",
      "Jedno z nich si žije vlastním životem.",
      "Takhle se neshodnou ani dvě kočky u jedné misky."
    ],
    "strong": [
      "Tak tohle už vypadá slibně. Respekt.",
      "Pěkně. Tohle bych neuhodl ani po třetí misce.",
      "Dobrá práce. Bezpečnostní kocour schvaluje.",
      "Tohle má drápy. Přesně tak to má být.",
      "Konečně heslo, které se nenechá zastrašit."
    ],
    "changed": [
      "Hotovo. Nové heslo, nový začátek.",
      "Změna proběhla. A já jsem u toho ani nemusel asistovat.",
      "Vyřízeno. Teď si ho hlavně pamatuj."
    ]
  },
  "profile": [
    "Nová fotka? Sluší ti to. Skoro jako mně.",
    "Profil upraven. Já bych na sobě nic neměnil. Není co.",
    "Fotka uložená. Galerie teď má o jedno mistrovské dílo víc.",
    "Tak, ať tě tu všichni poznají. Já se poznám i poslepu.",
    "Změna hotová. Teď už jen vymyslet, co dalšího na sebe prozradíš."
  ],
  "auth": {
    "in": [
      "Nazdar, známá tvář. Pojď dál.",
      "Přihlášení prošlo. Dveře jsou otevřený.",
      "Tak jsi uvnitř. Chovej se tu jako doma. Jen mi nesahej na misku.",
      "Účet tě poznal. Já jsem tě poznal podle způsobu klikání."
    ],
    "fail": [
      "Tohle nevyšlo. Zkus zkontrolovat údaje.",
      "Něco nesedí. A tentokrát to není moje poloha na gauči.",
      "Zkus to znovu. Nikam neuteču.",
      "Přístup zamítnut. Já jsem tě sice pustil, ale počítač má vlastní hlavu."
    ],
    "out": [
      "Tak zase někdy. Já tu budu. Pravděpodobně spát.",
      "Odhlášeno. Nezapomeň, kde jsi mě nechal.",
      "Měj se. A někdy zase přines dobrou náladu.",
      "Tak zatím. Já si tu ještě chvíli posedím.",
      "Odcházíš? Fajn. Stejně budu deset minut mňoukat u dveří."
    ],
    "welcome": [
      "Účet vytvořen. Tak teď už oficiálně patříš k nám."
    ]
  },
  "comment": {
    "added": [
      "Komentář odeslán. Tak uvidíme, co na to ostatní.",
      "A je to venku. Slova mají svou vlastní cestu.",
      "Přidáno. Slušná diskuse je lepší než hádka o poslední konzervu.",
      "Hotovo. Teď můžeš dělat, že sem chodíš jen číst.",
      "Můj názor? Ten vyjadřuju shozeným hrnkem.",
      "Dobře. To nebylo úplně blbý.",
      "Komentář proletěl internetem a přežil.",
      "Kontroluju… Hmm… Tohle projde."
    ],
    "deleted": [
      "Komentář zmizel. Po sobě uklízet se sluší.",
      "Hotovo. Digitální stopa je o něco menší.",
      "A je pryč. Někdy je nejlepší říct míň."
    ]
  },
  "heart": {
    "on": [
      "Srdíčko přistálo. Někdo bude mít radost.",
      "Tak tenhle track ti sedl, co?",
      "Dobrá volba. A neříkám to jen proto, že tu bydlím.",
      "Kdybych měl palec, dal bych like. Mám tlapku. Dostaneš tlapku.",
      "No konečně někdo s vkusem."
    ],
    "off": [
      "Že by změna názoru? I kočky mění názor.",
      "Srdíčko je pryč. Svět se točí dál.",
      "Hudební vztahy bývají složitý. Znám to ze soužití s vysavačem.",
      "…"
    ]
  },
  "search": {
    "found": [
      "Našel jsem výsledky. Tentokrát to bylo rychlejší než honění vlastního ocasu.",
      "Hledáme. Já bych začal u misky, ale ty si dělej, co chceš."
    ],
    "none": [
      "Nic jsem nenašel. Zkus jiné slovo.",
      "Nula výsledků. Tohle je chvíle, kdy bych normálně odešel na oběd."
    ]
  },
  "clip": {
    "ok": [
      "Tak poslouchej. Já budu dělat, že ten track slyším poprvé.",
      "A jedeme. Uši připravený?",
      "Výběr schválen. Můžeš mi poděkovat později.",
      "Obraz běží, zvuk hraje. Konečně něco, co funguje bez mé pomoci."
    ],
    "fail": [
      "Něco se zaseklo. Zkusíme to znovu.",
      "Přehrávač má dneska vlastní náladu. Znám to.",
      "Obraz ani zvuk? To už je skoro moderní umění.",
      "Teď to nevyšlo. Zkus jiný klip nebo to za chvíli opakuj.",
      "Technika tvrdí, že za to nemůže. Já tvrdím, že může."
    ]
  },
  "menu": {
    "hint": "Co pro tebe můžu udělat?",
    "find": "Najdi song",
    "play": "Pusť něco",
    "rap": "Zarapuj",
    "news": "Co je nového?",
    "fun": "Něco udělej",
    "report": "Nahlásit problém",
    "pong": "Zahraj si se mnou"
  },
  "report": {
    "prompt": [
      "Něco tu nefunguje? Napiš mi co a já to předám Skelimu.",
      "Chybí video, špatný řádek, něco rozbitého? Povídej, vyřídím to."
    ],
    "placeholder": "Co je špatně? (třeba: u písně chybí video)",
    "send": "Poslat",
    "thanks": [
      "Mám to. Předám to Skelimu, ať to spraví.",
      "Díky! Zapsal jsem si to za ucho."
    ],
    "empty": "Napiš aspoň pár slov, ať vím, co hledat.",
    "fail": "Teď se mi to nepovedlo odeslat. Zkus to za chvíli.",
    "limit": "Toho už je na teď dost, zkus to zase za hodinu."
  },
  "help": {
    "say": [
      "Kus textu nám tu chybí (jazyk: {lang}). Rozumíš mu? Dole je na to políčko.",
      "Tady někdo rapuje a nikdo neví co. Jazyk: {lang}. Jestli mu rozumíš, zachraň nás."
    ],
    "link": "Ukaž mi to"
  },
  "life": {
    "stretch": [
      "Protáhnout. Kočičí jóga.",
      "Hřbet do oblouku. Profík."
    ],
    "robot": [
      "Robotí tanec. Naučil jsem se ho od vysavače.",
      "Bip bup. Kočka v režimu robot."
    ],
    "look": [
      "Něco tam šustlo?",
      "Viděl jsi to taky? Ne? Tak nic."
    ],
    "fly": [
      "Moucha! …Utekla.",
      "Skoro jsem ji měl. Skoro."
    ],
    "neck": [
      "Křup. Hned lepší.",
      "Bolí mě krk po celodenním spaní."
    ],
    "startle": [
      "Co to bylo?! …Aha, můj ocas.",
      "Lekl jsem se vlastního stínu. Zase."
    ],
    "shrug": [
      "Mám hlad? Mám hlad.",
      "Nevím, co tu dělám. Ale dělám to dobře."
    ],
    "dance": [
      "Nikdo se nedívá? Tak jo.",
      "Tenhle krok mě naučil Skeli. Lže."
    ],
    "nap": [
      "Jen na vteřinku zavřu oči…",
      "Šlofík. Dvacetiminutovej. Na tři hodiny."
    ],
    "bored": [
      "Nuda. Hoď mi klubíčko.",
      "Shodil bych něco ze stolu, ale nemám stůl."
    ]
  },
  "find": {
    "prompt": [
      "Co hledáš? Název, kus textu, cokoliv. Jen po mně nechtěj, ať to zazpívám.",
      "Napiš, co máš na mysli. Já budu předstírat, že jsem hudební archivář.",
      "Tak povídej. Hledat umím. Jen mi nedávej hádanky."
    ],
    "placeholder": "třeba: tělo bez duše",
    "empty": [
      "Zadej aspoň kousek názvu. Nejsem jasnovidec."
    ],
    "found": [
      "Našel jsem pár kandidátů. Teď si vyber.",
      "Tady to máš. A ani jsem nemusel vstát.",
      "Výsledky jsou na světě. Moje práce tady končí. Zatím.",
      "Našel jsem, co šlo. Zbytek už je na tobě."
    ],
    "none": [
      "Nic. Ani stopa. Zkus jiný výraz.",
      "Tohle mi nic neříká. A já znám skoro všechno. Skoro.",
      "Tady je prázdno. Zkus zadat název trochu jinak.",
      "Nenašel jsem to. Možná hledáme pod špatným jménem."
    ]
  },
  "play": {
    "intro": [
      "Chceš něco pustit? Konečně úkol, který se mi líbí.",
      "Dobře. Dneska vybírám já. Stížnosti přijímám v podobě pamlsků.",
      "Vyberu ti track. Mám na to ucho. Dvě, dokonce."
    ],
    "pick": [
      "Pouštím: {t}. Tohle by mohlo sednout.",
      "Dnešní výběr: {t}. Kvalita schválena kocourem.",
      "Zkusíme {t}. Kdyžtak budeme dělat, že se to nestalo.",
      "Náhodný výběr: {t}. Náhoda má dneska dobrý vkus."
    ],
    "close": "Zavřít přehrávač",
    "song": "Text a víc →"
  },
  "rap": {
    "intro": [
      "Chceš bars? Tak poslouchej. Já text napsal… teda přečetl.",
      "Připraven? Tohle je práce mého člověka.",
      "Dámy a pánové, tlapky nahoru. Přichází poezie.",
      "Tak jo. Dneska budu rapper. Radek se to nesmí dozvědět.",
      "Pozor, následuje část, kterou si budeš broukat ještě zítra."
    ],
    "fail": [
      "Dneska nic. Text se mi někam zatoulal.",
      "Archiv mlčí. Stejně jako já, když slyším vysavač.",
      "Žádný bars. Dneska je den odpočinku.",
      "Text není k dispozici. Budeme muset chvíli žít bez poezie."
    ]
  },
  "news": {
    "first": [
      "Poprvé? Tak vítej. Pro začátek mrkni na Hudbu.",
      "Novinky? Pro tebe asi všechno. Já už tu znám každý roh.",
      "Začni tím, co tě zajímá. Já bych začal jídlem, ale to tu nenajdeš."
    ],
    "some": [
      "Něco přibylo.",
      "Mám nové informace. Ne o granulích, bohužel.",
      "Od minula se něco změnilo. Dobře, že jsi zpátky včas."
    ],
    "none": [
      "Zatím nic. Někdy se prostě jen žije.",
      "Žádné novinky. Radek asi zase něco ladí.",
      "Všechno při starém. Já, web a moje neutuchající potřeba jídla.",
      "Dneska se nic nového neurodilo. Ani v misce."
    ],
    "lead": "Od tvé minulé návštěvy:",
    "clip": "vyšel klip {t}",
    "clips": [
      "",
      "vyšly {n} nové klipy, nejnovější {t}",
      "vyšlo {n} nových klipů, nejnovější {t}"
    ],
    "posts": [
      "{n} nový příspěvek v Aktualitách",
      "{n} nové příspěvky v Aktualitách",
      "{n} nových příspěvků v Aktualitách"
    ],
    "link": "Mrknout →",
    "history": "Posledních 5 novinek",
    "web": [
      "A na webu je nově:",
      "Z dílny na webu:",
      "Čerstvě smontováno:"
    ],
    "webLast": [
      "Od minula nic novýho, ale tohle jsme na webu udělali naposledy:",
      "Nic čerstvýho, jen poslední novinka z dílny:"
    ]
  },
  "admin": {
    "hello": [
      "Máme tu pár nedodělků. Já bych začal tím nejjednodušším. Třeba pauzou na jídlo.",
      "Hlásím stav: něco potřebuje tvoji pozornost. Tentokrát to není moje miska.",
      "Čekají tu věci k vyřízení. Já na ně dohlížím. Z pohodlné vzdálenosti.",
      "{name}, tady máš přehled toho, co potřebuje vyřešit.",
      "Tady je seznam úkolů. Já bych ho zkrátil na nulu, ale tlapky mi nestačí."
    ],
    "missing": [
      "Některé skladby nemají doplněné údaje. Já bych je doplnil, ale neumím psát tlapkou."
    ],
    "clean": [
      "Všechno je vyřízené. Můžeš se věnovat hudbě. Nebo mně.",
      "Kontrola hotová. Teď si zasloužíš pauzu. Já už ji mám."
    ],
    "reports": [
      "{n} nahlášený komentář čeká na kontrolu",
      "{n} nahlášené komentáře čekají na kontrolu",
      "{n} nahlášených komentářů čeká na kontrolu"
    ],
    "clips": [
      "{n} klip nemá přiřazenou skladbu ({t})",
      "{n} klipy nemají přiřazenou skladbu (nejnovější: {t})",
      "{n} klipů nemá přiřazenou skladbu (nejnovější: {t})"
    ],
    "lyrics": [
      "{n} skladbě chybí text",
      "{n} skladbám chybí text",
      "{n} skladbám chybí text"
    ],
    "status": "Stav webu",
    "toReports": "Nahlášené →",
    "toLyrics": "Editor textů →"
  },
  "surprise": {
    "beatbox": "Bum tss, ka tss, bum bum tss!",
    "dance": "Tohle se normálně učí roky.",
    "dance2": "Hip hop mám v krvi. A v tlapkách.",
    "dance3": "Uhni, jdu na parket.",
    "robot": "Režim robot zapnut. Bip. Bup. Mňau.",
    "silly": "Nikdo se nekouká? Výborně.",
    "breakdance": "Devět životů a jeden headspin. Zatím to vychází.",
    "flair": "Tohle zvládnu jen nalačno.",
    "jump": "Taková elegance. A ani potlesk.",
    "dive": "Chytám! …Co jsem vlastně chytal?",
    "cheer": "Hurá! Komu fandíme? Mně, samozřejmě.",
    "clap": "Potlesk pro mě. Klidně začnu sám.",
    "fistPump": "Jo! Další level odemčen.",
    "laugh": "Promiň, vzpomněl jsem si na vysavač.",
    "sing": "Taky umím zpívat. Sousedi o tom ví.",
    "rap": "Mikrofon mám, beat mám… a text jsem zapomněl. Kočičí paměť.",
    "typing": "Píšu Radkovi, ať koupí granule. Velkými písmeny.",
    "stretchArms": "Moment. Musím si srovnat všechny kosti.",
    "neck": "Krk mám ztuhlý, jak se na tebe pořád koukám.",
    "lie": "Konec představení. Dobrou.",
    "thumbsUp": "Palec nahoru. Víc ti nedám, jsem kocour.",
    "wave": "Zdar. Tlapka podaná, důstojnost zachována.",
    "nervous": "Co to bylo?! …Aha. Nic.",
    "shrug": "Nevím. A je mi to jedno. Krásný pocit.",
    "lookAround": "Slyšel jsem něco. Asi vlastní myšlenky.",
    "rhyme": "Klikni na beat, / Kevin je fit, / otevři Spotify / a nech to znít."
  },
  "pongInvite": [
    "Máš chvilku? Hopík se nudí a já už jsem snědl imaginární svačinu.",
    "Kdyby ses chtěl protáhnout, moje pálka je pořád v provozu.",
    "Občas si tu pinkám s hopíkem. Občas hopík pinká se mnou.",
    "CatSmash čeká. Já taky, ale vsedě by mi to šlo líp.",
    "Máš rád výzvy? Já mám rád krabice. Každej máme něco.",
    "Jen tak mimochodem, dneska mám formu. Včera taky. Asi.",
    "Kdyby ses chtěl na chvilku zabavit, hopík už je připravenej.",
    "Slyšíš to cvakání? To je moje nenápadná pozvánka ke hře.",
    "Tady se dá pěkně potrénovat postřeh. Nebo moje ego.",
    "Nechci tě rušit, ale hřiště je dneska nějak prázdný.",
    "Hopík se ptal, jestli si s ním někdo nezapinká.",
    "Jestli máš chuť na malou výzvu, víš, kde mě najdeš.",
    "Někdy stačí pár odrazů a den je hned zajímavější.",
    "Já bych si zahrál. Ale samozřejmě jen pokud se ti chce.",
    "Mimochodem, mám tu hru, kde můžeš zkusit porazit kocoura.",
    "Žádnej spěch. Hopík nikam neuteče. Většinou.",
    "Pár minut hry? To je skoro tak snadný jako najít krabici.",
    "Jestli máš rychlý prsty, mohli bychom si něco dokázat.",
    "Hřiště je otevřený. Já jsem otevřený hlavně konzervám.",
    "Tak já tu budu. Kdyby tě náhodou přepadla chuť na pingpong."
  ],
  "building": [
    "Tady se pořád maká! Web je ve výstavbě, takže každej den tu můžeš najít něco novýho. Já jsem tu stálá expozice.",
    "Pssst… web se pořád staví. Co tu dneska není, může tu bejt zítra. Kromě disciplíny. Ta tu nebude nikdy.",
    "Upozornění: stavba v plném proudu. Každej den nějaká změna – tak se vracej, ať ti nic neuteče. Já jsem tu stavbyvedoucí. Hlavně přes spaní."
  ],
  "songs": {
    "S3BFk-qmXAY": [
      "Tenhle track znám. Byl jsem u toho. Nechtěl jsem."
    ],
    "LJ7ER355Hgg": [
      "Tenhle track znám. Byl jsem u toho. Nechtěl jsem.",
      "Remake. Radek to nahrál znova. Já bych to nechal, ale mě se nikdo neptá."
    ]
  },
  "clicks": [
    "Můžeš na mě přestat klikat?",
    "Ty nemáš nic lepšího na práci?",
    "Dobře. Vyhráváš."
  ]
};
