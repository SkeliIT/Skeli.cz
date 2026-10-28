<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%-- Karaoke cinema (preview of the coming big karaoke): /karaoke/{song uuid}, KaraokeCinemaServlet fills kinoJson.
     Two rooms: Prostor (/kino/prostor.js, a looping video; the default) and Ořechový salon (/kino/domov.js); switching loads the page again.
     A loading screen stays up until the room is built (no jerk on the way in). Czech only for now. --%>
<% String v = "5.9.5"; %>
<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Karaoke – <c:out value="${kinoTitle}"/> | Skeli</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://www.youtube-nocookie.com">
<style>
@font-face { font-family: 'Comforter Brush'; font-display: swap; src: url(/fonts/comforter-brush-latin-ext.woff2) format('woff2'); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F; }
@font-face { font-family: 'Comforter Brush'; font-display: swap; src: url(/fonts/comforter-brush-latin.woff2) format('woff2'); unicode-range: U+0000-00FF, U+2000-206F; }
@font-face { font-family: 'Exo 2'; font-weight: 500; font-display: swap; src: url(/fonts/exo-2-500-latin-ext.woff2) format('woff2'); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F; }
@font-face { font-family: 'Exo 2'; font-weight: 500; font-display: swap; src: url(/fonts/exo-2-500-latin.woff2) format('woff2'); unicode-range: U+0000-00FF, U+2000-206F; }
@font-face { font-family: 'Oswald'; font-weight: 200 700; font-display: swap; src: url(/fonts/oswald-latin-ext.woff2) format('woff2'); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF; }
@font-face { font-family: 'Oswald'; font-weight: 200 700; font-display: swap; src: url(/fonts/oswald-latin.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Bruno Ace SC'; font-weight: 400; font-display: swap; src: url(/fonts/bruno-ace-sc-400-latin-ext.woff2) format('woff2'); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF; }
@font-face { font-family: 'Bruno Ace SC'; font-weight: 400; font-display: swap; src: url(/fonts/bruno-ace-sc-400-latin.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212, U+FEFF, U+FFFD; }

:root { --gold: #e6b730; --gold-deep: #b8860b; --ink: #f4efe6; --hot: #ffd98a; --hot2: rgba(230, 183, 48, .55); --fs: clamp(22px, 2.6vw, 48px); }
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; background: #030304; color: var(--ink); overflow: hidden; font-family: 'Oswald', system-ui, sans-serif; }
button { font: inherit; color: inherit; }

/* layers, back to front: the 3D room (with bloom) | the clip, placed in 3D | light beams and haze in front of
   the clip | the words | the controls */
.layer { position: fixed; inset: 0; width: 100%; height: 100%; }
#back { display: block; }
#css3d { pointer-events: none; }
#front { display: block; pointer-events: none; }
#css3d .clip { pointer-events: auto; position: relative; width: 1280px; height: 720px; background: #000; overflow: hidden; }
.clip iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.clip .poster { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.clip .catch { position: absolute; inset: 0; cursor: pointer; transition: background .5s; }
.clip .catch.paused { background: rgba(0, 0, 0, .55); }
.clip .catch.paused::after, .clip .big-play { content: ""; position: absolute; left: 50%; top: 50%; width: 150px; height: 150px; margin: -75px 0 0 -75px; border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, .35); background: rgba(0, 0, 0, .3) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M8 5v14l11-7z'/%3E%3C/svg%3E") 55% 50% / 60px no-repeat; }
.clip .big-play { cursor: pointer; }
.clip .big-play[hidden] { display: none; }
.clip .power { position: absolute; inset: 0; background: #000; pointer-events: none; }
.sim .clip .poster { animation: drift 40s ease-in-out infinite alternate; }
@keyframes drift { to { transform: scale(1.12) translate(-2%, 1%); } }

/* corners */
.brand { position: fixed; left: 22px; top: 18px; display: flex; align-items: center; gap: 14px; opacity: .8; z-index: 4; }
.squad { width: 120px; aspect-ratio: 720 / 182; background: linear-gradient(100deg, #e6b730, #c99a12 45%, #8f6600 70%, #e6b730);
  -webkit-mask: url(/img/squad-logo.webp) center / contain no-repeat; mask: url(/img/squad-logo.webp) center / contain no-repeat; }
.brand-k { font: 400 11px 'Bruno Ace SC'; letter-spacing: .32em; color: rgba(244, 239, 230, .55); }
.song-tag { position: fixed; right: 24px; top: 20px; text-align: right; z-index: 4; }
.song-tag b { display: block; font: 400 15px 'Bruno Ace SC'; letter-spacing: .06em; color: var(--gold); }
.song-tag span { font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: rgba(244, 239, 230, .5); }

/* ---------- the words: two lines at most; each word flies in out of the depth (from the screen) ---------- */
.lyrics { position: fixed; left: 0; right: 0; z-index: 3; height: calc(var(--fs) * 3.2); pointer-events: none; font-size: var(--fs);
  perspective: 620px; perspective-origin: 50% -60%; }
.lyrics::before { content: ""; position: absolute; left: 50%; top: 50%; width: min(1150px, 98vw); height: 190%; transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(0, 0, 0, .5), rgba(0, 0, 0, 0)); }
.line { position: absolute; left: 50%; bottom: .2em; width: min(92vw, 1150px); text-align: center; line-height: 1.22; letter-spacing: .015em;
  transform: translate(-50%, var(--y, 0px)); transform-style: preserve-3d;
  transition: transform .9s cubic-bezier(.2, .75, .2, 1), opacity .7s ease, filter .7s ease; }
/* the lettering of each room (body[data-look]). Waiting: dimmer; sung: bright; being sung: the room's highlight */
.line { transition: transform .9s cubic-bezier(.2, .75, .2, 1), opacity 1s ease .15s, filter 1s ease .15s; }
.line.gone { opacity: 0; filter: blur(6px); transform: translate(-50%, calc(var(--y, 0px) - .8em)); }
.lyrics .w { display: inline-block; opacity: 0; margin: 0 .12em; transition: color .35s, text-shadow .35s, filter .35s, transform .25s; }
.lyrics .w.in { opacity: 1; }
.lyrics .c { display: inline-block; text-align: center; }
/* A · black luxury: neon – an arrived word is an unlit glass tube that lights up (with a flicker) when sung */
[data-look="a"] .lyrics { font-family: 'Comforter Brush', cursive; font-size: calc(var(--fs) * 1.35); }
[data-look="a"] .lyrics .w { color: transparent; -webkit-text-stroke: 1px rgba(255, 225, 235, .38); }
[data-look="a"] .lyrics .w.lit { color: #fff0f6; -webkit-text-stroke: 0; text-shadow: 0 0 2px #fff, 0 0 8px #ff4fa8, 0 0 18px #ff2d8a, 0 0 38px rgba(255, 30, 130, .55); animation: neon-on .45s steps(1); }
[data-look="a"] .lyrics .w.now { color: #fff; text-shadow: 0 0 2px #fff, 0 0 10px #ffd34f, 0 0 22px #ffb000, 0 0 48px rgba(255, 170, 0, .7); }
@keyframes neon-on { 0%, 30%, 60% { opacity: 1; } 15%, 45% { opacity: .2; } }
/* P · Prostor: a looping video of the space (prostor.js) under everything; the clip is bent onto the panel in it;
   three lines on the floor: the one before grey, the one being sung filling orange word by word, the next grey */
.space { position: fixed; z-index: 0; object-fit: fill; pointer-events: none; }
.space-glitch { position: fixed; z-index: 0; pointer-events: none; opacity: 0; backdrop-filter: blur(9px); -webkit-backdrop-filter: blur(9px);
  -webkit-mask: radial-gradient(closest-side, #000 45%, transparent); mask: radial-gradient(closest-side, #000 45%, transparent); }
.space.upright { -webkit-mask: linear-gradient(180deg, transparent, #000 12%, #000 86%, transparent); mask: linear-gradient(180deg, transparent, #000 12%, #000 86%, transparent); }
[data-look="p"] #css3d .clip { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; transform-origin: 0 0; background: transparent; box-shadow: none;
  /* a tilted box gets stair-stepped edges (no anti-aliasing on 3D transforms): fade its last few pixels instead */
  -webkit-mask: linear-gradient(90deg, transparent, #000 7px, #000 calc(100% - 7px), transparent), linear-gradient(180deg, transparent, #000 7px, #000 calc(100% - 7px), transparent);
  -webkit-mask-composite: source-in; mask: linear-gradient(90deg, transparent, #000 7px, #000 calc(100% - 7px), transparent), linear-gradient(180deg, transparent, #000 7px, #000 calc(100% - 7px), transparent);
  mask-composite: intersect; }
[data-look="p"] #css3d .clip .poster, [data-look="p"] #css3d .clip .player { background: #000; }
/* the golden rim round the clip (prostor.js sets --k = the bass, 0–1): the colours of the light lines in the space
   flowing slowly round it, a spark running round, a glow that flares on the beat */
@property --rim-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@property --rim-b { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
[data-look="p"] #css3d .clip-rim { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; transform-origin: 0 0; pointer-events: none; --k: 0;
  filter: drop-shadow(0 0 calc(10px + var(--k) * 26px) rgba(255, 166, 40, .9)) drop-shadow(0 0 calc(40px + var(--k) * 50px) rgba(255, 120, 20, .45)); }
.clip-rim::before, .clip-rim::after { content: ""; position: absolute; inset: -8px; padding: 8px; border-radius: 5px;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); }
.clip-rim::before { background: conic-gradient(from var(--rim-a), #7a5200, #e6b730 18%, #ff9a2e 32%, #ffe08a 42%, #e6b730 55%, #8f6600 70%, #c99a12 86%, #7a5200);
  filter: brightness(calc(.8 + var(--k) * .9)) blur(1.4px);   /* the soft edge keeps the tilted, shrunk ring from looking jagged */
  animation: rim-flow 16s linear infinite; }
.clip-rim::after { inset: -10px; padding: 10px; background: conic-gradient(from var(--rim-b), transparent 0 84%, rgba(255, 220, 140, .3) 89%, #fff7dc 92.5%, rgba(255, 200, 90, .3) 95%, transparent 98%);
  filter: blur(1.4px); animation: rim-run 7s linear infinite; }
/* embers rising through the space (prostor.js draws them; faster and brighter on the bass) */
.space-embers { position: fixed; inset: 0; z-index: 0; width: 100%; height: 100%; pointer-events: none; }
/* nebulae, comets, hyperspace, gold dust and fireworks (space-fx.js), with the embers behind the clip */
.space-fx { position: fixed; inset: 0; z-index: 0; width: 100%; height: 100%; pointer-events: none; }
@keyframes rim-flow { to { --rim-a: 360deg; } }
@keyframes rim-run { to { --rim-b: 360deg; } }
@media (prefers-reduced-motion: reduce) { .clip-rim::before, .clip-rim::after { animation: none; } }
[data-look="p"] .clip .catch.paused::after, [data-look="p"] .clip .big-play { width: 220px; height: 220px; margin: -110px 0 0 -110px; background-size: 90px; }
[data-look="p"] .lyrics { height: auto; perspective: none; font-family: 'Bruno Ace SC', sans-serif; font-size: var(--fs, 30px); }
[data-look="p"] .lyrics::before { width: min(1100px, 100vw); height: 230%; background: radial-gradient(closest-side, rgba(0, 0, 0, .62), rgba(0, 0, 0, .3) 60%, rgba(0, 0, 0, 0)); }
/* one line, out of smoke (prostor.js): a word comes out of a puff a moment before it is sung, white, and turns gold when
   it is sung; the line drifts up into smoke when the next one starts */
[data-look="p"] .pstack { position: relative; display: flex; flex-direction: column; align-items: center; gap: .35em; min-height: 5.6em; }
[data-look="p"] .pline { position: relative; width: min(94vw, 1200px); text-align: center; line-height: 1.3; letter-spacing: .03em; transition: transform .6s cubic-bezier(.2, .8, .2, 1), opacity .6s; }
[data-look="p"] .pline.next { opacity: .5; }
[data-look="p"] .lyrics .w { opacity: 0; margin: 0 .14em; color: #f1f3f8; text-shadow: 0 2px 14px rgba(0, 0, 0, .85); transition: color .25s, text-shadow .25s; }
[data-look="p"] .lyrics .w.in { animation: p-smoke-in 1s cubic-bezier(.2, .7, .2, 1) forwards; }
[data-look="p"] .lyrics .w.sung { color: #ffc24a; text-shadow: 0 0 14px rgba(255, 170, 40, .75), 0 2px 12px rgba(0, 0, 0, .8); }
@keyframes p-smoke-in { from { opacity: 0; filter: blur(14px); transform: scale(1.18) translateY(.15em); } to { opacity: 1; filter: none; transform: none; } }
[data-look="p"] .pline.instant .w.in { animation: none; opacity: 1; }
@media (max-height: 500px) { [data-look="p"] .song-tag { display: none; } }
[data-look="p"] .pline.out { position: absolute; left: 0; right: 0; margin: 0 auto; transition: transform 1.6s ease, opacity 1.6s ease, filter 1.6s ease; transform: translateY(-1.1em) scale(1.04); opacity: 0; filter: blur(10px); }
.line.instant, .line.instant .c, .line.instant .w { animation: none !important; transition: none !important; }

.title-card { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); text-align: center; width: 92vw; transition: opacity 1.4s ease, filter 1.4s ease, transform 1.4s ease; }
.title-card b { display: block; font: 400 calc(var(--fs) * 1.25) 'Bruno Ace SC'; letter-spacing: .08em;
  background: linear-gradient(100deg, #8f6600, #e6b730 30%, #fff1c2 50%, #e6b730 70%, #8f6600); -webkit-background-clip: text; background-clip: text; color: transparent;
  background-size: 250% 100%; animation: sheen 6s ease-in-out infinite; }
.title-card span { display: block; margin-top: .5em; font-size: calc(var(--fs) * .42); letter-spacing: .5em; text-transform: uppercase; color: rgba(244, 239, 230, .5); }
@keyframes sheen { 0%, 100% { background-position: 100% 0; } 50% { background-position: 0 0; } }
.title-card.gone { opacity: 0; filter: blur(12px); transform: translate(-50%, -80%); }
.dots { position: absolute; left: 50%; bottom: .55em; transform: translateX(-50%); display: flex; gap: .5em; opacity: 0; transition: opacity .4s; }
.dots.show { opacity: 1; }
.dots i { width: .32em; height: .32em; border-radius: 50%; background: var(--gold); box-shadow: 0 0 .5em var(--gold); transition: opacity .25s, transform .25s; }
.dots i.out { opacity: .15; transform: scale(.6); box-shadow: none; }

/* ---------- controls ---------- */
.controls { position: fixed; z-index: 5; left: 50%; bottom: max(16px, env(safe-area-inset-bottom)); transform: translateX(-50%);
  width: min(880px, calc(100vw - 24px)); display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 999px;
  background: rgba(12, 12, 14, .55); border: 1px solid rgba(255, 255, 255, .08); backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%);
  transition: opacity .6s ease, transform .6s ease; }
.idle .controls { opacity: 0; transform: translate(-50%, 14px); pointer-events: none; }
.idle { cursor: none; }
.cb { flex: none; width: 40px; height: 40px; border-radius: 50%; border: 0; background: transparent; display: grid; place-items: center; cursor: pointer; color: rgba(244, 239, 230, .85); transition: background .2s, color .2s; }
.cb:hover { background: rgba(255, 255, 255, .08); color: var(--gold); }
.cb.main { background: var(--gold); color: #1a1406; }
.cb.main:hover { background: #f3c84a; color: #1a1406; }
.cb svg { width: 18px; height: 18px; fill: currentColor; }
.time { flex: none; font-size: 13px; letter-spacing: .06em; color: rgba(244, 239, 230, .6); min-width: 82px; text-align: center; font-variant-numeric: tabular-nums; }
.bar { position: relative; flex: 1; height: 40px; cursor: pointer; }
.bar .track { position: absolute; left: 0; right: 0; top: 50%; height: 3px; margin-top: -1.5px; border-radius: 3px; background: rgba(255, 255, 255, .14); }
.bar .fill { position: absolute; left: 0; top: 50%; height: 3px; margin-top: -1.5px; border-radius: 3px; background: linear-gradient(90deg, var(--gold-deep), var(--gold)); box-shadow: 0 0 10px rgba(230, 183, 48, .6); }
.bar .tick { position: absolute; top: 50%; width: 2px; height: 7px; margin-top: -3.5px; background: rgba(255, 255, 255, .22); border-radius: 1px; }
.vol { flex: none; width: 70px; accent-color: var(--gold); }

/* ---------- the way in ---------- */
.lobby { position: fixed; inset: 0; display: grid; place-items: center; text-align: center; z-index: 6;
  background: radial-gradient(ellipse at 50% 40%, rgba(3, 3, 4, .35), rgba(3, 3, 4, .9) 70%); transition: opacity 1.2s ease; }
.lobby.gone { opacity: 0; pointer-events: none; }
.lobby .k { font: 400 12px 'Bruno Ace SC'; letter-spacing: .5em; color: var(--gold); }
.lobby h1 { margin: .35em 0 .1em; font: 400 clamp(34px, 6vw, 84px) 'Bruno Ace SC'; letter-spacing: .04em; color: var(--ink); text-shadow: 0 0 40px rgba(230, 183, 48, .35); }
.lobby p { margin: 0 0 2em; letter-spacing: .3em; text-transform: uppercase; color: rgba(244, 239, 230, .5); font-size: 14px; }
.enter { display: inline-flex; align-items: center; gap: 12px; padding: 16px 30px; border-radius: 999px; border: 0; cursor: pointer;
  background: var(--gold); color: #1a1406; font: 500 17px 'Oswald'; letter-spacing: .12em; text-transform: uppercase;
  box-shadow: 0 0 0 0 rgba(230, 183, 48, .5), 0 20px 50px -15px rgba(230, 183, 48, .6); animation: breath 2.8s ease-in-out infinite; }
@keyframes breath { 50% { box-shadow: 0 0 0 10px rgba(230, 183, 48, 0), 0 20px 50px -15px rgba(230, 183, 48, .6); } }
.lobby small { display: block; margin-top: 18px; color: rgba(244, 239, 230, .4); font-size: 13px; letter-spacing: .08em; }
.pc-hint { display: inline-flex; align-items: center; gap: 8px; margin-top: 22px; padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(230, 183, 48, .3); color: rgba(244, 239, 230, .6); font-size: 13px; letter-spacing: .04em; }
@media (max-width: 900px) { .pc-hint { color: var(--gold); border-color: rgba(230, 183, 48, .6); background: rgba(230, 183, 48, .08); } }
/* a phone held upright: ask to turn it (you can go on anyway) */
.rotate { position: fixed; inset: 0; z-index: 8; display: grid; place-items: center; text-align: center; padding: 24px; background: rgba(3, 3, 4, .92); backdrop-filter: blur(8px); }
.rotate[hidden] { display: none; }
.rotate p { margin: 22px 0 26px; line-height: 1.5; color: rgba(244, 239, 230, .7); }
.rotate b { font: 400 18px 'Bruno Ace SC'; color: var(--gold); letter-spacing: .04em; }
.enter.small { padding: 11px 22px; font-size: 14px; animation: none; background: transparent; color: var(--gold); border: 1px solid rgba(230, 183, 48, .6); box-shadow: none; }
.phone-ico { width: 46px; height: 80px; margin: 0 auto; border: 3px solid var(--gold); border-radius: 10px; animation: turn 2.4s ease-in-out infinite; }
@keyframes turn { 0%, 25% { transform: rotate(0); } 55%, 85% { transform: rotate(-90deg); } 100% { transform: rotate(0); } }
#fx { pointer-events: none; z-index: 2; }
/* Kevin's speech bubble: the bit of the line he is rapping */
  background: #fff8e6; color: #15110a; font: 500 clamp(15px, 1.4vw, 20px)/1.25 'Oswald'; text-align: center; box-shadow: 0 8px 30px rgba(0, 0, 0, .5), 0 0 0 2px #e6b730;
  pointer-events: none; transition: opacity .3s, transform .3s; }
/* end titles over the closed curtain */
.credits { position: fixed; inset: 0; z-index: 3; overflow: hidden; pointer-events: none; transition: opacity 1s; }
.credits[hidden] { display: block; opacity: 0; }
.roll { position: absolute; left: 0; right: 0; top: 100%; text-align: center; animation: none; }
.credits.run .roll { animation: roll 16s linear forwards; }
@keyframes roll { to { transform: translateY(calc(-100vh - 100%)); } }
.roll .ct { display: block; font: 400 clamp(28px, 4vw, 60px) 'Bruno Ace SC'; color: var(--gold); text-shadow: 0 0 30px rgba(230, 183, 48, .5); margin-bottom: .2em; }
.roll .cl { display: block; margin-top: 2.2em; font-size: 13px; letter-spacing: .4em; text-transform: uppercase; color: rgba(244, 239, 230, .45); }
.roll .cv { display: block; margin-top: .4em; font: 400 clamp(18px, 2vw, 28px) 'Oswald'; color: var(--ink); }
.roll .cs { display: block; width: 220px; height: 56px; margin: 3em auto 0; background: linear-gradient(100deg, #e6b730, #fff1c2 50%, #e6b730);
  -webkit-mask: url(/img/squad-logo.webp) center / contain no-repeat; mask: url(/img/squad-logo.webp) center / contain no-repeat; }
/* the room picker: rows like the Texty page – name and a line on the left, the room fading in on the right */
.room-pick { display: grid; grid-template-columns: repeat(2, minmax(0, 300px)); justify-content: center; gap: 10px; margin: 0 auto 26px; }
.room-k { grid-column: 1 / -1; font: 400 11px 'Bruno Ace SC'; letter-spacing: .3em; color: rgba(244, 239, 230, .55); }
.room { position: relative; display: flex; align-items: center; height: 78px; padding: 0 0 0 16px; border-radius: 12px; overflow: hidden; text-align: left;
  border: 1px solid rgba(255, 255, 255, .1); background: #0c0c0e; color: var(--ink); cursor: pointer; transition: border-color .2s, transform .2s, box-shadow .2s; }
.room img { position: absolute; right: 0; top: 0; width: 70%; height: 100%; object-fit: cover; object-position: 50% 40%;
  -webkit-mask: linear-gradient(90deg, transparent, #000 48%); mask: linear-gradient(90deg, transparent, #000 48%); transition: transform .5s ease; }
.room:hover { transform: translateY(-2px); border-color: rgba(230, 183, 48, .5); }
.room:hover img { transform: scale(1.06); }
.room .rt { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 3px; max-width: 52%; text-shadow: 0 1px 8px #000; }
.room b { font: 400 13px 'Bruno Ace SC'; letter-spacing: .04em; }
.room small { font-size: 12px; line-height: 1.25; color: rgba(244, 239, 230, .6); }
.room[aria-pressed="true"] { border-color: var(--gold); box-shadow: 0 0 0 1px var(--gold), 0 10px 30px -12px rgba(230, 183, 48, .6); }
.room[aria-pressed="true"] b { color: var(--gold); }
.rooms { position: absolute; right: 8px; bottom: calc(100% + 10px); display: grid; grid-template-columns: 270px; gap: 8px; padding: 10px; border-radius: 16px;
  background: rgba(12, 12, 14, .88); border: 1px solid rgba(255, 255, 255, .1); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
.rooms[hidden], .room-pick[hidden], .cb.room-btn[hidden] { display: none; }
.rooms .room { height: 66px; }
@media (max-width: 760px) { .room-pick { grid-template-columns: minmax(0, 1fr); width: 92vw; } .rooms { grid-template-columns: 1fr; width: 86vw; right: 50%; transform: translateX(50%); } }
.cb.room-btn { width: auto; padding: 0 14px 0 12px; gap: 7px; display: inline-flex; align-items: center; border-radius: 999px; border: 1px solid rgba(230, 183, 48, .45); color: var(--gold); font-size: 13px; letter-spacing: .06em; text-transform: uppercase; }
@media (max-width: 700px) { .cb.room-btn span { display: none; } .cb.room-btn { padding: 0; width: 40px; } }
.back-song { color: var(--gold); margin-left: 10px; }
/* always visible, top left: back to the site from the lobby, out of the cinema once inside */
.kino-exit { position: fixed; left: 18px; top: 16px; z-index: 7; display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px 0 14px; border-radius: 999px;
  background: rgba(12, 12, 14, .7); border: 1px solid rgba(230, 183, 48, .55); color: var(--gold); font: 500 14px 'Oswald', sans-serif; letter-spacing: .08em; text-transform: uppercase; text-decoration: none;
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); transition: opacity .6s, background .2s, color .2s; }
.kino-exit:hover { background: var(--gold); color: #1a1406; }
.idle .kino-exit { opacity: .35; }
.kino-exit .ke-ico { font-size: 17px; line-height: 1; }
.brand { display: none; }
/* the lobby scrolls when it is taller than the screen (a phone): from the top, under the exit */
.lobby { overflow-y: auto; padding: 70px 16px 28px; }
@media (max-width: 760px), (max-height: 820px) {
  .lobby { place-items: start center; }
  .lobby h1 { font-size: clamp(30px, 9vw, 60px); }
  .room { height: 62px; }
}
/* leaving: the picture fades to black, then the site comes back */
body::after { content: ""; position: fixed; inset: 0; z-index: 50; background: #000; opacity: 0; pointer-events: none; transition: opacity 1.3s ease; }
body.fading::after { opacity: 1; pointer-events: auto; }
/* the loading screen: up until the room is built and its first frames are drawn (window.kinoLoaded) */
.loader { position: fixed; inset: 0; z-index: 9; display: grid; place-items: center; text-align: center; background: #030304; transition: opacity .9s ease, visibility 0s linear .9s; }
.loader.gone { opacity: 0; visibility: hidden; }
.loader .squad { width: min(280px, 60vw); aspect-ratio: 720 / 182; margin: 0 auto; background: linear-gradient(100deg, #8f6600, #e6b730 35%, #fff1c2 50%, #e6b730 65%, #8f6600) 0 0 / 250% 100%;
  -webkit-mask: url(/img/squad-logo.webp) center / contain no-repeat; mask: url(/img/squad-logo.webp) center / contain no-repeat; animation: sheen 2.6s ease-in-out infinite; }
.loader .ld-k { margin-top: 22px; font: 400 12px 'Bruno Ace SC'; letter-spacing: .5em; color: rgba(244, 239, 230, .55); }
.loader .ld-bar { width: min(240px, 60vw); height: 2px; margin: 18px auto 0; border-radius: 2px; background: rgba(255, 255, 255, .1); overflow: hidden; }
.loader .ld-bar i { display: block; width: 8%; height: 100%; background: linear-gradient(90deg, var(--gold-deep), var(--gold)); box-shadow: 0 0 10px rgba(230, 183, 48, .7); transition: width .4s ease; }
.nogl { position: fixed; inset: 0; display: none; place-items: center; z-index: 7; background: #030304; text-align: center; padding: 24px; }

@media (max-width: 700px) {
  :root { --fs: clamp(19px, 5.6vw, 28px); }
  .brand, .song-tag, .vol, .time { display: none; }
  .controls { gap: 2px; }
}
@media (prefers-reduced-motion: reduce) {
  .line, .w, .title-card { transition-duration: .01s !important; }
  .title-card b, .enter, .sim .clip .poster { animation: none; }
}
</style>
<script type="importmap">{ "imports": { "three": "/js/vendor/three/three.module.min.js" } }</script>
</head>
<body>
<div class="loader" id="loader" role="status" aria-live="polite"><div><div class="squad" aria-hidden="true"></div><div class="ld-k">Připravujeme kino</div><div class="ld-bar"><i id="ldBar"></i></div></div></div>
<canvas class="layer" id="back" aria-hidden="true"></canvas>
<div class="layer" id="css3d"></div>
<canvas class="layer" id="front" aria-hidden="true"></canvas>

<canvas class="layer" id="fx" aria-hidden="true"></canvas>
<div class="credits" id="credits" hidden><div class="roll" id="roll"></div></div>
<a class="kino-exit" id="kinoExit" href="/karaoke-kino"><span class="ke-ico" aria-hidden="true">←</span> <span class="ke-txt">Zpět na web</span></a>
<div class="brand"><div class="squad" role="img" aria-label="SKELO SQUAD"></div><span class="brand-k">Karaoke</span></div>
<div class="song-tag"><b id="tagTitle"></b><span id="tagArtist"></span></div>
<div class="lyrics" id="lyrics" aria-live="off">
  <div class="title-card" id="titleCard"><b></b><span></span></div>
  <div class="dots" id="dots"><i></i><i></i><i></i></div>
</div>
<div class="controls" id="controls">
  <button class="cb" id="exit" title="Odejít (Esc)" aria-label="Odejít"><svg viewBox="0 0 24 24"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg></button>
  <button class="cb" id="back5" title="Zpět o 5 s (←)" aria-label="Zpět o 5 sekund"><svg viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6zm.5-6 8.5 6V6z"/></svg></button>
  <button class="cb main" id="pp" title="Přehrát / pauza (mezerník)" aria-label="Přehrát"><svg viewBox="0 0 24 24" id="ppIcon"><path d="M8 5v14l11-7z"/></svg></button>
  <button class="cb" id="fwd5" title="Dopředu o 5 s (→)" aria-label="Dopředu o 5 sekund"><svg viewBox="0 0 24 24"><path d="m4 18 8.5-6L4 6zm9-12v12l8.5-6z"/></svg></button>
  <span class="time" id="time">0:00 / 0:00</span>
  <div class="bar" id="bar"><div class="track"></div><div class="fill" id="fill"></div></div>
  <input class="vol" id="vol" type="range" min="0" max="100" value="90" aria-label="Hlasitost">
  <button class="cb room-btn" id="roomBtn" title="Změnit pokoj" aria-label="Změnit pokoj"><svg viewBox="0 0 24 24"><path d="M4 18v3h3v-3h10v3h3v-6H4zm15-8h3v3h-3zM2 10h3v3H2zm15 3H7V5c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2z"/></svg><span>Pokoj</span></button>
  <div class="rooms" id="rooms" hidden>
      <button type="button" class="room" data-room="p" aria-pressed="false"><span class="rt"><b>Prostor</b><small>Kameny ve vzduchu, zlaté světlo</small></span><img src="/kino/rooms/p.webp" loading="lazy" alt=""></button>
      <button type="button" class="room" data-room="a" aria-pressed="false"><span class="rt"><b>Ořechový salon</b><small>Ořech, kůže, noční město</small></span><img src="/kino/rooms/a.webp" loading="lazy" alt=""></button>
  </div>
  <button class="cb" id="fs" title="Celá obrazovka (F)" aria-label="Celá obrazovka"><svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zM14 5v2h3v3h2V5z"/></svg></button>
</div>
<div class="lobby" id="lobby">
  <div>
    <div class="k">KARAOKE</div>
    <h1 id="lobbyTitle"></h1>
    <p id="lobbyArtist"></p>
    <div class="room-pick" aria-label="Vyber si pokoj">
      <div class="room-k">Vyber si pokoj</div>
      <button type="button" class="room" data-room="p" aria-pressed="false"><span class="rt"><b>Prostor</b><small>Kameny ve vzduchu, zlaté světlo</small></span><img src="/kino/rooms/p.webp" loading="lazy" alt=""></button>
      <button type="button" class="room" data-room="a" aria-pressed="false"><span class="rt"><b>Ořechový salon</b><small>Ořech, kůže, noční město</small></span><img src="/kino/rooms/a.webp" loading="lazy" alt=""></button>
    </div>
    <button class="enter" id="enter"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Vstoupit do kina</button>
    <small>Pusť si zvuk a dej celou obrazovku (F). <a class="back-song" href="/karaoke-kino">← všechny písně</a></small>
    <div class="pc-hint"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2zM4 6h16v10H4z"/></svg> Kino si nejlíp užiješ na počítači s velkou obrazovkou.</div>
  </div>
</div>
<div class="rotate" id="rotate" hidden>
  <div>
    <div class="phone-ico" aria-hidden="true"></div>
    <p><b>Otoč telefon na šířku</b><br>Kino je široké jako plátno – na šířku uvidíš celý sál.</p>
    <button class="enter small" id="rotateAnyway">I tak pokračovat</button>
  </div>
</div>
<div class="nogl" id="nogl"><p>Tenhle prohlížeč neumí 3D grafiku (WebGL). Zkus Chrome, Edge nebo Firefox.</p></div>

<script>window.KDATA = <%= request.getAttribute("kinoJson") %>;</script>
<script src="/js/yt-clock.js?v=<%= v %>"></script>
<script>
  // the room: p = Prostor (prostor.js, the default), a = Ořechový salon (domov.js); switching loads the page again
  var ROOM = new URLSearchParams(location.search).get("v");
  try { if (!ROOM) ROOM = localStorage.getItem("kinoRoom"); } catch (e) {}
  if (ROOM !== "a") ROOM = "p";
  // the Ořechový salon is a heavy 3D room: on a phone or tablet (an iPhone above all) or a weak computer the
  // browser runs out of memory, drops the page and loads it again and again (the picker "blinks", the cinema
  // throws you out). There only Prostor is offered. And on any device: when the salon went down on its last load
  // (the page came back without leaving it properly), Prostor this time.
  var weak = /iP(hone|od|ad)|Android/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    || Math.min(screen.width, screen.height) < 600 || (navigator.deviceMemory && navigator.deviceMemory < 4);
  var crashed = false;
  try { crashed = sessionStorage.getItem("kinoTry") === "a"; sessionStorage.removeItem("kinoTry"); } catch (e) {}
  if (weak || crashed) {
    ROOM = "p";
    document.querySelectorAll('[data-room="a"]').forEach(function (b) { b.remove(); });
    document.querySelector(".room-pick").hidden = true;   // one room: nothing to pick
    document.getElementById("roomBtn").hidden = true;
  }
  if (ROOM === "a") {
    try { sessionStorage.setItem("kinoTry", "a"); } catch (e) {}
    addEventListener("pagehide", function () { try { sessionStorage.removeItem("kinoTry"); } catch (e) {} });   // left properly
  }
  if (ROOM === "p") document.body.classList.add("cinema");
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-room]"); if (!b) return;
    var k = b.dataset.room, cinema = document.body.classList.contains("cinema");
    if (k === "p" ? !cinema : cinema) { try { localStorage.setItem("kinoRoom", k); } catch (er) {} location.search = "?v=" + k; }
  });
  if (ROOM === "p") {
    document.querySelectorAll("[data-room]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.room === "p" ? "true" : "false"); });
    document.getElementById("roomBtn").onclick = function (e) { e.stopPropagation(); var r = document.getElementById("rooms"); r.hidden = !r.hidden; };
  }
</script>
<script>
  // a broken script shows its error on the page (preview only)
  function showErr(m) { var d = document.createElement("pre"); d.style.cssText = "position:fixed;left:10px;top:60px;z-index:99;color:#f66;background:#000c;padding:10px;max-width:90vw;white-space:pre-wrap;font:12px monospace"; d.textContent = m; document.body.appendChild(d); }
  addEventListener("error", function (e) { showErr(e.message + " @ " + (e.filename || "") + ":" + e.lineno); });
</script>
<script>
  // the loading screen: the room reports how far its models and textures are (kinoProgress) and when it is
  // ready (kinoLoaded); it never stays up longer than 25 s
  (function () {
    var ld = document.getElementById("loader"), bar = document.getElementById("ldBar"), shown = .08;
    window.kinoProgress = function (p) { shown = Math.max(shown, Math.min(.95, p)); bar.style.width = (shown * 100) + "%"; };
    window.kinoLoaded = function () { clearInterval(slow); bar.style.width = "100%"; setTimeout(function () { ld.classList.add("gone"); }, 250); };
    var slow = setInterval(function () { if (shown < .6) window.kinoProgress(shown + .03); }, 400);   // something moves while shaders build
    setTimeout(window.kinoLoaded, 25000);
  })();
</script>
<script type="module">import(document.body.classList.contains("cinema") ? "/kino/prostor.js?v=<%= v %>" : "/kino/domov.js?v=<%= v %>").catch(function (e) { showErr(String(e && e.stack || e)); window.kinoLoaded(); });</script>
<script>
  // the exit: on the lobby a plain link back to the karaoke list; inside the cinema it leaves the room
  // (the same as the leave button in the controls and Esc)
  (function () {
    var ex = document.getElementById("kinoExit"), lobby = document.getElementById("lobby");
    function inside() { return lobby.classList.contains("gone"); }
    function label() {
      ex.querySelector(".ke-ico").textContent = inside() ? "✕" : "←";
      ex.querySelector(".ke-txt").textContent = inside() ? "Odejít z kina" : "Zpět na web";
    }
    ex.addEventListener("click", function (e) {
      e.preventDefault();
      if (inside()) { document.getElementById("exit").click(); return; }
      document.body.classList.add("fading");
      try { sessionStorage.setItem("kinoOut", "1"); } catch (er) {}
      setTimeout(function () { location.href = ex.href; }, 900);
    });
    new MutationObserver(label).observe(lobby, { attributes: true, attributeFilter: ["class"] });
    label();
  })();
</script>
</body>
</html>
