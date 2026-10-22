// What MC Kevin says (js/kevin.js). Kevin is Skeli's cat: a bit fed up, sure of himself, curious, now and
// then lazy, convinced the site runs mainly thanks to him. He likes Skeli (Radek) but would never say so.
// No swear words, never "boss", the visitor's gender never assumed. Raps (/api/kevin/bars) stay in Czech.
// A language missing here falls back to English. {t} = a title, {n} = a number, {name} = a user name;
// a plural is [1, 2–4, 5+] in Czech, [1, more] elsewhere.
// surprise: one line per move of the ginger Kevin (js/kevin-model.js ACTS); beatbox and rhyme come with a beat (kevin.js).
window.KEVIN_LINES = {
  cs: {
    ui: {
      call: "MC Kevin – klikni na mě", hide: "Schovat MC Kevina", show: "Zavolat MC Kevina",
      sound: "Zvuk po kliknutí", fullLyrics: "Celý text →"
    },
    greet: {
      morning: [
        "Dobré ráno. Kdo z nás dvou dneska vstává dobrovolně?",
        "Už je ráno? Já ještě ani nedosnil.",
        "Ranní ptáče dál doskáče. Já si počkám na snídani.",
        "Dobré ráno. Kafe nemám, takže dneska neručím za své názory.",
        "Tak vzhůru do nového dne. Nebo si ještě lehni. Já tě soudit nebudu."
      ],
      day: [
        "Nazdar. Rozhlídni se, máme tu docela hezky. Teda díky mně.",
        "Vítej. Hudba je tamhle, obdivné pohledy na mě můžeš posílat rovnou.",
        "Čau. Jestli hledáš něco zajímavého, zkus Hudbu. Jestli něco dokonalého, právě se na to díváš.",
        "Vítej na webu. Boty si zouvat nemusíš. Tlapky taky ne."
      ],
      evening: [
        "Dobrej večer. Ideální čas pustit si něco dobrýho.",
        "Večer, klid a hudba. Už tomu chybí jen plná miska.",
        "Tak co, dáme nějaký track, nebo tu budeme jen tak existovat?",
        "Vítej. Já už mám po náročném dni. Spal jsem jen šest hodin.",
        "Večerní program začíná. Hlavní hvězda už tu sedí."
      ],
      night: [
        "Taky nemůžeš spát? To už začíná být podezřelé.",
        "Noční návštěva. Buď máš dobrý vkus, nebo rozbitý režim.",
        "Pst. Všichni spí. Teda kromě nás dvou a ledničky.",
        "V tuhle hodinu se dějí zvláštní věci. Třeba že tu ještě pořád sedím.",
        "Vítej v noční směně. Placená není, ale výhled mám dobrej."
      ],
      three: ["Tři hodiny. Čas běhat po bytě jako splašenej. Přidáš se?"]
    },
    first: [],
    back: {
      news: [
        "Jsi zpátky. A něco se tu mezitím dělo.",
        "Zatímco tu nikdo nebyl, web nezamrzl. Skoro zázrak.",
        "Mám pro tebe novinky. Tentokrát nejde o mou misku.",
        "Něco přibylo. Já bych ti to řekl už dřív, ale nikdo se mě neptal."
      ],
      plain: [
        "Á, stará známá tvář. Teda aspoň podle historie návštěv.",
        "Už zase ty? Výborně. Aspoň nemusím vysvětlovat, kde co je.",
        "Tak pokračujeme tam, kde jsme skončili. Pokud si to ještě pamatuješ."
      ]
    },
    page: {
      home: [
        "Tak tady to všechno začíná. Slušný místo, co říkáš?",
        "Nikam nespěchej. Hudba nikam neuteče. Já taky ne, bohužel.",
        "Rozhlídni se. Radek tomu říká web. Já tomu říkám pracoviště.",
        "Nevíš, co pustit? To je v pořádku. Já taky občas nevím, co se sebou.",
        "Jestli jsi tu kvůli hudbě, jsi správně. Jestli kvůli mně, máš výborný úsudek."
      ],
      music: [
        "Tady najdeš všechno, co Skeli vypustil do světa. Něco i několikrát.",
        "Vyber si track. Já už mám svoje oblíbené. Všechny, kde je ticho.",
        "Pusť si něco. A jestli se ti to zalíbí, můžeš mu to říct. Je na to zvědavej.",
        "Tolik hudby a pořád mi nikdo nenahrál ukolébavku.",
        "Klidně poslouchej nahlas. Já za sousedy neručím."
      ],
      lyrics: [
        "Tady jsou slova, která Radek poskládal místo toho, aby spal.",
        "Některý řádky vznikly rychle. Jiný tak dlouho, že jsem si stihl zdřímnout.",
        "Najdi si svůj oblíbený řádek. Já si hledám oblíbený polštář.",
        "Čti pozorně. Možná v tom najdeš něco, co autor ani nezamýšlel.",
        "Texty jsou tady. Zpívat ti je nebudu. Mám svou důstojnost."
      ],
      song: [
        "Tak tady máš celý text. Zpívat můžeš, ale za intonaci neručím.",
        "Tenhle znám skoro nazpaměť. Skoro je důležité slovo.",
        "Klidně si text zvětši přes Aa. Já si mezitím zvětším porci.",
        "Pozor, některý řádky se ti můžou zaseknout v hlavě. Mně už se to stalo.",
        "Přečti si to celé. Autor by byl rád. Já bych byl rád za tuňáka."
      ],
      about: [
        "Tady se dozvíš něco o Radkovi. Na mě je tu bohužel málo místa.",
        "Hudbu si dělá sám. Web si udělal sám. Misku mi ale pořád plní někdo jiný.",
        "Samouk, hudebník, tvůrce webu. A člověk, který si myslí, že vstávám rád.",
        "Mohl bych ti o něm něco prozradit, ale pak by mi zrušil přístup k počítači.",
        "Je to docela schopnej člověk. Na kocoura, jako jsem já, samozřejmě nemá."
      ],
      news: [
        "Novinky z první tlapky. Teda z první ruky.",
        "Tady se dozvíš, co se děje. Já většinou vím všechno, ale nikdo mi nevěří.",
        "Nový příspěvky, nový informace. Já mám pořád stejný granule.",
        "Mrkni, co je nového. A pak mi pověz, jestli už je čas na večeři."
      ],
      register: [
        "Nový účet? Fajn. Jen si pamatuj, že jméno kocoura není bezpečnostní strategie.",
        "Vyplň, co je potřeba. Já bych to za tebe udělal, ale mám krátké tlapky.",
        "Vítej mezi registrovanými. Čeká tě velká zodpovědnost. Třeba nezapomenout heslo.",
        "Silné heslo, prosím. Nechci, aby se ti sem dostal nějaký cizí kocour."
      ],
      login: [
        "Tak pojď dál. Dveře jsou otevřený, ale boty si nech.",
        "Nemůžeš se přihlásit? To je nepříjemný. Zkusíme to bez paniky.",
        "Zapomenuté heslo? To znám. Já zapomínám, proč jsem přišel do místnosti."
      ],
      // only for someone who has been here before
      loginBack: ["Zase zpátky? Za chvíli tu budeš mít vlastní pelíšek."],
      donate: [
        "Líbí se ti, co tu Skeli dělá? Tady můžeš pomoct, aby mohl pokračovat.",
        "Každá podpora se počítá. I já bych ocenil pravidelný příspěvky. V konzervách.",
        "Hudba nevzniká sama. Na rozdíl ode mě, když mám volný odpoledne.",
        "Jestli chceš podpořit další tvorbu, tudy vede cesta. Já tě nebudu přemlouvat. Moc."
      ],
      error: [
        "Tady nic není. A věř mi, hledal jsem.",
        "404. Stránka se někam zatoulala. Kočky to dělají pořád.",
        "Tak tohle nevyšlo. Zkusíme jinou cestu?",
        "Prázdno. Skoro jako moje miska po snídani.",
        "Stránka zmizela. Kdybych měl ocas jako detektor, už bych ji našel.",
        "Tuhle stránku jsem shodil ze stolu. Z principu."
      ]
    },
    // when he peeks out from the side of the screen: useful tips …
    tips: [
      "Líbí se ti písnička? Dej jí ❤. Skeli to vidí. Já taky, ale dělám, že ne.",
      "Nahoře si můžeš přepnout světlý a tmavý režim. Já jsem zlatej v obou.",
      "Přihlas se a můžeš se zapojit do komentářů. Slušně, prosím. Já si rýpu jen profesionálně.",
      "U textu písně najdeš Aa. Konečně tlačítko, který chápu i bez manuálu.",
      "Nevíš, co poslouchat? Klikni na mě. Vyberu ti něco podle nálady. Tvoje nálada mě sice nezajímá, ale pokusím se."
    ],
    // … and his own remarks
    idle: [
      "Ten scroll je plynulej. Skoro jako já, když se snažím nespadnout ze stolu.",
      "Ta zlatá tlapka nahoře? To není tlačítko na krmení. Už jsem to zkoušel.",
      "Klikni na mě. Nekoušu. Bez důvodu.",
      "Tlapky mám zlatý. Drápy taky. Jen ten účet za manikúru pořád nikde.",
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
    mobile: ["Na mobilu jsem menší. Ego mám pořád stejně velký."],
    sleep: [
      "Zzz… jen zavírám oči, abych líp přemýšlel.",
      "Odpočinek je důležitý. Hlavně když nemusíš pracovat.",
      "Kdyby něco, jsem vzhůru. Jen zvenku to tak nevypadá.",
      "Režim úspory energie. Tlapky vypnuty.",
      "Ticho, prosím. Právě nic nedělám."
    ],
    wake: [
      "Co? Už? Vždyť jsem se teprve pohodlně uvelebil.",
      "Já nespal. Jen jsem kontroloval vnitřní stranu víček.",
      "Jsem tady. Jen jsem na chvíli vypnul svět.",
      "No konečně nějaká akce. Už jsem málem začal uklízet.",
      "Vítej zpátky. O čem jsme to mluvili? Aha, o ničem."
    ],
    pw: {
      weak: [
        "Tohle heslo by uhodla i rybička.",
        "Zkus něco, co není napsaný na první stránce tvého deníčku.",
        "Trochu přitvrď. Tohle neochrání ani prázdnou misku.",
        "Tvoje heslo potřebuje posilu. Zavolej mu kamaráda.",
        "Tohle je heslo, nebo pozdrav pro sousedy?"
      ],
      invalid: [
        "Heslo se nám nějak rozuteklo. Zkus ho napsat bez ozdob.",
        "Emoji jsou hezký, ale tady jim pelíšek neuděláme.",
        "Něco se sem vloudilo navíc. Zkus to ještě jednou.",
        "Heslo není vánoční stromeček. Nemusí na něm být všechno."
      ],
      mismatch: [
        "Dvě hesla, dva různé názory.",
        "Zkus je seznámit. Zatím si moc nerozumí.",
        "Jedno z nich si žije vlastním životem.",
        "Takhle se neshodnou ani dvě kočky u jedné misky."
      ],
      strong: [
        "Tak tohle už vypadá slibně. Respekt.",
        "Pěkně. Tohle bych neuhodl ani po třetí misce.",
        "Dobrá práce. Bezpečnostní kocour schvaluje.",
        "Tohle má drápy. Přesně tak to má být.",
        "Konečně heslo, které se nenechá zastrašit."
      ],
      changed: [
        "Hotovo. Nové heslo, nový začátek.",
        "Změna proběhla. A já jsem u toho ani nemusel asistovat.",
        "Vyřízeno. Teď si ho hlavně pamatuj."
      ]
    },
    profile: [
      "Nová fotka? Sluší ti to. Skoro jako mně.",
      "Profil upraven. Já bych na sobě nic neměnil. Není co.",
      "Fotka uložená. Galerie teď má o jedno mistrovské dílo víc.",
      "Tak, ať tě tu všichni poznají. Já se poznám i poslepu.",
      "Změna hotová. Teď už jen vymyslet, co dalšího na sebe prozradíš."
    ],
    auth: {
      in: [
        "Nazdar, známá tvář. Pojď dál.",
        "Přihlášení prošlo. Dveře jsou otevřený.",
        "Tak jsi uvnitř. Chovej se tu jako doma. Jen mi nesahej na misku.",
        "Účet tě poznal. Já jsem tě poznal podle způsobu klikání."
      ],
      fail: [
        "Tohle nevyšlo. Zkus zkontrolovat údaje.",
        "Něco nesedí. A tentokrát to není moje poloha na gauči.",
        "Zkus to znovu. Nikam neuteču.",
        "Přístup zamítnut. Já jsem tě sice pustil, ale počítač má vlastní hlavu."
      ],
      out: [
        "Tak zase někdy. Já tu budu. Pravděpodobně spát.",
        "Odhlášeno. Nezapomeň, kde jsi mě nechal.",
        "Měj se. A někdy zase přines dobrou náladu.",
        "Tak zatím. Já si tu ještě chvíli posedím.",
        "Odcházíš? Fajn. Stejně budu deset minut mňoukat u dveří."
      ]
    },
    comment: {
      added: [
        "Komentář odeslán. Tak uvidíme, co na to ostatní.",
        "A je to venku. Slova mají svou vlastní cestu.",
        "Přidáno. Slušná diskuse je lepší než hádka o poslední konzervu.",
        "Hotovo. Teď můžeš dělat, že sem chodíš jen číst.",
        "Můj názor? Ten vyjadřuju shozeným hrnkem."
      ],
      deleted: [
        "Komentář zmizel. Po sobě uklízet se sluší.",
        "Hotovo. Digitální stopa je o něco menší.",
        "A je pryč. Někdy je nejlepší říct míň."
      ]
    },
    heart: {
      on: [
        "Srdíčko přistálo. Někdo bude mít radost.",
        "Tak tenhle track ti sedl, co?",
        "Dobrá volba. A neříkám to jen proto, že tu bydlím.",
        "Kdybych měl palec, dal bych like. Mám tlapku. Dostaneš tlapku."
      ],
      off: [
        "Že by změna názoru? I kočky mění názor.",
        "Srdíčko je pryč. Svět se točí dál.",
        "Hudební vztahy bývají složitý. Znám to ze soužití s vysavačem."
      ]
    },
    // the search box on the Lyrics page
    search: {
      found: [
        "Našel jsem výsledky. Tentokrát to bylo rychlejší než honění vlastního ocasu.",
        "Hledáme. Já bych začal u misky, ale ty si dělej, co chceš."
      ],
      none: [
        "Nic jsem nenašel. Zkus jiné slovo.",
        "Nula výsledků. Tohle je chvíle, kdy bych normálně odešel na oběd."
      ]
    },
    // a clip started on the song page
    clip: {
      ok: [
        "Tak poslouchej. Já budu dělat, že ten track slyším poprvé.",
        "A jedeme. Uši připravený?",
        "Výběr schválen. Můžeš mi poděkovat později.",
        "Obraz běží, zvuk hraje. Konečně něco, co funguje bez mé pomoci."
      ],
      fail: [
        "Něco se zaseklo. Zkusíme to znovu.",
        "Přehrávač má dneska vlastní náladu. Znám to.",
        "Obraz ani zvuk? To už je skoro moderní umění.",
        "Teď to nevyšlo. Zkus jiný klip nebo to za chvíli opakuj."
      ]
    },
    menu: { hint: "Co pro tebe můžu udělat?", find: "Najdi song", play: "Pusť něco", rap: "Zarapuj", news: "Co je nového?", fun: "Něco udělej", report: "Nahlásit problém" },
    // "Nahlásit problém" (issue #28): the message goes to the admin (Hodnocení webu → Nahlášené problémy)
    report: {
      prompt: ["Něco tu nefunguje? Napiš mi co a já to předám Skelimu.","Chybí video, špatný řádek, něco rozbitého? Povídej, vyřídím to."],
      placeholder: "Co je špatně? (třeba: u písně chybí video)",
      send: "Poslat",
      thanks: ["Mám to. Předám to Skelimu, ať to spraví.","Díky! Zapsal jsem si to za ucho."],
      empty: "Napiš aspoň pár slov, ať vím, co hledat.",
      fail: "Teď se mi to nepovedlo odeslat. Zkus to za chvíli.",
      limit: "Toho už je na teď dost, zkus to zase za hodinu."
    },
    // „Pomoz nám dopsat text“ na stránce písně, která o to žádá (řekne to jednou u písně, odkaz sjede ke kartě)
    help: {
      say: ["Kus textu nám tu chybí (jazyk: {lang}). Rozumíš mu? Dole je na to políčko.", "Tady někdo rapuje a nikdo neví co. Jazyk: {lang}. Jestli mu rozumíš, zachraň nás."],
      link: "Ukaž mi to"
    },
    // what he does on his own once his menu is gone (js/kevin.js LIFE): one short line by his head
    life: {
      stretch: ["Protáhnout. Kočičí jóga.","Hřbet do oblouku. Profík."],
      knead: ["Hnětu. Nevím proč. Musím.","Dělám těsto. Z ničeho."],
      look: ["Něco tam šustlo?","Viděl jsi to taky? Ne? Tak nic."],
      fly: ["Moucha! …Utekla.","Skoro jsem ji měl. Skoro."],
      neck: ["Křup. Hned lepší.","Bolí mě krk po celodenním spaní."],
      startle: ["Co to bylo?! …Aha, můj ocas.","Lekl jsem se vlastního stínu. Zase."],
      shrug: ["Mám hlad? Mám hlad.","Nevím, co tu dělám. Ale dělám to dobře."],
      dance: ["Nikdo se nedívá? Tak jo.","Tenhle krok mě naučil Skeli. Lže."],
      nap: ["Jen na vteřinku zavřu oči…","Šlofík. Dvacetiminutovej. Na tři hodiny."],
      bored: ["Nuda. Hoď mi klubíčko.","Shodil bych něco ze stolu, ale nemám stůl."]
    },
    find: {
      prompt: [
        "Co hledáš? Název, kus textu, cokoliv. Jen po mně nechtěj, ať to zazpívám.",
        "Napiš, co máš na mysli. Já budu předstírat, že jsem hudební archivář.",
        "Tak povídej. Hledat umím. Jen mi nedávej hádanky."
      ],
      placeholder: "třeba: tělo bez duše",
      empty: ["Zadej aspoň kousek názvu. Nejsem jasnovidec."],
      found: [
        "Našel jsem pár kandidátů. Teď si vyber.",
        "Tady to máš. A ani jsem nemusel vstát.",
        "Výsledky jsou na světě. Moje práce tady končí. Zatím.",
        "Našel jsem, co šlo. Zbytek už je na tobě."
      ],
      none: [
        "Nic. Ani stopa. Zkus jiný výraz.",
        "Tohle mi nic neříká. A já znám skoro všechno. Skoro.",
        "Tady je prázdno. Zkus zadat název trochu jinak.",
        "Nenašel jsem to. Možná hledáme pod špatným jménem."
      ]
    },
    play: {
      intro: [
        "Chceš něco pustit? Konečně úkol, který se mi líbí.",
        "Dobře. Dneska vybírám já. Stížnosti přijímám v podobě pamlsků.",
        "Vyberu ti track. Mám na to ucho. Dvě, dokonce."
      ],
      pick: [
        "Pouštím: {t}. Tohle by mohlo sednout.",
        "Dnešní výběr: {t}. Kvalita schválena kocourem.",
        "Zkusíme {t}. Kdyžtak budeme dělat, že se to nestalo.",
        "Náhodný výběr: {t}. Náhoda má dneska dobrý vkus."
      ],
      close: "Zavřít přehrávač", song: "Text a víc →"
    },
    rap: {
      intro: [
        "Chceš bars? Tak poslouchej. Já text napsal… teda přečetl.",
        "Připraven? Tohle je práce mého člověka.",
        "Dámy a pánové, tlapky nahoru. Přichází poezie.",
        "Tak jo. Dneska budu rapper. Radek se to nesmí dozvědět.",
        "Pozor, následuje část, kterou si budeš broukat ještě zítra."
      ],
      fail: [
        "Dneska nic. Text se mi někam zatoulal.",
        "Archiv mlčí. Stejně jako já, když slyším vysavač.",
        "Žádný bars. Dneska je den odpočinku.",
        "Text není k dispozici. Budeme muset chvíli žít bez poezie."
      ]
    },
    news: {
      first: [
        "Poprvé? Tak vítej. Pro začátek mrkni na Hudbu.",
        "Novinky? Pro tebe asi všechno. Já už tu znám každý roh.",
        "Začni tím, co tě zajímá. Já bych začal jídlem, ale to tu nenajdeš."
      ],
      some: [
        "Něco přibylo.",
        "Mám nové informace. Ne o granulích, bohužel.",
        "Od minula se něco změnilo. Dobře, že jsi zpátky včas."
      ],
      none: [
        "Zatím nic. Někdy se prostě jen žije.",
        "Žádné novinky. Radek asi zase něco ladí.",
        "Všechno při starém. Já, web a moje neutuchající potřeba jídla.",
        "Dneska se nic nového neurodilo. Ani v misce."
      ],
      lead: "Od tvé minulé návštěvy:",
      clip: "vyšel klip {t}",
      clips: ["", "vyšly {n} nové klipy, nejnovější {t}", "vyšlo {n} nových klipů, nejnovější {t}"],
      posts: ["{n} nový příspěvek v Aktualitách", "{n} nové příspěvky v Aktualitách", "{n} nových příspěvků v Aktualitách"],
      link: "Mrknout →"
    },
    admin: {
      hello: [
        "Máme tu pár nedodělků. Já bych začal tím nejjednodušším. Třeba pauzou na jídlo.",
        "Hlásím stav: něco potřebuje tvoji pozornost. Tentokrát to není moje miska.",
        "Čekají tu věci k vyřízení. Já na ně dohlížím. Z pohodlné vzdálenosti.",
        "{name}, tady máš přehled toho, co potřebuje vyřešit.",
        "Tady je seznam úkolů. Já bych ho zkrátil na nulu, ale tlapky mi nestačí."
      ],
      // only when songs or clips miss something
      missing: ["Některé skladby nemají doplněné údaje. Já bych je doplnil, ale neumím psát tlapkou."],
      clean: [
        "Všechno je vyřízené. Můžeš se věnovat hudbě. Nebo mně.",
        "Kontrola hotová. Teď si zasloužíš pauzu. Já už ji mám."
      ],
      reports: ["{n} nahlášený komentář čeká na kontrolu", "{n} nahlášené komentáře čekají na kontrolu", "{n} nahlášených komentářů čeká na kontrolu"],
      clips: ["{n} klip nemá přiřazenou skladbu ({t})", "{n} klipy nemají přiřazenou skladbu (nejnovější: {t})", "{n} klipů nemá přiřazenou skladbu (nejnovější: {t})"],
      lyrics: ["{n} skladbě chybí text", "{n} skladbám chybí text", "{n} skladbám chybí text"],
      status: "Stav webu", toReports: "Nahlášené →", toLyrics: "Editor textů →"
    },
    surprise: {
      beatbox: "Bum tss, ka tss, bum bum tss!",
      dance: "Tohle se normálně učí roky.",
      dance2: "Hip hop mám v krvi. A v tlapkách.",
      dance3: "Uhni, jdu na parket.",
      robot: "Režim robot zapnut. Bip. Bup. Mňau.",
      silly: "Nikdo se nekouká? Výborně.",
      breakdance: "Kočky prý padají na nohy. Já nejdřív na hlavu.",
      flair: "Tohle zvládnu jen nalačno.",
      jump: "Taková elegance. A ani potlesk.",
      dive: "Chytám! …Co jsem vlastně chytal?",
      kick: "Gól! Kde je míč? To je jedno, gól.",
      cheer: "Hurá! Na co fandíme? Na mě, samozřejmě.",
      clap: "Potlesk pro mě. Klidně začnu sám.",
      fistPump: "Jo! Další level odemčen.",
      laugh: "Promiň, vzpomněl jsem si na vysavač.",
      sing: "Taky umím zpívat. Sousedi o tom ví.",
      rap: "Mikrofon mám, beat mám… a text jsem zapomněl. Kočičí paměť.",
      typing: "Píšu Radkovi, ať koupí granule. Velkými písmeny.",
      stretchArms: "Moment. Musím si srovnat všechny kosti.",
      neck: "Krk mám ztuhlý, jak se na tebe pořád koukám.",
      lie: "Konec představení. Dobrou.",
      thumbsUp: "Palec nahoru. Víc ti nedám, jsem kocour.",
      wave: "Zdar. Tlapka podaná, důstojnost zachována.",
      nervous: "Co to bylo?! …Aha. Nic.",
      shrug: "Nevím. A je mi to jedno. Krásný pocit.",
      lookAround: "Slyšel jsem něco. Asi vlastní myšlenky."
    }
  },
  en: {
    ui: {
      call: "MC Kevin – click me", hide: "Hide MC Kevin", show: "Call MC Kevin",
      sound: "Sound on click", fullLyrics: "Full lyrics →"
    },
    greet: {
      morning: [
        "Good morning. Which of us got up voluntarily today?",
        "Morning already? I haven't even finished my dream.",
        "The early bird gets the worm. I'll wait for breakfast.",
        "Good morning. No coffee yet, so I take no responsibility for my opinions.",
        "Up you get, a brand new day. Or lie back down. I won't judge."
      ],
      day: [
        "Hey. Look around, it's quite nice here. Thanks to me.",
        "Welcome. The music's over there; admiring looks can come straight to me.",
        "Hi. Looking for something interesting? Try Music. Something perfect? You're looking at it.",
        "Welcome to the site. No need to take your shoes off. Or your paws."
      ],
      evening: [
        "Good evening. Perfect time to play something good.",
        "Evening, peace and music. All it needs is a full bowl.",
        "So, shall we play a track, or just sit here existing?",
        "Welcome. I've had a hard day. I only slept six hours.",
        "The evening show is starting. The main star is already seated."
      ],
      night: [
        "Can't sleep either? This is getting suspicious.",
        "A night visit. Either you have great taste or a broken sleep schedule.",
        "Shh. Everyone's asleep. Except the two of us and the fridge.",
        "Strange things happen at this hour. Like me still sitting here.",
        "Welcome to the night shift. It's unpaid, but the view is nice."
      ],
      three: ["Three o'clock. Time to race round the flat like mad. Coming?"]
    },
    first: [],
    back: {
      news: [
        "You're back. And things happened in the meantime.",
        "While nobody was here, the site didn't freeze. Almost a miracle.",
        "I've got news for you. For once it's not about my bowl.",
        "Something's new. I'd have told you sooner, but nobody asked me."
      ],
      plain: [
        "Ah, a familiar face. At least according to the visit history.",
        "You again? Great. At least I don't have to explain where everything is.",
        "Let's pick up where we left off. If you still remember."
      ]
    },
    page: {
      home: [
        "This is where it all begins. Decent place, don't you think?",
        "No rush. The music isn't going anywhere. Neither am I, sadly.",
        "Look around. Radek calls it a website. I call it my workplace.",
        "Don't know what to play? That's fine. Sometimes I don't know what to do with myself either.",
        "If you're here for the music, you're in the right place. If you're here for me, excellent judgement."
      ],
      music: [
        "Here's everything Skeli ever let out into the world. Some of it more than once.",
        "Pick a track. I've got my favourites already. All the ones with silence.",
        "Play something. And if you like it, you can tell him. He's curious.",
        "So much music and still nobody recorded me a lullaby.",
        "Feel free to play it loud. I take no responsibility for the neighbours."
      ],
      lyrics: [
        "Here are the words Radek put together instead of sleeping.",
        "Some lines came quickly. Others took so long I managed a nap.",
        "Find your favourite line. I'm looking for my favourite pillow.",
        "Read carefully. You may find something even the author didn't mean.",
        "The lyrics are here. I won't sing them for you. I have my dignity.",
      ],
      song: [
        "Here are the full lyrics. Sing along if you like, I don't vouch for the pitch.",
        "I know this one almost by heart. Almost is the key word.",
        "Make the text bigger with Aa. Meanwhile I'll make my portion bigger.",
        "Careful, some lines may get stuck in your head. It happened to me.",
        "Read it all. The author would be pleased. I'd be pleased with some tuna."
      ],
      about: [
        "Here you'll learn something about Radek. Sadly there's little room for me.",
        "He makes his music himself. He made the website himself. Someone else still fills my bowl though.",
        "Self-taught, musician, web maker. And a person who thinks I like getting up.",
        "I could tell you a secret about him, but then he'd take away my computer access.",
        "He's quite capable. Not compared to a cat like me, obviously."
      ],
      news: [
        "News straight from the paw. I mean, from the horse's mouth.",
        "Here's what's going on. I usually know everything, but nobody believes me.",
        "New posts, new information. I've still got the same kibble.",
        "Check what's new. Then tell me if it's dinner time yet."
      ],
      register: [
        "A new account? Fine. Just remember a cat's name is not a security strategy.",
        "Fill in what's needed. I'd do it for you, but my paws are short.",
        "Welcome among the registered. A great responsibility awaits. Like not forgetting your password.",
        "A strong password, please. I don't want some strange cat getting in."
      ],
      login: [
        "Come on in. The door is open, but keep your shoes on.",
        "Can't sign in? That's annoying. Let's try without panicking.",
        "Forgot your password? I know the feeling. I forget why I walked into a room."
      ],
      loginBack: ["Back again? Soon you'll have your own cat bed here."],
      donate: [
        "Like what Skeli does here? This is where you can help him keep going.",
        "Every bit of support counts. I'd appreciate regular contributions too. In tins.",
        "Music doesn't make itself. Unlike me on a free afternoon.",
        "If you want to support more music, this is the way. I won't persuade you. Much."
      ],
      error: [
        "There's nothing here. And believe me, I looked.",
        "404. The page wandered off. Cats do it all the time.",
        "Well, that didn't work. Shall we try another way?",
        "Empty. Almost like my bowl after breakfast.",
        "The page has vanished. If my tail were a detector, I'd have found it already.",
        "I knocked this page off the table. On principle."
      ]
    },
    tips: [
      "Like a song? Give it a ❤. Skeli sees it. So do I, but I pretend not to.",
      "Up top you can switch between the light and dark theme. I'm gold in both.",
      "Sign in and you can join the comments. Politely, please. I only tease professionally.",
      "On a song page there's Aa. Finally a button I understand without a manual.",
      "Don't know what to listen to? Click me. I'll pick something to suit your mood. Your mood doesn't interest me, but I'll try."
    ],
    idle: [
      "Smooth scrolling. Almost like me trying not to fall off the table.",
      "That gold paw up top? It's not a feeding button. I've tried.",
      "Click me. I don't bite. Without a reason.",
      "Golden paws. Golden claws too. Still no bill for the manicure, though.",
      "I have nine lives. I slept through eight of them.",
      "If I got a coin for every click, I'd own a cat food factory by now.",
      "I do important work here. I make sure nobody gets bored.",
      "If you're looking for me, I'm here. If you're looking for the meaning of life, try the News.",
      "I look like I know something. That's the secret of success.",
      "I could give you advice. But then you'd get used to it.",
      "There's a glass on the table. For now.",
      "I sleep sixteen hours a day. The rest of the time I watch you scroll.",
      "A box is the best furniture. This website will never understand.",
      "If Skeli wrote a song about me, it would go platinum. And be mostly about food.",
      "That red laser dot… no, nothing. Let's not talk about it.",
      "A cucumber behind me? Don't even try."
    ],
    mobile: ["I'm smaller on a phone. My ego is just as big."],
    sleep: [
      "Zzz… just closing my eyes to think better.",
      "Rest is important. Especially when you don't have to work.",
      "If anything happens, I'm awake. It just doesn't look like it.",
      "Power saving mode. Paws switched off.",
      "Quiet, please. I'm busy doing nothing."
    ],
    wake: [
      "What? Already? I'd only just got comfy.",
      "I wasn't asleep. I was checking the inside of my eyelids.",
      "I'm here. I just switched the world off for a moment.",
      "Finally some action. I nearly started tidying up.",
      "Welcome back. What were we talking about? Oh right, nothing."
    ],
    pw: {
      weak: [
        "Even a goldfish could guess that password.",
        "Try something that isn't on the first page of your diary.",
        "Toughen up a bit. This wouldn't protect an empty bowl.",
        "Your password needs backup. Call it a friend.",
        "Is that a password or a hello to the neighbours?"
      ],
      invalid: [
        "Your password ran off somewhere. Try typing it without decorations.",
        "Emoji are cute, but we can't make them a bed here.",
        "Something extra sneaked in. Try once more.",
        "A password is not a Christmas tree. It doesn't need everything on it."
      ],
      mismatch: [
        "Two passwords, two different opinions.",
        "Try introducing them. They don't get along yet.",
        "One of them is living its own life.",
        "Even two cats at one bowl agree better than this."
      ],
      strong: [
        "Now that looks promising. Respect.",
        "Nice. I wouldn't guess that even after my third bowl.",
        "Good job. The security cat approves.",
        "This one has claws. Exactly how it should be.",
        "Finally a password that won't be intimidated."
      ],
      changed: [
        "Done. New password, new start.",
        "Changed. And I didn't even have to help.",
        "Sorted. Now just remember it."
      ]
    },
    profile: [
      "A new picture? Looks good on you. Almost as good as on me.",
      "Profile updated. I wouldn't change a thing about myself. Nothing to change.",
      "Picture saved. The gallery has one more masterpiece.",
      "There, so everyone knows you. I'd know myself blindfolded.",
      "Change done. Now decide what else you'll reveal about yourself."
    ],
    auth: {
      in: [
        "Hey, familiar face. Come on in.",
        "Signed in. The door is open.",
        "You're in. Make yourself at home. Just don't touch my bowl.",
        "The account recognised you. I recognised you by the way you click."
      ],
      fail: [
        "That didn't work. Check your details.",
        "Something's off. And this time it's not my position on the sofa.",
        "Try again. I'm not going anywhere.",
        "Access denied. I let you in, but the computer has a mind of its own."
      ],
      out: [
        "See you some time. I'll be here. Probably asleep.",
        "Signed out. Don't forget where you left me.",
        "Take care. And bring a good mood next time.",
        "Bye for now. I'll sit here a while longer.",
        "Leaving? Fine. I'll still meow at the door for ten minutes."
      ]
    },
    comment: {
      added: [
        "Comment sent. Let's see what the others say.",
        "It's out there. Words have a way of their own.",
        "Added. A polite discussion beats a fight over the last tin.",
        "Done. Now you can pretend you only come here to read.",
        "My opinion? I express that by knocking a mug off the table."
      ],
      deleted: [
        "Comment gone. Tidying up after yourself is good manners.",
        "Done. Your digital footprint is a little smaller.",
        "And it's gone. Sometimes less is more."
      ]
    },
    heart: {
      on: [
        "The heart has landed. Someone will be happy.",
        "This track hit the spot, huh?",
        "Good choice. And I'm not just saying that because I live here.",
        "If I had a thumb, I'd give it a like. I have a paw. You get a paw."
      ],
      off: [
        "A change of heart? Cats change their minds too.",
        "The heart is gone. The world keeps turning.",
        "Musical relationships are complicated. I know, I live with a vacuum cleaner."
      ]
    },
    search: {
      found: [
        "Found some results. Quicker than chasing my own tail this time.",
        "Searching. I'd start at the bowl, but you do you."
      ],
      none: [
        "Found nothing. Try another word.",
        "Zero results. This is when I'd normally go for lunch."
      ]
    },
    clip: {
      ok: [
        "Listen up. I'll pretend I'm hearing this track for the first time.",
        "Here we go. Ears ready?",
        "Choice approved. You can thank me later.",
        "Picture rolling, sound playing. Finally something that works without my help."
      ],
      fail: [
        "Something got stuck. Let's try again.",
        "The player is in a mood today. I know the feeling.",
        "No picture, no sound? That's almost modern art.",
        "That didn't work. Try another clip or try again in a moment."
      ]
    },
    menu: { hint: "What can I do for you?", find: "Find a song", play: "Play something", rap: "Rap for me", news: "What's new?", fun: "Do something", report: "Report a problem" },
    // "Nahlásit problém" (issue #28): the message goes to the admin (Hodnocení webu → Nahlášené problémy)
    report: {
      prompt: ["Something not working? Tell me what and I'll pass it on to Skeli.","A missing video, a wrong line, something broken? Tell me, I'll sort it."],
      placeholder: "What's wrong? (e.g. the song has no video)",
      send: "Send",
      thanks: ["Got it. I'll pass it on to Skeli to fix.","Thanks! I've made a note of it."],
      empty: "Write a few words so I know what to look for.",
      fail: "I couldn't send it right now. Try again in a moment.",
      limit: "That's enough for now, try again in an hour."
    },
    help: {
      say: ["Part of these lyrics is missing. Know {lang}? There's a box for it down below.", "Someone raps here and nobody knows what. If you know {lang}, save us."],
      link: "Show me"
    },
    life: {
      stretch: ["Stretch. Cat yoga.","Back in an arch. A pro."],
      knead: ["Kneading. Don't know why. Have to.","Making dough. Out of nothing."],
      look: ["Did something rustle over there?","Did you see that too? No? Never mind."],
      fly: ["A fly! …Gone.","Almost had it. Almost."],
      neck: ["Crack. Much better.","My neck hurts from sleeping all day."],
      startle: ["What was that?! …Oh, my tail.","Scared of my own shadow. Again."],
      shrug: ["Am I hungry? I am hungry.","No idea what I'm doing here. But I'm doing it well."],
      dance: ["Nobody's watching? Right then.","Skeli taught me this move. He lies."],
      nap: ["I'll just close my eyes for a second…","A twenty-minute nap. For three hours."],
      bored: ["Boring. Throw me a ball of yarn.","I'd knock something off the table, but I haven't got a table."]
    },
    find: {
      prompt: [
        "What are you looking for? A title, a bit of the lyrics, anything. Just don't ask me to sing it.",
        "Type what's on your mind. I'll pretend to be a music archivist.",
        "Go on then. I can search. Just no riddles."
      ],
      placeholder: "e.g. a body without a soul",
      empty: ["Type at least part of a title. I'm not a fortune teller."],
      found: [
        "I found a few candidates. Your pick.",
        "Here you go. And I didn't even have to get up.",
        "The results are out. My work here is done. For now.",
        "I found what I could. The rest is up to you."
      ],
      none: [
        "Nothing. Not a trace. Try another word.",
        "That means nothing to me. And I know nearly everything. Nearly.",
        "Empty here. Try typing the title a little differently.",
        "Couldn't find it. Maybe we're looking under the wrong name."
      ]
    },
    play: {
      intro: [
        "Want something played? Finally a task I like.",
        "Fine. Today I pick. Complaints accepted in the form of treats.",
        "I'll pick you a track. I've got an ear for it. Two, actually."
      ],
      pick: [
        "Now playing: {t}. This might suit you.",
        "Today's pick: {t}. Quality approved by a cat.",
        "Let's try {t}. If not, we'll pretend it never happened.",
        "Random pick: {t}. Chance has good taste today."
      ],
      close: "Close the player", song: "Lyrics and more →"
    },
    rap: {
      intro: [
        "Want bars? Listen up. I wrote them… well, read them. (In Czech.)",
        "Ready? This is my human's work.",
        "Ladies and gentlemen, paws up. Here comes poetry.",
        "Alright. Today I'm a rapper. Radek must never find out.",
        "Careful, here comes a bit you'll still be humming tomorrow."
      ],
      fail: [
        "Nothing today. The lyrics wandered off.",
        "The archive is silent. Like me when I hear the vacuum cleaner.",
        "No bars. Today is a day of rest.",
        "Lyrics not available. We'll have to live without poetry for a while."
      ]
    },
    news: {
      first: [
        "First time? Welcome then. Start with the Music.",
        "News? For you, probably everything. I already know every corner.",
        "Start with what interests you. I'd start with food, but you won't find any here."
      ],
      some: [
        "Something's new.",
        "I've got new information. Not about kibble, sadly.",
        "Something changed since last time. Good thing you're back in time."
      ],
      none: [
        "Nothing yet. Sometimes life just happens.",
        "No news. Radek must be fine-tuning something again.",
        "All as before. Me, the site and my endless need for food.",
        "Nothing new today. Not even in the bowl."
      ],
      lead: "Since your last visit:",
      clip: "a new clip came out: {t}",
      clips: ["", "{n} new clips came out, the newest is {t}"],
      posts: ["{n} new post in the News", "{n} new posts in the News"],
      link: "Take a look →"
    },
    admin: {
      hello: [
        "A few loose ends here. I'd start with the easiest one. Like a food break.",
        "Status report: something needs your attention. For once it's not my bowl.",
        "Things are waiting to be done. I'm supervising. From a comfortable distance.",
        "{name}, here's what needs sorting out.",
        "Here's the to-do list. I'd cut it to zero, but my paws aren't up to it."
      ],
      missing: ["Some songs are missing details. I'd fill them in, but I can't type with a paw."],
      clean: [
        "Everything's done. You can get on with the music. Or with me.",
        "Check complete. You deserve a break. I'm already on mine."
      ],
      reports: ["{n} reported comment is waiting to be checked", "{n} reported comments are waiting to be checked"],
      clips: ["{n} clip has no song ({t})", "{n} clips have no song (newest: {t})"],
      lyrics: ["{n} song has no lyrics", "{n} songs have no lyrics"],
      status: "Site status", toReports: "Reports →", toLyrics: "Lyrics editor →"
    },
    surprise: {
      beatbox: "Boom tss, ka tss, boom boom tss!",
      dance: "Normally this takes years to learn.",
      dance2: "Hip hop runs in my blood. And in my paws.",
      dance3: "Move aside, I'm hitting the dance floor.",
      robot: "Robot mode on. Beep. Boop. Meow.",
      silly: "Nobody watching? Perfect.",
      breakdance: "They say cats land on their feet. I land on my head first.",
      flair: "I can only do this on an empty stomach.",
      jump: "Such elegance. And not even applause.",
      dive: "Got it! …What did I just catch?",
      kick: "Goal! Where's the ball? Never mind, goal.",
      cheer: "Hooray! What are we cheering? Me, obviously.",
      clap: "A round of applause for me. I'll start.",
      fistPump: "Yes! Next level unlocked.",
      laugh: "Sorry, I just remembered the vacuum cleaner.",
      sing: "I can sing too. The neighbours know.",
      rap: "Got the mic, got the beat… and forgot the words. Cat memory.",
      typing: "Texting Radek to buy cat food. In capitals.",
      stretchArms: "One moment. I have to put all my bones in order.",
      neck: "Stiff neck from watching you all the time.",
      lie: "End of the show. Good night.",
      thumbsUp: "Thumbs up. That's all you get, I'm a cat.",
      wave: "Hi. Paw given, dignity kept.",
      nervous: "What was that?! …Oh. Nothing.",
      shrug: "No idea. And I don't care. Lovely feeling.",
      lookAround: "I heard something. Probably my own thoughts."
    }
  },
  de: {
    ui: {
      call: "MC Kevin – klick mich an", hide: "MC Kevin verstecken", show: "MC Kevin rufen",
      sound: "Ton beim Klicken", fullLyrics: "Ganzer Text →"
    },
    greet: {
      morning: [
        "Guten Morgen. Wer von uns beiden ist heute freiwillig aufgestanden?",
        "Schon Morgen? Ich hab noch nicht mal fertig geträumt.",
        "Der frühe Vogel fängt den Wurm. Ich warte aufs Frühstück.",
        "Guten Morgen. Noch kein Kaffee, also keine Gewähr für meine Meinungen.",
        "Auf in den neuen Tag. Oder leg dich wieder hin. Ich urteile nicht."
      ],
      day: [
        "Hi. Schau dich um, ganz schön hier. Dank mir.",
        "Willkommen. Die Musik ist da drüben, bewundernde Blicke direkt an mich.",
        "Hey. Suchst du was Interessantes? Probier Musik. Was Perfektes? Du siehst es gerade an.",
        "Willkommen auf der Seite. Schuhe ausziehen musst du nicht. Pfoten auch nicht."
      ],
      evening: [
        "Guten Abend. Perfekte Zeit, was Gutes zu hören.",
        "Abend, Ruhe und Musik. Fehlt nur noch ein voller Napf.",
        "Na, hören wir einen Track oder existieren wir hier nur so?",
        "Willkommen. Ich hab einen harten Tag hinter mir. Nur sechs Stunden geschlafen.",
        "Das Abendprogramm beginnt. Der Hauptstar sitzt schon."
      ],
      night: [
        "Kannst du auch nicht schlafen? Langsam wird's verdächtig.",
        "Nachtbesuch. Entweder guter Geschmack oder kaputter Schlafrhythmus.",
        "Psst. Alle schlafen. Außer uns beiden und dem Kühlschrank.",
        "Um diese Uhrzeit passieren seltsame Dinge. Zum Beispiel, dass ich immer noch hier sitze.",
        "Willkommen in der Nachtschicht. Unbezahlt, aber mit guter Aussicht."
      ],
      three: ["Drei Uhr. Zeit, wie verrückt durch die Wohnung zu rennen. Machst du mit?"]
    },
    first: [],
    back: {
      news: [
        "Du bist zurück. Und inzwischen ist was passiert.",
        "Während keiner hier war, ist die Seite nicht eingefroren. Fast ein Wunder.",
        "Ich hab Neuigkeiten für dich. Diesmal nicht über meinen Napf.",
        "Es gibt was Neues. Ich hätt's früher gesagt, aber mich fragt ja keiner."
      ],
      plain: [
        "Ah, ein bekanntes Gesicht. Zumindest laut Besuchsverlauf.",
        "Schon wieder du? Prima. Dann muss ich nicht erklären, wo was ist.",
        "Machen wir weiter, wo wir aufgehört haben. Falls du dich noch erinnerst."
      ]
    },
    page: {
      home: [
        "Hier fängt alles an. Ordentlicher Ort, oder?",
        "Keine Eile. Die Musik läuft nicht weg. Ich leider auch nicht.",
        "Schau dich um. Radek nennt es Website. Ich nenne es Arbeitsplatz.",
        "Keine Ahnung, was du hören sollst? Kein Problem. Ich weiß auch manchmal nichts mit mir anzufangen.",
        "Wenn du wegen der Musik hier bist, bist du richtig. Wenn wegen mir, hast du ein exzellentes Urteilsvermögen."
      ],
      music: [
        "Hier ist alles, was Skeli in die Welt gesetzt hat. Manches sogar mehrfach.",
        "Such dir einen Track aus. Ich hab meine Favoriten schon. Alle, in denen Stille ist.",
        "Hör dir was an. Und wenn's dir gefällt, sag's ihm. Er ist neugierig.",
        "So viel Musik und immer noch hat mir keiner ein Schlaflied aufgenommen.",
        "Hör ruhig laut. Für die Nachbarn übernehme ich keine Haftung."
      ],
      lyrics: [
        "Hier sind die Worte, die Radek zusammengesetzt hat, statt zu schlafen.",
        "Manche Zeilen entstanden schnell. Andere so langsam, dass ich ein Nickerchen geschafft hab.",
        "Such dir deine Lieblingszeile. Ich such mein Lieblingskissen.",
        "Lies genau. Vielleicht findest du was, das nicht mal der Autor gemeint hat.",
        "Die Texte sind hier. Vorsingen werd ich sie nicht. Ich hab meine Würde."
      ],
      song: [
        "Hier ist der ganze Text. Mitsingen darfst du, für die Intonation hafte ich nicht.",
        "Den kann ich fast auswendig. Fast ist das wichtige Wort.",
        "Mach den Text ruhig mit Aa größer. Ich mach inzwischen meine Portion größer.",
        "Vorsicht, manche Zeilen bleiben im Kopf hängen. Mir ist das schon passiert.",
        "Lies alles. Der Autor würde sich freuen. Ich würde mich über Thunfisch freuen."
      ],
      about: [
        "Hier erfährst du was über Radek. Für mich ist hier leider wenig Platz.",
        "Musik macht er selbst. Die Website hat er selbst gemacht. Meinen Napf füllt aber immer noch jemand anders.",
        "Autodidakt, Musiker, Webentwickler. Und ein Mensch, der glaubt, ich steh gern auf.",
        "Ich könnte dir was über ihn verraten, aber dann sperrt er mir den Computer.",
        "Er ist ziemlich fähig. Mit einem Kater wie mir kann er natürlich nicht mithalten."
      ],
      news: [
        "Neuigkeiten aus erster Pfote. Äh, aus erster Hand.",
        "Hier erfährst du, was los ist. Ich weiß meistens alles, aber keiner glaubt mir.",
        "Neue Beiträge, neue Infos. Ich hab immer noch dasselbe Trockenfutter.",
        "Schau, was es Neues gibt. Und dann sag mir, ob schon Zeit fürs Abendessen ist."
      ],
      register: [
        "Ein neues Konto? Gut. Aber merk dir: Der Name deines Katers ist keine Sicherheitsstrategie.",
        "Füll aus, was nötig ist. Ich würd's ja machen, aber meine Pfoten sind zu kurz.",
        "Willkommen bei den Registrierten. Große Verantwortung wartet. Zum Beispiel, das Passwort nicht zu vergessen.",
        "Ein starkes Passwort, bitte. Ich will nicht, dass hier ein fremder Kater reinkommt."
      ],
      login: [
        "Komm rein. Die Tür ist offen, aber lass die Schuhe an.",
        "Du kannst dich nicht anmelden? Ärgerlich. Wir versuchen's ohne Panik.",
        "Passwort vergessen? Kenn ich. Ich vergesse, warum ich ins Zimmer gekommen bin."
      ],
      loginBack: ["Schon wieder da? Bald hast du hier dein eigenes Körbchen."],
      donate: [
        "Gefällt dir, was Skeli hier macht? Hier kannst du helfen, dass er weitermachen kann.",
        "Jede Unterstützung zählt. Ich würde auch regelmäßige Beiträge schätzen. In Dosen.",
        "Musik entsteht nicht von allein. Im Gegensatz zu mir an einem freien Nachmittag.",
        "Wenn du weitere Musik unterstützen willst, geht's hier lang. Ich werd dich nicht überreden. Nicht sehr."
      ],
      error: [
        "Hier ist nichts. Und glaub mir, ich hab gesucht.",
        "404. Die Seite hat sich verlaufen. Katzen machen das ständig.",
        "Das hat nicht geklappt. Versuchen wir einen anderen Weg?",
        "Leer. Fast wie mein Napf nach dem Frühstück.",
        "Die Seite ist verschwunden. Wäre mein Schwanz ein Detektor, hätt ich sie schon gefunden.",
        "Diese Seite hab ich vom Tisch geschubst. Aus Prinzip."
      ]
    },
    tips: [
      "Gefällt dir ein Song? Gib ihm ein ❤. Skeli sieht das. Ich auch, aber ich tu so, als nicht.",
      "Oben kannst du zwischen hellem und dunklem Modus wechseln. Ich bin in beiden golden.",
      "Melde dich an und mach bei den Kommentaren mit. Höflich, bitte. Ich stichel nur professionell.",
      "Auf der Songseite gibt's Aa. Endlich ein Knopf, den ich ohne Anleitung verstehe.",
      "Keine Ahnung, was du hören sollst? Klick mich an. Ich such was nach deiner Laune aus. Deine Laune interessiert mich zwar nicht, aber ich versuch's."
    ],
    idle: [
      "Flüssig gescrollt. Fast wie ich, wenn ich versuche, nicht vom Tisch zu fallen.",
      "Die goldene Pfote oben? Das ist kein Fütterungsknopf. Hab's probiert.",
      "Klick mich an. Ich beiße nicht. Ohne Grund.",
      "Goldene Pfoten. Goldene Krallen auch. Nur die Rechnung für die Maniküre fehlt noch.",
      "Ich habe neun Leben. Acht davon hab ich verschlafen.",
      "Wenn ich für jeden Klick eine Münze kriegen würde, hätt ich schon eine eigene Dosenfabrik.",
      "Ich mach hier wichtige Arbeit. Ich pass auf, dass sich keiner langweilt.",
      "Wenn du mich suchst, ich bin hier. Wenn du den Sinn des Lebens suchst, probier die Neuigkeiten.",
      "Ich seh aus, als wüsste ich was. Das ist das Geheimnis des Erfolgs.",
      "Ich könnte dir einen Rat geben. Aber dann gewöhnst du dich dran.",
      "Auf dem Tisch steht ein Glas. Noch.",
      "Ich schlafe sechzehn Stunden am Tag. Den Rest schau ich dir beim Scrollen zu.",
      "Ein Karton ist das beste Möbelstück. Diese Website wird das nie verstehen.",
      "Wenn Skeli einen Song über mich schreiben würde, ginge er auf Platin. Und es ginge viel ums Essen.",
      "Dieser rote Laserpunkt… nein, nichts. Reden wir nicht drüber.",
      "Eine Gurke hinter mir? Versuch's gar nicht erst."
    ],
    mobile: ["Auf dem Handy bin ich kleiner. Mein Ego ist genauso groß."],
    sleep: [
      "Zzz… ich schließe nur die Augen, um besser nachzudenken.",
      "Ausruhen ist wichtig. Vor allem, wenn man nicht arbeiten muss.",
      "Falls was ist, ich bin wach. Sieht von außen nur nicht so aus.",
      "Energiesparmodus. Pfoten ausgeschaltet.",
      "Ruhe, bitte. Ich tu gerade nichts."
    ],
    wake: [
      "Was? Schon? Ich hatte es mir gerade gemütlich gemacht.",
      "Ich hab nicht geschlafen. Ich hab die Innenseite meiner Lider kontrolliert.",
      "Ich bin da. Ich hab nur kurz die Welt ausgeschaltet.",
      "Endlich Action. Fast hätte ich angefangen aufzuräumen.",
      "Willkommen zurück. Worüber haben wir geredet? Ach ja, über nichts."
    ],
    pw: {
      weak: [
        "Dieses Passwort würde sogar ein Goldfisch erraten.",
        "Probier was, das nicht auf der ersten Seite deines Tagebuchs steht.",
        "Leg ein bisschen nach. Das schützt nicht mal einen leeren Napf.",
        "Dein Passwort braucht Verstärkung. Ruf ihm einen Freund.",
        "Ist das ein Passwort oder ein Gruß an die Nachbarn?"
      ],
      invalid: [
        "Dein Passwort ist irgendwie ausgebüxt. Schreib es ohne Verzierungen.",
        "Emojis sind süß, aber hier kriegen sie kein Körbchen.",
        "Da hat sich was eingeschlichen. Versuch's nochmal.",
        "Ein Passwort ist kein Weihnachtsbaum. Da muss nicht alles dran."
      ],
      mismatch: [
        "Zwei Passwörter, zwei Meinungen.",
        "Stell sie einander vor. Noch verstehen sie sich nicht.",
        "Eins von beiden führt ein Eigenleben.",
        "So uneinig sind nicht mal zwei Katzen an einem Napf."
      ],
      strong: [
        "Das sieht schon vielversprechend aus. Respekt.",
        "Schön. Das würd ich nicht mal nach dem dritten Napf erraten.",
        "Gute Arbeit. Der Sicherheitskater ist einverstanden.",
        "Das hat Krallen. Genau so soll es sein.",
        "Endlich ein Passwort, das sich nicht einschüchtern lässt."
      ],
      changed: [
        "Fertig. Neues Passwort, neuer Anfang.",
        "Geändert. Und ich musste nicht mal assistieren.",
        "Erledigt. Jetzt merk's dir nur."
      ]
    },
    profile: [
      "Ein neues Foto? Steht dir. Fast so gut wie mir.",
      "Profil geändert. An mir würde ich nichts ändern. Gibt nichts zu ändern.",
      "Foto gespeichert. Die Galerie hat ein Meisterwerk mehr.",
      "So, damit dich hier alle erkennen. Ich erkenn mich auch blind.",
      "Änderung fertig. Jetzt überleg, was du noch über dich verrätst."
    ],
    auth: {
      in: [
        "Hi, bekanntes Gesicht. Komm rein.",
        "Angemeldet. Die Tür ist offen.",
        "Du bist drin. Fühl dich wie zu Hause. Nur meinen Napf nicht anfassen.",
        "Das Konto hat dich erkannt. Ich dich an der Art, wie du klickst."
      ],
      fail: [
        "Das hat nicht geklappt. Prüf deine Angaben.",
        "Irgendwas passt nicht. Und diesmal ist es nicht meine Liegeposition auf dem Sofa.",
        "Versuch's nochmal. Ich lauf nicht weg.",
        "Zugang verweigert. Ich hätte dich reingelassen, aber der Computer hat seinen eigenen Kopf."
      ],
      out: [
        "Bis irgendwann. Ich bin hier. Wahrscheinlich schlafend.",
        "Abgemeldet. Vergiss nicht, wo du mich gelassen hast.",
        "Mach's gut. Und bring nächstes Mal gute Laune mit.",
        "Bis dann. Ich sitz hier noch ein bisschen.",
        "Du gehst? Gut. Ich miau trotzdem noch zehn Minuten an der Tür."
      ]
    },
    comment: {
      added: [
        "Kommentar gesendet. Mal sehen, was die anderen sagen.",
        "Und raus damit. Worte gehen ihren eigenen Weg.",
        "Hinzugefügt. Eine höfliche Diskussion ist besser als Streit um die letzte Dose.",
        "Fertig. Jetzt kannst du so tun, als würdest du hier nur lesen.",
        "Meine Meinung? Die äußere ich, indem ich eine Tasse vom Tisch schubse."
      ],
      deleted: [
        "Kommentar weg. Hinter sich aufräumen gehört sich.",
        "Fertig. Der digitale Fußabdruck ist etwas kleiner.",
        "Und weg. Manchmal ist weniger mehr."
      ]
    },
    heart: {
      on: [
        "Das Herz ist gelandet. Da freut sich jemand.",
        "Der Track hat gesessen, was?",
        "Gute Wahl. Und das sag ich nicht nur, weil ich hier wohne.",
        "Hätte ich einen Daumen, gäb's ein Like. Ich hab eine Pfote. Du kriegst eine Pfote."
      ],
      off: [
        "Meinung geändert? Katzen tun das auch.",
        "Das Herz ist weg. Die Welt dreht sich weiter.",
        "Musikalische Beziehungen sind kompliziert. Ich kenn das vom Zusammenleben mit dem Staubsauger."
      ]
    },
    search: {
      found: [
        "Ergebnisse gefunden. Diesmal schneller, als meinen eigenen Schwanz zu jagen.",
        "Wir suchen. Ich würde beim Napf anfangen, aber mach, wie du willst."
      ],
      none: [
        "Nichts gefunden. Probier ein anderes Wort.",
        "Null Ergebnisse. Jetzt würd ich normalerweise zum Mittagessen gehen."
      ]
    },
    clip: {
      ok: [
        "Hör zu. Ich tu so, als würd ich den Track zum ersten Mal hören.",
        "Los geht's. Ohren bereit?",
        "Auswahl genehmigt. Danken kannst du mir später.",
        "Bild läuft, Ton spielt. Endlich was, das ohne meine Hilfe funktioniert."
      ],
      fail: [
        "Da hängt was. Versuchen wir's nochmal.",
        "Der Player hat heute seine eigene Laune. Kenn ich.",
        "Weder Bild noch Ton? Das ist fast schon moderne Kunst.",
        "Hat nicht geklappt. Probier einen anderen Clip oder gleich nochmal."
      ]
    },
    menu: { hint: "Was kann ich für dich tun?", find: "Song finden", play: "Spiel was", rap: "Rapp mal", news: "Was gibt's Neues?", fun: "Mach was", report: "Problem melden" },
    // "Nahlásit problém" (issue #28): the message goes to the admin (Hodnocení webu → Nahlášené problémy)
    report: {
      prompt: ["Funktioniert hier was nicht? Sag mir was, ich geb's an Skeli weiter.","Fehlt ein Video, eine falsche Zeile, was kaputt? Erzähl, ich kümmere mich."],
      placeholder: "Was ist falsch? (z. B. beim Song fehlt das Video)",
      send: "Senden",
      thanks: ["Hab's. Ich geb's an Skeli weiter.","Danke! Hab's mir notiert."],
      empty: "Schreib ein paar Worte, damit ich weiß, wonach ich suchen soll.",
      fail: "Konnte es gerade nicht senden. Versuch's gleich nochmal.",
      limit: "Für jetzt reicht's, versuch's in einer Stunde wieder."
    },
    help: {
      say: ["Hier fehlt ein Stück Text. Kannst du {lang}? Unten gibt es ein Feld dafür.", "Hier rappt jemand und keiner weiß, was. Wenn du {lang} kannst, rette uns."],
      link: "Zeig's mir"
    },
    life: {
      stretch: ["Strecken. Katzen-Yoga.","Rücken im Bogen. Ein Profi."],
      knead: ["Ich knete. Weiß nicht, warum. Muss.","Ich mache Teig. Aus nichts."],
      look: ["Hat da was geraschelt?","Hast du das auch gesehen? Nein? Egal."],
      fly: ["Eine Fliege! …Weg.","Fast hätte ich sie gehabt. Fast."],
      neck: ["Knack. Gleich besser.","Mir tut der Nacken weh vom Schlafen den ganzen Tag."],
      startle: ["Was war das?! …Ach, mein Schwanz.","Vor dem eigenen Schatten erschrocken. Schon wieder."],
      shrug: ["Hab ich Hunger? Ich hab Hunger.","Keine Ahnung, was ich hier mache. Aber ich mache es gut."],
      dance: ["Schaut keiner? Na gut.","Den Schritt hat mir Skeli beigebracht. Er lügt."],
      nap: ["Ich mach nur kurz die Augen zu…","Ein Zwanzig-Minuten-Nickerchen. Für drei Stunden."],
      bored: ["Langweilig. Wirf mir ein Wollknäuel.","Ich würde was vom Tisch werfen, aber ich hab keinen Tisch."]
    },
    find: {
      prompt: [
        "Was suchst du? Titel, ein Stück Text, egal. Nur verlang nicht, dass ich's singe.",
        "Schreib, was du im Kopf hast. Ich tu so, als wär ich Musikarchivar.",
        "Na los. Suchen kann ich. Nur keine Rätsel."
      ],
      placeholder: "z. B. ein Körper ohne Seele",
      empty: ["Gib wenigstens einen Teil des Titels ein. Ich bin kein Hellseher."],
      found: [
        "Ich hab ein paar Kandidaten. Such dir einen aus.",
        "Bitte schön. Und ich musste nicht mal aufstehen.",
        "Die Ergebnisse sind da. Meine Arbeit ist getan. Vorerst.",
        "Ich hab gefunden, was ging. Der Rest liegt bei dir."
      ],
      none: [
        "Nichts. Keine Spur. Probier einen anderen Begriff.",
        "Sagt mir nichts. Und ich kenn fast alles. Fast.",
        "Hier ist es leer. Schreib den Titel mal etwas anders.",
        "Nicht gefunden. Vielleicht suchen wir unter dem falschen Namen."
      ]
    },
    play: {
      intro: [
        "Soll ich was spielen? Endlich eine Aufgabe, die mir gefällt.",
        "Gut. Heute wähle ich. Beschwerden nehme ich in Form von Leckerlis an.",
        "Ich such dir einen Track aus. Ich hab ein Ohr dafür. Sogar zwei."
      ],
      pick: [
        "Ich spiele: {t}. Das könnte passen.",
        "Heutige Auswahl: {t}. Qualität vom Kater geprüft.",
        "Versuchen wir {t}. Notfalls tun wir so, als wär's nie passiert.",
        "Zufallsauswahl: {t}. Der Zufall hat heute guten Geschmack."
      ],
      close: "Player schließen", song: "Text und mehr →"
    },
    rap: {
      intro: [
        "Willst du Bars? Dann hör zu. Ich hab den Text geschrieben… äh, gelesen. (Auf Tschechisch.)",
        "Bereit? Das ist die Arbeit meines Menschen.",
        "Meine Damen und Herren, Pfoten hoch. Hier kommt Poesie.",
        "Na gut. Heute bin ich Rapper. Radek darf das nie erfahren.",
        "Achtung, jetzt kommt ein Stück, das du morgen noch summst."
      ],
      fail: [
        "Heute nichts. Der Text hat sich verlaufen.",
        "Das Archiv schweigt. Wie ich, wenn ich den Staubsauger höre.",
        "Keine Bars. Heute ist Ruhetag.",
        "Text nicht verfügbar. Wir müssen eine Weile ohne Poesie leben."
      ]
    },
    news: {
      first: [
        "Zum ersten Mal hier? Dann willkommen. Fang mit der Musik an.",
        "Neuigkeiten? Für dich wohl alles. Ich kenn hier schon jede Ecke.",
        "Fang mit dem an, was dich interessiert. Ich würde mit Essen anfangen, aber das gibt's hier nicht."
      ],
      some: [
        "Es gibt was Neues.",
        "Ich hab neue Infos. Leider nicht übers Trockenfutter.",
        "Seit dem letzten Mal hat sich was geändert. Gut, dass du rechtzeitig zurück bist."
      ],
      none: [
        "Noch nichts. Manchmal lebt man einfach.",
        "Keine Neuigkeiten. Radek feilt wohl wieder an irgendwas.",
        "Alles beim Alten. Ich, die Seite und mein unstillbarer Hunger.",
        "Heute nichts Neues. Nicht mal im Napf."
      ],
      lead: "Seit deinem letzten Besuch:",
      clip: "ein neuer Clip ist erschienen: {t}",
      clips: ["", "{n} neue Clips sind erschienen, der neueste: {t}"],
      posts: ["{n} neuer Beitrag in den Neuigkeiten", "{n} neue Beiträge in den Neuigkeiten"],
      link: "Ansehen →"
    },
    admin: {
      hello: [
        "Hier ist noch einiges offen. Ich würd mit dem Einfachsten anfangen. Einer Essenspause zum Beispiel.",
        "Statusmeldung: Etwas braucht deine Aufmerksamkeit. Diesmal nicht mein Napf.",
        "Hier wartet Arbeit. Ich beaufsichtige sie. Aus bequemer Entfernung.",
        "{name}, hier ist die Übersicht, was zu tun ist.",
        "Hier ist die Aufgabenliste. Ich würd sie auf null kürzen, aber meine Pfoten reichen nicht."
      ],
      missing: ["Bei einigen Songs fehlen Angaben. Ich würd sie ergänzen, aber ich kann nicht mit der Pfote tippen."],
      clean: [
        "Alles erledigt. Du kannst dich der Musik widmen. Oder mir.",
        "Kontrolle fertig. Du hast dir eine Pause verdient. Ich hab meine schon."
      ],
      reports: ["{n} gemeldeter Kommentar wartet auf Prüfung", "{n} gemeldete Kommentare warten auf Prüfung"],
      clips: ["{n} Clip hat keinen Song ({t})", "{n} Clips haben keinen Song (neuester: {t})"],
      lyrics: ["{n} Song hat keinen Text", "{n} Songs haben keinen Text"],
      status: "Status der Seite", toReports: "Meldungen →", toLyrics: "Texteditor →"
    },
    surprise: {
      beatbox: "Bum tss, ka tss, bum bum tss!",
      dance: "Das lernt man normalerweise jahrelang.",
      dance2: "Hip-Hop hab ich im Blut. Und in den Pfoten.",
      dance3: "Platz da, ich geh auf die Tanzfläche.",
      robot: "Robotermodus an. Piep. Pup. Miau.",
      silly: "Keiner schaut? Bestens.",
      breakdance: "Katzen landen angeblich auf den Füßen. Ich zuerst auf dem Kopf.",
      flair: "Das schaff ich nur mit leerem Magen.",
      jump: "Solche Eleganz. Und nicht mal Applaus.",
      dive: "Gefangen! …Was hab ich eigentlich gefangen?",
      kick: "Tor! Wo ist der Ball? Egal, Tor.",
      cheer: "Hurra! Wen feiern wir? Mich natürlich.",
      clap: "Applaus für mich. Ich fang an.",
      fistPump: "Ja! Nächstes Level freigeschaltet.",
      laugh: "Sorry, mir ist gerade der Staubsauger eingefallen.",
      sing: "Singen kann ich auch. Die Nachbarn wissen das.",
      rap: "Mikro hab ich, Beat hab ich… und den Text vergessen. Katzengedächtnis.",
      typing: "Ich schreib Radek, er soll Katzenfutter kaufen. In Großbuchstaben.",
      stretchArms: "Moment. Ich muss alle Knochen sortieren.",
      neck: "Steifer Nacken, weil ich dich ständig anschaue.",
      lie: "Ende der Vorstellung. Gute Nacht.",
      thumbsUp: "Daumen hoch. Mehr gibt's nicht, ich bin ein Kater.",
      wave: "Servus. Pfote gegeben, Würde bewahrt.",
      nervous: "Was war das?! …Ach so. Nichts.",
      shrug: "Keine Ahnung. Und mir egal. Schönes Gefühl.",
      lookAround: "Ich hab was gehört. Wahrscheinlich meine eigenen Gedanken."
    }
  },
  uk: {
    ui: {
      call: "MC Кевін – натисни на мене", hide: "Сховати MC Кевіна", show: "Покликати MC Кевіна",
      sound: "Звук після натискання", fullLyrics: "Увесь текст →"
    },
    greet: {
      morning: [
        "Доброго ранку. Хто з нас двох сьогодні встав добровільно?",
        "Вже ранок? Я ще навіть не додивився сон.",
        "Хто рано встає, тому Бог дає. А я почекаю на сніданок.",
        "Доброго ранку. Кави ще не було, тож за свої думки не відповідаю.",
        "Ну, вперед у новий день. Або ляж ще. Я не засуджуватиму."
      ],
      day: [
        "Привіт. Озирнися, тут доволі гарно. Завдяки мені.",
        "Ласкаво просимо. Музика он там, захоплені погляди можна надсилати одразу мені.",
        "Привіт. Шукаєш щось цікаве? Спробуй Музику. Щось досконале? Ти якраз на це дивишся.",
        "Ласкаво просимо на сайт. Взуття знімати не треба. Лапи теж."
      ],
      evening: [
        "Добрий вечір. Ідеальний час увімкнути щось гарне.",
        "Вечір, спокій і музика. Бракує тільки повної миски.",
        "Ну що, увімкнемо трек чи просто посидимо, існуючи?",
        "Ласкаво просимо. У мене був важкий день. Спав лише шість годин.",
        "Вечірня програма починається. Головна зірка вже на місці."
      ],
      night: [
        "Теж не спиться? Це вже стає підозріло.",
        "Нічний візит. Або в тебе гарний смак, або збитий режим.",
        "Тсс. Усі сплять. Крім нас двох і холодильника.",
        "О цій порі стаються дивні речі. Наприклад, я досі тут сиджу.",
        "Ласкаво просимо в нічну зміну. Не оплачується, зате краєвид гарний."
      ],
      three: ["Третя година. Час гасати по квартирі як навіжений. Приєднаєшся?"]
    },
    first: [],
    back: {
      news: [
        "Ти повернувся(-лася). А тут тим часом дещо сталося.",
        "Поки тут нікого не було, сайт не завис. Майже диво.",
        "Маю для тебе новини. Цього разу не про мою миску.",
        "Дещо додалося. Я б сказав раніше, але мене ніхто не питав."
      ],
      plain: [
        "О, знайоме обличчя. Принаймні за історією відвідувань.",
        "Знову ти? Чудово. Хоч не треба пояснювати, де що.",
        "Продовжимо, де зупинилися. Якщо ти ще пам'ятаєш."
      ]
    },
    page: {
      home: [
        "Ось тут усе й починається. Пристойне місце, скажи?",
        "Не поспішай. Музика нікуди не втече. Я теж, на жаль.",
        "Озирнися. Радек називає це сайтом. Я — робочим місцем.",
        "Не знаєш, що увімкнути? Нічого страшного. Я теж іноді не знаю, що з собою робити.",
        "Якщо ти тут заради музики — ти в правильному місці. Якщо заради мене — у тебе чудове судження."
      ],
      music: [
        "Тут усе, що Скелі випустив у світ. Дещо навіть кілька разів.",
        "Обери трек. У мене вже є улюблені. Усі, де тиша.",
        "Увімкни щось. А якщо сподобається, можеш йому сказати. Йому цікаво.",
        "Стільки музики, а колискову мені досі ніхто не записав.",
        "Слухай сміливо гучно. За сусідів не відповідаю."
      ],
      lyrics: [
        "Ось слова, які Радек склав замість того, щоб спати.",
        "Деякі рядки з'явилися швидко. Інші так довго, що я встиг подрімати.",
        "Знайди свій улюблений рядок. Я шукаю улюблену подушку.",
        "Читай уважно. Може, знайдеш те, чого навіть автор не мав на увазі.",
        "Тексти тут. Співати їх тобі не буду. Маю гідність."
      ],
      song: [
        "Ось увесь текст. Співати можна, але за інтонацію не ручаюся.",
        "Цей я знаю майже напам'ять. Майже — ключове слово.",
        "Збільш текст через Aa. А я тим часом збільшу порцію.",
        "Обережно, деякі рядки можуть застрягти в голові. Зі мною вже так було.",
        "Прочитай до кінця. Автор зрадіє. А я зрадів би тунцю."
      ],
      about: [
        "Тут дізнаєшся дещо про Радека. Для мене тут, на жаль, мало місця.",
        "Музику робить сам. Сайт зробив сам. А миску мені досі наповнює хтось інший.",
        "Самоук, музикант, творець сайту. І людина, яка думає, що я люблю вставати.",
        "Я міг би щось про нього розповісти, але тоді він забере мені доступ до комп'ютера.",
        "Він доволі здібний. До такого кота, як я, звісно, не дотягує."
      ],
      news: [
        "Новини з перших лап. Тобто з перших рук.",
        "Тут дізнаєшся, що відбувається. Я зазвичай знаю все, але мені ніхто не вірить.",
        "Нові дописи, нова інформація. А в мене той самий сухий корм.",
        "Глянь, що нового. А потім скажи, чи вже час вечеряти."
      ],
      register: [
        "Новий акаунт? Добре. Тільки пам'ятай: ім'я кота — це не стратегія безпеки.",
        "Заповни, що треба. Я б зробив це за тебе, але лапи короткі.",
        "Ласкаво просимо до зареєстрованих. На тебе чекає велика відповідальність. Наприклад, не забути пароль.",
        "Надійний пароль, будь ласка. Не хочу, щоб сюди проліз якийсь чужий кіт."
      ],
      login: [
        "Заходь. Двері відчинені, але взуття не знімай.",
        "Не вдається увійти? Неприємно. Спробуймо без паніки.",
        "Забув(-ла) пароль? Знайоме. Я забуваю, навіщо прийшов у кімнату."
      ],
      loginBack: ["Знову тут? Скоро матимеш тут власну лежанку."],
      donate: [
        "Подобається, що тут робить Скелі? Тут можна допомогти, щоб він продовжував.",
        "Кожна підтримка важлива. Я б теж оцінив регулярні внески. У консервах.",
        "Музика не створюється сама. На відміну від мене у вільний день.",
        "Якщо хочеш підтримати нову музику — тобі сюди. Я не вмовлятиму. Майже."
      ],
      error: [
        "Тут нічого немає. І повір, я шукав.",
        "404. Сторінка кудись забрела. Коти так роблять постійно.",
        "Не вийшло. Спробуємо інший шлях?",
        "Порожньо. Майже як моя миска після сніданку.",
        "Сторінка зникла. Якби мій хвіст був детектором, я б її вже знайшов.",
        "Цю сторінку я скинув зі столу. З принципу."
      ]
    },
    tips: [
      "Подобається пісня? Постав їй ❤. Скелі це бачить. Я теж, але вдаю, що ні.",
      "Угорі можна перемкнути світлий і темний режим. Я золотий в обох.",
      "Увійди — і зможеш долучитися до коментарів. Чемно, будь ласка. Я дражнюся лише професійно.",
      "На сторінці пісні є Aa. Нарешті кнопка, яку я розумію без інструкції.",
      "Не знаєш, що слухати? Натисни на мене. Підберу щось під настрій. Твій настрій мене, щоправда, не цікавить, але спробую."
    ],
    idle: [
      "Плавно гортаєш. Майже як я, коли намагаюся не впасти зі столу.",
      "Та золота лапа вгорі? Це не кнопка годування. Я перевіряв.",
      "Натисни на мене. Я не кусаюся. Без причини.",
      "Лапи золоті. Кігті теж. Тільки рахунку за манікюр досі нема.",
      "У мене дев'ять життів. Вісім я проспав.",
      "Якби я отримував монетку за кожен клік, уже мав би власний консервний завод.",
      "Я тут роблю важливу роботу. Стежу, щоб ніхто не нудьгував.",
      "Якщо шукаєш мене — я тут. Якщо шукаєш сенс життя — спробуй Новини.",
      "Я виглядаю так, ніби щось знаю. Це основа успіху.",
      "Я міг би порадити. Але тоді ти звикнеш.",
      "На столі стоїть склянка. Поки що.",
      "Я сплю шістнадцять годин на добу. Решту часу дивлюся, як ти гортаєш.",
      "Коробка — найкращі меблі. Цей сайт ніколи цього не зрозуміє.",
      "Якби Скелі написав пісню про мене, вона стала б платиновою. І була б здебільшого про їжу.",
      "Та червона лазерна цятка… ні, нічого. Не будемо про це.",
      "Огірок за моєю спиною? Навіть не пробуй."
    ],
    mobile: ["На телефоні я менший. Его в мене таке саме велике."],
    sleep: [
      "Хррр… просто заплющую очі, щоб краще думати.",
      "Відпочинок — це важливо. Особливо коли не треба працювати.",
      "Якщо що — я не сплю. Просто ззовні так не виглядає.",
      "Режим енергозбереження. Лапи вимкнено.",
      "Тихо, будь ласка. Я саме нічого не роблю."
    ],
    wake: [
      "Що? Вже? Я ж тільки зручно вмостився.",
      "Я не спав. Я перевіряв внутрішній бік повік.",
      "Я тут. Просто на хвилинку вимкнув світ.",
      "Нарешті якась дія. Я вже мало не почав прибирати.",
      "З поверненням. Про що ми говорили? А, ні про що."
    ],
    pw: {
      weak: [
        "Такий пароль вгадала б навіть рибка.",
        "Спробуй щось, чого немає на першій сторінці твого щоденника.",
        "Додай жорсткості. Це не захистить навіть порожню миску.",
        "Твоєму паролю потрібне підкріплення. Поклич йому друга.",
        "Це пароль чи привітання для сусідів?"
      ],
      invalid: [
        "Пароль якось розбігся. Спробуй написати його без прикрас.",
        "Емодзі гарні, але лежанки ми їм тут не дамо.",
        "Сюди прокралося щось зайве. Спробуй ще раз.",
        "Пароль — не новорічна ялинка. Не все треба на нього вішати."
      ],
      mismatch: [
        "Два паролі, дві різні думки.",
        "Познайом їх. Поки що вони не дуже ладнають.",
        "Один із них живе власним життям.",
        "Так не сперечаються навіть два коти біля однієї миски."
      ],
      strong: [
        "Ось це вже виглядає багатообіцяюче. Респект.",
        "Гарно. Я б не вгадав навіть після третьої миски.",
        "Добра робота. Кіт безпеки схвалює.",
        "У цього є кігті. Саме так і має бути.",
        "Нарешті пароль, який не злякається."
      ],
      changed: [
        "Готово. Новий пароль, новий початок.",
        "Змінено. І мені навіть не довелося допомагати.",
        "Зроблено. Тепер головне — запам'ятай його."
      ]
    },
    profile: [
      "Нове фото? Тобі пасує. Майже як мені.",
      "Профіль оновлено. Я б у собі нічого не міняв. Нема чого.",
      "Фото збережено. У галереї на один шедевр більше.",
      "Ось, щоб тебе тут усі впізнавали. Я себе впізнаю навіть наосліп.",
      "Зміну зроблено. Тепер лишилося вигадати, що ще про себе розповіси."
    ],
    auth: {
      in: [
        "Привіт, знайоме обличчя. Заходь.",
        "Вхід виконано. Двері відчинені.",
        "Ти всередині. Почувайся як удома. Тільки не чіпай мою миску.",
        "Акаунт тебе впізнав. А я — за манерою клікати."
      ],
      fail: [
        "Не вийшло. Перевір дані.",
        "Щось не сходиться. І цього разу це не моя поза на дивані.",
        "Спробуй ще. Я нікуди не втечу.",
        "Доступ заборонено. Я тебе пустив, але в комп'ютера своя голова."
      ],
      out: [
        "До зустрічі. Я буду тут. Найімовірніше, спатиму.",
        "Вихід виконано. Не забудь, де ти мене залишив(-ла).",
        "Бувай. І наступного разу принось гарний настрій.",
        "Поки. Я тут ще трохи посиджу.",
        "Йдеш? Добре. Я все одно ще десять хвилин нявчатиму під дверима."
      ]
    },
    comment: {
      added: [
        "Коментар надіслано. Подивимося, що скажуть інші.",
        "І ось воно в світі. Слова мають власний шлях.",
        "Додано. Чемна дискусія краща за сварку через останню консерву.",
        "Готово. Тепер можеш удавати, що приходиш сюди лише читати.",
        "Моя думка? Я її висловлюю скинутим зі столу горнятком."
      ],
      deleted: [
        "Коментар зник. Прибирати за собою — це гарний тон.",
        "Готово. Цифровий слід трохи менший.",
        "І його нема. Іноді краще сказати менше."
      ]
    },
    heart: {
      on: [
        "Сердечко приземлилося. Хтось зрадіє.",
        "Цей трек зайшов, так?",
        "Гарний вибір. І я кажу це не лише тому, що тут живу.",
        "Якби в мене був великий палець, я б поставив лайк. У мене лапа. Отримуй лапу."
      ],
      off: [
        "Змінилася думка? Коти теж передумують.",
        "Сердечка нема. Світ крутиться далі.",
        "Музичні стосунки бувають складні. Знаю з життя з пилососом."
      ]
    },
    search: {
      found: [
        "Знайшов результати. Цього разу швидше, ніж ганятися за власним хвостом.",
        "Шукаємо. Я б почав із миски, але роби як знаєш."
      ],
      none: [
        "Нічого не знайшов. Спробуй інше слово.",
        "Нуль результатів. У такий момент я зазвичай іду на обід."
      ]
    },
    clip: {
      ok: [
        "Слухай. А я вдаватиму, що чую цей трек уперше.",
        "Поїхали. Вуха готові?",
        "Вибір схвалено. Подякуєш пізніше.",
        "Картинка йде, звук грає. Нарешті щось працює без моєї допомоги."
      ],
      fail: [
        "Щось застрягло. Спробуймо ще раз.",
        "У плеєра сьогодні свій настрій. Знайоме.",
        "Ні картинки, ні звуку? Це вже майже сучасне мистецтво.",
        "Зараз не вийшло. Спробуй інший кліп або повтори за хвилинку."
      ]
    },
    menu: { hint: "Що я можу для тебе зробити?", find: "Знайди пісню", play: "Увімкни щось", rap: "Зачитай", news: "Що нового?", fun: "Зроби щось", report: "Повідомити про проблему" },
    // "Nahlásit problém" (issue #28): the message goes to the admin (Hodnocení webu → Nahlášené problémy)
    report: {
      prompt: ["Щось тут не працює? Напиши мені що, я передам Скелі.","Немає відео, неправильний рядок, щось зламане? Розкажи, я все владнаю."],
      placeholder: "Що не так? (напр.: у пісні немає відео)",
      send: "Надіслати",
      thanks: ["Є. Передам Скелі, хай виправить.","Дякую! Я собі записав."],
      empty: "Напиши хоч кілька слів, щоб я знав, що шукати.",
      fail: "Зараз не вдалося надіслати. Спробуй трохи пізніше.",
      limit: "На зараз досить, спробуй знову за годину."
    },
    help: {
      say: ["Тут бракує шматка тексту (мова: {lang}). Розумієш? Внизу є для цього поле.", "Тут хтось читає реп, і ніхто не знає що. Мова: {lang}. Якщо розумієш, рятуй."],
      link: "Покажи"
    },
    life: {
      stretch: ["Потягнутися. Котяча йога.","Спина дугою. Профі."],
      knead: ["Мну лапками. Не знаю навіщо. Мушу.","Мішу тісто. З нічого."],
      look: ["Там щось зашаруділо?","Ти теж бачив? Ні? Ну й гаразд."],
      fly: ["Муха! …Втекла.","Майже впіймав. Майже."],
      neck: ["Хрусь. Одразу краще.","Болить шия після цілоденного сну."],
      startle: ["Що це було?! …А, мій хвіст.","Злякався власної тіні. Знову."],
      shrug: ["Я голодний? Я голодний.","Не знаю, що я тут роблю. Але роблю це добре."],
      dance: ["Ніхто не дивиться? Ну гаразд.","Цього кроку мене навчив Skeli. Бреше."],
      nap: ["Лише на секундочку заплющу очі…","Двадцятихвилинний сон. На три години."],
      bored: ["Нудно. Кинь мені клубочок.","Я б щось скинув зі столу, але в мене немає столу."]
    },
    find: {
      prompt: [
        "Що шукаєш? Назву, шматок тексту, будь-що. Тільки не проси заспівати.",
        "Напиши, що на думці. Я вдаватиму музичного архіваріуса.",
        "Ну, кажи. Шукати я вмію. Тільки без загадок."
      ],
      placeholder: "наприклад: тіло без душі",
      empty: ["Введи хоча б частину назви. Я не ясновидець."],
      found: [
        "Знайшов кількох кандидатів. Обирай.",
        "Ось, тримай. І мені навіть не довелося вставати.",
        "Результати готові. Моя робота тут закінчена. Поки що.",
        "Знайшов, що зміг. Решта за тобою."
      ],
      none: [
        "Нічого. Ані сліду. Спробуй інший вираз.",
        "Мені це ні про що не говорить. А я знаю майже все. Майже.",
        "Тут порожньо. Спробуй написати назву трохи інакше.",
        "Не знайшов. Може, шукаємо під неправильною назвою."
      ]
    },
    play: {
      intro: [
        "Увімкнути щось? Нарешті завдання, яке мені подобається.",
        "Гаразд. Сьогодні обираю я. Скарги приймаю у вигляді смаколиків.",
        "Підберу тобі трек. У мене є слух. Навіть два вуха."
      ],
      pick: [
        "Вмикаю: {t}. Це може зайти.",
        "Сьогоднішній вибір: {t}. Якість схвалено котом.",
        "Спробуймо {t}. Як що, вдаватимемо, що нічого не було.",
        "Випадковий вибір: {t}. У випадку сьогодні гарний смак."
      ],
      close: "Закрити плеєр", song: "Текст і більше →"
    },
    rap: {
      intro: [
        "Хочеш бари? Слухай. Я текст написав… тобто прочитав. (Чеською.)",
        "Готовий(-а)? Це робота моєї людини.",
        "Пані та панове, лапи вгору. Іде поезія.",
        "Гаразд. Сьогодні я репер. Радек не повинен про це дізнатися.",
        "Увага, далі шматок, який ти наспівуватимеш ще завтра."
      ],
      fail: [
        "Сьогодні нічого. Текст кудись забрів.",
        "Архів мовчить. Як я, коли чую пилосос.",
        "Жодних барів. Сьогодні вихідний.",
        "Текст недоступний. Доведеться трохи пожити без поезії."
      ]
    },
    news: {
      first: [
        "Уперше тут? Тоді ласкаво просимо. Почни з Музики.",
        "Новини? Для тебе, мабуть, усе. Я тут уже знаю кожен куток.",
        "Почни з того, що тобі цікаво. Я б почав з їжі, але її тут нема."
      ],
      some: [
        "Дещо додалося.",
        "Маю нову інформацію. Не про сухий корм, на жаль.",
        "Відтоді дещо змінилося. Добре, що ти вчасно повернувся(-лася)."
      ],
      none: [
        "Поки нічого. Іноді просто живеш.",
        "Жодних новин. Радек, мабуть, знову щось доводить до ладу.",
        "Усе по-старому. Я, сайт і моя невгамовна потреба в їжі.",
        "Сьогодні нічого нового не вродило. Навіть у мисці."
      ],
      lead: "Від твого минулого візиту:",
      clip: "вийшов кліп {t}",
      clips: ["", "вийшло нових кліпів: {n}, найновіший {t}"],
      posts: ["новий допис у Новинах: {n}", "нових дописів у Новинах: {n}"],
      link: "Глянути →"
    },
    admin: {
      hello: [
        "Тут є кілька недоробок. Я б почав із найпростішого. Наприклад, з перерви на їжу.",
        "Доповідаю: дещо потребує твоєї уваги. Цього разу не моя миска.",
        "Тут чекають справи. Я за ними наглядаю. З комфортної відстані.",
        "{name}, ось огляд того, що треба вирішити.",
        "Ось список завдань. Я б скоротив його до нуля, але лап не вистачає."
      ],
      missing: ["Деяким пісням бракує даних. Я б доповнив, але не вмію писати лапою."],
      clean: [
        "Усе вирішено. Можеш займатися музикою. Або мною.",
        "Перевірку завершено. Ти заслуговуєш на перерву. У мене вона вже є."
      ],
      reports: ["скарг на коментарі чекає на перевірку: {n}", "скарг на коментарі чекає на перевірку: {n}"],
      clips: ["кліпів без пісні: {n} ({t})", "кліпів без пісні: {n} (найновіший: {t})"],
      lyrics: ["пісень без тексту: {n}", "пісень без тексту: {n}"],
      status: "Стан сайту", toReports: "Скарги →", toLyrics: "Редактор текстів →"
    },
    surprise: {
      beatbox: "Бум тсс, ка тсс, бум бум тсс!",
      dance: "Такого зазвичай вчаться роками.",
      dance2: "Хіп-хоп у мене в крові. І в лапах.",
      dance3: "Посунься, я йду на танцпол.",
      robot: "Режим робота ввімкнено. Біп. Буп. Няв.",
      silly: "Ніхто не дивиться? Чудово.",
      breakdance: "Кажуть, коти падають на лапи. Я спершу на голову.",
      flair: "Таке можу тільки на голодний шлунок.",
      jump: "Яка елегантність. І навіть без оплесків.",
      dive: "Спіймав! …А що я, власне, ловив?",
      kick: "Гол! Де м'яч? Неважливо, гол.",
      cheer: "Ура! За кого вболіваємо? За мене, звісно.",
      clap: "Оплески мені. Можу почати сам.",
      fistPump: "Так! Новий рівень відкрито.",
      laugh: "Вибач, згадав пилосос.",
      sing: "Я теж умію співати. Сусіди знають.",
      rap: "Мікрофон є, біт є… а текст я забув. Котяча пам’ять.",
      typing: "Пишу Радекові, щоб купив корм. Великими літерами.",
      stretchArms: "Хвилинку. Мушу розкласти всі кістки по місцях.",
      neck: "Шия затерпла, бо весь час дивлюся на тебе.",
      lie: "Виставу завершено. На добраніч.",
      thumbsUp: "Великий палець угору. Більше не дам, я кіт.",
      wave: "Привіт. Лапу подано, гідність збережено.",
      nervous: "Що це було?! …А. Нічого.",
      shrug: "Не знаю. І мені байдуже. Чудове відчуття.",
      lookAround: "Я щось почув. Мабуть, власні думки."
    }
  },
  vi: {
    ui: {
      call: "MC Kevin – bấm vào tôi", hide: "Ẩn MC Kevin", show: "Gọi MC Kevin",
      sound: "Âm thanh khi bấm", fullLyrics: "Toàn bộ lời →"
    },
    greet: {
      morning: [
        "Chào buổi sáng. Hôm nay ai trong hai ta dậy tự nguyện thế?",
        "Sáng rồi à? Tôi còn chưa mơ xong.",
        "Chim dậy sớm thì bắt được sâu. Tôi thì chờ bữa sáng.",
        "Chào buổi sáng. Chưa có cà phê, nên hôm nay tôi không chịu trách nhiệm về ý kiến của mình.",
        "Nào, bắt đầu ngày mới. Hoặc nằm thêm chút nữa. Tôi không phán xét đâu."
      ],
      day: [
        "Chào. Nhìn quanh đi, ở đây khá đẹp. Nhờ tôi đấy.",
        "Chào mừng. Nhạc ở đằng kia, ánh mắt ngưỡng mộ thì gửi thẳng cho tôi.",
        "Chào. Tìm gì đó thú vị thì thử mục Nhạc. Tìm gì đó hoàn hảo thì bạn đang nhìn nó đấy.",
        "Chào mừng đến với trang web. Không cần cởi giày. Cả chân mèo cũng không."
      ],
      evening: [
        "Chào buổi tối. Đúng lúc để bật gì đó hay hay.",
        "Buổi tối, yên tĩnh và âm nhạc. Chỉ thiếu một bát đầy.",
        "Sao, nghe một bài nhé, hay chỉ ngồi đây tồn tại?",
        "Chào mừng. Tôi vừa qua một ngày vất vả. Chỉ ngủ được sáu tiếng.",
        "Chương trình buổi tối bắt đầu. Ngôi sao chính đã ngồi sẵn."
      ],
      night: [
        "Bạn cũng không ngủ được à? Bắt đầu đáng ngờ rồi đấy.",
        "Khách ghé đêm. Hoặc bạn có gu tốt, hoặc giờ giấc lộn xộn.",
        "Suỵt. Mọi người ngủ cả rồi. Trừ hai ta và cái tủ lạnh.",
        "Giờ này hay có chuyện lạ. Ví dụ tôi vẫn còn ngồi đây.",
        "Chào mừng đến ca đêm. Không có lương, nhưng cảnh đẹp."
      ],
      three: ["Ba giờ sáng. Đến giờ chạy khắp nhà như điên. Tham gia không?"]
    },
    first: [],
    back: {
      news: [
        "Bạn quay lại rồi. Và trong lúc đó có chuyện xảy ra.",
        "Trong lúc không ai ở đây, trang web không bị treo. Gần như phép màu.",
        "Tôi có tin mới cho bạn. Lần này không phải về bát ăn của tôi.",
        "Có thứ mới đấy. Tôi định nói sớm hơn, nhưng chẳng ai hỏi tôi."
      ],
      plain: [
        "À, gương mặt quen. Ít nhất là theo lịch sử truy cập.",
        "Lại là bạn à? Tuyệt. Đỡ phải giải thích cái gì ở đâu.",
        "Tiếp tục từ chỗ ta dừng lại nhé. Nếu bạn còn nhớ."
      ]
    },
    page: {
      home: [
        "Mọi thứ bắt đầu từ đây. Chỗ cũng ra gì đấy chứ?",
        "Đừng vội. Âm nhạc không chạy đi đâu. Tôi cũng vậy, tiếc thay.",
        "Nhìn quanh đi. Radek gọi đây là trang web. Tôi gọi là chỗ làm.",
        "Không biết bật gì à? Không sao. Thỉnh thoảng tôi cũng chẳng biết làm gì với bản thân.",
        "Nếu bạn đến vì âm nhạc, bạn đến đúng chỗ. Nếu đến vì tôi, bạn có óc phán đoán tuyệt vời."
      ],
      music: [
        "Đây là tất cả những gì Skeli đã tung ra thế giới. Có bài còn nhiều lần.",
        "Chọn một bài đi. Tôi có bài yêu thích rồi. Tất cả những bài có sự im lặng.",
        "Bật gì đó đi. Nếu thích thì nói với anh ấy. Anh ấy tò mò lắm.",
        "Bao nhiêu là nhạc mà vẫn chưa ai thu cho tôi một bài ru.",
        "Cứ nghe to thoải mái. Tôi không chịu trách nhiệm về hàng xóm."
      ],
      lyrics: [
        "Đây là những lời Radek ghép lại thay vì đi ngủ.",
        "Có câu viết nhanh. Có câu lâu đến mức tôi kịp chợp mắt.",
        "Tìm câu bạn thích nhất đi. Tôi đang tìm cái gối yêu thích.",
        "Đọc kỹ nhé. Biết đâu bạn tìm ra điều mà cả tác giả cũng không định nói.",
        "Lời bài hát ở đây. Tôi sẽ không hát cho bạn đâu. Tôi có lòng tự trọng."
      ],
      song: [
        "Đây là toàn bộ lời. Hát theo cũng được, nhưng tôi không bảo đảm cao độ.",
        "Bài này tôi gần như thuộc lòng. Gần như là từ quan trọng.",
        "Phóng to chữ bằng Aa nhé. Trong lúc đó tôi phóng to khẩu phần.",
        "Cẩn thận, vài câu có thể mắc kẹt trong đầu. Tôi bị rồi đấy.",
        "Đọc hết đi. Tác giả sẽ vui. Còn tôi sẽ vui với cá ngừ."
      ],
      about: [
        "Ở đây bạn sẽ biết đôi điều về Radek. Tiếc là chẳng còn mấy chỗ cho tôi.",
        "Nhạc tự làm. Web cũng tự làm. Nhưng bát của tôi vẫn do người khác đổ đầy.",
        "Tự học, nhạc sĩ, người làm web. Và là người nghĩ rằng tôi thích dậy sớm.",
        "Tôi có thể tiết lộ đôi điều về anh ấy, nhưng rồi anh ấy sẽ cấm tôi dùng máy tính.",
        "Anh ấy khá giỏi. Tất nhiên không bằng một con mèo như tôi."
      ],
      news: [
        "Tin tức từ chân mèo đầu tiên. À, từ nguồn đầu tiên.",
        "Ở đây bạn biết chuyện gì đang diễn ra. Tôi thường biết hết, nhưng chẳng ai tin.",
        "Bài mới, thông tin mới. Tôi thì vẫn hạt khô cũ.",
        "Xem có gì mới đi. Rồi bảo tôi đã đến giờ ăn tối chưa."
      ],
      register: [
        "Tài khoản mới à? Được. Chỉ nhớ rằng tên con mèo không phải là chiến lược bảo mật.",
        "Điền những gì cần thiết. Tôi định làm hộ, nhưng chân tôi ngắn quá.",
        "Chào mừng gia nhập hội đã đăng ký. Trách nhiệm lớn đang chờ. Ví dụ đừng quên mật khẩu.",
        "Làm ơn đặt mật khẩu mạnh. Tôi không muốn mèo lạ nào lọt vào đây."
      ],
      login: [
        "Vào đi. Cửa mở rồi, cứ đi giày.",
        "Không đăng nhập được à? Khó chịu thật. Thử lại mà đừng hoảng.",
        "Quên mật khẩu à? Tôi hiểu. Tôi cũng hay quên vì sao mình vào phòng."
      ],
      loginBack: ["Lại về rồi à? Sắp có ổ riêng ở đây đấy."],
      donate: [
        "Thích những gì Skeli làm ở đây? Ở đây bạn có thể giúp anh ấy tiếp tục.",
        "Mọi sự ủng hộ đều quý. Tôi cũng muốn được đóng góp đều đặn. Bằng đồ hộp.",
        "Âm nhạc không tự sinh ra. Không như tôi vào buổi chiều rảnh rỗi.",
        "Nếu muốn ủng hộ thêm nhạc mới, đường ở đây. Tôi sẽ không thuyết phục đâu. Không nhiều."
      ],
      error: [
        "Ở đây chẳng có gì. Tin tôi đi, tôi tìm rồi.",
        "404. Trang này đi lạc đâu mất. Mèo làm thế suốt.",
        "Không được rồi. Thử đường khác nhé?",
        "Trống trơn. Gần giống bát của tôi sau bữa sáng.",
        "Trang biến mất rồi. Nếu đuôi tôi là máy dò, tôi đã tìm ra nó rồi.",
        "Tôi đã gạt trang này khỏi bàn. Vì nguyên tắc."
      ]
    },
    tips: [
      "Thích bài nào à? Thả ❤ cho nó. Skeli thấy đấy. Tôi cũng thấy, nhưng giả vờ không.",
      "Ở trên cùng có thể đổi chế độ sáng và tối. Tôi vàng óng ở cả hai.",
      "Đăng nhập là tham gia bình luận được. Lịch sự nhé. Tôi chỉ châm chọc chuyên nghiệp thôi.",
      "Ở trang bài hát có Aa. Cuối cùng cũng có nút tôi hiểu mà không cần hướng dẫn.",
      "Không biết nghe gì? Bấm vào tôi. Tôi sẽ chọn theo tâm trạng. Tâm trạng của bạn thì tôi không quan tâm, nhưng tôi sẽ thử."
    ],
    idle: [
      "Cuộn mượt đấy. Gần như tôi lúc cố không rơi khỏi bàn.",
      "Cái chân vàng ở trên ấy à? Không phải nút cho ăn đâu. Tôi thử rồi.",
      "Bấm vào tôi đi. Tôi không cắn. Khi không có lý do.",
      "Chân vàng. Móng cũng vàng. Chỉ có hóa đơn làm móng là chưa thấy đâu.",
      "Tôi có chín mạng. Tám mạng tôi ngủ hết rồi.",
      "Nếu mỗi cú bấm được một đồng, tôi đã có xưởng đồ hộp riêng.",
      "Tôi làm việc quan trọng ở đây. Đảm bảo không ai thấy chán.",
      "Nếu tìm tôi thì tôi ở đây. Nếu tìm ý nghĩa cuộc sống thì thử mục Tin tức.",
      "Trông tôi như biết điều gì đó. Đó là bí quyết thành công.",
      "Tôi có thể khuyên bạn. Nhưng rồi bạn sẽ quen.",
      "Trên bàn có một cái ly. Tạm thời thôi.",
      "Tôi ngủ mười sáu tiếng mỗi ngày. Thời gian còn lại tôi xem bạn cuộn trang.",
      "Thùng các-tông là đồ nội thất tốt nhất. Trang web này sẽ không bao giờ hiểu.",
      "Nếu Skeli viết bài về tôi, nó sẽ đạt bạch kim. Và chủ yếu về đồ ăn.",
      "Cái chấm laser đỏ ấy… thôi, không có gì. Đừng nhắc nữa.",
      "Quả dưa chuột sau lưng tôi? Đừng hòng."
    ],
    mobile: ["Trên điện thoại tôi nhỏ hơn. Cái tôi thì vẫn to như cũ."],
    sleep: [
      "Khò… chỉ nhắm mắt để suy nghĩ tốt hơn.",
      "Nghỉ ngơi là quan trọng. Nhất là khi không phải làm việc.",
      "Có gì thì tôi vẫn thức. Chỉ là nhìn bên ngoài không giống thôi.",
      "Chế độ tiết kiệm năng lượng. Chân đã tắt.",
      "Làm ơn yên lặng. Tôi đang không làm gì cả."
    ],
    wake: [
      "Hả? Rồi à? Tôi vừa mới nằm thoải mái.",
      "Tôi không ngủ. Tôi kiểm tra mặt trong mí mắt.",
      "Tôi đây. Chỉ tắt thế giới một lát thôi.",
      "Cuối cùng cũng có chuyện. Suýt nữa tôi bắt đầu dọn dẹp.",
      "Chào mừng trở lại. Ta đang nói gì nhỉ? À, chẳng gì cả."
    ],
    pw: {
      weak: [
        "Mật khẩu này đến con cá cũng đoán được.",
        "Thử thứ gì không nằm ở trang đầu nhật ký của bạn.",
        "Cứng rắn hơn chút. Cái này không bảo vệ nổi cả bát rỗng.",
        "Mật khẩu của bạn cần tiếp viện. Gọi thêm bạn cho nó đi.",
        "Đây là mật khẩu hay lời chào hàng xóm?"
      ],
      invalid: [
        "Mật khẩu chạy lung tung rồi. Thử gõ lại không trang trí.",
        "Emoji thì dễ thương, nhưng ở đây không có ổ cho chúng.",
        "Có gì đó lẻn vào thừa. Thử lại lần nữa.",
        "Mật khẩu không phải cây thông Noel. Không cần treo đủ thứ."
      ],
      mismatch: [
        "Hai mật khẩu, hai ý kiến khác nhau.",
        "Giới thiệu chúng với nhau đi. Chúng chưa hợp nhau lắm.",
        "Một trong hai đang sống cuộc đời riêng.",
        "Đến hai con mèo bên một cái bát còn hợp nhau hơn."
      ],
      strong: [
        "Cái này trông hứa hẹn đấy. Nể.",
        "Hay. Ăn hết ba bát tôi cũng không đoán ra.",
        "Làm tốt lắm. Mèo bảo mật phê duyệt.",
        "Cái này có móng vuốt. Đúng như phải thế.",
        "Cuối cùng cũng có mật khẩu không biết sợ."
      ],
      changed: [
        "Xong. Mật khẩu mới, khởi đầu mới.",
        "Đã đổi. Mà tôi còn chẳng phải giúp.",
        "Xong xuôi. Giờ nhớ lấy nó nhé."
      ]
    },
    profile: [
      "Ảnh mới à? Hợp với bạn đấy. Gần bằng tôi.",
      "Đã cập nhật hồ sơ. Tôi thì chẳng đổi gì ở mình. Không có gì để đổi.",
      "Đã lưu ảnh. Bộ sưu tập thêm một kiệt tác.",
      "Thế, để mọi người ở đây nhận ra bạn. Tôi nhắm mắt cũng nhận ra mình.",
      "Đổi xong rồi. Giờ nghĩ xem còn tiết lộ gì về bản thân nữa."
    ],
    auth: {
      in: [
        "Chào, gương mặt quen. Vào đi.",
        "Đăng nhập thành công. Cửa mở rồi.",
        "Bạn vào rồi. Cứ tự nhiên như ở nhà. Chỉ đừng đụng vào bát của tôi.",
        "Tài khoản nhận ra bạn. Tôi nhận ra qua cách bạn bấm."
      ],
      fail: [
        "Không được rồi. Kiểm tra lại thông tin nhé.",
        "Có gì đó không khớp. Lần này không phải tư thế nằm của tôi trên sofa.",
        "Thử lại đi. Tôi không chạy đâu.",
        "Truy cập bị từ chối. Tôi cho bạn vào rồi, nhưng máy tính có ý riêng."
      ],
      out: [
        "Hẹn gặp lại. Tôi sẽ ở đây. Chắc là đang ngủ.",
        "Đã đăng xuất. Đừng quên bạn để tôi ở đâu.",
        "Bảo trọng. Lần sau mang theo tâm trạng tốt nhé.",
        "Tạm biệt. Tôi ngồi đây thêm chút nữa.",
        "Đi à? Được thôi. Dù sao tôi cũng sẽ kêu meo ở cửa mười phút."
      ]
    },
    comment: {
      added: [
        "Đã gửi bình luận. Xem mọi người nói gì nào.",
        "Nó ra ngoài rồi. Lời nói có đường đi riêng.",
        "Đã thêm. Thảo luận lịch sự hay hơn cãi nhau vì hộp cuối cùng.",
        "Xong. Giờ bạn có thể giả vờ chỉ đến đây để đọc.",
        "Ý kiến của tôi? Tôi thể hiện bằng cách gạt cái cốc khỏi bàn."
      ],
      deleted: [
        "Bình luận đã biến mất. Tự dọn dẹp là lịch sự.",
        "Xong. Dấu chân số nhỏ đi một chút.",
        "Và nó đi rồi. Đôi khi nói ít là tốt nhất."
      ]
    },
    heart: {
      on: [
        "Trái tim đã hạ cánh. Ai đó sẽ vui lắm.",
        "Bài này hợp với bạn nhỉ?",
        "Lựa chọn tốt. Và tôi không nói vậy chỉ vì tôi sống ở đây.",
        "Nếu có ngón cái, tôi đã bấm like. Tôi có chân mèo. Bạn nhận chân mèo."
      ],
      off: [
        "Đổi ý rồi à? Mèo cũng đổi ý mà.",
        "Trái tim đi rồi. Thế giới vẫn quay.",
        "Quan hệ âm nhạc thường phức tạp. Tôi biết, tôi sống chung với máy hút bụi."
      ]
    },
    search: {
      found: [
        "Tìm thấy kết quả rồi. Lần này nhanh hơn đuổi theo đuôi mình.",
        "Đang tìm. Tôi sẽ bắt đầu từ cái bát, nhưng tùy bạn."
      ],
      none: [
        "Không tìm thấy gì. Thử từ khác đi.",
        "Không có kết quả. Đây là lúc tôi thường đi ăn trưa."
      ]
    },
    clip: {
      ok: [
        "Nghe đi. Tôi sẽ giả vờ nghe bài này lần đầu.",
        "Bắt đầu nào. Tai sẵn sàng chưa?",
        "Lựa chọn được duyệt. Cảm ơn tôi sau nhé.",
        "Hình chạy, tiếng phát. Cuối cùng cũng có thứ chạy được mà không cần tôi."
      ],
      fail: [
        "Có gì đó bị kẹt. Thử lại nhé.",
        "Trình phát hôm nay có tâm trạng riêng. Tôi hiểu mà.",
        "Không hình không tiếng? Gần như nghệ thuật đương đại rồi.",
        "Lần này không được. Thử clip khác hoặc lát nữa thử lại."
      ]
    },
    menu: { hint: "Tôi có thể làm gì cho bạn?", find: "Tìm bài hát", play: "Bật gì đó", rap: "Rap đi", news: "Có gì mới?", fun: "Làm gì đi", report: "Báo lỗi" },
    // "Nahlásit problém" (issue #28): the message goes to the admin (Hodnocení webu → Nahlášené problémy)
    report: {
      prompt: ["Có gì không hoạt động à? Nói tôi biết, tôi sẽ chuyển cho Skeli.","Thiếu video, sai lời, có gì hỏng? Kể đi, tôi lo."],
      placeholder: "Có gì sai? (vd: bài hát không có video)",
      send: "Gửi",
      thanks: ["Rồi. Tôi sẽ chuyển cho Skeli sửa.","Cảm ơn! Tôi ghi lại rồi."],
      empty: "Viết vài chữ để tôi biết cần tìm gì.",
      fail: "Giờ chưa gửi được. Thử lại sau chút nhé.",
      limit: "Thế là đủ rồi, thử lại sau một giờ nhé."
    },
    help: {
      say: ["Bài này thiếu một đoạn lời. Bạn biết {lang} không? Bên dưới có ô để viết.", "Có người rap ở đây mà chẳng ai biết họ nói gì. Nếu bạn biết {lang}, cứu chúng tôi với."],
      link: "Chỉ cho tôi"
    },
    life: {
      stretch: ["Vươn vai. Yoga của mèo.","Cong lưng. Chuyên nghiệp."],
      knead: ["Đang nhào. Không biết tại sao. Phải làm.","Đang nhào bột. Từ không khí."],
      look: ["Có gì đó sột soạt đằng kia à?","Bạn cũng thấy à? Không? Thôi kệ."],
      fly: ["Con ruồi! …Bay mất rồi.","Suýt bắt được. Suýt thôi."],
      neck: ["Rắc. Đỡ hẳn.","Đau cổ vì ngủ cả ngày."],
      startle: ["Cái gì thế?! …À, đuôi của tôi.","Lại giật mình vì cái bóng của mình."],
      shrug: ["Tôi đói à? Tôi đói.","Không biết tôi làm gì ở đây. Nhưng tôi làm giỏi."],
      dance: ["Không ai nhìn à? Được thôi.","Bước này Skeli dạy tôi. Anh ấy nói dối."],
      nap: ["Chỉ nhắm mắt một giây thôi…","Ngủ trưa hai mươi phút. Trong ba tiếng."],
      bored: ["Chán quá. Ném cho tôi cuộn len.","Tôi sẽ hất gì đó khỏi bàn, nhưng tôi không có bàn."]
    },
    find: {
      prompt: [
        "Bạn tìm gì? Tên bài, một đoạn lời, gì cũng được. Chỉ đừng bắt tôi hát.",
        "Viết điều bạn nghĩ. Tôi sẽ giả làm người lưu trữ âm nhạc.",
        "Nói đi. Tìm thì tôi giỏi. Chỉ đừng đố tôi."
      ],
      placeholder: "ví dụ: thân xác không linh hồn",
      empty: ["Gõ ít nhất một phần tên bài. Tôi không phải thầy bói."],
      found: [
        "Tôi tìm được vài ứng viên. Giờ bạn chọn đi.",
        "Đây này. Mà tôi còn chẳng phải đứng dậy.",
        "Kết quả đây. Việc của tôi xong rồi. Tạm thời.",
        "Tôi tìm được những gì có thể. Phần còn lại là của bạn."
      ],
      none: [
        "Không có gì. Không một dấu vết. Thử từ khác đi.",
        "Cái này tôi chẳng biết. Mà tôi biết gần hết đấy. Gần hết.",
        "Ở đây trống trơn. Thử gõ tên bài hơi khác đi.",
        "Không tìm thấy. Có khi ta tìm sai tên."
      ]
    },
    play: {
      intro: [
        "Muốn bật gì à? Cuối cùng cũng có việc tôi thích.",
        "Được. Hôm nay tôi chọn. Khiếu nại xin gửi bằng đồ ăn vặt.",
        "Tôi sẽ chọn cho bạn một bài. Tôi có tai nghe nhạc. Hai cái hẳn hoi."
      ],
      pick: [
        "Đang phát: {t}. Chắc sẽ hợp.",
        "Lựa chọn hôm nay: {t}. Chất lượng do mèo duyệt.",
        "Thử {t} nhé. Không hay thì ta giả vờ chưa có gì xảy ra.",
        "Chọn ngẫu nhiên: {t}. Hôm nay may mắn có gu đấy."
      ],
      close: "Đóng trình phát", song: "Lời và hơn nữa →"
    },
    rap: {
      intro: [
        "Muốn nghe rap? Nghe này. Tôi viết lời… à, đọc lời. (Bằng tiếng Séc.)",
        "Sẵn sàng chưa? Đây là tác phẩm của người nhà tôi.",
        "Thưa quý vị, giơ chân lên. Thơ đến rồi.",
        "Được rồi. Hôm nay tôi làm rapper. Không được để Radek biết.",
        "Chú ý, sau đây là đoạn mà mai bạn vẫn còn ngân nga."
      ],
      fail: [
        "Hôm nay không có gì. Lời bài đi lạc đâu rồi.",
        "Kho lưu trữ im lặng. Như tôi khi nghe máy hút bụi.",
        "Không rap. Hôm nay là ngày nghỉ.",
        "Lời bài không có sẵn. Ta phải sống thiếu thơ một lúc."
      ]
    },
    news: {
      first: [
        "Lần đầu à? Vậy chào mừng. Bắt đầu với mục Nhạc nhé.",
        "Tin mới à? Với bạn chắc là tất cả. Tôi thì thuộc từng góc rồi.",
        "Bắt đầu từ thứ bạn quan tâm. Tôi sẽ bắt đầu từ đồ ăn, nhưng ở đây không có."
      ],
      some: [
        "Có thứ mới đấy.",
        "Tôi có thông tin mới. Tiếc là không phải về hạt khô.",
        "Từ lần trước đã có thay đổi. May mà bạn về kịp."
      ],
      none: [
        "Chưa có gì. Đôi khi chỉ là sống thôi.",
        "Không có tin mới. Chắc Radek lại đang chỉnh gì đó.",
        "Mọi thứ như cũ. Tôi, trang web và cơn đói bất tận của tôi.",
        "Hôm nay chẳng có gì mới. Kể cả trong bát."
      ],
      lead: "Từ lần ghé trước của bạn:",
      clip: "có clip mới {t}",
      clips: ["", "có {n} clip mới, mới nhất là {t}"],
      posts: ["{n} bài mới trong Tin tức", "{n} bài mới trong Tin tức"],
      link: "Xem →"
    },
    admin: {
      hello: [
        "Còn vài việc dang dở. Tôi sẽ bắt đầu với việc dễ nhất. Ví dụ nghỉ ăn.",
        "Báo cáo: có việc cần bạn chú ý. Lần này không phải bát của tôi.",
        "Có việc đang chờ xử lý. Tôi giám sát. Từ khoảng cách thoải mái.",
        "{name}, đây là danh sách những việc cần giải quyết.",
        "Đây là danh sách việc. Tôi muốn rút về không, nhưng chân không đủ dài."
      ],
      missing: ["Vài bài hát còn thiếu thông tin. Tôi định điền, nhưng không gõ được bằng chân."],
      clean: [
        "Mọi thứ đã xong. Bạn có thể lo âm nhạc. Hoặc lo cho tôi.",
        "Kiểm tra xong. Bạn xứng đáng được nghỉ. Tôi nghỉ rồi."
      ],
      reports: ["{n} bình luận bị báo cáo đang chờ kiểm tra", "{n} bình luận bị báo cáo đang chờ kiểm tra"],
      clips: ["{n} clip chưa có bài ({t})", "{n} clip chưa có bài (mới nhất: {t})"],
      lyrics: ["{n} bài chưa có lời", "{n} bài chưa có lời"],
      status: "Tình trạng trang", toReports: "Báo cáo →", toLyrics: "Sửa lời bài →"
    },
    surprise: {
      beatbox: "Bùm tss, ka tss, bùm bùm tss!",
      dance: "Cái này bình thường phải học mấy năm.",
      dance2: "Hip hop chảy trong máu tôi. Và trong chân.",
      dance3: "Tránh ra, tôi lên sàn nhảy đây.",
      robot: "Bật chế độ robot. Bíp. Búp. Meo.",
      silly: "Không ai nhìn à? Tuyệt.",
      breakdance: "Người ta bảo mèo rơi bằng chân. Tôi thì bằng đầu trước.",
      flair: "Cái này tôi chỉ làm được khi bụng đói.",
      jump: "Thanh lịch thế này. Mà chẳng ai vỗ tay.",
      dive: "Bắt được rồi! …Mà tôi bắt cái gì nhỉ?",
      kick: "Vào! Bóng đâu? Kệ, vẫn vào.",
      cheer: "Hoan hô! Cổ vũ ai thế? Tất nhiên là tôi.",
      clap: "Vỗ tay cho tôi. Tôi tự bắt đầu cũng được.",
      fistPump: "Yeah! Mở khóa cấp độ mới.",
      laugh: "Xin lỗi, tôi vừa nhớ ra cái máy hút bụi.",
      sing: "Tôi cũng biết hát. Hàng xóm biết rõ.",
      rap: "Có mic, có beat… mà quên mất lời. Trí nhớ mèo.",
      typing: "Đang nhắn Radek mua đồ ăn cho mèo. Viết hoa hết.",
      stretchArms: "Chờ chút. Phải sắp xếp lại hết xương đã.",
      neck: "Cứng cổ vì cứ nhìn bạn suốt.",
      lie: "Kết thúc buổi diễn. Chúc ngủ ngon.",
      thumbsUp: "Giơ ngón cái. Chỉ thế thôi, tôi là mèo.",
      wave: "Chào. Đưa chân rồi, giữ được phong độ.",
      nervous: "Cái gì thế?! …À. Không có gì.",
      shrug: "Không biết. Và cũng chẳng quan tâm. Cảm giác tuyệt.",
      lookAround: "Tôi nghe thấy gì đó. Chắc là suy nghĩ của mình."
    }
  }
};

// Lines from the earlier "personality bible" (work/kevin-napady.md, 2026-10-08), added to the lists above.
// New keys: auth.welcome (just signed up), songs (by YouTube id: a song he remembers), clicks (5, 10 and
// 20 clicks in a row), surprise.rhyme. {time} = the time now.
(function (more) {
  function merge(to, from) {
    Object.keys(from).forEach(function (k) {
      var v = from[k];
      if (Array.isArray(v)) to[k] = (to[k] || []).concat(v);
      else if (v && typeof v === 'object') merge(to[k] = to[k] || {}, v);
      else to[k] = v;
    });
  }
  Object.keys(more).forEach(function (lang) { merge(window.KEVIN_LINES[lang], more[lang]); });
})({
  cs: {
    first: ["Nazdar. Já jsem Kevin. Skeliho kocour, hlavní odborník na všechno a neplacený zaměstnanec tohohle webu."],
    greet: {
      morning: ["Dobré ráno. Proč jsi vzhůru?"],
      three: ["{time}. Ty nespíš? Já taky ne.", "Radek tvrdí, že v tuhle dobu vznikají nejlepší texty. Já tvrdím, že nejlepší spánek."]
    },
    page: {
      music: ["Tady si můžeš pustit Skeliho. A jestli se ti to nelíbí, problém je samozřejmě v tobě."],
      lyrics: ["Některý dávají smysl. Některý vznikly ve tři ráno. Hodně štěstí."],
      song: ["Skeli tvrdí, že tenhle track je dobrej. Já jsem kočka. Já hudbu neposuzuju."],
      about: ["Proč tohle píše Radek, když jsem tady jednoznačně důležitější já, nevím.", "Jo jo, to je můj páníček. Doplňuje mi misku… ale panička ji sype plnější."],
      register: ["Jo, vím. Další účet. Ale aspoň ti nebudu posílat 48 e-mailů denně."]
    },
    tips: ["Komentáře: napiš něco chytrýho. A kdyby někdo zlobil, admin má tlačítko Smazat."],
    auth: { welcome: ["Účet vytvořen. Tak teď už oficiálně patříš k nám."] },
    heart: { on: ["No konečně někdo s vkusem."], off: ["…"] },
    comment: { added: ["Dobře. To nebylo úplně blbý.", "Komentář proletěl internetem a přežil.", "Kontroluju… Hmm… Tohle projde."] },
    clip: { fail: ["Technika tvrdí, že za to nemůže. Já tvrdím, že může."] },
    songs: {
      "S3BFk-qmXAY": ["Tenhle track znám. Byl jsem u toho. Nechtěl jsem."],
      "LJ7ER355Hgg": ["Tenhle track znám. Byl jsem u toho. Nechtěl jsem.", "Remake. Radek to nahrál znova. Já bych to nechal, ale mě se nikdo neptá."]
    },
    clicks: ["Můžeš na mě přestat klikat?", "Ty nemáš nic lepšího na práci?", "Dobře. Vyhráváš."],
    surprise: { rhyme: "Klikni na beat, / Kevin je fit, / otevři Spotify / a nech to znít." }
  },
  en: {
    first: ["Hey. I'm Kevin. Skeli's cat, chief expert on everything and unpaid employee of this website."],
    greet: {
      morning: ["Good morning. Why are you awake?"],
      three: ["{time}. Not sleeping? Me neither.", "Radek says the best lyrics are written at this hour. I say the best naps are."]
    },
    page: {
      music: ["Here you can play Skeli. And if you don't like it, the problem is obviously you."],
      lyrics: ["Some make sense. Some were written at three in the morning. Good luck."],
      song: ["Skeli says this track is good. I'm a cat. I don't judge music."],
      about: ["Why Radek writes this when I'm clearly the important one here, I don't know.", "Yep, that's my human. He fills my bowl… but his girlfriend fills it fuller."],
      register: ["Yes, I know. Another account. But at least I won't send you 48 e-mails a day."]
    },
    tips: ["Comments: write something clever. And if anyone misbehaves, the admin has a Delete button."],
    auth: { welcome: ["Account created. Now you're officially one of us."] },
    heart: { on: ["Finally someone with taste."], off: ["…"] },
    comment: { added: ["Fine. That wasn't totally dumb.", "Your comment flew across the internet and survived.", "Checking… Hmm… That'll pass."] },
    clip: { fail: ["The tech says it's not to blame. I say it is."] },
    songs: {
      "S3BFk-qmXAY": ["I know this track. I was there. Didn't want to be."],
      "LJ7ER355Hgg": ["I know this track. I was there. Didn't want to be.", "A remake. Radek recorded it again. I'd have left it, but nobody asks me."]
    },
    clicks: ["Could you stop clicking me?", "Have you got nothing better to do?", "Fine. You win."],
    surprise: { rhyme: "Click on the beat, / Kevin's on his feet, / open up Spotify, / let it play, don't be shy." }
  },
  de: {
    first: ["Servus. Ich bin Kevin. Skelis Kater, Chefexperte für alles und unbezahlter Mitarbeiter dieser Website."],
    greet: {
      morning: ["Guten Morgen. Warum bist du wach?"],
      three: ["{time}. Du schläfst nicht? Ich auch nicht.", "Radek sagt, um diese Uhrzeit entstehen die besten Texte. Ich sage, die besten Nickerchen."]
    },
    page: {
      music: ["Hier kannst du Skeli hören. Und wenn's dir nicht gefällt, liegt das Problem natürlich bei dir."],
      lyrics: ["Manche ergeben Sinn. Manche sind um drei Uhr morgens entstanden. Viel Glück."],
      song: ["Skeli sagt, der Track ist gut. Ich bin eine Katze. Ich beurteile keine Musik."],
      about: ["Warum Radek das schreibt, wo doch eindeutig ich hier der Wichtigere bin, weiß ich nicht.", "Jaja, das ist mein Herrchen. Er füllt mir den Napf… aber Frauchen füllt ihn voller."],
      register: ["Ja, ich weiß. Noch ein Konto. Aber wenigstens schick ich dir keine 48 E-Mails am Tag."]
    },
    tips: ["Kommentare: Schreib was Kluges. Und falls sich jemand danebenbenimmt, hat der Admin einen Löschknopf."],
    auth: { welcome: ["Konto erstellt. Jetzt gehörst du offiziell zu uns."] },
    heart: { on: ["Endlich jemand mit Geschmack."], off: ["…"] },
    comment: { added: ["Gut. Das war nicht ganz blöd.", "Dein Kommentar ist durchs Internet geflogen und hat überlebt.", "Ich prüfe… Hmm… Das geht durch."] },
    clip: { fail: ["Die Technik sagt, sie ist nicht schuld. Ich sage, doch."] },
    songs: {
      "S3BFk-qmXAY": ["Den Track kenn ich. Ich war dabei. Wollte ich nicht."],
      "LJ7ER355Hgg": ["Den Track kenn ich. Ich war dabei. Wollte ich nicht.", "Ein Remake. Radek hat's nochmal aufgenommen. Ich hätt's gelassen, aber mich fragt ja keiner."]
    },
    clicks: ["Kannst du aufhören, mich anzuklicken?", "Hast du nichts Besseres zu tun?", "Gut. Du gewinnst."],
    surprise: { rhyme: "Klick auf den Beat, / Kevin ist fit, / mach Spotify an / und hör dir das an." }
  },
  uk: {
    first: ["Привіт. Я Кевін. Кіт Скелі, головний експерт з усього й неоплачуваний працівник цього сайту."],
    greet: {
      morning: ["Доброго ранку. Чому ти не спиш?"],
      three: ["{time}. Не спиш? Я теж.", "Радек каже, що о цій порі народжуються найкращі тексти. А я кажу — найкращий сон."]
    },
    page: {
      music: ["Тут можна увімкнути Скелі. А якщо не подобається, проблема, звісно, в тобі."],
      lyrics: ["Деякі мають сенс. Деякі написані о третій ночі. Щасти."],
      song: ["Скелі каже, що цей трек гарний. Я кіт. Я музику не оцінюю."],
      about: ["Чому це пише Радек, коли тут очевидно важливіший я, не знаю.", "Ага, це мій хазяїн. Насипає мені миску… але хазяйка насипає повнішу."],
      register: ["Так, знаю. Ще один акаунт. Зате я не надсилатиму тобі 48 листів на день."]
    },
    tips: ["Коментарі: напиши щось розумне. А якщо хтось бешкетуватиме, в адміна є кнопка Видалити."],
    auth: { welcome: ["Акаунт створено. Тепер ти офіційно з нами."] },
    heart: { on: ["Нарешті хтось зі смаком."], off: ["…"] },
    comment: { added: ["Добре. Це було не зовсім дурне.", "Коментар пролетів інтернетом і вижив.", "Перевіряю… Хм… Це пройде."] },
    clip: { fail: ["Техніка каже, що вона не винна. А я кажу, що винна."] },
    songs: {
      "S3BFk-qmXAY": ["Цей трек я знаю. Я був при цьому. Не хотів."],
      "LJ7ER355Hgg": ["Цей трек я знаю. Я був при цьому. Не хотів.", "Ремейк. Радек записав його знову. Я б залишив як було, але мене ніхто не питає."]
    },
    clicks: ["Можеш перестати на мене клікати?", "Тобі нема чим зайнятися?", "Гаразд. Твоя взяла."],
    surprise: { rhyme: "Тисни на біт, / Кевін — як світ, / вмикай Spotify / і просто кайфуй." }
  },
  vi: {
    first: ["Chào. Tôi là Kevin. Mèo của Skeli, chuyên gia về mọi thứ và nhân viên không lương của trang web này."],
    greet: {
      morning: ["Chào buổi sáng. Sao bạn lại thức?"],
      three: ["{time}. Không ngủ à? Tôi cũng vậy.", "Radek bảo giờ này viết lời hay nhất. Tôi bảo giờ này ngủ ngon nhất."]
    },
    page: {
      music: ["Ở đây bạn có thể bật nhạc của Skeli. Nếu không thích thì tất nhiên lỗi là ở bạn."],
      lyrics: ["Có bài có nghĩa. Có bài viết lúc ba giờ sáng. Chúc may mắn."],
      song: ["Skeli bảo bài này hay. Tôi là mèo. Tôi không chấm điểm âm nhạc."],
      about: ["Sao Radek lại viết cái này trong khi rõ ràng tôi mới là người quan trọng, tôi không hiểu.", "Ừ, đó là chủ của tôi. Anh ấy đổ đầy bát cho tôi… nhưng bà chủ đổ đầy hơn."],
      register: ["Ừ, biết rồi. Thêm một tài khoản. Nhưng ít ra tôi không gửi bạn 48 email mỗi ngày."]
    },
    tips: ["Bình luận: viết gì đó thông minh nhé. Ai quậy thì admin có nút Xóa."],
    auth: { welcome: ["Đã tạo tài khoản. Giờ bạn chính thức là người nhà rồi."] },
    heart: { on: ["Cuối cùng cũng có người có gu."], off: ["…"] },
    comment: { added: ["Được. Cái đó không ngớ ngẩn lắm.", "Bình luận đã bay qua internet và sống sót.", "Đang kiểm tra… Hừm… Cái này qua."] },
    clip: { fail: ["Kỹ thuật bảo không phải lỗi của nó. Tôi bảo là có."] },
    songs: {
      "S3BFk-qmXAY": ["Bài này tôi biết. Tôi có mặt lúc đó. Không muốn đâu."],
      "LJ7ER355Hgg": ["Bài này tôi biết. Tôi có mặt lúc đó. Không muốn đâu.", "Bản làm lại. Radek thu lại lần nữa. Tôi thì để nguyên, nhưng chẳng ai hỏi tôi."]
    },
    clicks: ["Bạn thôi bấm vào tôi được không?", "Bạn không có việc gì hay hơn à?", "Được rồi. Bạn thắng."],
    surprise: { rhyme: "Bấm vào nhịp, / Kevin theo kịp, / mở Spotify / và nghe đi nào." }
  }
});
