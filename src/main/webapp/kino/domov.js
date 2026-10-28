// Karaoke in a home cinema (preview): the comfort of a home, a touch of the future. Layers: the room (WebGL
// with bloom), the clip (an <iframe> placed in 3D by CSS3DRenderer, sized to the pixels it covers so it stays
// sharp), what is in front of it (a second, transparent WebGL canvas: the curtain, the light beams, the gold
// rain, the haze) and the words (HTML). The room is lit by the clip (eq/<id>.json: edge colours 4x a second,
// bass 20x a second). A slow computer drops to 30 frames a second for all layers together.
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from './vendor/jsm/renderers/CSS3DRenderer.js';
import { EffectComposer } from './vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/jsm/postprocessing/OutputPass.js';
import { Reflector } from './vendor/jsm/objects/Reflector.js';
import { RoomEnvironment } from './vendor/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from './vendor/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from './vendor/jsm/loaders/GLTFLoader.js';
import { GTAOPass } from './vendor/jsm/postprocessing/GTAOPass.js';
import { RectAreaLightUniformsLib } from './vendor/jsm/lights/RectAreaLightUniformsLib.js';

const D = window.KDATA;
// settings: #sim;auto;t=58;end;low (sim = no YouTube, auto = straight in, t = start time, end = the end titles)
const qs = new URLSearchParams((location.search.slice(1) + '&' + location.hash.slice(1)).replace(/;/g, '&'));
const SIM = qs.has('sim') || location.protocol === 'file:';
const PHONE = Math.min(innerWidth, innerHeight) < 600;
const LOW = PHONE || qs.has('low');
const LAST_END = D.times[D.times.length - 1][1];
if (SIM) document.body.classList.add('sim');
const $ = (id) => document.getElementById(id);
// interior variants (?v=a..e): walls, furniture, lights and the view from the window
const VARIANTS = {
  a: { name: 'Ořechový salon', side: 0x141416, floor: [1, 1, 1], rug: '#1b1a1c', sofa: 0x0b0b0c, cove: [1, .66, .36], corners: ['cold', 'warm'], curtain: [0x16161a, [.75, .6, .3]] }
};
let roomKey = qs.get('v');
try { if (!VARIANTS[roomKey]) roomKey = localStorage.getItem('kinoRoom'); } catch (er) { /* no storage */ }
if (!VARIANTS[roomKey]) roomKey = 'a';
let V = VARIANTS[roomKey];
const rnd = (a, b) => a + Math.random() * (b - a);

$('tagTitle').textContent = D.title;
$('tagArtist').textContent = D.artist + ' · ' + D.year;
$('lobbyTitle').textContent = D.title;
$('lobbyArtist').textContent = D.artist;
$('titleCard').querySelector('b').textContent = D.title;
$('titleCard').querySelector('span').textContent = D.artist;

// ---------------- the clip's colours and beat ----------------
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const E = D.eq;
E.l = unb64(E.l); E.r = unb64(E.r); E.b = unb64(E.b); E.energy = unb64(E.energy);
const cur = new Float32Array(16 * 3 * 3), tgt = new Float32Array(16 * 3 * 3);   // rows: left, right, bottom edge
function target(t, out) {
  const f = Math.min(E.cframes - 1, Math.max(0, Math.floor(t * E.cfps)));
  for (let row = 0; row < 3; row++) {
    const src = row === 0 ? E.l : row === 1 ? E.r : E.b, n = row === 2 ? E.cols : E.rows;
    for (let i = 0; i < 16; i++) {
      const k = Math.min(n - 1, Math.round(i * (n - 1) / 15)), o = (f * n + k) * 3;
      for (let c = 0; c < 3; c++) out[(row * 16 + i) * 3 + c] = Math.pow(src[o + c] / 255, .6);   // edges are darker than the middle
    }
  }
}
function bassAt(t) {
  const f = Math.floor(t * E.fps), o = f * E.bands;
  if (f < 0 || o + 3 > E.energy.length) return 0;
  return (E.energy[o] + E.energy[o + 1] + E.energy[o + 2]) / 765;
}
const seen = {}, keys = D.lines.map((l) => { const k = l.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ''); seen[k] = (seen[k] || 0) + 1; return k; });
const isChorus = keys.map((k) => seen[k] > 1);   // the chorus: lines that come more than once

// ---------------- renderers ----------------
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('back'), antialias: true, powerPreference: 'high-performance' });
} catch (er) { $('nogl').style.display = 'grid'; if (window.kinoLoaded) window.kinoLoaded(); throw er; }
let PR = Math.min(devicePixelRatio || 1, LOW ? 1.25 : 2);   // full sharpness; lowered on a slow computer
renderer.setPixelRatio(PR);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .85;
const front = new THREE.WebGLRenderer({ canvas: $('front'), alpha: true, antialias: true, premultipliedAlpha: true });
front.setPixelRatio(PR);
front.setClearColor(0x000000, 0);
front.toneMapping = THREE.ACESFilmicToneMapping;
const css = new CSS3DRenderer({ element: $('css3d') });

const scene = new THREE.Scene(), frontScene = new THREE.Scene(), cssScene = new THREE.Scene();
scene.background = new THREE.Color(0x020203);
scene.fog = new THREE.FogExp2(0x030304, .04);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .12;

const camera = new THREE.PerspectiveCamera(45, 1, .05, 60);
// the effects (AO, bloom) draw into a render target, which loses the canvas's own antialiasing: the target itself
// is multisampled instead, otherwise every edge in the room is jagged
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(innerWidth * PR, innerHeight * PR,
  { type: THREE.HalfFloatType, samples: LOW ? 2 : 4 }));
composer.addPass(new RenderPass(scene, camera));
// soft shadow in the corners and under things (room A only, not on a phone)
let ao = null;
if (!LOW) {
  ao = new GTAOPass(scene, camera, innerWidth, innerHeight);
  ao.blendIntensity = .85;
  ao.updateGtaoMaterial({ radius: .35, distanceExponent: 1.5, thickness: 1, scale: 1.2, samples: 16 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  composer.addPass(ao);
}
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .45, .5, .84);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------------- the room: a home cinema ----------------
const SW = 3.6, SH = SW * 9 / 16, SCY = 1.55, SZ = -3.9;    // the screen: width, height, centre height, depth (metres)
const BACK = -4, FRONT = 3.6, HALF = 3.4, TOP = 3;
const GOLD = new THREE.Color(1, .72, .2), COLD = new THREE.Color(.25, .55, 1), WARM = new THREE.Color(1, .45, .12), CANDLE = new THREE.Color(...V.cove);
const NEON = { cold: COLD, warm: WARM, gold: GOLD };
const cornerCols = [NEON[V.corners[0]].clone(), NEON[V.corners[1]].clone()];

function canvasTex(w, h, draw, repeat, linear) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = 8;
  return t;
}
const glowMat = (c, k) => new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(k), toneMapped: false });
const glows = [];                                       // light that follows the room's "on" (k = full strength)
function glow(geo, col, k, pos) { const m = glowMat(col, k); const mesh = new THREE.Mesh(geo, m); mesh.position.copy(pos); scene.add(mesh); glows.push({ m, col, k }); return mesh; }

