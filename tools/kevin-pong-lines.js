// Hlášky do hry Kevin Pong: z textových souborů (klíč na řádku, pod ním „- hláška“) udělá
// src/main/webapp/js/kevin-pong-lines.js (window.KEVIN_PONG_LINES = { cs: { start: [...], ... }, en: {...} }).
// Hra ho načte až při otevření (zbytek webu nezpomaluje).
//   node tools/kevin-pong-lines.js cs=../kevin-hlasky-pong.md [en=../kevin-hlasky-pong-en.md ...]
// Vyřazené hlášky (slabé, opakující se vtip, skoro sprosté) jsou v SKIP – porovnává se celý text.
const fs = require('fs');
const path = require('path');

const SKIP = new Set([
  'Gól jako zlatá rybka v akváriu. Krásnej a můj.',
  'Hopík sviští jak závodní šnek po energetickým koberci.',
  'Sakra… ne, vlastně jen škoda. Komár má štěstí.',
  'Mám podezření, že hopík je kulatější, než se na první pohled zdá.',
]);

const out = {};
for (const arg of process.argv.slice(2)) {
  const [lang, file] = arg.split('=');
  const lines = {};
  let key = null;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('- ')) {
      const text = line.slice(2).trim();
      if (key && !SKIP.has(text)) lines[key].push(text);
    } else {
      key = line.replace(/^#+\s*/, '').split(/\s/)[0];
      lines[key] = lines[key] || [];
    }
  }
  out[lang] = lines;
  console.log(lang, Object.keys(lines).length, 'situací,', Object.values(lines).reduce((n, a) => n + a.length, 0), 'hlášek');
}
const target = path.join(__dirname, '..', 'src', 'main', 'webapp', 'js', 'kevin-pong-lines.js');
fs.writeFileSync(target,
  '// Hlášky MC Kevina do hry Kevin Pong – vygenerováno nástrojem tools/kevin-pong-lines.js, neupravovat ručně.\n' +
  'window.KEVIN_PONG_LINES = ' + JSON.stringify(out, null, 1) + ';\n');
console.log('hotovo', target);
