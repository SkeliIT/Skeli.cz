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
    pw: {
      weak: ['Even my grandma could guess that one. And she\'s a cat.', 'Weak password. Add something I wouldn\'t think of.'],
      invalid: ['A space in a password? Like a hair in the soup.'],
      mismatch: ['The passwords don\'t match. I see double too when I spin too much.'],
      strong: ['That password is stronger than my claws. Respect.']
    }
  }
};
