// CatSmash – pevná data hry: rozměry hřiště a rámu, obtížnosti, odstřel, materiály přívěsků, stopy letu,
// odznaky a jejich vzácnost. Jen data, žádný stav hry (hra je čte přes window.CatSmash.data, js/catsmash/hra.js).
// Načítá se před hrou (js/kevin.js pong()).
(function () {
  var C = window.CatSmash = window.CatSmash || {};
  var W = 600, H = 900, PAD_W = 124, PAD_H = 16, BALL_R = 14, WIN = 10;
  var PLAYER_Y = H - 46, KEVIN_Y = 60;               // pálky (logické souřadnice hřiště)
  // rám: rozměr obrázku, sklo hřiště v něm a kola [obrázek, x, y, poloměr] (vše v pixelech obrázku)
  var FRAME_W = 768, FRAME_H = 1376, GLASS = { x: 138, y: 316, w: 492, h: 741 };
  // Kevinova kola koukají shora ze stroje: spodek je uvnitř (ořízne ho štěrbina v horní hraně rámu, y = TOP_SLOT)
  var TOP_SLOT = 124, GEARS_KEVIN = [[1, 290.5, 122, 46], [2, 384, 118, 58], [3, 477.5, 122, 46]];
  // okénka s živou mechanikou [x, y, šířka, výška] – nahoře ji pohání Kevinův běh, dole hráčova pálka
  var WIN_TOP = [128, 191, 513, 79], WIN_BOT = [123, 1073, 523, 136];
  var BGS = ['tma', 'mesto', 'zapad', 'les', 'vesmir', 'zare', 'ganja', 'sopka', 'poklad', 'kyber', 'podmori', 'podium', 'klenotnice', 'tovarna', 'plys', 'skelosquad'];
  // watch = jakou část hřiště (od sebe) Kevin sleduje, err = chyba odhadu (díl šířky), bounceErr = o kolik víc
  // se splete za každý odraz od stěny; chyba se losuje jednou za let míčku (ne pořád dokola – to by se zprůměrovalo)
  var LEVELS = {
    1: { speed: 490, gain: 1.03, max: 1000, react: 0.26, err: 0.11, bounceErr: 0.6, watch: 0.6, aiSpeed: 340, aim: 0.1, kshot: 0 },
    2: { speed: 580, gain: 1.04, max: 1250, react: 0.15, err: 0.065, bounceErr: 0.5, watch: 0.75, aiSpeed: 520, aim: 0.35, kshot: 0 },
    // trojka: pořád těžká, ale porazitelná (dřív chyba 0,02 a běh 1000 = skoro neomylný, hráč dal 1 gól z 10 her)
    3: { speed: 680, gain: 1.045, max: 1500, react: 0.08, err: 0.048, bounceErr: 0.45, watch: 0.95, aiSpeed: 800, aim: 0.7, kshot: 0.16 }
  };
  // odstřel: pálka je nejvýš SHOT_IDEAL ms po kliknutí; odchylka dotyku míčku od té chvíle (ms) → zrychlení
  var SHOT = [[35, 1.6, 'perfect'], [90, 1.3, 'good'], [160, 1.12, 'weak']], SHOT_IDEAL = 40, SHOT_SUPER = 1.85, LIFT = 22;

  // ---------- odznaky: pamatuje si je prohlížeč, přihlášenému je sloučí s účtem (/api/pong/me) ----------
  // Část se počítá z výher (první výhra, 10:0…), část se stane uvnitř zápasu (odstřely, šroubky…) – ty se
  // přihlášenému posílají na server (/api/pong/badges). Odznaky odemykají pálky, míčky a pozadí.
  var BADGE_ICON = { first: 'fa-trophy', easy: 'fa-mug-hot', normal: 'fa-scale-balanced', angry: 'fa-cat', clean: 'fa-shield-halved',
    close: 'fa-heart-pulse', fast: 'fa-bolt', streak: 'fa-medal', wins50: 'fa-medal', wins100: 'fa-medal', sniper: 'fa-crosshairs',
    super: 'fa-explosion', tinker: 'fa-screwdriver-wrench', yarn: 'fa-mitten', overheat: 'fa-fire', comeback: 'fa-arrow-trend-up',
    marathon: 'fa-person-running', night: 'fa-moon', loyal: 'fa-calendar-check',
    hwins5: 'fa-crown', hfast: 'fa-meteor', hclean: 'fa-skull', hsniper: 'fa-bullseye', hcomeback: 'fa-fire-flame-curved',   // jen za nejtěžší
    wardrobe: 'fa-shirt', skelosquad: 'fa-gem' };
  var CLAIMABLE = ['sniper', 'super', 'tinker', 'yarn', 'overheat', 'comeback', 'marathon', 'night', 'loyal', 'hsniper', 'hcomeback'];
  var LOOKS = ['first', 'easy', 'tinker', 'normal', 'loyal', 'streak', 'night', 'sniper', 'overheat', 'close', 'marathon', 'comeback', 'clean', 'super', 'angry', 'wins100', 'wins50'];
  // pozadí pro všechny: Tma a Noční město; ostatní odemkne odznak (kdo nic nevybral nebo má zamčené, má Noční město)
  // pozadí patří k pálce: odemkne ho stejný odznak jako pálku (Noční město ke Graffiti je zdarma)
  var BG_BADGE = { zare: 'night', zapad: 'first', vesmir: 'angry', ganja: 'wins50', les: 'loyal', sopka: 'comeback', poklad: 'streak', kyber: 'sniper', podmori: 'close', podium: 'marathon', klenotnice: 'clean', tovarna: 'wins100', plys: 'tinker', skelosquad: 'skelosquad' };
  // výřez obrázku na hřiště (hřiště je na výšku, obrázky na šířku): kde je v obrázku to nejhezčí
  var BG_POS = { mesto: '20%', zapad: '62%', les: '50%', vesmir: '28%', zare: '50%', ganja: '55%', sopka: '50%', poklad: '50%', kyber: '50%', podmori: '50%', podium: '50%', klenotnice: '50%', tovarna: '50%', plys: '50%', skelosquad: '50%' };
  var MOOD = { lazy: [0.85, 1.35], calm: [1, 1], try: [1.08, 0.8] };
  // Přívěsky pod pálkou se chovají podle materiálu (MAT podle id pálky):
  //  swing = tuhý kus, otáčí se celý kolem místa, kde visí (kov, dřevo, střapec);
  //  sway  = měkké nebo tekuté, ohýbá se (čím níž, tím víc): plyš, láva, barva;
  //  beads = tuhé korálky na šňůrce: korálky se jen posouvají, ohýbá se šňůrka;
  //  string = tuhý kus na provázku (klíček): provázek se kývá, klíček visí na jeho konci;
  //  leg = chlupatá nožička (dokreslená) a na ní tuhá tlapka – nožička se houpe, tlapka se neohýbá;
  //  rigid = nehýbe se vůbec (led, neon, ekvalizér, ozubená kola).
  // damp = tlumení (kov se houpe dlouho, láva skoro hned stojí), stiff = pružnost (větvička se vrací sama),
  // push = jak moc ho rozhoupe pohyb pálky (těžká láva málo, lehký plyš hodně)
  var MAT = {
    vetev: { mode: 'swing', damp: 3.2, stiff: 55, push: 0.55 },
    lava: { mode: 'sway', damp: 7, stiff: 6, push: 0.3, drip: 'lava', every: [900, 2600] },
    retez: { mode: 'swing', damp: 1.1, stiff: 0, push: 1 },
    ganja: { mode: 'swing', damp: 1.6, stiff: 8, push: 0.9 },
    skelosquad: { mode: 'swing', damp: 1.2, stiff: 0, push: 1 },
    graffiti: { mode: 'sway', damp: 6, stiff: 10, push: 0.3, drip: 'paint', every: [1800, 4200] },
    plys: { mode: 'leg', damp: 2.4, stiff: 16, push: 0.8, leg: 28 },
    jadeit: { mode: 'swing', damp: 1.6, stiff: 0, push: 1 },
    perly: { mode: 'beads', damp: 2.2, stiff: 0, push: 0.7 },
    mince: { mode: 'swing', damp: 1.2, stiff: 0, push: 1 },
    cip: { mode: 'swing', damp: 1.3, stiff: 0, push: 1 },
    led: { mode: 'rigid' }, neon: { mode: 'rigid' }, ekvalizer: { mode: 'rigid' }, kola: { mode: 'rigid' },
    kevin: { mode: 'swing', damp: 1.2, stiff: 0, push: 1 }    // Kevinova pálka: kočičí hlavička na řetízku a štítek K.V. (kov)
  };
  // ---------- let míčku po odrazu od hráčovy pálky: stopa a částice podle pálky ----------
  // Každá pálka má 3 varianty (vybere se jiná než minule) a každý let se ještě trochu liší (síla vlnění, hustota).
  // Čára za míčkem slábne s časem i se vzdáleností od pálky; kreslí se pod míček.
  // line = [barva jádra, barva záře], w = šířka, kind = tvar čáry, emit = částice, rate = kolik za sekundu
  var FLIGHT = {
    led: [{ line: ['#c6f1ff', '#7fd3ff'], w: 2.6, kind: 'smooth', emit: 'flake', rate: 16 },
      { line: ['#a9e6ff', '#e9fbff'], w: 1.8, kind: 'zigzag', emit: 'flake', rate: 9 },
      { line: ['#d8f5ff', '#7fd3ff'], w: 1.3, kind: 'helix', emit: 'flakeBig', rate: 7 }],
    vetev: [{ line: ['#86d152', '#3f8f2a'], w: 2.4, kind: 'smooth', emit: 'tornado', rate: 9 },
      { line: ['#6fbf4a', '#b8e68a'], w: 1.8, kind: 'wave', emit: 'leafDrop', rate: 7 },
      { line: ['#9fd65a', '#3f8f2a'], w: 1.4, kind: 'helix', emit: 'leafSide', rate: 10 }],
    lava: [{ line: ['#ffb02e', '#ff4a00'], w: 2.6, kind: 'smooth', emit: 'ember', rate: 22 },
      { line: ['#ff8a1a', '#b32400'], w: 2.2, kind: 'wave', emit: 'lavaDrop', rate: 8 },
      { line: ['#ffd36b', '#ff6a00'], w: 1.6, kind: 'zigzag', emit: 'smoke', rate: 10 }],
    skelosquad: [{ line: ['#ffe27a', '#1a1405'], w: 2.6, kind: 'smooth', emit: 'goldSpark', rate: 24 },   // černozlatá
      { line: ['#ffd23f', '#000000'], w: 1.8, kind: 'helix', emit: 'goldSpark', rate: 14 },
      { line: ['#fff1a8', '#8f6600'], w: 1.6, kind: 'zigzag', emit: 'smoke', rate: 10 }],
    ganja: [{ line: ['#7fd36b', '#2f7a2a'], w: 2.4, kind: 'wave', emit: 'smoke', rate: 12 },     // zelený kouř
      { line: ['#d62a1e', '#ffd23f'], w: 1.6, kind: 'dots', emit: 'smoke', rate: 6 },           // rasta tečky
      { line: ['#ffd23f', '#3fbf4f'], w: 1.6, kind: 'helix', emit: 'tornado', rate: 8 }],
    retez: [{ line: ['#ffe27a', '#b8860b'], w: 2.2, kind: 'smooth', emit: 'goldSpark', rate: 20 },
      { line: ['#ffd23f', '#8f6600'], w: 1.4, kind: 'dots', emit: 'pawPrint', rate: 5 },
      { line: ['#fff1a8', '#c99a12'], w: 1.4, kind: 'helix', emit: 'goldSpark', rate: 12 }],
    graffiti: [{ line: 'multi', w: 2.6, kind: 'smooth', emit: 'paintSplat', rate: 10 },
      { line: 'multi', w: 1.8, kind: 'wave', emit: 'paintDot', rate: 14 },
      { line: 'multi', w: 2, kind: 'zigzag', emit: 'paintSplat', rate: 6 }],
    plys: [{ line: ['#ffc2cf', '#ffffff'], w: 3, kind: 'smooth', emit: 'heart', rate: 4 },
      { line: ['#ffffff', '#ffc2cf'], w: 2, kind: 'wave', emit: 'fluff', rate: 12 },
      { line: ['#ffd6df', '#ff8fb0'], w: 1.6, kind: 'dots', emit: 'heart', rate: 3 }],
    neon: [{ line: ['#c8fbff', '#7df9ff'], w: 2, kind: 'smooth', emit: 'zap', rate: 10, glow: true },
      { line: ['#7df9ff', '#c76bff'], w: 1.6, kind: 'zigzag', emit: 'zap', rate: 14, glow: true },
      { line: ['#e6c2ff', '#c76bff'], w: 1.4, kind: 'helix', emit: 'zap', rate: 6, glow: true }],
    ekvalizer: [{ line: ['#ffd23f', '#8f6600'], w: 1.8, kind: 'wave', emit: 'note', rate: 5 },
      { line: ['#e6b730', '#8f6600'], w: 1.4, kind: 'smooth', emit: 'bar', rate: 16 },
      { line: ['#fff1a8', '#d9a441'], w: 1.4, kind: 'zigzag', emit: 'note', rate: 7 }],
    jadeit: [{ line: ['#9fe6bb', '#2f7a4c'], w: 2.6, kind: 'wave', emit: 'jadeRing', rate: 3 },
      { line: ['#7fd6a0', '#d6ffe6'], w: 1.8, kind: 'smooth', emit: 'jadeSpark', rate: 14 },
      { line: ['#b9f0cc', '#4fae78'], w: 1.4, kind: 'helix', emit: 'jadeSpark', rate: 8 }],
    perly: [{ line: 'iri', w: 2.6, kind: 'smooth', emit: 'pearl', rate: 6 },
      { line: 'iri', w: 1.6, kind: 'dots', emit: 'shimmer', rate: 14 },
      { line: 'iri', w: 1.4, kind: 'helix', emit: 'pearl', rate: 4 }],
    mince: [{ line: ['#ffd23f', '#a07400'], w: 2, kind: 'smooth', emit: 'coin', rate: 5 },
      { line: ['#ffe27a', '#8a6400'], w: 1.4, kind: 'dots', emit: 'goldSpark', rate: 14 },
      { line: ['#fff1a8', '#c99a12'], w: 1.6, kind: 'wave', emit: 'coin', rate: 3 }],
    cip: [{ line: ['#59f0a0', '#0e6b3c'], w: 1.8, kind: 'step', emit: 'pixel', rate: 10 },
      { line: ['#ffd23f', '#59f0a0'], w: 1.4, kind: 'step', emit: 'bit', rate: 8 },
      { line: ['#7dffbf', '#0e6b3c'], w: 1.4, kind: 'dots', emit: 'pixel', rate: 14 }],
    kola: [{ line: ['#e0a36a', '#7a4320'], w: 2, kind: 'smooth', emit: 'gearlet', rate: 4 },
      { line: ['#ffb35c', '#7a4320'], w: 1.6, kind: 'zigzag', emit: 'copperSpark', rate: 16 },
      { line: ['#ece6de', '#9a8f80'], w: 1.8, kind: 'wave', emit: 'steam', rate: 7 }]
  };
  // vlastní stopa každého míčku (barva a částice); s obrázkovou pálkou se obě čáry proplétají jako copánek
  var BALL_FLIGHT = {
    kastan: { line: ['#d39a5a', '#6b3e14'], emit: 'nutChip', rate: 8 },
    ledovka: { line: ['#d8f5ff', '#7fd3ff'], emit: 'flake', rate: 10 },
    lavak: { line: ['#ffb02e', '#ff4a00'], emit: 'ember', rate: 14 },
    tlapka: { line: ['#ffe27a', '#b8860b'], emit: 'goldSpark', rate: 12 },
    sprej: { line: 'multi', emit: 'paintDot', rate: 10 },
    plysak: { line: ['#ffd6df', '#ff8fb0'], emit: 'fluff', rate: 9 },
    vir: { line: ['#7df9ff', '#c76bff'], emit: 'zap', rate: 9, glow: true },
    repro: { line: ['#ffd23f', '#8f6600'], emit: 'note', rate: 4 },
    jadeitak: { line: ['#9fe6bb', '#2f7a4c'], emit: 'jadeSpark', rate: 10 },
    perla: { line: 'iri', emit: 'shimmer', rate: 10 },
    procesor: { line: ['#59f0a0', '#0e6b3c'], emit: 'bit', rate: 6 },
    hodinky: { line: ['#e0a36a', '#7a4320'], emit: 'gearlet', rate: 3 },
    mramor: { line: ['#f4f4f7', '#9a9aa4'], emit: 'dust', rate: 10 }
  };
  // pálka + míček, které spolu reagují: kde se jejich stopy potkají, vzniká navíc tohle
  var REACT = { 'led|lavak': 'steam', 'vetev|lavak': 'smoke', 'lava|ledovka': 'steam', 'lava|kastan': 'smoke',
    'neon|ledovka': 'zap', 'graffiti|perla': 'shimmer', 'mince|tlapka': 'coin', 'kola|hodinky': 'copperSpark' };
  var BALL_KINDS = ['smooth', 'wave', 'dots', 'zigzag'];
  // ---------- nastavení hráče (⚙, pamatuje si je prohlížeč) ----------
  // upovídanost: [násobek šance na hlášku, odstup mezi běžnými hláškami v ms]; mlčí = žádné komentáře
  // (scénka s komárem a otázky „pokračujem?“ mluví dál)
  var TALK = { more: [1.6, 3500], normal: [1, 6000], less: [0.4, 11000], mute: [0, 1e9] };
  // přehled odznaků v menu hry: skupiny, u každého ikona, titul a ikonky odměn; ťuknutím se ukáže, jak ho získat
  // vzácnost odznaků (barva v nastavení a v přehledu): běžný, neobvyklý, vzácný, epický, legendární
  var RARITY = { first: 'c', easy: 'c', normal: 'c', tinker: 'c', loyal: 'c',
    streak: 'u', night: 'u', sniper: 'u', overheat: 'u', close: 'u', fast: 'u',
    marathon: 'r', comeback: 'r', super: 'r', yarn: 'r', wins50: 'r', clean: 'r',
    angry: 'e', wins100: 'e', wardrobe: 'e',
    hwins5: 'l', hfast: 'l', hclean: 'l', hsniper: 'l', hcomeback: 'l', skelosquad: 'l' };
  // odznaky, které navíc odemknou rámeček kolem fotky (stejné jako PongBadges.FRAMES na serveru)
  var FRAMES = ['angry', 'wins100', 'wardrobe', 'hwins5', 'hfast', 'hclean', 'hsniper', 'hcomeback'];
  var BADGE_GROUPS = [['first', 'easy', 'normal', 'angry', 'clean', 'close', 'fast', 'streak', 'wins50', 'wins100'],
    ['sniper', 'super', 'tinker', 'yarn', 'overheat', 'comeback', 'marathon', 'night', 'loyal', 'wardrobe'],
    ['hwins5', 'hfast', 'hclean', 'hsniper', 'hcomeback', 'skelosquad']];
  // barvy pálky během vylepšení: velká pálka zelená, pomalý Kevin modrá, klidný hopík fialová
  var POWER_COL = {
    big: ['#c6ffd0', '#18a04e', 'rgba(90, 255, 140, .9)'],
    slow: ['#cfe6ff', '#2a62d0', 'rgba(110, 170, 255, .9)'],
    calm: ['#eadcff', '#7a46d0', 'rgba(190, 140, 255, .9)']
  };

  C.data = { W: W, H: H, PAD_W: PAD_W, PAD_H: PAD_H, BALL_R: BALL_R, WIN: WIN, PLAYER_Y: PLAYER_Y, KEVIN_Y: KEVIN_Y, FRAME_W: FRAME_W, FRAME_H: FRAME_H, GLASS: GLASS, TOP_SLOT: TOP_SLOT, GEARS_KEVIN: GEARS_KEVIN, WIN_TOP: WIN_TOP, WIN_BOT: WIN_BOT, BGS: BGS, LEVELS: LEVELS, SHOT: SHOT, SHOT_IDEAL: SHOT_IDEAL, SHOT_SUPER: SHOT_SUPER, LIFT: LIFT, BADGE_ICON: BADGE_ICON, CLAIMABLE: CLAIMABLE, LOOKS: LOOKS, BG_BADGE: BG_BADGE, BG_POS: BG_POS, MOOD: MOOD, MAT: MAT, FLIGHT: FLIGHT, BALL_FLIGHT: BALL_FLIGHT, REACT: REACT, BALL_KINDS: BALL_KINDS, TALK: TALK, RARITY: RARITY, FRAMES: FRAMES, BADGE_GROUPS: BADGE_GROUPS, POWER_COL: POWER_COL };
})();
