// What MC Kevin says (js/kevin.js). Cheeky, never rude (the user's wish: no swear words).
// Czech is the main voice; the raps (/api/kevin/bars) stay in Czech in every language.
// A language missing here falls back to English. {link} lines get a link from the caller.
window.KEVIN_LINES = {
  cs: {
    ui: {
      call: 'MC Kevin – klikni na mě', hide: 'Schovat MC Kevina', show: 'Zavolat MC Kevina',
      sound: 'Beat po kliknutí', fullLyrics: 'Celý text →'
    },
    greet: {
      morning: ['Dobrý ráno. Já už jsem vzhůru, šéf ještě ladí beat.', 'Ráno bez kafe a bez beatu? To nedám. Klikni na mě.'],
      day: ['Yo! MC Kevin, hlavní kocour SKELO SQUAD. Klikni a pustím ti bars.', 'Čau! Kevin na place. Jedno kliknutí a dostaneš flow.'],
      evening: ['Dobrej večer. Ideální čas na pár tracků.', 'Večer patří rapu. A mně miska.'],
      night: ['Takhle pozdě? Respekt. Noční flow je nejlepší.', 'Pst, šéf spí. Ale já ti klidně zarapuju.']
    },
    idle: [
      'Ten scroll máš plynulej. Skoro jako můj flow.',
      'Kdybys hledal talent, sedí ti v levým dolním rohu.',
      'Mám devět životů a ve všech rapuju.',
      'Klikni na mě. Nekoušu… teda většinou.',
      'Tlapky mám zlatý. Rýmy taky.',
      'Moje oblíbená písnička? Ta, kde rapuju já. Zatím žádná. Zatím.'
    ],
    // tips he gives when he peeks out from the side of the screen now and then
    tips: [
      'Tip: texty najdu i podle jednoho slova. Klikni na mě a dej „Najdi song“.',
      'Tip: v Diskografii najeď na obal – vyjede z něj deska.',
      'Tip: u textu písně jde písmo zvětšit tlačítky A+ a A−.',
      'Tip: přihlas se a můžeš komentovat a hlasovat. Já hlasuju vždycky pro šéfa.',
      'Tip: nahoře si přepneš světlý nebo tmavý režim. Já jsem zlatej v obou.',
      'Tip: nevíš, co pustit? Klikni na mě, vyberu ti klip.'
    ],
    spin: ['Točím se jak vinyl.', 'Pirueta. Gravitace mě nezastaví.'],
    cool: ['Brýle nasazený. Na můj lesk se bez nich nedá koukat.', 'Chill. Já jsem chill. Ty jsi chill?'],
    sulk: ['Tolik klikání? Teď se urazím.', 'Jsem zády. To je umělecký protest.'],
    unsulk: ['…dobře, už jsem zpátky. Nevydržím bez publika.'],
    beatbox: ['Bum ts ka ts, bum bum ts ka!', 'Pfff-tsss-kchh! Beatbox level kocour.'],
    rapIntro: ['Tohle napsal šéf:', 'Bars od Skeliho, já jen přednáším:', 'Pozor, jdou rýmy:'],
    rapFail: ['Dneska nemám text. Šéf ho zamkl do šuplíku.'],
    sleep: ['Zzz… jen si zavřu oči. Nespím.'],
    wake: ['Já nespal! Jen jsem meditoval nad rýmem.', 'Co? Kdo? Jo, jsem tady. Úplně vzhůru.'],
    page: {
      home: ['Novej klip venku. A ty tu koukáš na kocoura?', 'Dole běží písničky. Klikni na kteroukoli, za ty se neuhodíš.'],
      music: ['Tady je všechno, co šéf nahrál. Já hrál na triangl, nevzali to.', 'Pusť si to nahlas. Sousedi to potřebujou.'],
      lyrics: ['Texty se mají rapovat. Klikni na mě a jeden kousek ti dám.', 'Najdi si svůj řádek a sdílej ho. Já sdílím jen misku.'],
      song: ['Tenhle text znám nazpaměť. No… skoro.', 'Čti pozorně. Pak bude test.'],
      about: ['Šéf se tu chvástá. Já bych dodal: a má nejlepšího kocoura.', 'Samouk. Jako já. Rapovat jsem se naučil sám, z YouTube.'],
      news: ['Čerstvý novinky. Čerstvější než moje granule.'],
      register: ['Registrace? Super. Heslo vymysli pořádný, ne jméno kocoura.'],
      login: ['Zapomněls heslo? Nevadí, já zapomínám, kam jsem dal myš. Tu živou.'],
      donate: ['Podpora šéfa = víc tracků = víc mě. Win-win.'],
      error: ['Tady nic není, kámo. Jako v mý misce v neděli.', '404. Tuhle stránku jsem asi shodil ze stolu.']
    },
    // the menu after a click and what is behind it ({n} = a number, {t} = a title;
    // a plural is [1, 2–4, 5+] in Czech, [1, more] in English)
    menu: { hint: 'Co pro tebe můžu udělat?', find: 'Najdi song', play: 'Pusť něco', rap: 'Zarapuj', news: 'Co je nového?', fun: 'Překvap mě' },
    find: {
      prompt: 'Napiš název nebo kus textu. Najdu to dřív, než řekneš „mňau“.',
      placeholder: 'třeba: tělo bez duše',
      none: 'Nic. Ani v šuplíku. Zkus jiný slovo.',
      found: ['Našel jsem {n} song:', 'Našel jsem {n} songy:', 'Našel jsem {n} songů:']
    },
    play: {
      intro: ['Pouštím: {t}', 'Tohle ti sedne: {t}', 'Náhodnej výběr od kocoura: {t}'],
      fail: 'Přehrávač se zasekl. Asi ho někdo přejel ocasem.',
      close: 'Zavřít přehrávač', song: 'Text a víc →'
    },
    news: {
      intro: 'Od tvý minulý návštěvy:',
      clip: 'vyšel klip {t}',
      clips: ['', 'vyšly {n} nový klipy, nejnovější {t}', 'vyšlo {n} novejch klipů, nejnovější {t}'],
      posts: ['{n} novej příspěvek v Aktualitách', '{n} nový příspěvky v Aktualitách', '{n} novejch příspěvků v Aktualitách'],
      none: 'Od minula nic novýho. Šéf asi zase ladí jeden refrén tři tejdny.',
      first: 'Jsi tu poprvý? Tak to je novinka všechno. Mrkni na Hudbu.',
      link: 'Mrknout →'
    },
    admin: {
      hello: 'Šéfe, hlásím stav webu:',
      reports: ['{n} nahlášenej komentář čeká na tebe', '{n} nahlášený komentáře čekají na tebe', '{n} nahlášenejch komentářů čeká na tebe'],
      clips: ['{n} klip nemá song (nejnovější: {t})', '{n} klipy nemaj song (nejnovější: {t})', '{n} klipů nemá song (nejnovější: {t})'],
      lyrics: ['{n} song nemá text', '{n} songy nemaj text', '{n} songů nemá text'],
      clean: 'Všechno čistý. Můžeš jít nahrávat.',
      status: 'Stav webu', toReports: 'Nahlášené →', toLyrics: 'Editor textů →'
    },
    pw: {
      weak: ['Tohle heslo uhodne i moje babička. A ta je kočka.', 'Slabý heslo. Přidej něco, co by mě nenapadlo.'],
      invalid: ['Mezera v hesle? To je jak chlup v polívce.'],
      mismatch: ['Hesla se neshodují. Já taky vidím dvojitě, když se moc točím.'],
      strong: ['Tohle heslo je silnější než moje drápy. Respekt.', 'To je heslo! Ani já bych ho neprolomil.']
    }
  },
  en: {
    ui: {
      call: 'MC Kevin – click me', hide: 'Hide MC Kevin', show: 'Call MC Kevin',
      sound: 'Beat on click', fullLyrics: 'Full lyrics →'
    },
    greet: {
      morning: ['Good morning. I\'m up, the boss is still tuning the beat.', 'Morning without coffee and a beat? No way. Click me.'],
      day: ['Yo! MC Kevin, head cat of SKELO SQUAD. Click and I\'ll drop some bars.', 'Hey! Kevin in the house. One click and you get the flow.'],
      evening: ['Good evening. Perfect time for a few tracks.', 'Evenings belong to rap. And to my bowl.'],
      night: ['This late? Respect. Night flow is the best.', 'Shh, the boss is asleep. But I\'ll rap for you.']
    },
    idle: [
      'Smooth scrolling. Almost as smooth as my flow.',
      'Looking for talent? It\'s sitting in the bottom left corner.',
      'Nine lives and I rap in every one.',
      'Click me. I don\'t bite… mostly.',
      'Golden paws. Golden rhymes.'
    ],
    tips: [
      'Tip: I can find lyrics by a single word. Click me and pick "Find a song".',
      'Tip: in the Discography, point at a cover – a record slides out.',
      'Tip: on a song page the A+ and A− buttons make the lyrics bigger.',
      'Tip: sign in to comment and vote. I always vote for the boss.',
      'Tip: switch between the light and dark theme at the top. I\x27m gold in both.',
      'Tip: don\x27t know what to play? Click me and I\x27ll pick a clip.'
    ],
    spin: ['Spinning like vinyl.', 'A pirouette. Gravity can\'t stop me.'],
    cool: ['Shades on. You can\'t look at this shine without them.', 'Chill. I\'m chill. Are you chill?'],
    sulk: ['So much clicking? I\'m offended now.', 'My back to you. It\'s an artistic protest.'],
    unsulk: ['…fine, I\'m back. Can\'t live without an audience.'],
    beatbox: ['Boom ts ka ts, boom boom ts ka!', 'Pfff-tsss-kchh! Beatbox cat level.'],
    rapIntro: ['The boss wrote this (in Czech):', 'Bars by Skeli, I just perform them:'],
    rapFail: ['No lyrics today. The boss locked them in a drawer.'],
    sleep: ['Zzz… just resting my eyes. Not sleeping.'],
    wake: ['I wasn\'t asleep! I was meditating on a rhyme.'],
    page: {
      home: ['New video\'s out. And you\'re looking at a cat?', 'Songs are running below. Click any of them.'],
      music: ['Everything the boss ever recorded. I played the triangle. Didn\'t make the cut.'],
      lyrics: ['Lyrics are meant to be rapped. Click me and I will drop a few bars.'],
      song: ['I know these lyrics by heart. Well… almost.'],
      about: ['The boss is bragging here. I\'d add: and he has the best cat.'],
      news: ['Fresh news. Fresher than my cat food.'],
      register: ['Signing up? Great. Pick a real password, not your cat\'s name.'],
      login: ['Forgot your password? I forget where I put the mouse. The live one.'],
      donate: ['Support the boss = more tracks = more me. Win-win.'],
      error: ['Nothing here, buddy. Like my bowl on Sunday.', '404. I must have knocked this page off the table.']
    },
    menu: { hint: 'What can I do for you?', find: 'Find a song', play: 'Play something', rap: 'Rap for me', news: 'What\x27s new?', fun: 'Surprise me' },
    find: {
      prompt: 'Type a title or a bit of the lyrics. I\x27ll find it before you say "meow".',
      placeholder: 'e.g. a body without a soul',
      none: 'Nothing. Not even in the drawer. Try another word.',
      found: ['I found {n} song:', 'I found {n} songs:']
    },
    play: {
      intro: ['Now playing: {t}', 'This one\x27s for you: {t}', 'The cat\x27s random pick: {t}'],
      fail: 'The player got stuck. Someone must have stepped on it with a tail.',
      close: 'Close the player', song: 'Lyrics and more →'
    },
    news: {
      intro: 'Since your last visit:',
      clip: 'a new clip came out: {t}',
      clips: ['', '{n} new clips came out, the newest is {t}'],
      posts: ['{n} new post in the News', '{n} new posts in the News'],
      none: 'Nothing new since last time. The boss is probably tuning one chorus for three weeks again.',
      first: 'First time here? Then everything is news. Check out the Music.',
      link: 'Take a look →'
    },
    admin: {
      hello: 'Boss, here\x27s the state of the site:',
      reports: ['{n} reported comment is waiting for you', '{n} reported comments are waiting for you'],
      clips: ['{n} clip has no song (newest: {t})', '{n} clips have no song (newest: {t})'],
      lyrics: ['{n} song has no lyrics', '{n} songs have no lyrics'],
      clean: 'All clean. Go record something.',
      status: 'Site status', toReports: 'Reports →', toLyrics: 'Lyrics editor →'
    },
    pw: {
      weak: ['Even my grandma could guess that one. And she\'s a cat.', 'Weak password. Add something I wouldn\'t think of.'],
      invalid: ['A space in a password? Like a hair in the soup.'],
      mismatch: ['The passwords don\'t match. I see double too when I spin too much.'],
      strong: ['That password is stronger than my claws. Respect.']
    }
  },
  de: {
    ui: {
      call: 'MC Kevin – klick mich an', hide: 'MC Kevin verstecken', show: 'MC Kevin rufen',
      sound: 'Beat beim Klicken', fullLyrics: 'Ganzer Text →'
    },
    greet: {
      morning: ['Guten Morgen. Ich bin wach, der Boss stimmt noch den Beat.', 'Morgen ohne Kaffee und ohne Beat? Nicht mit mir. Klick mich an.'],
      day: ['Yo! MC Kevin, Oberkater der SKELO SQUAD. Klick, und ich droppe ein paar Bars.', 'Hey! Kevin am Start. Ein Klick und du kriegst den Flow.'],
      evening: ['Guten Abend. Perfekte Zeit für ein paar Tracks.', 'Der Abend gehört dem Rap. Und meinem Napf.'],
      night: ['So spät noch? Respekt. Der Nacht-Flow ist der beste.', 'Psst, der Boss schläft. Aber für dich rappe ich trotzdem.']
    },
    idle: [
      'Flüssig gescrollt. Fast so flüssig wie mein Flow.',
      'Suchst du Talent? Es sitzt unten links.',
      'Neun Leben, und in jedem rappe ich.',
      'Klick mich an. Ich beiße nicht… meistens.',
      'Goldene Pfoten. Goldene Reime.'
    ],
    tips: [
      'Tipp: Ich finde Texte schon an einem einzigen Wort. Klick mich an und wähle „Song finden“.',
      'Tipp: Fahr in der Diskografie über ein Cover – eine Platte gleitet heraus.',
      'Tipp: Auf der Songseite machen A+ und A− den Text größer.',
      'Tipp: Melde dich an, dann kannst du kommentieren und abstimmen. Ich stimme immer für den Boss.',
      'Tipp: Oben schaltest du zwischen hellem und dunklem Modus. Ich bin in beiden golden.',
      'Tipp: Keine Ahnung, was du hören sollst? Klick mich an, ich such dir einen Clip aus.'
    ],
    spin: ['Ich dreh mich wie Vinyl.', 'Eine Pirouette. Die Schwerkraft hält mich nicht auf.'],
    cool: ['Sonnenbrille auf. Ohne sie hält man meinen Glanz nicht aus.', 'Chill. Ich bin chill. Bist du chill?'],
    sulk: ['So viel Geklicke? Jetzt bin ich beleidigt.', 'Ich dreh dir den Rücken zu. Das ist künstlerischer Protest.'],
    unsulk: ['…na gut, ich bin wieder da. Ohne Publikum halt ich\x27s nicht aus.'],
    beatbox: ['Bum ts ka ts, bum bum ts ka!', 'Pfff-tsss-kchh! Beatbox auf Katerniveau.'],
    rapIntro: ['Das hat der Boss geschrieben (auf Tschechisch):', 'Bars von Skeli, ich trag sie nur vor:'],
    rapFail: ['Heute hab ich keinen Text. Der Boss hat ihn in die Schublade gesperrt.'],
    sleep: ['Zzz… ich mach nur kurz die Augen zu. Ich schlafe nicht.'],
    wake: ['Ich hab nicht geschlafen! Ich hab über einen Reim meditiert.', 'Was? Wer? Ja, ich bin da. Hellwach.'],
    page: {
      home: ['Neuer Clip draußen. Und du schaust dir einen Kater an?', 'Unten laufen Songs. Klick auf irgendeinen.'],
      music: ['Hier ist alles, was der Boss aufgenommen hat. Ich hab Triangel gespielt, wurde nicht genommen.', 'Dreh laut auf. Die Nachbarn brauchen das.'],
      lyrics: ['Texte sind zum Rappen da. Klick mich an, und ich gebe dir ein Stück.', 'Such dir deine Zeile und teile sie. Ich teile nur meinen Napf.'],
      song: ['Diesen Text kann ich auswendig. Na ja… fast.', 'Lies genau. Danach gibt\x27s einen Test.'],
      about: ['Der Boss gibt hier an. Ich würde ergänzen: und er hat den besten Kater.', 'Autodidakt. Wie ich. Rappen hab ich mir selbst beigebracht, mit YouTube.'],
      news: ['Frische Neuigkeiten. Frischer als mein Trockenfutter.'],
      register: ['Registrieren? Super. Denk dir ein richtiges Passwort aus, nicht den Namen deines Katers.'],
      login: ['Passwort vergessen? Macht nichts, ich vergesse, wo ich die Maus hingelegt hab. Die lebendige.'],
      donate: ['Den Boss unterstützen = mehr Tracks = mehr von mir. Win-win.'],
      error: ['Hier ist nichts, Kumpel. Wie in meinem Napf am Sonntag.', '404. Die Seite hab ich wohl vom Tisch geworfen.']
    },
    menu: { hint: 'Was kann ich für dich tun?', find: 'Song finden', play: 'Spiel was ab', rap: 'Rap für mich', news: 'Was gibt\x27s Neues?', fun: 'Überrasch mich' },
    find: {
      prompt: 'Schreib einen Titel oder ein Stück Text. Ich finde es, bevor du „Miau“ sagst.',
      placeholder: 'z. B. Körper ohne Seele',
      none: 'Nichts. Nicht mal in der Schublade. Versuch ein anderes Wort.',
      found: ['Ich hab {n} Song gefunden:', 'Ich hab {n} Songs gefunden:']
    },
    play: {
      intro: ['Jetzt läuft: {t}', 'Der passt zu dir: {t}', 'Zufallsauswahl vom Kater: {t}'],
      fail: 'Der Player hängt. Da ist wohl jemand mit dem Schwanz draufgetreten.',
      close: 'Player schließen', song: 'Text und mehr →'
    },
    news: {
      intro: 'Seit deinem letzten Besuch:',
      clip: 'ist der Clip {t} erschienen',
      clips: ['', 'sind {n} neue Clips erschienen, der neueste ist {t}'],
      posts: ['{n} neuer Beitrag in den News', '{n} neue Beiträge in den News'],
      none: 'Seit dem letzten Mal nichts Neues. Der Boss stimmt wohl wieder drei Wochen lang einen Refrain.',
      first: 'Zum ersten Mal hier? Dann ist alles neu. Schau mal in die Musik.',
      link: 'Ansehen →'
    },
    admin: {
      hello: 'Boss, hier der Stand der Seite:',
      reports: ['{n} gemeldeter Kommentar wartet auf dich', '{n} gemeldete Kommentare warten auf dich'],
      clips: ['{n} Clip hat keinen Song (neuester: {t})', '{n} Clips haben keinen Song (neuester: {t})'],
      lyrics: ['{n} Song hat keinen Text', '{n} Songs haben keinen Text'],
      clean: 'Alles sauber. Geh was aufnehmen.',
      status: 'Stand der Seite', toReports: 'Meldungen →', toLyrics: 'Texteditor →'
    },
    pw: {
      weak: ['Das Passwort errät sogar meine Oma. Und die ist eine Katze.', 'Schwaches Passwort. Füg etwas hinzu, auf das ich nicht käme.'],
      invalid: ['Ein Leerzeichen im Passwort? Wie ein Haar in der Suppe.'],
      mismatch: ['Die Passwörter stimmen nicht überein. Ich seh auch doppelt, wenn ich mich zu viel drehe.'],
      strong: ['Das Passwort ist stärker als meine Krallen. Respekt.', 'Das ist ein Passwort! Nicht mal ich würde es knacken.']
    }
  },
  uk: {
    ui: {
      call: 'MC Кевін – натисни на мене', hide: 'Сховати MC Кевіна', show: 'Покликати MC Кевіна',
      sound: 'Біт після натискання', fullLyrics: 'Увесь текст →'
    },
    greet: {
      morning: ['Доброго ранку. Я вже прокинувся, бос іще налаштовує біт.', 'Ранок без кави і без біту? Не витримаю. Натисни на мене.'],
      day: ['Йоу! MC Кевін, головний кіт SKELO SQUAD. Натисни, і я зачитаю бари.', 'Привіт! Кевін на місці. Один клік — і флоу твій.'],
      evening: ['Добрий вечір. Ідеальний час для кількох треків.', 'Вечір належить репу. І моїй мисці.'],
      night: ['Так пізно? Респект. Нічний флоу найкращий.', 'Тсс, бос спить. Але для тебе я зачитаю.']
    },
    idle: [
      'Плавно скролиш. Майже як мій флоу.',
      'Шукаєш талант? Він сидить у лівому нижньому куті.',
      'У мене дев\x27ять життів, і в кожному я читаю реп.',
      'Натисни на мене. Я не кусаюсь… ну, здебільшого.',
      'Лапи золоті. Рими теж.'
    ],
    tips: [
      'Порада: я знайду тексти навіть за одним словом. Натисни на мене й обери «Знайти пісню».',
      'Порада: у Дискографії наведи на обкладинку — з неї виїде платівка.',
      'Порада: на сторінці пісні кнопки A+ і A− збільшують текст.',
      'Порада: увійди, і зможеш коментувати й голосувати. Я завжди голосую за боса.',
      'Порада: угорі перемикаєш світлий і темний режим. Я золотий в обох.',
      'Порада: не знаєш, що увімкнути? Натисни на мене, я виберу кліп.'
    ],
    spin: ['Кручуся, як вініл.', 'Пірует. Гравітація мене не зупинить.'],
    cool: ['Окуляри вдягнув. Без них на мій блиск не подивишся.', 'Чіл. Я на чілі. А ти на чілі?'],
    sulk: ['Стільки клацання? Тепер я ображусь.', 'Я спиною до тебе. Це мистецький протест.'],
    unsulk: ['…гаразд, я повернувся. Без публіки не можу.'],
    beatbox: ['Бум тс ка тс, бум бум тс ка!', 'Пфф-тссс-кхх! Бітбокс рівня кота.'],
    rapIntro: ['Це написав бос (чеською):', 'Бари від Skeli, я лише виконую:'],
    rapFail: ['Сьогодні тексту нема. Бос замкнув його в шухляді.'],
    sleep: ['Ззз… я лише заплющу очі. Я не сплю.'],
    wake: ['Я не спав! Я медитував над римою.', 'Що? Хто? Так, я тут. Цілком прокинувся.'],
    page: {
      home: ['Новий кліп уже вийшов. А ти дивишся на кота?', 'Унизу біжать пісні. Натисни на будь-яку.'],
      music: ['Тут усе, що записав бос. Я грав на трикутнику, мене не взяли.', 'Увімкни гучніше. Сусідам це потрібно.'],
      lyrics: ['Тексти створені, щоб їх читати. Натисни на мене, і я дам тобі шматочок.', 'Знайди свій рядок і поділись ним. Я ділюся лише мискою.'],
      song: ['Цей текст я знаю напам\x27ять. Ну… майже.', 'Читай уважно. Потім буде тест.'],
      about: ['Бос тут хвалиться. Я б додав: і в нього найкращий кіт.', 'Самоук. Як і я. Читати реп я навчився сам, з YouTube.'],
      news: ['Свіжі новини. Свіжіші за мій корм.'],
      register: ['Реєстрація? Супер. Придумай нормальний пароль, а не ім\x27я кота.'],
      login: ['Забув пароль? Нічого, я забуваю, куди поклав мишу. Живу.'],
      donate: ['Підтримка боса = більше треків = більше мене. Win-win.'],
      error: ['Тут нічого нема, друже. Як у моїй мисці в неділю.', '404. Цю сторінку я, мабуть, скинув зі столу.']
    },
    menu: { hint: 'Що я можу для тебе зробити?', find: 'Знайти пісню', play: 'Увімкни щось', rap: 'Зачитай', news: 'Що нового?', fun: 'Здивуй мене' },
    find: {
      prompt: 'Напиши назву або шматок тексту. Знайду раніше, ніж скажеш «няв».',
      placeholder: 'напр.: тіло без душі',
      none: 'Нічого. Навіть у шухляді. Спробуй інше слово.',
      found: ['Я знайшов {n} пісню:', 'Я знайшов {n} пісні:', 'Я знайшов {n} пісень:']
    },
    play: {
      intro: ['Вмикаю: {t}', 'Це тобі сподобається: {t}', 'Випадковий вибір від кота: {t}'],
      fail: 'Плеєр заїв. Мабуть, хтось наступив на нього хвостом.',
      close: 'Закрити плеєр', song: 'Текст і більше →'
    },
    news: {
      intro: 'Від твого минулого візиту:',
      clip: 'вийшов кліп {t}',
      clips: ['', 'вийшло {n} нові кліпи, найновіший {t}', 'вийшло {n} нових кліпів, найновіший {t}'],
      posts: ['{n} новий допис у Новинах', '{n} нові дописи в Новинах', '{n} нових дописів у Новинах'],
      none: 'Від минулого разу нічого нового. Бос, мабуть, знову три тижні налаштовує один приспів.',
      first: 'Ти тут уперше? Тоді новина — усе. Заглянь у Музику.',
      link: 'Глянути →'
    },
    admin: {
      hello: 'Босе, доповідаю стан сайту:',
      reports: ['{n} поскаржений коментар чекає на тебе', '{n} поскаржені коментарі чекають на тебе', '{n} поскаржених коментарів чекають на тебе'],
      clips: ['{n} кліп без пісні (найновіший: {t})', '{n} кліпи без пісні (найновіший: {t})', '{n} кліпів без пісні (найновіший: {t})'],
      lyrics: ['{n} пісня без тексту', '{n} пісні без тексту', '{n} пісень без тексту'],
      clean: 'Усе чисто. Можеш іти записувати.',
      status: 'Стан сайту', toReports: 'Скарги →', toLyrics: 'Редактор текстів →'
    },
    pw: {
      weak: ['Цей пароль вгадає навіть моя бабуся. А вона кішка.', 'Слабкий пароль. Додай щось, до чого я б не додумався.'],
      invalid: ['Пробіл у паролі? Як волосина в супі.'],
      mismatch: ['Паролі не збігаються. У мене теж двоїться, коли я забагато кручуся.'],
      strong: ['Цей пароль міцніший за мої кігті. Респект.', 'Оце пароль! Навіть я б його не зламав.']
    }
  },
  vi: {
    ui: {
      call: 'MC Kevin – bấm vào tôi', hide: 'Ẩn MC Kevin', show: 'Gọi MC Kevin',
      sound: 'Beat khi bấm', fullLyrics: 'Toàn bộ lời →'
    },
    greet: {
      morning: ['Chào buổi sáng. Tôi dậy rồi, sếp vẫn đang chỉnh beat.', 'Buổi sáng không cà phê, không beat? Chịu thôi. Bấm vào tôi đi.'],
      day: ['Yo! MC Kevin, con mèo đầu đàn của SKELO SQUAD. Bấm đi, tôi thả vài câu rap.', 'Chào! Kevin có mặt. Một cú bấm là có flow.'],
      evening: ['Chào buổi tối. Thời điểm hoàn hảo cho vài bài hát.', 'Buổi tối thuộc về rap. Và về cái bát của tôi.'],
      night: ['Muộn thế này à? Nể đấy. Flow ban đêm là đỉnh nhất.', 'Suỵt, sếp ngủ rồi. Nhưng tôi vẫn rap cho bạn nghe.']
    },
    idle: [
      'Bạn cuộn mượt ghê. Gần mượt như flow của tôi.',
      'Đang tìm tài năng à? Nó ngồi ở góc dưới bên trái đấy.',
      'Chín cái mạng, mạng nào tôi cũng rap.',
      'Bấm vào tôi đi. Tôi không cắn đâu… thường là vậy.',
      'Chân vàng. Vần cũng vàng.'
    ],
    tips: [
      'Mẹo: tôi tìm được lời bài hát chỉ với một từ. Bấm vào tôi và chọn „Tìm bài hát“.',
      'Mẹo: trong Danh sách đĩa nhạc, rê chuột lên bìa – một chiếc đĩa sẽ trượt ra.',
      'Mẹo: ở trang bài hát, nút A+ và A− giúp chữ to hơn.',
      'Mẹo: đăng nhập để bình luận và bình chọn. Tôi luôn bầu cho sếp.',
      'Mẹo: ở trên cùng bạn đổi được chế độ sáng hoặc tối. Tôi vàng óng ở cả hai.',
      'Mẹo: không biết nghe gì? Bấm vào tôi, tôi chọn cho một clip.'
    ],
    spin: ['Xoay như đĩa than.', 'Một vòng pirouette. Trọng lực không cản được tôi.'],
    cool: ['Đeo kính vào. Không có nó thì chẳng ai nhìn nổi độ bóng của tôi.', 'Chill. Tôi chill. Bạn có chill không?'],
    sulk: ['Bấm nhiều thế? Giờ tôi giận rồi.', 'Tôi quay lưng đây. Đây là phản đối nghệ thuật.'],
    unsulk: ['…thôi được, tôi quay lại đây. Không có khán giả tôi chịu không nổi.'],
    beatbox: ['Bum ts ka ts, bum bum ts ka!', 'Pfff-tsss-kchh! Beatbox trình độ mèo.'],
    rapIntro: ['Cái này sếp viết (bằng tiếng Séc):', 'Câu rap của Skeli, tôi chỉ trình diễn thôi:'],
    rapFail: ['Hôm nay không có lời. Sếp khóa nó trong ngăn kéo rồi.'],
    sleep: ['Zzz… tôi chỉ nhắm mắt chút thôi. Không ngủ đâu.'],
    wake: ['Tôi không ngủ! Tôi đang thiền về một câu vần.', 'Gì cơ? Ai đấy? À, tôi đây. Tỉnh hẳn rồi.'],
    page: {
      home: ['Clip mới ra rồi. Mà bạn lại đi ngắm một con mèo?', 'Bên dưới đang chạy các bài hát. Bấm vào bài nào cũng được.'],
      music: ['Đây là tất cả những gì sếp đã thu âm. Tôi chơi kẻng tam giác, không được chọn.', 'Bật to lên. Hàng xóm cần cái này.'],
      lyrics: ['Lời bài hát là để rap. Bấm vào tôi, tôi cho bạn một đoạn.', 'Tìm câu của riêng bạn và chia sẻ nó. Tôi chỉ chia sẻ cái bát.'],
      song: ['Lời này tôi thuộc lòng. Ừm… gần như thế.', 'Đọc kỹ nhé. Lát nữa có bài kiểm tra.'],
      about: ['Sếp đang khoe khoang ở đây. Tôi xin bổ sung: và sếp có con mèo xịn nhất.', 'Tự học. Giống tôi. Tôi tự học rap qua YouTube.'],
      news: ['Tin mới tinh. Còn tươi hơn hạt khô của tôi.'],
      register: ['Đăng ký à? Tuyệt. Nghĩ một mật khẩu cho đàng hoàng, đừng lấy tên con mèo.'],
      login: ['Quên mật khẩu? Không sao, tôi cũng quên đã để con chuột ở đâu. Con chuột thật ấy.'],
      donate: ['Ủng hộ sếp = nhiều bài hơn = nhiều tôi hơn. Đôi bên cùng có lợi.'],
      error: ['Ở đây chẳng có gì, bạn ơi. Giống cái bát của tôi ngày Chủ nhật.', '404. Chắc tôi đã hất trang này xuống khỏi bàn.']
    },
    menu: { hint: 'Tôi có thể làm gì cho bạn?', find: 'Tìm bài hát', play: 'Mở gì đó', rap: 'Rap đi', news: 'Có gì mới?', fun: 'Làm tôi bất ngờ' },
    find: {
      prompt: 'Gõ tên bài hoặc một đoạn lời. Tôi tìm ra trước khi bạn kịp nói „meo“.',
      placeholder: 'ví dụ: thân xác không linh hồn',
      none: 'Không có gì. Ngăn kéo cũng không. Thử từ khác xem.',
      found: ['Tôi tìm thấy {n} bài hát:', 'Tôi tìm thấy {n} bài hát:']
    },
    play: {
      intro: ['Đang phát: {t}', 'Bài này hợp với bạn: {t}', 'Mèo chọn ngẫu nhiên: {t}'],
      fail: 'Trình phát bị kẹt. Chắc ai đó giẫm đuôi lên nó rồi.',
      close: 'Đóng trình phát', song: 'Lời và hơn thế →'
    },
    news: {
      intro: 'Kể từ lần ghé trước của bạn:',
      clip: 'clip {t} đã ra mắt',
      clips: ['', '{n} clip mới đã ra mắt, mới nhất là {t}'],
      posts: ['{n} bài đăng mới trong mục Tin tức', '{n} bài đăng mới trong mục Tin tức'],
      none: 'Từ lần trước chẳng có gì mới. Chắc sếp lại chỉnh một đoạn điệp khúc suốt ba tuần.',
      first: 'Lần đầu đến đây à? Vậy thì mọi thứ đều là tin mới. Ghé qua mục Âm nhạc nhé.',
      link: 'Xem thử →'
    },
    admin: {
      hello: 'Sếp ơi, báo cáo tình trạng trang web:',
      reports: ['{n} bình luận bị báo cáo đang chờ sếp', '{n} bình luận bị báo cáo đang chờ sếp'],
      clips: ['{n} clip chưa có bài hát (mới nhất: {t})', '{n} clip chưa có bài hát (mới nhất: {t})'],
      lyrics: ['{n} bài hát chưa có lời', '{n} bài hát chưa có lời'],
      clean: 'Mọi thứ sạch sẽ. Đi thu âm đi.',
      status: 'Tình trạng trang web', toReports: 'Báo cáo →', toLyrics: 'Trình sửa lời →'
    },
    pw: {
      weak: ['Mật khẩu này đến bà tôi cũng đoán được. Mà bà là mèo đấy.', 'Mật khẩu yếu. Thêm thứ gì đó tôi không nghĩ ra.'],
      invalid: ['Dấu cách trong mật khẩu? Như sợi tóc trong bát canh.'],
      mismatch: ['Hai mật khẩu không khớp. Tôi cũng nhìn đôi khi xoay quá nhiều.'],
      strong: ['Mật khẩu này còn chắc hơn móng vuốt của tôi. Nể.', 'Đúng là mật khẩu! Đến tôi cũng không phá nổi.']
    }
  }
};