// walls: dark walnut slats behind the screen, smooth dark plaster on the sides
const slats = canvasTex(512, 256, (g, w, h) => {
  for (let x = 0; x < w; x += 16) {
    const v = 26 + Math.random() * 10; g.fillStyle = `rgb(${v + 12},${v + 4},${v - 4})`; g.fillRect(x, 0, 13, h);
    for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(0,0,0,${Math.random() * .12})`; g.fillRect(x, y, 13, 2); }
    g.fillStyle = '#050403'; g.fillRect(x + 13, 0, 3, h);
  }
}, [7, 1]);
const wallMaterial = () => new THREE.MeshStandardMaterial({ map: slats, bumpMap: slats, bumpScale: 1.5, roughness: .6 });
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, TOP), wallMaterial());
backWall.position.set(0, TOP / 2, BACK);
scene.add(backWall);
const plaster = new THREE.MeshStandardMaterial({ color: V.side, roughness: .92 });
const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(FRONT - BACK, TOP), plaster);
rightWall.position.set(HALF, TOP / 2, (FRONT + BACK) / 2); rightWall.rotation.y = -Math.PI / 2;
scene.add(rightWall);
// the left wall has a big window (the view is a photo, built with the tour of room A below)
const WIN = { z0: -3.2, z1: -.2, y0: .55, y1: 2.55 };
const leftWhole = [], leftWin = [];
for (const [z0, z1, y0, y1, whole] of [[BACK, FRONT, 0, TOP, 1], [BACK, WIN.z0, 0, TOP], [WIN.z1, FRONT, 0, TOP], [WIN.z0, WIN.z1, 0, WIN.y0], [WIN.z0, WIN.z1, WIN.y1, TOP]]) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, y1 - y0), plaster);
  p.position.set(-HALF, (y0 + y1) / 2, (z0 + z1) / 2); p.rotation.y = Math.PI / 2; scene.add(p);
  (whole ? leftWhole : leftWin).push(p);
}
const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN.z1 - WIN.z0, WIN.y1 - WIN.y0), new THREE.MeshPhysicalMaterial({ color: 0x111418, metalness: 0, roughness: .05, transmission: 0, transparent: true, opacity: .18, envMapIntensity: 2 }));
glass.position.set(-HALF + .01, (WIN.y0 + WIN.y1) / 2, (WIN.z0 + WIN.z1) / 2); glass.rotation.y = Math.PI / 2;
scene.add(glass);
const winFrame = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: .4, metalness: .7 });
for (const [w, h, y, z] of [[.06, WIN.y1 - WIN.y0 + .06, (WIN.y0 + WIN.y1) / 2, WIN.z0], [.06, WIN.y1 - WIN.y0 + .06, (WIN.y0 + WIN.y1) / 2, WIN.z1], [.06, WIN.y1 - WIN.y0, (WIN.y0 + WIN.y1) / 2, (WIN.z0 + WIN.z1) / 2],
  [WIN.z1 - WIN.z0, .06, WIN.y0, (WIN.z0 + WIN.z1) / 2], [WIN.z1 - WIN.z0, .06, WIN.y1, (WIN.z0 + WIN.z1) / 2]]) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(.08, h, w), winFrame); b.position.set(-HALF + .03, y, z); scene.add(b);
}

const moon = new THREE.PointLight(0x6f86c8, 0, 8, 1.5); moon.position.set(-HALF + .4, 1.8, (WIN.z0 + WIN.z1) / 2); scene.add(moon);

const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, FRONT - BACK), new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: .95 }));
ceiling.position.set(0, TOP, (FRONT + BACK) / 2); ceiling.rotation.x = Math.PI / 2;
scene.add(ceiling);

// the floor: dark oak, a little glossy (a soft mirror under it on a fast computer)
const floorW = HALF * 2, floorD = FRONT - BACK, floorZ = (FRONT + BACK) / 2;
let mirror = null;
if (!LOW) {
  mirror = new Reflector(new THREE.PlaneGeometry(floorW, floorD), {
    clipBias: .003, textureWidth: Math.round(innerWidth * .4), textureHeight: Math.round(innerHeight * .4), color: 0x6a6a70
  });
  mirror.rotation.x = -Math.PI / 2; mirror.position.set(0, 0, floorZ);
  scene.add(mirror);
}
const oak = canvasTex(512, 512, (g, w, h) => {
  for (let y = 0; y < h; y += 32) {
    let x = -Math.random() * 200;
    while (x < w) { const L = rnd(160, 300), v = 22 + Math.random() * 10; g.fillStyle = `rgb(${v + 10},${v + 4},${v})`; g.fillRect(x, y, L, 31);
      for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .15})`; g.fillRect(x, y + Math.random() * 31, L, 1); }
      g.fillStyle = '#060504'; g.fillRect(x + L - 1, y, 1, 31); x += L; }
    g.fillStyle = '#060504'; g.fillRect(0, y + 31, w, 1);
  }
}, [3, 3]);
const floorTop = new THREE.Mesh(new THREE.PlaneGeometry(floorW, floorD), new THREE.MeshStandardMaterial({
  map: oak, color: new THREE.Color(...V.floor), roughness: .42, metalness: .05, transparent: !LOW, opacity: LOW ? 1 : .88
}));
floorTop.rotation.x = -Math.PI / 2; floorTop.position.set(0, .003, floorZ);
scene.add(floorTop);
// a soft rug under the sofa
const rugTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = V.rug; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { const v = Math.random() * 40; g.fillStyle = `rgba(${v + 30},${v + 28},${v + 30},.25)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.strokeStyle = 'rgba(180,140,60,.35)'; g.lineWidth = 3; g.strokeRect(22, 22, w - 44, h - 44);
});
const rug = new THREE.Mesh(new RoundedBoxGeometry(3.6, .02, 3.4, 2, .01), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }));
rug.position.set(.2, .01, .8); scene.add(rug);

// ceiling cove: a hidden warm LED line round the room (indirect light), recessed downlights
for (const [w, d, x, z] of [[HALF * 2 - .2, .02, 0, BACK + .1], [HALF * 2 - .2, .02, 0, FRONT - .1], [.02, FRONT - BACK - .2, -HALF + .1, floorZ], [.02, FRONT - BACK - .2, HALF - .1, floorZ]]) {
  glow(new THREE.BoxGeometry(w, .015, d), CANDLE, 1.1, new THREE.Vector3(x, TOP - .06, z));
}
const cove = [];
for (const [x, z] of [[-2.2, -2.6], [2.2, -2.6], [-2.2, .8], [2.2, .8]]) {
  const l = new THREE.PointLight(CANDLE, 0, 4.5, 1.6); l.position.set(x, TOP - .15, z); scene.add(l); cove.push(l);
}
for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.2], [1.5, 1.2]]) glow(new THREE.CircleGeometry(.06, 20), CANDLE, .7, new THREE.Vector3(x, TOP - .005, z)).rotation.x = Math.PI / 2;

// the lit corners (the user's favourite): a cold and a warm neon tube down the back corners
const cornerLights = [], cornerTubes = [];
for (const s of [-1, 1]) {
  const col = cornerCols[s < 0 ? 0 : 1];
  cornerTubes.push(glow(new THREE.CylinderGeometry(.018, .018, TOP - .1, 10), col, 2.2, new THREE.Vector3(s * (HALF - .04), TOP / 2, BACK + .05)));
  const l = new THREE.PointLight(col, 0, 5, 1.4); l.position.set(s * (HALF - .25), TOP / 2, BACK + .3); scene.add(l); cornerLights.push(l);
}

// a low black console under the screen, warm light under it
const consoleBox = new THREE.Mesh(new RoundedBoxGeometry(3.4, .42, .45, 3, .03), new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: .18, metalness: .35 }));
consoleBox.position.set(0, .3, BACK + .25); scene.add(consoleBox);
const consoleLed = glow(new THREE.BoxGeometry(3.3, .01, .01), CANDLE, 1.2, new THREE.Vector3(0, .085, BACK + .48));

// the screen: a soft picture of the clip (mirrored by the floor, spread by the bloom; the real clip lies over it)
const scrCanvas = document.createElement('canvas'); scrCanvas.width = 32; scrCanvas.height = 18;
const scrCtx = scrCanvas.getContext('2d'), scrImg = scrCtx.createImageData(32, 18);
const scrTex = new THREE.CanvasTexture(scrCanvas); scrTex.colorSpace = THREE.SRGBColorSpace;
const screenMat = new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false });
const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), screenMat);
screenMesh.position.set(0, SCY, SZ);
scene.add(screenMesh);
const screenLight = new THREE.PointLight(0xffffff, 0, 9, 1.3); screenLight.position.set(0, SCY, SZ + 1.2); scene.add(screenLight);
const sideLights = [-1, 1].map((s) => { const l = new THREE.PointLight(0xffffff, 0, 6, 1.6); l.position.set(s * 1.5, SCY, SZ + .5); scene.add(l); return l; });

// the frame: one piece of polished chrome (chamfered, round corners) and a thin gold line round it
const frameMat = new THREE.MeshStandardMaterial({ color: 0xc9ccd2, metalness: 1, roughness: .1, envMapIntensity: 1.5 });
const FT = .07;
function roundRect(w, hh, r, hole) {
  const p = hole ? new THREE.Path() : new THREE.Shape(), x = -w / 2, y = -hh / 2;
  p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r); p.lineTo(x + w, y + hh - r);
  p.quadraticCurveTo(x + w, y + hh, x + w - r, y + hh); p.lineTo(x + r, y + hh); p.quadraticCurveTo(x, y + hh, x, y + hh - r);
  p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y);
  return p;
}
function ring(w, hh, t, r) { const sh = roundRect(w, hh, r); sh.holes.push(roundRect(w - t * 2, hh - t * 2, Math.max(.001, r - t), true)); return sh; }
const frame3 = new THREE.Mesh(new THREE.ExtrudeGeometry(ring(SW + FT * 2, SH + FT * 2, FT, .06), { depth: .02, bevelEnabled: true, bevelThickness: .018, bevelSize: .015, bevelSegments: 6, curveSegments: 16 }), frameMat);
frame3.position.set(0, SCY, SZ - .02); scene.add(frame3);
const goldLine = glow(new THREE.ShapeGeometry(ring(SW + FT * 2 + .07, SH + FT * 2 + .07, .012, .09), 16), GOLD, 1.2, new THREE.Vector3(0, SCY, SZ - .035));

// the SKELO SQUAD neon above the screen
const signMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(1.6, 1.15, .35), opacity: 0 });
const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25 * 182 / 720), signMat);
sign.position.set(HALF - .02, 2.05, -3.05); sign.rotation.y = -Math.PI / 2;
scene.add(sign);
const logo = new Image();
logo.onload = () => {
  signMat.map = canvasTex(720, 182, (g, w, h) => { g.drawImage(logo, 0, 0, w, h); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); });
  signMat.needsUpdate = true;
};
logo.src = '/img/squad-logo.webp';

// floor-standing speakers by the screen, in every room (the look comes with the room, applyRoom). Built like
// real ones: a lacquered cabinet with a recessed front baffle, two woofers (metal trim, rubber roll surround,
// a curved cone, a dust cap) and a dome tweeter in a shallow waveguide, on a plinth with spikes. The woofer
// cones push out with the bass, so you see the beat.
const SPK = {   // cabinet: colour, roughness, clearcoat, wood?; trim: colour, roughness
  a: { cab: [0x0a0a0b, .35, 1, 0], trim: [0xb9bcc2, .18] },
};
const speakers = [], speakerParts = [];
const lathe = (pts, seg = 64) => { const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg); g.rotateX(Math.PI / 2); return g; };   // axis along z
const cabMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0b, roughness: .35, clearcoat: 1, clearcoatRoughness: .12 });
const baffleMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: .7 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0xb9bcc2, roughness: .18, metalness: 1 });
const rubber = new THREE.MeshStandardMaterial({ color: 0x101012, roughness: .65 });
const coneTex = canvasTex(256, 256, (g, w, h) => {   // a woven fibre cone: fine radial and circular grain
  g.fillStyle = '#1c1c20'; g.fillRect(0, 0, w, h);
  g.translate(w / 2, h / 2);
  for (let a = 0; a < 360; a += 3) { g.rotate(3 * Math.PI / 180); g.fillStyle = 'rgba(255,255,255,' + (.02 + Math.random() * .03) + ')'; g.fillRect(0, -1, w, 1.2); }
  for (let r = 6; r < w / 2; r += 4) { g.strokeStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
});
const coneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: coneTex, roughness: .55, metalness: .1, side: THREE.DoubleSide });
const capMat = new THREE.MeshPhysicalMaterial({ color: 0x141416, roughness: .3, clearcoat: .6 });
const domeMat = new THREE.MeshStandardMaterial({ color: 0xd8d8dc, roughness: .25, metalness: .9 });
const footMat = new THREE.MeshStandardMaterial({ color: 0x9a9da4, roughness: .3, metalness: 1 });
function woofer(r) {
  const fixed = new THREE.Group(), moving = new THREE.Group();
  fixed.add(new THREE.Mesh(lathe([[r + .024, -.004], [r + .022, .006], [r + .012, .009], [r + .004, .004], [r + .002, -.006]]), trimMat));
  // the surround rolls out, the cone dips in to the cap
  const roll = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; roll.push([r - .012 * Math.cos(a) - .012, .009 * Math.sin(a) - .002]); }
  moving.add(new THREE.Mesh(lathe(roll), rubber));
  const cone = []; for (let i = 0; i <= 12; i++) { const t = i / 12; cone.push([(r - .022) * (1 - t * .7), -.002 - .045 * Math.pow(t, .8)]); }
  moving.add(new THREE.Mesh(lathe(cone), coneMat));
  const cap = []; for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 * i / 8; cap.push([r * .32 * Math.cos(a), -.046 + .03 * Math.sin(a)]); }
  moving.add(new THREE.Mesh(lathe(cap), capMat));
  return { fixed, moving };
}
for (const sx of [-1, 1]) {
  const g = new THREE.Group();
  const cab = new THREE.Mesh(new RoundedBoxGeometry(.34, 1.22, .38, 6, .035), cabMat); cab.position.y = .69; g.add(cab);
  const baffle = new THREE.Mesh(new RoundedBoxGeometry(.29, 1.14, .02, 4, .008), baffleMat); baffle.position.set(0, .69, .184); g.add(baffle);
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(.4, .03, .44, 3, .01), cabMat); plinth.position.y = .065; g.add(plinth);
  for (const fx of [-.16, .16]) for (const fz of [-.18, .18]) { const sp = new THREE.Mesh(new THREE.ConeGeometry(.014, .05, 12), footMat); sp.rotation.x = Math.PI; sp.position.set(fx, .025, fz); g.add(sp); }
  const cones = [];
  for (const yy of [.42, .72]) {
    const w = woofer(.112); w.fixed.position.set(0, yy, .196); w.moving.position.set(0, yy, .196); g.add(w.fixed, w.moving); cones.push(w.moving);
  }
  const guide = new THREE.Mesh(lathe([[.06, -.002], [.055, .004], [.035, -.008], [.024, -.012]]), trimMat); guide.position.set(0, 1.02, .196); g.add(guide);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.02, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat); dome.rotation.x = Math.PI / 2; dome.position.set(0, 1.02, .184); g.add(dome);
  g.position.set(sx * 2.25, 0, BACK + .45);
  scene.add(g); speakerParts.push(g);
  speakers.push({ cones });
}
function styleSpeakers(key) {
  const st = SPK[key] || SPK.a;
  cabMat.color.setHex(st.cab[0]); cabMat.roughness = st.cab[1]; cabMat.clearcoat = st.cab[2];
  cabMat.needsUpdate = true;
  trimMat.color.setHex(st.trim[0]); trimMat.roughness = st.trim[1];
}

// the black leather L-sofa (you sit behind it), warm LED under it; Kevin's armchair on the left
const leather = new THREE.MeshPhysicalMaterial({ color: V.sofa, roughness: .42, clearcoat: .35, clearcoatRoughness: .45, sheen: .3, sheenColor: new THREE.Color(.25, .2, .15) });
const sofa = new THREE.Group();
const box = (w, h, d, x, y, z, r = .06) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), leather); m.position.set(x, y, z); sofa.add(m); return m; };
box(3, .3, .95, 0, .22, 0, .05);                        // base
for (let i = 0; i < 3; i++) box(.96, .17, .82, -1 + i, .45, .03, .07);   // seat cushions
box(3, .45, .24, 0, .62, .36, .1);                      // back
for (let i = 0; i < 3; i++) box(.94, .36, .16, -1 + i, .74, .2, .08);    // back cushions
box(.2, .5, .95, -1.6, .45, 0, .08);                     // left arm
box(1, .3, 1.5, 1, .22, -1.15, .05);                     // chaise (towards the screen)
box(.96, .17, 1.4, 1, .45, -1.15, .07);
box(.2, .5, 2.4, 1.6, .45, -.7, .08);                    // right arm along both
sofa.position.set(.3, 0, 1.9);
scene.add(sofa);
const sofaLed = glow(new THREE.BoxGeometry(2.9, .006, .006), CANDLE, 1.3, new THREE.Vector3(.3, .04, 1.9 - .47));
// Kevin's armchair, front left, turned a little to the screen. kevinSlot: where the (new) Kevin goes
const chair = new THREE.Group();
const cbox = (w, h, d, x, y, z, r = .06) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), leather); m.position.set(x, y, z); chair.add(m); };
cbox(.95, .3, .9, 0, .22, 0); cbox(.75, .17, .75, 0, .45, .02); cbox(.95, .5, .2, 0, .62, .36, .08); cbox(.15, .48, .9, -.42, .45, 0); cbox(.15, .48, .9, .42, .45, 0);
chair.position.set(-1.95, 0, .35); chair.rotation.y = -.35;
scene.add(chair);
const kevinSlot = new THREE.Group(); kevinSlot.position.set(0, .53, .02); chair.add(kevinSlot);

// a floor lamp by the sofa (warm) and a plant in the corner
const lampMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: .3, metalness: .8 });
const pole = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1.55, 10), lampMat); pole.position.set(2.75, .78, 2.3); scene.add(pole);
const base = new THREE.Mesh(new THREE.CylinderGeometry(.16, .18, .03, 24), lampMat); base.position.set(2.75, .015, 2.3); scene.add(base);
const shade = new THREE.Mesh(new THREE.CylinderGeometry(.16, .22, .26, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a2116, roughness: .9, side: THREE.DoubleSide, emissive: CANDLE, emissiveIntensity: .35 }));
shade.position.set(2.75, 1.6, 2.3); scene.add(shade);
const lampLight = new THREE.PointLight(CANDLE, 0, 4, 1.5); lampLight.position.set(2.75, 1.5, 2.3); scene.add(lampLight);
const PX = 2.8, PZ = -3.35, plantA = new THREE.Group(); scene.add(plantA);
const potProfile = [[0, 0], [.13, 0], [.16, .04], [.19, .3], [.205, .42], [.215, .44], [.2, .45], [.185, .43]].map(([x, y]) => new THREE.Vector2(x, y));
const pot = new THREE.Mesh(new THREE.LatheGeometry(potProfile, 48), new THREE.MeshPhysicalMaterial({ color: 0xd9d4cc, roughness: .35, clearcoat: .6, side: THREE.DoubleSide }));
pot.position.set(PX, 0, PZ); scene.add(pot);
const soil = new THREE.Mesh(new THREE.CircleGeometry(.185, 32), new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 1 }));
soil.rotation.x = -Math.PI / 2; soil.position.set(PX, .405, PZ); scene.add(soil);
const leafCanvas = canvasTex(64, 256, (g, w, h) => {   // green bands across, yellow edges (sansevieria)
  g.fillStyle = '#1f4a2a'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 9) { g.fillStyle = `rgba(${120 + Math.random() * 40},${170 + Math.random() * 40},110,.22)`; g.fillRect(0, y, w, 3 + Math.random() * 3); }
  g.fillStyle = '#c9b84a'; g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h);
});
const leafMat = new THREE.MeshStandardMaterial({ map: leafCanvas, roughness: .45, side: THREE.DoubleSide });
for (let i = 0; i < 14; i++) {
  const L = rnd(.7, 1.25), geo = new THREE.PlaneGeometry(.085, L, 1, 10), p = geo.attributes.position;
  for (let k = 0; k < p.count; k++) {          // tapered to a point, bent back a little, slightly cupped
    const y = p.getY(k) / L + .5, x = p.getX(k);
    p.setX(k, x * (1 - Math.pow(y, 2.2) * .95)); p.setY(k, y * L); p.setZ(k, Math.pow(y, 2) * .14 + Math.abs(x) * .4);
  }
  geo.computeVertexNormals();
  const lf = new THREE.Mesh(geo, leafMat), a = i / 14 * Math.PI * 2 + rnd(-.25, .25), r = rnd(.02, .1);
  lf.position.set(PX + Math.cos(a) * r, .4, PZ + Math.sin(a) * r);
  lf.rotation.set(0, -a + Math.PI / 2, 0); lf.rotateX(-rnd(.05, .3));
  plantA.add(lf);
}

// two small smart lights in the ceiling corners: soft beams that come up with the bass (drawn in front)
const heads = [];
const beamGeo = new THREE.CylinderGeometry(.03, 1, 1, 40, 1, true); beamGeo.translate(0, -.5, 0);
const addBlend = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor };
const beamMat = (col) => new THREE.ShaderMaterial({
  uniforms: { uColor: { value: col.clone() }, uInt: { value: 0 }, uTime: { value: 0 } },
  vertexShader: 'varying float vL;varying vec3 vN,vV,vW;void main(){vL=-position.y;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mv=viewMatrix*w;vV=-mv.xyz;' +
    'vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*mv;}',
  fragmentShader: 'uniform vec3 uColor;uniform float uInt,uTime;varying float vL;varying vec3 vN,vV,vW;' +
    'void main(){float f=abs(dot(normalize(vN),normalize(vV)));float a=pow(f,2.4)*pow(1.-vL,1.8)*smoothstep(0.,.05,vL)*(.75+.25*sin(vW.y*6.+uTime*.7)*sin(vW.z*5.-uTime*.5));' +
    'gl_FragColor=vec4(uColor*a*uInt,0.);}',
  side: THREE.DoubleSide, ...addBlend
});
for (const s of [-1, 1]) {
  const col = s < 0 ? COLD : WARM, pos = new THREE.Vector3(s * (HALF - .35), TOP - .12, BACK + .6);
  const pod = new THREE.Mesh(new THREE.SphereGeometry(.07, 20, 14), new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: .2, metalness: .8 })); pod.position.copy(pos); scene.add(pod);
  const lensM = glowMat(col, 1.2); const lens = new THREE.Mesh(new THREE.TorusGeometry(.04, .008, 8, 24), lensM); lens.position.copy(pos).add(new THREE.Vector3(-s * .03, -.04, .04)); lens.lookAt(0, 0, 2); scene.add(lens);
  const beam = new THREE.Mesh(beamGeo, beamMat(col)); frontScene.add(beam);
  const spot = new THREE.SpotLight(col, 0, 9, .2, .7, 1.4); spot.position.copy(lens.position); scene.add(spot, spot.target);
  heads.push({ s, origin: lens.position.clone(), beam, spot, lensM, col, pod, lens, phase: Math.random() * 6 });
}

// haze in front: a little, low and at the sides
const smokeTex = (() => {
  const n = 128, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), img = g.createImageData(n, n);
  const hsh = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    return (hsh(ix, iy) * (1 - fx) + hsh(ix + 1, iy) * fx) * (1 - fy) + (hsh(ix, iy + 1) * (1 - fx) + hsh(ix + 1, iy + 1) * fx) * fy; };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = x / n - .5, dy = y / n - .5, r = Math.sqrt(dx * dx + dy * dy) * 2;
    const no = vn(x / 22, y / 22) * .6 + vn(x / 10, y / 10) * .28 + vn(x / 5, y / 5) * .12;
    const a = Math.max(0, 1 - r) ** 2 * Math.max(0, no * 1.8 - .3), o = (y * n + x) * 4;
    img.data[o] = img.data[o + 1] = img.data[o + 2] = 255; img.data[o + 3] = Math.min(255, a * 255);
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const wisps = [];
for (let i = 0; i < (LOW ? 8 : 16); i++) {
  const m = new THREE.SpriteMaterial({ map: smokeTex, opacity: 0, rotation: Math.random() * 6.28, ...addBlend, blendSrc: THREE.SrcAlphaFactor });
  const s = new THREE.Sprite(m); frontScene.add(s); wisps.push({ sp: s, m });
}
function respawn(w) {
  const low = Math.random() < .6, side = Math.random() < .5 ? -1 : 1;
  w.sp.position.set(low ? rnd(-2.5, 2.5) : side * rnd(2, 3), low ? rnd(.1, .4) : rnd(.4, 2.2), rnd(-3.6, -1.5));
  w.v = new THREE.Vector3(rnd(-.03, .03), rnd(.005, .025), rnd(-.01, .02));
  w.size = rnd(.8, 1.6); w.age = 0; w.life = 10 + Math.random() * 6; w.spin = rnd(-.05, .05);
}
wisps.forEach((w) => { respawn(w); w.age = Math.random() * w.life; });

// a rain of gold glitter from the ceiling (a chorus starts, the end) – in front of everything, the clip too
const N_RAIN = LOW ? 220 : 520, rainPos = new Float32Array(N_RAIN * 3), rainLife = new Float32Array(N_RAIN), rainSeed = new Float32Array(N_RAIN), rainVel = new Float32Array(N_RAIN);
for (let i = 0; i < N_RAIN; i++) { rainSeed[i] = Math.random(); rainPos[i * 3 + 1] = -10; }
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3)); rainGeo.setAttribute('aLife', new THREE.BufferAttribute(rainLife, 1)); rainGeo.setAttribute('aSeed', new THREE.BufferAttribute(rainSeed, 1));
const rainMat = new THREE.ShaderMaterial({
  uniforms: { uPix: { value: PR }, uTime: { value: 0 } },
  vertexShader: 'attribute float aLife,aSeed;uniform float uPix,uTime;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;' +
    'vA=aLife*(.3+.7*pow(.5+.5*sin(uTime*(6.+aSeed*9.)+aSeed*40.),2.));gl_PointSize=uPix*(1.6+aSeed*2.4)*(4./-mv.z);}',
  fragmentShader: 'varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);gl_FragColor=vec4(vec3(1.,.78,.3)*1.7*a*vA,0.);}',
  ...addBlend
});
const rain = new THREE.Points(rainGeo, rainMat); rain.frustumCulled = false; frontScene.add(rain);
function spawnRain(n) {
  for (let i = 0; i < N_RAIN && n > 0; i++) {
    if (rainLife[i] > 0) continue;
    rainPos[i * 3] = rnd(-HALF + .3, HALF - .3); rainPos[i * 3 + 1] = rnd(TOP - .1, TOP + 1.5); rainPos[i * 3 + 2] = rnd(BACK + .3, 1.2);
    rainVel[i] = rnd(.3, .7); rainLife[i] = 1; n--;
  }
}

// the curtain: just in front of the screen (drawn in front of the clip, so it covers it when
// closed). Its colour comes with the room. It opens with the projector and stays gathered close to both
// sides of the screen; it closes for the end titles and when leaving.
frontScene.add(new THREE.HemisphereLight(0x8a8078, 0x000000, .5));
const curtainKey = new THREE.PointLight(0xffd9a8, 0, 6, 1.5); curtainKey.position.set(0, SCY + 1, BACK + 2.55); frontScene.add(curtainKey);
const curtainMat = new THREE.MeshPhysicalMaterial({ color: 0x16161a, roughness: .8, sheen: 1, sheenColor: new THREE.Color(.75, .6, .3), sheenRoughness: .35 });   // the room sets its colour (applyRoom)
const CPIV = SW / 2 + .4, CW = CPIV + .04, CH = SH + .4, CZ = SZ + .12;
const curtains = [-1, 1].map((s) => {
  const g = new THREE.PlaneGeometry(CW, CH, 90, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(x * 19) * .035 + Math.sin(x * 53 + 1) * .008); }
  g.computeVertexNormals(); g.translate(-s * CW / 2, 0, 0);   // pivot on its outer edge
  const m = new THREE.Mesh(g, curtainMat);
  m.position.set(s * CPIV, SCY, CZ);
  frontScene.add(m);
  return m;
});
const valance = new THREE.Mesh(new THREE.BoxGeometry(CPIV * 2 + .12, .14, .08), curtainMat); valance.position.set(0, SCY + CH / 2 + .05, CZ); frontScene.add(valance);
let curtainOpen = 0;
// a warm light grazing each gathered side, so the velvet shows
const curtainSides = [-1, 1].map((sd) => { const l = new THREE.PointLight(0xffe2c4, 0, 3.2, 1.6); l.position.set(sd * (CPIV - .2), SCY + .3, CZ + .7); frontScene.add(l); return l; });

// Kevinovo křeslo zůstává zatím prázdné: starý kódem stavěný Kevin (js/kevin3d.js) je pryč, nový přijde do kevinSlot.

// ---------------- the clip in 3D: sized to the pixels it covers, so it is sharp ----------------
const clipEl = document.createElement('div');
clipEl.className = 'clip';
clipEl.innerHTML = '<img class="poster" src="' + D.thumb + '" alt=""><div class="player"></div><div class="catch" hidden></div><button class="big-play" hidden aria-label="Přehrát"></button><div class="power"></div>';
const clipObj = new CSS3DObject(clipEl);
clipObj.position.set(0, SCY, SZ + .003);
cssScene.add(clipObj);
const poster = clipEl.querySelector('.poster'), catcher = clipEl.querySelector('.catch'), bigPlay = clipEl.querySelector('.big-play'), powerEl = clipEl.querySelector('.power');
function sizeClip() {
  const a = new THREE.Vector3(-SW / 2, SCY, SZ).project(camera), b = new THREE.Vector3(SW / 2, SCY, SZ).project(camera);
  const px = Math.max(320, Math.round(Math.abs(b.x - a.x) / 2 * innerWidth * 1.05));
  clipEl.style.width = px + 'px'; clipEl.style.height = Math.round(px * 9 / 16) + 'px';
  clipObj.scale.setScalar(SW / px);
}

// ---------------- camera: behind the sofa, a little above it ----------------
const CAM = new THREE.Vector3(.25, 1.62, 3.5), look = new THREE.Vector3();
let camFrom = new THREE.Vector3(0, 1.7, 5.6), camAt = 0, camMs = 1, portrait = false;
const mouse = { x: 0, y: 0 }, par = { x: 0, y: 0 };
function fit() {
  const w = innerWidth, h = innerHeight, aspect = w / h;
  portrait = h > w;
  const share = PHONE ? (portrait ? .8 : .42) : .38;          // how much of the width the screen takes
  const dist = CAM.z - SZ, tanH = (SW / 2 / share) / dist;
  camera.fov = Math.min(90, 2 * Math.atan(tanH / aspect) * 180 / Math.PI);
  camera.aspect = aspect; camera.updateProjectionMatrix();
  look.set(0, SCY, SZ); camera.position.copy(CAM);
  const want = portrait ? .3 : .37;                             // the middle of the screen at this height
  for (let n = 0; n < 6; n++) {
    camera.lookAt(look); camera.updateMatrixWorld();
    const c = new THREE.Vector3(0, SCY, SZ).project(camera);
    look.y += (want - (1 - c.y) / 2) * 3;
  }
  renderer.setPixelRatio(PR); front.setPixelRatio(PR);
  renderer.setSize(w, h, false); front.setSize(w, h, false); css.setSize(w, h); composer.setSize(w, h);
  fx.width = Math.round(w * PR); fx.height = Math.round(h * PR);
  sizeClip(); placeWords();
}
addEventListener('pointermove', (ev) => { mouse.x = ev.clientX / innerWidth * 2 - 1; mouse.y = ev.clientY / innerHeight * 2 - 1; });

// ---------------- the clock ----------------
let clock = null, simT = qs.has('end') ? LAST_END + 7 : parseFloat(qs.get('t') || '0'), simPlaying = false, simAt = performance.now();
const now = () => clock ? clock.time() : simT + (simPlaying ? (performance.now() - simAt) / 1000 : 0);
const playing = () => clock ? clock.playing() : simPlaying;
const duration = () => clock && clock.duration() ? clock.duration() : E.cframes / E.cfps;
function play() { if (clock) clock.play(); else if (!simPlaying) { simAt = performance.now(); simPlaying = true; } }
function pause() { if (clock) clock.pause(); else if (simPlaying) { simT = now(); simPlaying = false; } }
function seek(t) { t = Math.max(0, Math.min(duration() - .5, t)); if (clock) clock.seek(t); else { simT = t; simAt = performance.now(); } rebuild(t); }
function startPlayer() {
  if (SIM) { play(); return; }
  const f = document.createElement('iframe');
  f.src = 'https://www.youtube-nocookie.com/embed/' + D.yt + '?enablejsapi=1&autoplay=1&controls=0&cc_load_policy=0&disablekb=1&fs=0&rel=0&playsinline=1&iv_load_policy=3&modestbranding=1&origin=' + encodeURIComponent(location.origin);
  f.allow = 'autoplay; encrypted-media; picture-in-picture';
  f.title = D.title;
  clipEl.querySelector('.player').appendChild(f);
  // YouTube shows its automatic subtitles when the viewer has them on: switch the module off (again later)
  const noCaptions = () => ['captions', 'cc'].forEach((m) => { try { f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unloadModule', args: [m], id: 1, channel: 'widget' }), '*'); } catch (er) { /* gone */ } });
  clock = new window.YtClock(f, noCaptions);
  [800, 2000, 4000, 8000].forEach((ms) => setTimeout(noCaptions, ms));
  catcher.hidden = false;
  catcher.onclick = () => (playing() ? pause() : play());
  setTimeout(() => { if (!playing()) bigPlay.hidden = false; }, 3500);
}
bigPlay.onclick = () => { bigPlay.hidden = true; play(); };

// ---------------- the words ----------------
// Each room its own lettering (body[data-room], index.html). A word arrives AHEAD seconds before it is sung:
// out of a puff of smoke, or – in the sci-fi room – decoded on the glass LED panel (random letters run in a
// box as wide as the real one, so nothing moves). Gold/lit while sung, white once sung. The next line starts:
// the full one moves up and fades (in smoke).
const fx = $('fx'), fg = fx.getContext('2d');
let smoke = [];
const smokeSprites = (() => {   // soft wisps of turbulent noise (as on the home page quote)
  const hash = (x, y, sd) => { const v = Math.sin(x * 127.1 + y * 311.7 + sd * 74.7) * 43758.5453; return v - Math.floor(v); };
  const noise = (x, y, sd) => { const ix = Math.floor(x), iy = Math.floor(y), fx2 = x - ix, fy = y - iy, ux = fx2 * fx2 * (3 - 2 * fx2), uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy, sd), b = hash(ix + 1, iy, sd), c = hash(ix, iy + 1, sd), d = hash(ix + 1, iy + 1, sd); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy; };
  const fbm = (x, y, sd) => { let v = 0, amp = .5; for (let o = 0; o < 5; o++) { v += amp * noise(x, y, sd); x *= 2.03; y *= 2.03; amp *= .5; } return v; };
  const S = 96, out = [];
  for (let k = 0; k < 3; k++) {
    const sd = k * 13.7 + 1, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d'), img = x.createImageData(S, S), o = img.data;
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
      const u = px / S, v = py / S, dx = u - .5, dy = v - .5, r = Math.sqrt(dx * dx + dy * dy) * 2;
      const tt = fbm(u * 4 + fbm(u * 3 + 5, v * 3, sd) * 1.6, v * 4 + fbm(u * 3, v * 3 + 9, sd) * 1.6, sd);
      let al = Math.min(1, Math.max(0, (tt - .38) / .45)); al = al * al * (3 - 2 * al);
      const i = (py * S + px) * 4; o[i] = 215; o[i + 1] = 205; o[i + 2] = 195; o[i + 3] = Math.round(255 * al * Math.pow(Math.max(0, 1 - r), 1.6));
    }
    x.putImageData(img, 0, 0); out.push(c);
  }
  return out;
})();
const puff = (x, y, size, grow, life, alpha) => smoke.push({ x, y, age: 0, life, size, grow, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .9, seed: Math.random() * 9, a: alpha, sp: smokeSprites[Math.floor(Math.random() * 3)] });
function drawFx(dt) {
  const W = innerWidth, H = innerHeight;
  fg.setTransform(PR, 0, 0, PR, 0, 0); fg.clearRect(0, 0, W, H);
  smoke = smoke.filter((m) => {
    m.age += dt; if (m.age > m.life) return false;
    const a = m.age / m.life, size = m.size + m.grow * m.age;
    m.y -= (22 - 8 * a) * dt; m.x += Math.sin(m.age * 1.6 + m.seed) * 10 * dt; m.rot += m.vr * dt;
    fg.globalAlpha = Math.min(1, m.age * 3) * Math.pow(1 - a, 1.4) * m.a;
    fg.save(); fg.translate(m.x, m.y); fg.rotate(m.rot); fg.drawImage(m.sp, -size / 2, -size / 2, size, size); fg.restore();
    return true;
  });
  fg.globalAlpha = 1;
}

const AHEAD = .9, lyricsEl = $('lyrics'), titleCard = $('titleCard'), dotsEl = $('dots');
let line = null, shownIdx = -1;
function placeWords() {
  const h = innerHeight;
  const bottom = new THREE.Vector3(0, SCY - SH / 2 - FT, SZ).project(camera);
  const sy = (1 - bottom.y) / 2 * h, lh = lyricsEl.offsetHeight;
  lyricsEl.style.top = Math.max(sy + 8, Math.min(h - lh - 78, sy + (h - sy - 78 - lh) * .4)) + 'px';
}
function makeLine(i) {
  const el = document.createElement('div'); el.className = 'line';
  const toks = D.lines[i].split(/\s+/), times = D.words[i] || [];
  el._w = toks.map((tok, k) => {
    const w = document.createElement('span'); w.className = 'w';
    const chars = Array.from(tok).map((ch) => { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; c._ch = ch; w.appendChild(c); return c; });
    el.appendChild(w); el.appendChild(document.createTextNode(' '));
    return { el: w, chars, t: times[k] || D.times[i] };
  });
  el._i = i;
  lyricsEl.appendChild(el);
  return el;
}
function arrive(w) {
  const el = w.el;
  el.classList.add('in');
  const r = el.getBoundingClientRect();
  for (let k = 0; k < (LOW ? 3 : 6); k++) puff(r.left + r.width * (.1 + .8 * Math.random()), r.top + r.height * .6, r.height * (.6 + Math.random() * .5), r.height * 1.3, 1.3 + Math.random() * .7, .32);
  el.animate([{ opacity: 0, filter: 'blur(12px)', transform: 'scale(1.14)' }, { opacity: 1, filter: 'blur(0px)', transform: 'none' }], { duration: 950, easing: 'cubic-bezier(.2,.7,.2,1)' });
}
function leaveLine() {
  if (!line) return;
  const l = line; line = null;
  l.querySelectorAll('.w.in').forEach((w) => { const r = w.getBoundingClientRect(); puff(r.left + r.width / 2, r.top + r.height * .5, r.height * .8, r.height * 1.5, 1.5, .3); });
  l.classList.add('gone');
  setTimeout(() => l.remove(), 1000);
}
const firstWord = (k) => (D.words[k] && D.words[k][0] ? D.words[k][0][0] : D.times[k][0]);
function lineAt(t) { let i = -1; for (let k = 0; k < D.times.length; k++) { if (firstWord(k) - AHEAD <= t) i = k; else break; } return i; }
function rebuild(t) {
  lyricsEl.querySelectorAll('.line').forEach((l) => l.remove()); line = null;
  const i = lineAt(t); shownIdx = i;
  if (i >= 0 && t < D.times[i][1] + 1.2) {
    line = makeLine(i); line.classList.add('instant');
    for (const w of line._w) if (t >= w.t[0] - AHEAD) { w.arrived = true; w.el.classList.add('in'); }
    requestAnimationFrame(() => line && line.classList.remove('instant'));
  }
}
function words(t) {
  const i = lineAt(t);
  if (i < shownIdx) { rebuild(t); return; }
  if (i > shownIdx) { leaveLine(); shownIdx = i; line = makeLine(i); }
  if (line && t > D.times[line._i][1] + 1.2) leaveLine();
  if (line) for (const w of line._w) {
    if (!w.arrived && t >= w.t[0] - AHEAD) { w.arrived = true; arrive(w); }
    const lit = t >= w.t[0] - .06, nw = lit && t < Math.max(w.t[1], w.t[0] + .25);
    if (lit !== w.lit) { w.el.classList.toggle('lit', lit); w.lit = lit; }
    if (nw !== w.now) { w.el.classList.toggle('now', nw); w.now = nw; }
  }
  titleCard.classList.toggle('gone', t > D.times[0][0] - 1.4);
  let sung = -1; for (let s2 = 0; s2 < D.times.length && D.times[s2][0] <= t; s2++) sung = s2;
  const next = D.times[sung + 1], prevEnd = sung >= 0 ? D.times[sung][1] : 0;
  const wait = next ? next[0] - AHEAD - t : 99, gap = next ? next[0] - prevEnd : 0;
  const showDots = next && sung >= 0 && gap > 5 && wait > 0 && wait < 3.2;
  dotsEl.classList.toggle('show', !!showDots);
  if (showDots) [...dotsEl.children].forEach((d, n) => d.classList.toggle('out', wait < 3 - n));
}

// ---------------- controls ----------------
const fmt = (s) => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); };
const bar = $('bar');
D.times.forEach((tt) => { const i = document.createElement('i'); i.className = 'tick'; i.style.left = (tt[0] / duration() * 100) + '%'; bar.appendChild(i); });
bar.onclick = (ev) => { const r = bar.getBoundingClientRect(); seek((ev.clientX - r.left) / r.width * duration()); };
$('pp').onclick = () => (playing() ? pause() : play());
$('back5').onclick = () => seek(now() - 5);
$('fwd5').onclick = () => seek(now() + 5);
$('vol').oninput = (ev) => { if (clock) clock.setVolume(+ev.target.value); };
// the whole screen where the browser can (an iPhone's Safari can't for a page, only for a video: then no button)
const fsRoot = document.documentElement, fsOn = () => document.fullscreenElement || document.webkitFullscreenElement;
const fsEnter = fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen, fsExit = document.exitFullscreen || document.webkitExitFullscreen;
if (!fsEnter) $('fs').hidden = true;
$('fs').onclick = () => { try { const r = fsOn() ? fsExit.call(document) : fsEnter.call(fsRoot); if (r && r.catch) r.catch(() => {}); } catch (e) { /* not allowed now */ } };
$('exit').onclick = leave;
let entered = false, idleTimer = 0;
addEventListener('keydown', (ev) => {
  if (!entered) return;
  if (ev.key === ' ') { ev.preventDefault(); playing() ? pause() : play(); }
  else if (ev.key === 'ArrowLeft') seek(now() - 5);
  else if (ev.key === 'ArrowRight') seek(now() + 5);
  else if (ev.key === 'Escape' && !fsOn()) leave();
  else if (ev.key === 'f' || ev.key === 'F') $('fs').click();
  else if (/^[1-6]$/.test(ev.key)) { const r = 'abcdef'[+ev.key - 1]; if (VARIANTS[r]) applyRoom(r); else document.querySelector('[data-room="f"]').click(); }
  wake();
});
function wake() { document.body.classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (playing()) document.body.classList.add('idle'); }, 2800); }
addEventListener('pointermove', wake); addEventListener('pointerdown', wake);
let turnDismissed = false;   // a phone held upright: ask to turn it on its side
function askToTurn() { $('rotate').hidden = !(PHONE && entered && !turnDismissed && innerHeight > innerWidth); }
$('rotateAnyway').onclick = () => { turnDismissed = true; askToTurn(); };
addEventListener('resize', () => { fit(); askToTurn(); });

// ---------------- in and out ----------------
let on = 0, onFrom = 0, onTo = 0, onAt = 0, onMs = 1, lights = .15, lightsTo = .15;
const flicker = (p) => (p < .18 ? p / .18 * .55 : p < .26 ? .12 : p < .4 ? .7 : p < .46 ? .3 : Math.min(1, .3 + (p - .46) / .54 * .7));
function power(to, ms) { onFrom = on; onTo = to; onAt = performance.now(); onMs = ms; }
camera.position.copy(camFrom);
$('enter').onclick = () => {
  entered = true;
  $('lobby').classList.add('gone');
  camAt = performance.now(); camMs = 3200;
  setTimeout(() => { lightsTo = 1; }, 500);
  setTimeout(() => power(1, 1500), 1800);
  setTimeout(startPlayer, 2400);
  askToTurn(); wake();
};
// leaving the cinema, like the end of a film: the curtain closes, the lights and the projector go down, the
// camera pulls back, the picture fades to black and the site comes back (the karaoke list fades in from black)
let exiting = false, camBack = false;
function exitKino() {
  if (exiting) return;
  exiting = true; pause(); wake();
  $('kinoExit') && ($('kinoExit').style.visibility = 'hidden');
  setTimeout(() => { lightsTo = .1; power(0, 1200); }, 900);
  setTimeout(() => { camFrom = new THREE.Vector3(0, 1.9, 6.2); camBack = true; camAt = performance.now(); camMs = 2600; }, 700);
  setTimeout(() => document.body.classList.add('fading'), 1900);
  setTimeout(() => { try { sessionStorage.setItem('kinoOut', '1'); } catch (er) { /* no storage */ } location.href = '/karaoke-kino'; }, 3300);
}
function leave() { exitKino(); }
if (qs.has('auto')) { entered = true; $('lobby').classList.add('gone'); on = onTo = 1; lights = lightsTo = 1; camAt = -1e9; play(); if (!qs.has('end')) curtainOpen = 1; }


// the built furniture of room A: the sofa, lamp and plant (the models below replace them once loaded)
const roomA = [sofa, sofaLed, pole, base, shade, lampLight, pot, soil, plantA];

// ---------------- room A in real models and textures (Poly Haven, CC0: kino/assets, see assets/CREDITS.txt) ----------------
// The parquet, the walnut wall and the plaster are photographed materials (colour, relief, roughness); the
// sofa, Kevin's armchair, the table and the plant are scanned / modelled furniture. While they load, the
// built ones stand in; a soft dark blob under each piece keeps it on the floor.
const texLoader = new THREE.TextureLoader();
function pbr(name, rep2, tint, rough = 1) {
  const t = (k, srgb) => { const x = texLoader.load('/kino/assets/tex/' + name + '_' + k + '.jpg'); x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(rep2[0], rep2[1]); x.anisotropy = 8; if (srgb) x.colorSpace = THREE.SRGBColorSpace; return x; };
  return new THREE.MeshStandardMaterial({ map: t('diff', true), normalMap: t('nor'), roughnessMap: t('rough'), roughness: rough, color: tint });
}
const A_MAT = {
  back: pbr('smoked_walnut_veneer', [2.4, 1.1], 0x8a6a52, .8),
  side: pbr('plastered_wall_04', [2.6, 1.1], 0x45454c),
  floor: pbr('herringbone_parquet', [3.2, 3.6], 0x8f7560, 1.15),
  rug: pbr('wool_boucle', [3, 3], 0x5e5953)
};
const rugBase = rug.material;
A_MAT.floor.envMapIntensity = .3; A_MAT.floor.normalScale.set(.5, .5);   // satin oiled oak, not a mirror
const floorBase = floorTop.material;
const blobTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(.6, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
function blob(w, d) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = .012; return m; }
const gltf = new GLTFLoader();
const roomAModels = [];
let chairModel = null;
// a model at a place (pos[1] = what it stands on), turned, scaled so its footprint is about "width" metres
// wide; it casts and takes shadows. onWall = hung on a wall (no blob under it)
function place(name, pos, yaw, width, onWall) {
  return new Promise((ok) => gltf.load('/kino/assets/' + name + '/' + name + '_1k.gltf', (g) => {
    const m = g.scene;
    const box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3());
    const k = width ? width / Math.max(size.x, size.z) : 1;
    m.scale.setScalar(k);
    m.position.set(-(box.min.x + size.x / 2) * k, -box.min.y * k, -(box.min.z + size.z / 2) * k);   // centred on its footprint, on the floor
    const holder = new THREE.Group(); holder.position.set(pos[0], pos[1] || 0, pos[2]); holder.rotation.y = yaw;
    holder.add(m);
    if (!onWall) holder.add(blob(size.x * k * 1.15, size.z * k * 1.25));
    m.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      if (/glass/i.test(o.material.name)) {   // picture glass: a faint reflection, no costly transmission pass
        o.material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .04, transparent: true, opacity: .1, depthWrite: false });
        return;
      }
      o.material.envMapIntensity = .8; o.castShadow = o.receiveShadow = true;
    });
    scene.add(holder);
    ok(holder);
  }, undefined, () => ok(null)));
}
// a photo of Skeli in black and white, cut to fill a picture of this shape (glTF textures are not flipped)
function photoTex(src, aspect) {
  const c = document.createElement('canvas'); c.width = Math.round(1000 * aspect); c.height = 1000;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.anisotropy = 8;
  const img = new Image();
  img.onload = () => {
    const g = c.getContext('2d'), s = Math.max(c.width / img.width, c.height / img.height);
    g.filter = 'grayscale(1) contrast(1.12) brightness(.92)';
    g.drawImage(img, (c.width - img.width * s) / 2, (c.height - img.height * s) / 2, img.width * s, img.height * s);
    t.needsUpdate = true;
  };
  img.src = src;
  return t;
}
function hangPhoto(holder, src, aspect) {
  if (!holder) return;
  const map = photoTex(src, aspect);
  holder.traverse((o) => { if (o.isMesh && /artwork/i.test(o.material.name)) { o.material = o.material.clone(); o.material.map = map; o.material.roughness = .6; } });
}
const modelsA = Promise.all([
  place('sofa_02', [.3, 0, 1.75], Math.PI, 2.2),
  place('modern_arm_chair_01', [-1.95, 0, .35], Math.PI - .35, .8),
  place('coffee_table_round_01', [.25, 0, -.35], 0, .95),
  place('potted_plant_02', [2.7, 0, -3.3], .6, .95)
]).then(([sofaM, chairM, tableM, plantM]) => {
  for (const m of [sofaM, tableM, plantM]) if (m) roomAModels.push(m);
  chairModel = chairM;
  if (sofaM) sofa.userData.replaced = true;
  if (plantM) [pot, soil, plantA].forEach((o) => { o.userData.replaced = true; });
  applyRoom(roomKey);
  modelsAt = performance.now();
});
// styled like a flat on a property site: a low sideboard on the right wall with a brass vase, a framed photo
// and a succulent, two black-and-white photos of Skeli above it, a side table with a vase by Kevin's armchair
const SB = { x: HALF - .17, z: -2.05, top: .42 };
const modelsB = PHONE ? null : Promise.all([
  place('modern_wooden_cabinet', [SB.x, 0, SB.z], -Math.PI / 2, 1.5),
  place('brass_vase_01', [SB.x, SB.top, SB.z - .55], 0, .15),
  place('standing_picture_frame_01', [SB.x + .02, SB.top, SB.z + .05], -Math.PI / 2 - .35, .2),
  place('potted_plant_04', [SB.x - .02, SB.top, SB.z + .5], .4, .17),
  place('hanging_picture_frame_01', [HALF - .015, 1.0, -2.35], -Math.PI / 2, .45, true),
  place('hanging_picture_frame_01', [HALF - .015, 1.0, -1.7], -Math.PI / 2, .45, true),
  place('side_table_01', [-2.25, 0, -1.05], .3, .5),
  place('ceramic_vase_01', [-2.25, .45, -1.05], 0, .14)
]).then((list) => {
  hangPhoto(list[2], '/img/photos/mic-md.webp', .75);
  hangPhoto(list[4], '/img/photos/square-md.webp', .66);
  hangPhoto(list[5], '/img/photos/street-md.webp', .66);
  list.forEach((m) => { if (m) { roomAModels.push(m); m.visible = roomKey === 'a'; } });
  modelsAt = performance.now(); envDone = false;
});

// ---------------- room A as a virtual tour of a flat: real light ----------------
// Downlights in the ceiling make pools of light on the floor, wall washers graze the walnut and the plaster,
// the screen lights the room as a soft panel and throws real shadows, the corners and the gaps under things
// get soft shadow (GTAO), and the reflections are of this very room (captured once it is lit).
const aTour = new THREE.Group(); scene.add(aTour);
if (!LOW) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
RectAreaLightUniformsLib.init();
const screenPanel = new THREE.RectAreaLight(0xffffff, 0, SW, SH);
screenPanel.position.set(0, SCY, SZ + .05); screenPanel.lookAt(0, SCY, 5); aTour.add(screenPanel);
const shadowSpot = (s, size) => { s.castShadow = !LOW; s.shadow.mapSize.set(size, size); s.shadow.bias = -.0004; s.shadow.normalBias = .02; s.shadow.camera.near = .2; };
const screenShadow = new THREE.SpotLight(0xffffff, 0, 10, 1.1, 1, 1.2);
screenShadow.position.set(0, SCY, SZ + .35); screenShadow.target.position.set(0, .3, 2.5); shadowSpot(screenShadow, 1024);
aTour.add(screenShadow, screenShadow.target);
const canMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: .35, metalness: .9 });
const downs = [];
for (const [x, z, sh] of [[-1.5, -1.5, 1], [1.5, -1.5, 0], [.25, -.35, 1], [-1.5, 1.2, 0], [1.5, 1.2, 0]]) {
  const s = new THREE.SpotLight(0xffd8a8, 0, 6, .7, .9, 1.7);
  s.position.set(x, TOP - .03, z); s.target.position.set(x, 0, z);
  if (sh) shadowSpot(s, 1024);
  aTour.add(s, s.target); downs.push(s);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(.058, .009, 8, 32), canMat); trim.rotation.x = Math.PI / 2; trim.position.set(x, TOP - .006, z); aTour.add(trim);
}
aTour.add(glow(new THREE.CircleGeometry(.05, 24), CANDLE, 1.6, new THREE.Vector3(.25, TOP - .005, -.35)));
aTour.children[aTour.children.length - 1].rotation.x = Math.PI / 2;
const washers = [];   // light grazing down the walls: the "scallops" of a lit flat
for (const [x, z, tx, tz] of [[-2.9, BACK + .35, -2.9, BACK + .02], [2.9, BACK + .35, 2.9, BACK + .02], [HALF - .35, -2.35, HALF - .02, -2.35], [HALF - .35, -1.7, HALF - .02, -1.7], [HALF - .35, -.6, HALF - .02, -.6]]) {
  const s = new THREE.SpotLight(0xffd2a0, 0, 4.5, .55, 1, 1.5);
  s.position.set(x, TOP - .03, z); s.target.position.set(tx, .2, tz);
  aTour.add(s, s.target); washers.push(s);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(.04, .007, 8, 28), canMat); trim.rotation.x = Math.PI / 2; trim.position.set(x, TOP - .006, z); aTour.add(trim);
}
// skirting boards and a window sill
const skirtMat = new THREE.MeshStandardMaterial({ color: 0x0e0e10, roughness: .45 });
for (const [w, d, x, z] of [[HALF * 2, .014, 0, BACK + .007], [.014, FRONT - BACK, HALF - .007, (FRONT + BACK) / 2], [.014, FRONT - BACK, -HALF + .007, (FRONT + BACK) / 2]]) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, .08, d), skirtMat); b.position.set(x, .04, z); b.receiveShadow = true; aTour.add(b);
}
const sill = new THREE.Mesh(new THREE.BoxGeometry(.22, .035, WIN.z1 - WIN.z0 + .16), new THREE.MeshPhysicalMaterial({ color: 0x1c1c1f, roughness: .25, clearcoat: .6 }));
sill.position.set(-HALF + .09, WIN.y0 - .015, (WIN.z0 + WIN.z1) / 2); sill.castShadow = sill.receiveShadow = true; aTour.add(sill);
// velvet drapes either side of the window, on a black rod; the same velvet on the curtain at the screen
const velvet = pbr('velour_velvet', [2, 3], 0xffffff);
const drapeMat = new THREE.MeshPhysicalMaterial({ map: velvet.map, normalMap: velvet.normalMap, roughnessMap: velvet.roughnessMap, color: 0x2b2b33, roughness: 1, sheen: 1, sheenColor: new THREE.Color(.55, .5, .45), sheenRoughness: .45 });
for (const zc of [WIN.z0 - .3, WIN.z1 + .3]) {
  const g = new THREE.PlaneGeometry(.75, TOP - .12, 70, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const u = p.getX(i); p.setZ(i, Math.sin(u * 26) * .045 + Math.sin(u * 61 + 2) * .01 + .07); }
  g.computeVertexNormals();
  const d = new THREE.Mesh(g, drapeMat); d.rotation.y = Math.PI / 2; d.position.set(-HALF, (TOP - .12) / 2 + .01, zc); d.castShadow = d.receiveShadow = true; aTour.add(d);
}
const rod = new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, WIN.z1 - WIN.z0 + 1.6, 12), canMat); rod.rotation.x = Math.PI / 2; rod.position.set(-HALF + .09, TOP - .1, (WIN.z0 + WIN.z1) / 2); aTour.add(rod);
// the view: the river and the skyline at night from a high floor (a photo, Poly Haven CC0), far behind the glass
const skyCanvas = document.createElement('canvas'); skyCanvas.width = 2048; skyCanvas.height = 1024;
const skyTex = new THREE.CanvasTexture(skyCanvas); skyTex.colorSpace = THREE.SRGBColorSpace;
const SKY_W = 16, SKY_H = 9, HORIZON = .6;      // horizon 60 % down the picture, at eye height
const skyline = new THREE.Mesh(new THREE.PlaneGeometry(SKY_W, SKY_H), new THREE.MeshBasicMaterial({ map: skyTex, toneMapped: false, fog: false, color: new THREE.Color(.62, .62, .66) }));
skyline.rotation.y = Math.PI / 2; skyline.position.set(-HALF - 3, 1.62 + (HORIZON - .5) * SKY_H, -8.2);   // 3 m behind the glass, the towers where you look through it
aTour.add(skyline);
const pano = new Image();
pano.onload = () => {
  const g = skyCanvas.getContext('2d'), W = 2048, H = 1024, hz = H * HORIZON;
  const sx = pano.width * .342, sw = pano.width * .513, sy = pano.height * .193, sh = pano.height * .3 ;   // the skyline, above the promenade
  g.drawImage(pano, sx, sy, sw, sh, 0, 0, W, hz);
  g.fillStyle = '#04050b'; g.fillRect(0, hz, W, H - hz);
  g.save(); g.translate(0, hz * 2); g.scale(1, -1); g.globalAlpha = .5; g.filter = 'blur(5px)'; g.drawImage(pano, sx, sy, sw, sh, 0, 0, W, hz); g.restore();
  for (let y = hz; y < H; y += 3) { g.fillStyle = `rgba(4,5,11,${.15 + Math.random() * .35})`; g.fillRect(0, y, W, 1 + Math.random() * 2); }   // ripples
  const fade = g.createLinearGradient(0, hz, 0, H); fade.addColorStop(0, 'rgba(4,5,11,0)'); fade.addColorStop(1, 'rgba(4,5,11,.9)'); g.fillStyle = fade; g.fillRect(0, hz, W, H - hz);
  skyTex.needsUpdate = true;
};
pano.src = '/kino/assets/tex/view_shanghai_bund.jpg';
// shadows: walls, floor and rug take them; the speakers and Kevin cast them
[backWall, rightWall, ceiling, floorTop, rug, ...leftWhole, ...leftWin].forEach((o) => { o.receiveShadow = true; });
speakerParts.forEach((g) => g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }));
consoleBox.castShadow = consoleBox.receiveShadow = true;
// the reflections: this room, lit, caught once by a camera in the middle of it
const roomEnv = scene.environment, cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
const cubeCam = new THREE.CubeCamera(.1, 30, cubeRT); cubeCam.position.set(.2, 1.3, -.8);
let envA = null, envDone = false, modelsAt = 0;
function captureRoom() {
  envDone = true;
  scene.environment = null;
  cubeCam.update(renderer, scene);
  if (envA) envA.dispose();
  envA = pmrem.fromCubemap(cubeRT.texture).texture;
  setEnv();
}
function setEnv() {
  const a = roomKey === 'a' && envA;
  scene.environment = a ? envA : roomEnv; scene.environmentIntensity = a ? .8 : .12;
}
function tourFrame(lum) {
  if (roomKey !== 'a') return;
  const dim = 1 - .35 * on;          // the lights go down a little while the film runs
  downs.forEach((s, i) => { s.intensity = (i === 2 ? 1.6 : 6) * lights * dim; });   // [2] = over the white marble table
  washers.forEach((s) => { s.intensity = 7 * lights * dim; });
  screenPanel.color.copy(avg); screenPanel.intensity = (.2 + lum * 1.6) * on;
  screenShadow.color.copy(avg); screenShadow.intensity = (2 + lum * 14) * on;
  if (!envDone && modelsAt && performance.now() - modelsAt > 1500 && lights > .9) captureRoom();
}

// ---------------- the room the viewer picked ----------------
// what the room keeps of the shared things
const KIT = { a: { frame: 1, speakers: 1, console: 1, corners: 1, smart: 1 } };
function sofaMaterial(v) {
  return new THREE.MeshPhysicalMaterial({ color: v.sofa, roughness: .42, clearcoat: .35, clearcoatRoughness: .45, sheen: .3, sheenColor: new THREE.Color(.25, .2, .15) });
}
function applyRoom(key) {
  if (!VARIANTS[key]) return;
  roomKey = key; V = VARIANTS[key];
  document.body.dataset.look = key;
  if (typeof rebuild === 'function' && entered) rebuild(now());
  try { localStorage.setItem('kinoRoom', key); } catch (er) { /* no storage */ }
  leftWhole.forEach((p) => { p.visible = false; }); leftWin.forEach((p) => { p.visible = true; });
  floorTop.material = key === 'a' ? A_MAT.floor : floorBase;
  floorTop.material.color.setRGB(...V.floor);
  if (key === 'a') { backWall.material = A_MAT.back; rightWall.material = A_MAT.side; leftWhole.concat(leftWin).forEach((p) => { p.material = A_MAT.side; }); A_MAT.floor.color.setHex(0x8f7560); }
  const A = key === 'a';
  aTour.visible = A; if (ao) ao.enabled = A;
  if (mirror) mirror.visible = !A;   // oiled parquet in a flat does not mirror (and it saves a whole extra render)
  renderer.toneMappingExposure = A ? 1 : .85;
  setEnv();
  curtainMat.map = A ? velvet.map : null; curtainMat.normalMap = A ? velvet.normalMap : null; curtainMat.needsUpdate = true;
  rug.material = A ? A_MAT.rug : rugBase;
  const old = rugBase.map;
  rugBase.map = canvasTex(512, 512, (g, w, hh) => {
    g.fillStyle = V.rug; g.fillRect(0, 0, w, hh);
    for (let i = 0; i < 9000; i++) { const v = Math.random() * 40; g.fillStyle = `rgba(${v + 30},${v + 28},${v + 30},.25)`; g.fillRect(Math.random() * w, Math.random() * hh, 2, 2); }
    g.strokeStyle = 'rgba(180,140,60,.35)'; g.lineWidth = 3; g.strokeRect(22, 22, w - 44, hh - 44);
  });
  rugBase.needsUpdate = true; if (old) old.dispose();
  const m = sofaMaterial(V);
  sofa.children.forEach((o) => { if (o.isMesh) o.material = m; });
  chair.children.forEach((o) => { if (o.isMesh) o.material = m; });
  CANDLE.setRGB(...V.cove);
  styleSpeakers(key);
  curtainMat.color.setHex(V.curtain[0]); curtainMat.sheenColor.setRGB(...V.curtain[1]);
  cove.forEach((l) => l.color.copy(CANDLE)); lampLight.color.copy(CANDLE); shade.material.emissive.copy(CANDLE);
  cornerCols[0].copy(NEON[V.corners[0]]); cornerCols[1].copy(NEON[V.corners[1]]);
  cornerLights.forEach((l, i) => l.color.copy(cornerCols[i]));
  roomA.forEach((o) => { o.visible = key === 'a' && !o.userData.replaced; });
  roomAModels.forEach((o) => { o.visible = key === 'a'; });
  const realChair = key === 'a' && chairModel;
  if (chairModel) chairModel.visible = !!realChair;
  chair.children.forEach((o) => { if (o !== kevinSlot) o.visible = !realChair; });
  const kit = KIT[key];
  frame3.visible = goldLine.visible = !!kit.frame; consoleBox.visible = consoleLed.visible = !!kit.console;
  speakerParts.forEach((o) => { o.visible = !!kit.speakers; });
  cornerTubes.forEach((o) => { o.visible = !!kit.corners; }); cornerLights.forEach((l) => { l.visible = !!kit.corners; });
  heads.forEach((hd) => { hd.pod.visible = hd.lens.visible = hd.beam.visible = hd.spot.visible = !!kit.smart; });
  document.querySelectorAll('[data-room]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.room === key ? 'true' : 'false'));
}
document.querySelectorAll('[data-room]').forEach((b) => b.addEventListener('click', (ev) => { if (!VARIANTS[b.dataset.room]) return; ev.stopPropagation(); applyRoom(b.dataset.room); }));
$('roomBtn').onclick = (ev) => { ev.stopPropagation(); $('rooms').hidden = !$('rooms').hidden; };
addEventListener('click', (ev) => { if (!$('rooms').hidden && !$('rooms').contains(ev.target)) $('rooms').hidden = true; });
applyRoom(roomKey);

// ---------------- every frame ----------------
const ease = (p) => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
let last = performance.now(), beat = 0, bassAvg = 0, chorus = 0, wasPlaying = null, started = false, wasChorus = false, credited = false, slowFrames = 0, half = false, skip = false;
const avg = new THREE.Color(), tmp = new THREE.Color(), tmp2 = new THREE.Color(), DOWN = new THREE.Vector3(0, -1, 0), tv = new THREE.Vector3();
function credits() {
  return '<span class="ct">' + D.title + '</span><span class="cv">' + D.artist + ' · ' + D.year + '</span>' +
    '<span class="cl">Rap a text</span><span class="cv">' + D.artist + '</span><span class="cl">Karaoke</span><span class="cv">SKELO SQUAD</span>' +
    '<span class="cl">A hlavně</span><span class="cv">ty – díky, že sis zazpíval/a</span><span class="cs"></span>';
}
target(Math.max(20, simT), cur);
fit();
if (qs.has('auto')) rebuild(now());
const edgeCol = (row, i, out) => { const o = (row * 16 + i) * 3; return out.setRGB(cur[o], cur[o + 1], cur[o + 2]); };

function frame(ts) {
  requestAnimationFrame(frame);
  const raw = (ts - last) / 1000;
  // a slow computer: every other frame, all layers together (the clip and its frame never drift apart)
  if (raw > .024) slowFrames = Math.min(90, slowFrames + 1); else slowFrames = Math.max(0, slowFrames - 1);
  if (!half && slowFrames > 60) half = true;
  if (half && (skip = !skip)) return;
  const dt = Math.min(.1, raw); last = ts;
  const t = now(), pl = playing(), sec = ts / 1000;

  if (onAt) { const p = Math.min(1, (ts - onAt) / onMs); on = onTo > onFrom ? onFrom + (onTo - onFrom) * flicker(p) : onFrom + (onTo - onFrom) * p; if (p >= 1) onAt = 0; }
  lights += (lightsTo - lights) * (1 - Math.exp(-dt * 2.5));
  powerEl.style.opacity = (1 - on).toFixed(3);
  const k0 = camAt < 0 ? 1 : ease(Math.min(1, (ts - camAt) / camMs)), k = camBack ? 1 - k0 : k0;
  par.x += (mouse.x - par.x) * (1 - Math.exp(-dt * 2)); par.y += (mouse.y - par.y) * (1 - Math.exp(-dt * 2));
  camera.position.lerpVectors(camFrom, CAM, k);
  camera.position.x += par.x * .18; camera.position.y -= par.y * .06;
  camera.lookAt(look);

  // the clip's colours
  if (entered && (pl || onAt)) target(t, tgt); else target(Math.max(t, 20), tgt);
  const kk = 1 - Math.exp(-dt * 5);
  let sr = 0, sg = 0, sb = 0;
  for (let i = 0; i < cur.length; i++) cur[i] += (tgt[i] - cur[i]) * kk;
  for (let j = 0; j < 48; j++) { sr += cur[j * 3]; sg += cur[j * 3 + 1]; sb += cur[j * 3 + 2]; }
  avg.setRGB(sr / 48, sg / 48, sb / 48);
  const lum = avg.r * .3 + avg.g * .59 + avg.b * .11;
  for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) {
    const u = x / 31, v = y / 17, li = Math.round(v * 15), bi = Math.round(u * 15), wb = Math.max(0, Math.min(1, (v - .35) / .65)) * .65;
    edgeCol(0, li, tmp); edgeCol(1, li, tmp2); tmp.lerp(tmp2, u * u * (3 - 2 * u)); edgeCol(2, bi, tmp2); tmp.lerp(tmp2, wb);
    const o = (y * 32 + x) * 4; scrImg.data[o] = tmp.r * 255; scrImg.data[o + 1] = tmp.g * 255; scrImg.data[o + 2] = tmp.b * 255; scrImg.data[o + 3] = 255;
  }
  scrCtx.putImageData(scrImg, 0, 0); scrTex.needsUpdate = true;
  tourFrame(lum);
  screenMat.color.setScalar(1.1 * on);
  screenLight.color.copy(avg); screenLight.intensity = (.6 + lum * 4) * on;
  for (const [i, l] of sideLights.entries()) {   // a grey clip lights the sides cold left / warm right like a film
    edgeCol(i, 7, tmp); const g = tmp.r * .3 + tmp.g * .59 + tmp.b * .11, sat = Math.max(tmp.r, tmp.g, tmp.b) - Math.min(tmp.r, tmp.g, tmp.b);
    tmp2.copy(i === 0 ? COLD : WARM).multiplyScalar(g * 1.6);
    l.color.copy(tmp2.lerp(tmp, Math.min(1, sat * 4))); l.intensity = 1.6 * on;
  }

  // the beat and the chorus
  if (pl) { const b = bassAt(t); bassAvg += (b - bassAvg) * (1 - Math.exp(-dt / .7)); beat = Math.max(beat * Math.exp(-dt / .17), Math.min(1, Math.max(0, b - bassAvg * 1.08) * 4.5)); }
  else beat *= Math.exp(-dt / .3);
  let sg2 = -1; for (let c = 0; c < D.times.length && D.times[c][0] <= t; c++) sg2 = c;
  chorus += ((sg2 >= 0 && isChorus[sg2] && t < D.times[sg2][1] + 1.5 ? 1 : 0) - chorus) * (1 - Math.exp(-dt / .9));

  // the home: warm indirect light, the lit corners, the lamp, the moon through the window
  for (const g of glows) g.m.color.copy(g.col).multiplyScalar(g.k * lights);
  for (const l of cove) l.intensity = .9 * lights;
  for (const l of cornerLights) l.intensity = 1.6 * lights;
  lampLight.intensity = 1.4 * lights; shade.material.emissiveIntensity = .35 * lights;
  moon.intensity = .6;
  const buzz = (ts % 9000) < 160 ? (Math.sin(ts * .09) > 0 ? .5 : 1) : 1;
  signMat.opacity = Math.min(1, lights) * buzz;
  for (const sp of speakers) sp.cones.forEach((m) => { m.position.z = .196 + beat * .022; });   // the cones push out with the bass

  // smart lights: soft sweeps, up with the bass, wider in the chorus
  for (const h of heads) {
    const sw = .5 + .5 * Math.sin(sec * .21 + h.phase), up = .5 + .5 * Math.sin(sec * .15 + h.phase * 2);
    tv.set(-h.s * (.4 + 1.8 * sw * (1 + chorus * .5)), .05 + .7 * up + chorus * .6, -3 + 2.6 * (.5 + .5 * Math.sin(sec * .11 + h.phase)));
    const dir = tv.clone().sub(h.origin), len = dir.length(); dir.normalize();
    h.beam.position.copy(h.origin); h.beam.quaternion.setFromUnitVectors(DOWN, dir);
    const r = len * .09; h.beam.scale.set(r, len, r);
    const inten = (.05 + beat * .45 + chorus * .12) * lights * on;
    h.beam.material.uniforms.uInt.value = inten; h.beam.material.uniforms.uTime.value = sec;
    h.spot.target.position.copy(tv); h.spot.intensity = inten * 9;
    h.lensM.color.copy(h.col).multiplyScalar(.6 + inten * 4);
  }

  for (const w of wisps) {
    w.age += dt; if (w.age > w.life) respawn(w);
    w.sp.position.addScaledVector(w.v, dt);
    const f = w.age / w.life, s = w.size * (1 + f * .6);
    w.sp.scale.set(s, s, 1); w.m.rotation += w.spin * dt;
    w.m.color.copy(avg).lerp(GOLD, .15).multiplyScalar(.5);
    w.m.opacity = (f < .2 ? f / .2 : 1 - (f - .2) / .8) * .1 * (.4 + .6 * on);
  }

  // gold rain when a chorus starts
  if (chorus > .5 && !wasChorus && pl) spawnRain(LOW ? 80 : 170);
  wasChorus = chorus > .5;
  rainMat.uniforms.uTime.value = sec;
  for (let i = 0; i < N_RAIN; i++) {
    if (rainLife[i] <= 0) continue;
    rainPos[i * 3 + 1] -= rainVel[i] * dt; rainPos[i * 3] += Math.sin(sec * 2 + rainSeed[i] * 30) * .05 * dt;
    if (rainPos[i * 3 + 1] < 0) rainLife[i] = 0;
  }
  rainGeo.attributes.position.needsUpdate = true; rainGeo.attributes.aLife.needsUpdate = true;

  // the curtain: open once the projector is on; closes after the last line for the end titles
  const ended = entered && (started || SIM) && t > Math.min(duration() - 1.5, LAST_END + 6);
  const curtainTo = ended || exiting ? 0 : on > .95 && (started || SIM) ? 1 : 0;
  if (ended && !credited) { credited = true; $('roll').innerHTML = credits(); $('credits').hidden = false; $('credits').classList.add('run'); spawnRain(N_RAIN); setTimeout(() => { if (credited) exitKino(); }, 17000); }
  if (!ended && credited) { credited = false; $('credits').hidden = true; $('credits').classList.remove('run'); }
  curtainOpen += (curtainTo - curtainOpen) * (1 - Math.exp(-dt * (curtainTo ? .9 : 1.3)));
  const co = curtainOpen * curtainOpen * (3 - 2 * curtainOpen);
  curtains.forEach((c) => { c.scale.x = 1 - co * .87; c.scale.z = 1 + co * 2.2; });
  curtainKey.intensity = (3 * (1 - co) + .9) * Math.max(lights, .3);
  curtainSides.forEach((l) => { l.intensity = 2.2 * co * Math.max(lights, .3); });


  if (entered) words(t);
  drawFx(dt);
  if (pl && !started && (!clock || clock.time() > .3)) { started = true; if (clock) poster.style.display = 'none'; }
  if (clock && clock.time() > .3) catcher.classList.toggle('paused', !pl);
  $('fill').style.width = (t / duration() * 100) + '%';
  $('time').textContent = fmt(t) + ' / ' + fmt(duration());
  if (pl !== wasPlaying) { wasPlaying = pl; $('ppIcon').innerHTML = pl ? '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>'; }
  const hb = .85 / Math.max(avg.r, avg.g, avg.b, .08);
  document.documentElement.style.setProperty('--hot', `rgb(${Math.round(Math.min(255, avg.r * hb * 128 + 115))},${Math.round(Math.min(255, avg.g * hb * 128 + 92))},${Math.round(Math.min(255, avg.b * hb * 128 + 24))})`);

  composer.render(dt);
  css.render(cssScene, camera);
  front.render(frontScene, camera);
}

// the loading screen (kino.jsp) stays up while the models and textures load and reach the graphics card,
// the shaders build and the lit room is caught for its reflections – all of which used to jerk the way in.
// The room is lit fully behind it for that, then goes dark again for the lobby.
const frames = (n) => new Promise((res) => { let k = 0; const f = () => (++k >= n ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); });
THREE.DefaultLoadingManager.onProgress = (url, done, all) => { if (window.kinoProgress) window.kinoProgress(.1 + .75 * done / all); };
if (!entered) lights = lightsTo = 1;
requestAnimationFrame(frame);
(async () => {
  await Promise.race([Promise.all([modelsA, modelsB]), new Promise((res) => setTimeout(res, 15000))]);
  try { await Promise.all([renderer.compileAsync(scene, camera), front.compileAsync(frontScene, camera)]); } catch (er) { /* older browsers: built on the first frame */ }
  await frames(6);
  if (roomKey === 'a' && !envDone) captureRoom();
  await frames(2);
  if (!entered) lights = lightsTo = .15;
  if (window.kinoLoaded) window.kinoLoaded();
})();
