// What MC Kevin says (js/kevin.js). Cheeky, never rude (the user's wish: no swear words).
// Czech is the main voice; other languages use English. {link} lines get a link from the caller.
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
      lyrics: ['Texty se čtou nahlas. Klidně to udělám, klikni na mě.', 'Najdi si svůj řádek a sdílej ho. Já sdílím jen misku.'],
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
      lyrics: ['Lyrics are meant to be read out loud. Click me and I will.'],
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
      placeholder: 'e.g. tělo bez duše',
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
  }
};
