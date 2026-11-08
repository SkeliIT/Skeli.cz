// Převod vzhledů chatu z náhledu (work/Skeli.cz-podklady/navrhy/chat-vzhledy/index.html) do css/chat-looks.css.
// Vezme jen vybrané vzhledy (LOOKS), třídy náhledu přejmenuje na skutečné prvky chatu (includes/chat-body.jspf),
// proměnné na --k-*, animace na lk-*, aby se nic nepotkalo se zbytkem webu. Spuštění:
//   node tools/chat-looks.js ../Skeli.cz-podklady/navrhy/chat-vzhledy/index.html src/main/webapp/css/chat-looks.css
// Ručně psaný základ (jak se proměnné použijí na prvky, telefon, slabé telefony) je v tools/chat-looks-base.css.
const fs = require('fs');
const path = require('path');
const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('použití: node tools/chat-looks.js <náhled.html> <výstup.css>'); process.exit(1); }

// stejné seznamy jako model/ChatPrefs (LOOKS_DARK, LOOKS_LIGHT) + společné třídy (sklo, částice, klidné)
const LOOKS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd11', 'd16', 'd18',
  'l1', 's2', 's4', 's11', 's13', 's15', 'l8', 'l10', 'm4', 'o1', 'o2', 'o3', 'o4'];
const COMMON = ['g', 'p', 'calm'];
const KEEP = new Set([...LOOKS, ...COMMON]);
// prvky náhledu, které v chatu nejsou: celé pravidlo pryč
const DROP = /\.(av|reel|cube|bolts|fibers|wave|rec|meter|num|pick|tally|grid)\b|figure|figcaption/;
// proměnné náhledu → --k-* (od nejdelších, ať --them-bg nechytí --bg)
const VARS = ['them-line', 'them-bg', 'them-fg', 'me-line', 'me-bg', 'me-fg', 'me-dim', 'in-line', 'in-bg', 'in-r', 'send-line', 'send-fg', 'send-r', 'send',
  'name-font', 'name', 'dot-ring', 'av-r', 'av', 'bg', 'fg', 'dim', 'line', 'font', 'head', 'day', 'fs', 'bw', 'r',
  'x', 'y', 's', 'd', 'dl', 'sw', 'k', 'z', 'leaf', 'a', 'rot', 'c'];
const VAR_RE = new RegExp('--(' + VARS.join('|') + ')(?![\\w-])', 'g');
// třídy náhledu → prvky chatu
const MAP = [
  [/\.who small\b/g, '.chat-who-state'], [/\.msg\b/g, '.chat-msg'], [/\.them\b/g, '.chat-msg:not(.mine)'], [/\.me\b/g, '.chat-msg.mine'],
  [/\.who\b/g, '.chat-who'], [/\.head\b/g, '.chat-head'], [/\.log\b/g, '.chat-msgs'], [/\.form\b/g, '.chat-form'],
  [/\.input\b/g, '.chat-form textarea'], [/\.send\b/g, '.chat-form button[type=submit]'], [/\.day\b/g, '.chat-day'], [/\.seen\b/g, '.chat-seen'],
  [/\.deco\b/g, '.lk-deco'], [/\.icons\b/g, '.chat-head > button'], [/(^|\s)time\b/g, '$1.chat-meta time']
];

const html = fs.readFileSync(src, 'utf8');
const css = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'));

// rozdělení na pravidla nejvyšší úrovně (s vnořenými bloky @keyframes, @media)
function blocks(text) {
  const res = []; let i = 0;
  while (i < text.length) {
    const open = text.indexOf('{', i);
    if (open < 0) break;
    let depth = 1, j = open + 1;
    while (j < text.length && depth) { if (text[j] === '{') depth++; else if (text[j] === '}') depth--; j++; }
    const head = text.slice(i, open).replace(/\/\*[\s\S]*?\*\//g, '').trim();
    res.push({ head, body: text.slice(open + 1, j - 1) });
    i = j;
  }
  return res;
}

const keyframes = new Map();
const rules = [];
const used = new Set();
for (const b of blocks(css)) {
  if (b.head.startsWith('@keyframes')) { keyframes.set(b.head.split(/\s+/)[1], b.body); continue; }
  if (b.head.startsWith('@property')) continue;   // --a si dopíšeme sami
  if (b.head.startsWith('@')) continue;           // @media (reduced-motion) a podobné řeší základ
  const parts = b.head.split(',').map(p => p.trim()).filter(p => {
    const m = /^\.([a-z]+\d*)/.exec(p);
    return m && KEEP.has(m[1]) && !DROP.test(p);
  });
  if (!parts.length) continue;
  const sel = parts.map(p => {
    let s = p.replace(/^\.([a-z]+\d*)/, '.chat-room.lk-$1');
    for (const [re, to] of MAP) s = s.replace(re, to);
    return s;
  }).join(',\n');
  let body = b.body.replace(VAR_RE, '--k-$1').replace(/'Space Grotesk'/g, "'Exo 2'")
    // jména v náhledu jsou natvrdo (Terka, ty): v chatu je bere z data-who u zprávy (js/chat.js)
    .replace(/'(terka|ty)@squad:~\$ '/g, "attr(data-who) '@squad:~$ '")
    .replace(/'\/\/ (TERKA|JÁ)'/g, "'// ' attr(data-who)");
  for (const m of body.matchAll(/animation(?:-name)?\s*:\s*([^;]+)/g)) m[1].split(/[\s,]+/).forEach(w => used.add(w));
  rules.push(sel + ' {' + body + '}');
  // kořen vzhledu (jen „.d1“, „.g“…): stejné proměnné dostane i okno nastavení, ať má barvy vybraného vzhledu
  const roots = parts.filter(p => /^\.[a-z]+\d*$/.test(p));
  const vars = body.split(';').map(d => d.trim()).filter(d => d.startsWith('--k-'));
  if (roots.length && vars.length) rules.push(roots.map(p => '.chat-settings.lk-' + p.slice(1)).join(', ') + ' { ' + vars.join('; ') + '; }');
}
// animace: jen použité, přejmenované na lk-*
const names = [...keyframes.keys()].filter(n => used.has(n));
let outCss = rules.join('\n').replace(/animation(-name)?(\s*:\s*)([^;]+)/g, (all, n, sep, v) =>
  'animation' + (n || '') + sep + v.replace(/[a-zA-Z][\w-]*/g, w => names.includes(w) ? 'lk-' + w : w));
const kf = names.map(n => '@keyframes lk-' + n + ' {' + keyframes.get(n).replace(VAR_RE, '--k-$1') + '}').join('\n');
const base = fs.readFileSync(path.join(__dirname, 'chat-looks-base.css'), 'utf8');
fs.writeFileSync(out, '/* VYGENEROVÁNO nástrojem tools/chat-looks.js z náhledu vzhledů chatu – ruční úpravy dělat v tools/chat-looks-base.css nebo v náhledu. */\n'
  + base + '\n/* ---------- vzhledy ---------- */\n' + outCss + '\n' + kf + '\n');
console.log('vzhledů:', LOOKS.length, 'pravidel:', rules.length, 'animací:', names.length, '→', out);
