'use strict';
/* Rohrwelt – Rohre flicken mit Adrian & Lorenz. Reines HTML/JS, lädt nichts von außen. */

// ===================== Spiel-Daten =====================
const DIRS = ['N', 'E', 'S', 'W', 'U', 'D'];
const DV = { N: [0, -1, 0], E: [1, 0, 0], S: [0, 1, 0], W: [-1, 0, 0], U: [0, 0, 1], D: [0, 0, -1] };
const pieceKey = (a, b) => (DIRS.indexOf(a) < DIRS.indexOf(b) ? a + b : b + a);
const FLAT_PIECES = ['EW', 'NS', 'NE', 'ES', 'SW', 'NW'];
const VERT_PIECES = ['NU', 'EU', 'SU', 'WU', 'ND', 'ED', 'SD', 'WD'];

const TOOLS = [
  ['Hände', '✋'], ['Arbeitshandschuhe', '🧤'], ['Klebeband', '🩹'], ['Schraubenzieher', '🪛'], ['Schraubenschlüssel', '🔧'],
  ['Hammer', '🔨'], ['Rohrzange', '🗜️'], ['Schrauben-Set', '🔩'], ['Säge', '🪚'], ['Werkzeugkoffer', '🧰'],
  ['Schweißbrenner', '🔥'], ['Rohr-Wagen', '🛒'], ['Lastenrad', '🚲'], ['Roller', '🛵'], ['Traktor', '🚜'],
  ['Rohr-Laster', '🚚'], ['Hebebühne', '🛗'], ['Kleiner Kran', '🏗️'], ['Riesen-Kran', '🏗️'], ['Goldener Mega-Kran', '🏗️'],
].map(([name, icon], i) => ({ name, icon, tier: i + 1, cost: i ? (i + 1) * (i + 1) + 4 * (i + 1) : 0 }));

const tierStats = t => ({ carry: 1 + Math.floor((t - 1) / 4), speed: 2.4 * (1 + (t - 1) * 0.05) });
const tapsFor = (size, tier) => Math.max(1, Math.ceil(size * 3 / (1 + (tier - 1) * 0.5)));

const DECOS = [
  { id: 'helm', name: 'Bauhelm', icon: '⛑️', slot: 'hut', cost: 0 },
  { id: 'clown', name: 'Clownsnase', icon: '🤡', slot: 'nase', cost: 30 },
  { id: 'fliege', name: 'Fliege', icon: '🎀', slot: 'hals', cost: 35 },
  { id: 'party', name: 'Partyhut', icon: '🥳', slot: 'hut', cost: 40 },
  { id: 'bart', name: 'Schnurrbart', icon: '🥸', slot: 'nase', cost: 45 },
  { id: 'brille', name: 'Sonnenbrille', icon: '😎', slot: 'augen', cost: 50 },
  { id: 'hase', name: 'Hasenohren', icon: '🐰', slot: 'hut', cost: 60 },
  { id: 'regenbogen', name: 'Regenbogen-Latzhose', icon: '🌈', slot: 'anzug', cost: 90 },
  { id: 'pirat', name: 'Piratenhut', icon: '🏴‍☠️', slot: 'hut', cost: 120 },
  { id: 'umhang', name: 'Superhelden-Umhang', icon: '🦸', slot: 'ruecken', cost: 140 },
  { id: 'zauber', name: 'Zauberhut', icon: '🧙', slot: 'hut', cost: 150 },
  { id: 'einhorn', name: 'Einhorn-Horn', icon: '🦄', slot: 'hut', cost: 180 },
  { id: 'krone', name: 'Krone', icon: '👑', slot: 'hut', cost: 250 },
  { id: 'gold', name: 'Goldener Anzug', icon: '✨', slot: 'anzug', cost: 300 },
];

const FLUIDS = [
  { name: 'Das Wasser', stuff: 'Wasser', color: '#38bdf8', goal: 'zum Planschbecken', icon: '🏊' },
  { name: 'Die Limonade', stuff: 'Limo', color: '#fde047', goal: 'zur Gartenparty', icon: '🥤' },
  { name: 'Der Kakao', stuff: 'Kakao', color: '#92400e', goal: 'zum Frühstückstisch', icon: '☕' },
  { name: 'Der Himbeersaft', stuff: 'Himbeersaft', color: '#e11d48', goal: 'zum Kindergeburtstag', icon: '🎂' },
  { name: 'Der grüne Schleim', stuff: 'Schleim', color: '#84cc16', goal: 'ins Monster-Labor', icon: '👾' },
  { name: 'Der Honig', stuff: 'Honig', color: '#f59e0b', goal: 'in die Bärenhöhle', icon: '🐻' },
  { name: 'Die Seifenblasen-Lauge', stuff: 'Seifenlauge', color: '#c084fc', goal: 'zur Blasen-Maschine', icon: '🫧' },
  { name: 'Der Regenbogensaft', stuff: 'Regenbogensaft', color: 'rainbow', goal: 'zum Einhorn-Brunnen', icon: '🦄' },
];

const WORLDS = [
  { name: 'Garten', icon: '🌻', W: 5, H: 4, F: 1, size: 1, tr: [], sky: ['#8fd3ff', '#e0f4ff'], floor: '#7cc35a', floor2: '#8ed16a',
    intro: 'Willkommen im Garten! 🌻 Hol Rohre im Lager 🏠 und flick die Lecks!' },
  { name: 'Stadt', icon: '🏙️', W: 6, H: 5, F: 1, size: 2, tr: [], sky: ['#9ec5e8', '#e3eef8'], floor: '#a9b4bd', floor2: '#b8c2ca',
    intro: 'Ab in die Stadt! 🏙️ Mehr Rohre, mehr Lecks, dickere Rohre!' },
  { name: 'Fabrik', icon: '🏭', W: 5, H: 3, F: 2, size: 3, tr: ['lift'], sky: ['#f6c28b', '#fde7cf'], floor: '#c8a27a', floor2: '#d4b08a',
    intro: 'Die Fabrik hat 2 Stockwerke! 🏭 Der Lift 🛗 bringt dich hoch und runter.' },
  { name: 'Wolkenkratzer', icon: '🏢', W: 5, H: 3, F: 3, size: 4, tr: ['lift', 'rutsche'], sky: ['#6fb1ff', '#cfe6ff'], floor: '#8aa1b8', floor2: '#9bb1c6',
    intro: 'Wolkenkratzer mit 3 Etagen! 🏢 Mit der Rutsche 🛝 geht es ganz schnell runter.' },
  { name: 'Vulkan-Labor', icon: '🌋', W: 6, H: 3, F: 3, size: 5, tr: ['lift', 'rutsche', 'trampolin'], sky: ['#ff9a6b', '#ffd9b0'], floor: '#9c6b5a', floor2: '#ad7a68',
    intro: 'Das Vulkan-Labor! 🌋 Das Trampolin 🤸 katapultiert dich nach oben!' },
];

// ===================== Level-Erzeugung (auch per Node testbar) =====================
function levelParams(n) {
  const w = Math.min(WORLDS.length - 1, Math.floor((n - 1) / 5)), world = WORLDS[w];
  return {
    n, w, world, W: world.W, H: world.H, F: world.F, size: world.size,
    gaps: Math.min(7, 2 + Math.floor((n - 1) / 4)),
    fluid: FLUIDS[(n - 1) % FLUIDS.length],
    timeFactor: Math.max(1.3, 2.2 - (n - 1) * 0.04),   // wird langsam knapper, bleibt aber großzügig
  };
}

function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const dirBetween = (a, b) => DIRS.find(d => a.x + DV[d][0] === b.x && a.y + DV[d][1] === b.y && a.z + DV[d][2] === b.z);

// Zufälliger Rohrweg von (0,0,0) nach (W-1,ty,F-1); geht nur nach oben, nie zweimal direkt hintereinander.
function findPath(W, H, F, ty, minLen, rnd) {
  const maxLen = Math.floor(W * H * F * 0.7) + 2, k = (x, y, z) => x + ',' + y + ',' + z;
  for (let attempt = 0; attempt < 500; attempt++) {
    const seen = new Set(), path = [];
    let steps = 0;
    const dfs = (x, y, z, fs) => {
      path.push({ x, y, z }); seen.add(k(x, y, z));
      if (x === W - 1 && y === ty && z === F - 1 && path.length >= minLen) return true;
      if (path.length < maxLen && ++steps < 3000) {
        for (const d of shuffle(['N', 'E', 'S', 'W', 'U'], rnd)) {
          if (d === 'U' && (z >= F - 1 || fs < 2)) continue;
          const nx = x + DV[d][0], ny = y + DV[d][1], nz = z + DV[d][2];
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k(nx, ny, nz))) continue;
          if (dfs(nx, ny, nz, d === 'U' ? 0 : fs + 1)) return true;
        }
      }
      path.pop(); seen.delete(k(x, y, z));
      return false;
    };
    if (dfs(0, 0, 0, 1)) return path;
  }
  throw new Error('Kein Rohrweg gefunden');
}

function bestShaft(a, b, shafts, speed) {
  const up = b.z > a.z;
  let s = null, cost = Infinity;
  for (const t of shafts) {
    if (up ? !t.up : !t.down) continue;
    const c = Math.hypot(a.x - t.x, a.y - t.y) / speed + Math.abs(b.z - a.z) / t.speed + Math.hypot(t.x - b.x, t.y - b.y) / speed;
    if (c < cost) { cost = c; s = t; }
  }
  return { s, cost };
}
const routeCost = (a, b, shafts, speed) =>
  Math.abs(a.z - b.z) < 0.01 ? Math.hypot(a.x - b.x, a.y - b.y) / speed : bestShaft(a, b, shafts, speed).cost;
const standSpot = c => ({ x: c.x + 0.95, y: c.y + 0.9, z: c.z });

function genLevel(n, rnd = Math.random) {
  const p = levelParams(n), { W, H, F } = p, tr = p.world.tr, shafts = [];
  if (tr.includes('lift')) shafts.push({ type: 'lift', icon: '🛗', x: -0.5, y: 1.5, up: true, down: true, speed: 0.9, col: '#9ca3af' });
  if (tr.includes('rutsche')) shafts.push({ type: 'rutsche', icon: '🛝', x: W + 0.5, y: H - 0.5, up: false, down: true, speed: 2.6, col: '#f97316' });
  if (tr.includes('trampolin')) shafts.push({ type: 'trampolin', icon: '🤸', x: W + 0.5, y: 0.5, up: true, down: false, speed: 2.2, col: '#a855f7' });
  const rows = [];
  for (let y = 0; y < H; y++) if (!shafts.some(s => s.x > W && Math.floor(s.y) === y)) rows.push(y);
  const ty = rows[Math.floor(rnd() * rows.length)];
  const coords = findPath(W, H, F, ty, Math.max(W + 2 * (F - 1) + 1, p.gaps * 2 + 1), rnd);
  const cells = coords.map((c, i) => {
    const inD = i ? dirBetween(c, coords[i - 1]) : 'W', outD = i < coords.length - 1 ? dirBetween(c, coords[i + 1]) : 'E';
    return { ...c, i, inD, outD, piece: pieceKey(inD, outD), gap: false, placed: false, fixed: false, taps: 0, tapsMax: 0, hinted: false, hit: 0, puddle: 0 };
  });
  // Lecks: nie direkt nebeneinander, damit man die Rohr-Enden sieht. In 3D-Welten mind. eins am Steigrohr.
  const cand = shuffle(cells.map(c => c.i), rnd);
  if (F > 1) { const v = cand.findIndex(i => /[UD]/.test(cells[i].piece)); if (v > 0) cand.unshift(...cand.splice(v, 1)); }
  const gi = [];
  for (const i of cand) { if (gi.length >= p.gaps) break; if (!gi.some(j => Math.abs(i - j) <= 1)) gi.push(i); }
  gi.forEach(i => { cells[i].gap = true; });
  const gapCells = cells.filter(c => c.gap);
  // Lager: alle flachen Teile + nötige Steigrohr-Teile + ein paar zum Verwechseln
  const vert = new Set(gapCells.filter(c => /[UD]/.test(c.piece)).map(c => c.piece));
  if (F > 1) for (const v of shuffle(VERT_PIECES.slice(), rnd)) { if (vert.size >= 3) break; vert.add(v); }
  const store = [...FLAT_PIECES, ...VERT_PIECES.filter(v => vert.has(v))];
  // Zeit: großzügig geschätzt mit den Start-Werkzeug-Werten
  const house = { x: -0.5, y: H - 0.5, z: 0 }, sp = tierStats(1).speed;
  let est = 8;
  for (const c of gapCells) est += 2 * routeCost(house, standSpot(c), shafts, sp) + tapsFor(p.size, 1) * 0.45 + 5;
  const timeMax = Math.ceil(est * p.timeFactor / 5) * 5;
  const cellMap = new Map(cells.map(c => [c.x + ',' + c.y + ',' + c.z, c]));
  return { ...p, shafts, ty, cells, gapCells, store, house, timeMax, cellMap };
}

if (typeof module !== 'undefined') module.exports = { genLevel, levelParams, tapsFor, tierStats, TOOLS, DECOS, DV };

// ===================== Browser-Teil =====================
const PLAYERS = {
  Adrian: { hair: '#5b3a1e', shirt: '#ef4444', scale: 0.92 },
  Lorenz: { hair: '#c58b2b', shirt: '#14b8a6', scale: 1 },
};
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const HIT_WORDS = ['Klonk!', 'Bäm!', 'Zack!', 'Bumm!', 'Ping!', 'Tock!'];
const $ = id => document.getElementById(id);
let cv, ctx, DPR = 1, VW = 0, VH = 0, L = null;
let S = null, playerName = null, G = null, lastT = 0, animT = 0, musicOn = true, demo = false, msgTimer = 0;

// ---------- Speichern (nur im Browser, localStorage) ----------
const newSave = () => ({ coins: 0, level: 1, tool: 1, owned: ['helm'], worn: { hut: 'helm' } });
function loadSave(name) {
  const s = newSave();
  try {
    const d = JSON.parse(localStorage.getItem('rohrwelt_' + name) || 'null');
    if (d) {
      if (Number.isFinite(d.coins) && d.coins >= 0) s.coins = Math.floor(d.coins);
      if (Number.isInteger(d.level) && d.level > 0) s.level = d.level;
      if (Number.isInteger(d.tool)) s.tool = Math.min(20, Math.max(1, d.tool));
      if (Array.isArray(d.owned)) s.owned = [...new Set(['helm', ...d.owned.filter(id => DECOS.some(x => x.id === id))])];
      if (d.worn && typeof d.worn === 'object') {
        s.worn = {};
        for (const [slot, id] of Object.entries(d.worn)) {
          const x = DECOS.find(x => x.id === id);
          if (x && x.slot === slot && s.owned.includes(id)) s.worn[slot] = id;
        }
      }
    }
  } catch (e) { /* kaputter Spielstand -> neu anfangen */ }
  return s;
}
function save() { if (demo) return; try { localStorage.setItem('rohrwelt_' + playerName, JSON.stringify(S)); } catch (e) { /* privat-Modus */ } }

// ---------- kleine Helfer ----------
function el(tag, cls, text, onclick) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  if (onclick) e.addEventListener('click', onclick);
  return e;
}
const row = kids => { const r = el('div', 'row'); r.append(...kids); return r; };
function overlay(kids, keepScroll) {
  const p = $('panel'), st = p.scrollTop;
  p.replaceChildren(...kids); $('overlay').hidden = false; p.scrollTop = keepScroll ? st : 0;
}
const closeOverlay = () => { $('overlay').hidden = true; };
function say(text, ms = 4000) {
  const m = $('msg'); m.textContent = text; m.classList.add('show');
  clearTimeout(msgTimer); msgTimer = setTimeout(() => m.classList.remove('show'), ms);
}
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16), c = s => Math.max(0, Math.min(255, ((n >> s) & 255) + amt));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}
function circ(g, x, y, r, fill) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); if (fill) g.fillStyle = fill; g.fill(); }
function ellipse(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); g.fill(); }
function rr(g, x, y, w, h, r) {
  g.beginPath();
  if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h);
}
function line2(g, x1, y1, x2, y2) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
const line = (a, b) => line2(ctx, a[0], a[1], b[0], b[1]);
function poly(pts, fill, g = ctx) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath(); g.fillStyle = fill; g.fill();
}
function emoji(g, ch, x, y, size, rot) {
  g.save(); g.translate(x, y); if (rot) g.rotate(rot);
  g.font = `${Math.round(size)}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000';
  g.fillText(ch, 0, 0); g.restore();
}

// ---------- Figur (Adrian / Lorenz) mit Deko ----------
function drawKid(g, x, y, h, name, sv, t, walking, face, toolIcon) {
  const pl = PLAYERS[name], u = h * pl.scale / 10, w = sv.worn || {};
  const gold = w.anzug === 'gold';
  let suit = gold ? '#facc15' : '#2563eb';
  const shirt = gold ? '#fde047' : pl.shirt, skin = '#f8c9a0', sw = walking ? Math.sin(t * 14) * u : 0;
  g.save(); g.translate(x, y); g.scale(face || 1, 1); g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillStyle = 'rgba(0,0,0,.22)'; ellipse(g, 0, 0, 2.6 * u, 0.8 * u);
  if (w.ruecken === 'umhang') {
    g.fillStyle = '#dc2626'; g.beginPath(); g.moveTo(-1.6 * u, -6.4 * u); g.lineTo(1.6 * u, -6.4 * u);
    g.lineTo(2.8 * u + sw * 0.5, -1.5 * u); g.quadraticCurveTo(0, -0.8 * u, -2.8 * u + sw * 0.5, -1.5 * u); g.closePath(); g.fill();
  }
  if (w.anzug === 'regenbogen') {
    suit = g.createLinearGradient(-2 * u, 0, 2 * u, 0);
    ['#ef4444', '#f59e0b', '#facc15', '#22c55e', '#3b82f6', '#a855f7'].forEach((c, i, a) => suit.addColorStop(i / (a.length - 1), c));
  }
  g.strokeStyle = suit; g.lineWidth = 1.4 * u;
  line2(g, -0.8 * u, -3.2 * u, -0.8 * u + sw, -0.6 * u); line2(g, 0.8 * u, -3.2 * u, 0.8 * u - sw, -0.6 * u);
  g.fillStyle = '#3f2a1d'; ellipse(g, -0.9 * u + sw, -0.35 * u, 0.9 * u, 0.45 * u); ellipse(g, 0.9 * u - sw, -0.35 * u, 0.9 * u, 0.45 * u);
  g.fillStyle = shirt; rr(g, -2 * u, -6.8 * u, 4 * u, 3.9 * u, 1.1 * u); g.fill();
  g.fillStyle = suit; rr(g, -1.7 * u, -5.3 * u, 3.4 * u, 2.5 * u, 0.6 * u); g.fill();
  g.strokeStyle = suit; g.lineWidth = 0.5 * u; line2(g, -1.3 * u, -5.3 * u, -1.1 * u, -6.7 * u); line2(g, 1.3 * u, -5.3 * u, 1.1 * u, -6.7 * u);
  if (gold) for (let i = 0; i < 4; i++) {
    const a = 0.5 + 0.5 * Math.sin(t * 5 + i * 2);
    g.fillStyle = `rgba(255,255,255,${a})`; circ(g, (i % 2 ? 1 : -1) * (0.6 + i * 0.3) * u, (-6 + i * 0.8) * u, 0.25 * u);
  }
  g.strokeStyle = shirt; g.lineWidth = 1.1 * u;
  line2(g, -1.9 * u, -6.2 * u, -2.9 * u, -4.2 * u - sw * 0.4); line2(g, 1.9 * u, -6.2 * u, 3 * u, -5 * u);
  g.fillStyle = skin; circ(g, -2.9 * u, -4.1 * u - sw * 0.4, 0.6 * u); circ(g, 3 * u, -5 * u, 0.6 * u);
  if (toolIcon) emoji(g, toolIcon, 3.5 * u, -5.7 * u, 2.3 * u, -0.5);
  if (w.hals === 'fliege') {
    poly([[0, -6.7 * u], [-1.1 * u, -7.3 * u], [-1.1 * u, -6.1 * u]], '#9333ea', g);
    poly([[0, -6.7 * u], [1.1 * u, -7.3 * u], [1.1 * u, -6.1 * u]], '#9333ea', g); circ(g, 0, -6.7 * u, 0.3 * u, '#7e22ce');
  }
  const hy = -8.7 * u, r = 2 * u;
  circ(g, 0, hy, r, skin);
  g.fillStyle = pl.hair; g.beginPath(); g.arc(0, hy, r * 1.05, Math.PI, 0); g.lineTo(r * 0.9, hy - r * 0.1);
  g.quadraticCurveTo(0, hy - r * 0.65, -r * 0.9, hy - r * 0.1); g.closePath(); g.fill();
  g.fillStyle = '#1f2937'; circ(g, -0.7 * u, hy + 0.1 * u, 0.28 * u); circ(g, 0.7 * u, hy + 0.1 * u, 0.28 * u);
  if (w.augen === 'brille') {
    g.fillStyle = '#111827'; rr(g, -1.6 * u, hy - 0.4 * u, 1.4 * u, 0.9 * u, 0.3 * u); g.fill(); rr(g, 0.2 * u, hy - 0.4 * u, 1.4 * u, 0.9 * u, 0.3 * u); g.fill();
    g.strokeStyle = '#111827'; g.lineWidth = 0.25 * u; line2(g, -0.2 * u, hy - 0.1 * u, 0.2 * u, hy - 0.1 * u);
    g.strokeStyle = 'rgba(255,255,255,.7)'; line2(g, -1.3 * u, hy - 0.2 * u, -0.9 * u, hy - 0.2 * u);
  }
  g.fillStyle = 'rgba(244,114,182,.45)'; circ(g, -1.3 * u, hy + 0.8 * u, 0.4 * u); circ(g, 1.3 * u, hy + 0.8 * u, 0.4 * u);
  g.strokeStyle = '#7f1d1d'; g.lineWidth = 0.25 * u; g.beginPath(); g.arc(0, hy + 0.7 * u, 0.7 * u, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  if (w.nase === 'clown') { circ(g, 0, hy + 0.35 * u, 0.6 * u, '#ef4444'); circ(g, -0.18 * u, hy + 0.15 * u, 0.15 * u, 'rgba(255,255,255,.7)'); }
  else circ(g, 0, hy + 0.35 * u, 0.25 * u, '#e8a87c');
  if (w.nase === 'bart') { g.fillStyle = '#4a2c17'; ellipse(g, -0.55 * u, hy + 0.8 * u, 0.6 * u, 0.25 * u, 0.2); ellipse(g, 0.55 * u, hy + 0.8 * u, 0.6 * u, 0.25 * u, -0.2); }
  drawHat(g, w.hut, hy, r, u);
  g.restore();
}

function drawHat(g, hat, hy, r, u) {
  switch (hat) {
    case 'helm':
      g.fillStyle = '#facc15'; g.beginPath(); g.arc(0, hy - 0.3 * u, r * 1.05, Math.PI, 0); g.fill();
      rr(g, -r * 1.35, hy - 0.6 * u, r * 2.7, 0.6 * u, 0.3 * u); g.fill();
      g.fillStyle = '#eab308'; rr(g, -0.3 * u, hy - r * 1.3, 0.6 * u, r, 0.2 * u); g.fill(); break;
    case 'party':
      poly([[-1.3 * u, hy - 1.6 * u], [1.3 * u, hy - 1.6 * u], [0.3 * u, hy - 5 * u]], '#ec4899', g);
      g.strokeStyle = '#fde047'; g.lineWidth = 0.35 * u; line2(g, -0.9 * u, hy - 2.4 * u, 0.9 * u, hy - 2.6 * u); line2(g, -0.4 * u, hy - 3.6 * u, 0.6 * u, hy - 3.7 * u);
      circ(g, 0.3 * u, hy - 5 * u, 0.5 * u, '#fde047'); break;
    case 'hase':
      for (const s of [-1, 1]) {
        g.fillStyle = '#fff'; ellipse(g, s * 0.9 * u, hy - 3.8 * u, 0.75 * u, 2.1 * u, s * 0.15);
        g.fillStyle = '#f9a8d4'; ellipse(g, s * 0.9 * u, hy - 3.7 * u, 0.35 * u, 1.5 * u, s * 0.15);
      }
      g.strokeStyle = '#f9a8d4'; g.lineWidth = 0.4 * u; g.beginPath(); g.arc(0, hy, r * 1.02, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); break;
    case 'pirat':
      g.fillStyle = '#111827'; g.beginPath(); g.moveTo(-2.7 * u, hy - 1.1 * u); g.quadraticCurveTo(0, hy - 5 * u, 2.7 * u, hy - 1.1 * u);
      g.quadraticCurveTo(0, hy - 2 * u, -2.7 * u, hy - 1.1 * u); g.fill();
      circ(g, 0, hy - 2.7 * u, 0.45 * u, '#fff'); break;
    case 'zauber':
      poly([[-1.8 * u, hy - 1.3 * u], [1.8 * u, hy - 1.3 * u], [0.7 * u, hy - 6 * u]], '#3730a3', g);
      g.fillStyle = '#3730a3'; ellipse(g, 0, hy - 1.3 * u, 2.7 * u, 0.5 * u);
      circ(g, -0.4 * u, hy - 3 * u, 0.3 * u, '#fde047'); circ(g, 0.5 * u, hy - 4.2 * u, 0.25 * u, '#fde047'); break;
    case 'einhorn':
      poly([[-0.55 * u, hy - 1.6 * u], [0.55 * u, hy - 1.6 * u], [0, hy - 4.8 * u]], '#fbbf24', g);
      g.strokeStyle = '#fff'; g.lineWidth = 0.2 * u;
      line2(g, -0.4 * u, hy - 2.2 * u, 0.4 * u, hy - 2.6 * u); line2(g, -0.25 * u, hy - 3.2 * u, 0.25 * u, hy - 3.5 * u); break;
    case 'krone':
      poly([[-1.8 * u, hy - 1.4 * u], [-1.8 * u, hy - 3.3 * u], [-0.9 * u, hy - 2.3 * u], [0, hy - 3.7 * u],
        [0.9 * u, hy - 2.3 * u], [1.8 * u, hy - 3.3 * u], [1.8 * u, hy - 1.4 * u]], '#f59e0b', g);
      circ(g, 0, hy - 2.1 * u, 0.35 * u, '#ef4444'); circ(g, -1.1 * u, hy - 1.9 * u, 0.25 * u, '#3b82f6'); circ(g, 1.1 * u, hy - 1.9 * u, 0.25 * u, '#22c55e'); break;
  }
}

function avatarCanvas(name, sv, px) {
  const c = document.createElement('canvas');
  c.width = c.height = Math.round(px * DPR); c.className = 'avatar'; c.style.width = c.style.height = px + 'px';
  const g = c.getContext('2d'); g.scale(DPR, DPR);
  circ(g, px / 2, px / 2, px / 2, '#fde68a');
  drawKid(g, px / 2, px * 0.92, px * 0.62, name, sv, 1, false, 1, TOOLS[sv.tool - 1].icon);
  return c;
}

function pieceCanvas(pc) {
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = Math.round(s * DPR);
  const g = c.getContext('2d'); g.scale(DPR, DPR);
  g.fillStyle = '#fff7e0'; rr(g, 2, 2, s - 4, s - 4, 10); g.fill(); g.strokeStyle = '#d6b77a'; g.lineWidth = 2; g.stroke();
  const m = s / 2, flat = [...pc].filter(d => DV[d][2] === 0);
  g.lineCap = 'round';
  for (const [col, wid] of [['#263238', 19], ['#94a3b8', 13]]) {
    g.strokeStyle = col; g.lineWidth = wid;
    for (const d of flat) line2(g, m, m, m + DV[d][0] * (m - 3), m + DV[d][1] * (m - 3));
  }
  const v = pc.includes('U') ? 'U' : pc.includes('D') ? 'D' : null;
  if (v) {
    circ(g, m, m, 13, v === 'U' ? '#f97316' : '#3b82f6');
    g.fillStyle = '#fff'; g.font = 'bold 16px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(v === 'U' ? '▲' : '▼', m, m + 1);
  }
  return c;
}

// ---------- Bildschirme ----------
function showStart() {
  G = null; $('hud').hidden = true;
  const cards = Object.keys(PLAYERS).map(name => {
    const s = loadSave(name), b = el('button', 'card');
    b.append(avatarCanvas(name, s, 140), el('div', 'big', name), el('div', '', `Level ${s.level} · 🪙 ${s.coins}`));
    b.onclick = () => { playerName = name; S = s; demo = false; showMenu(); };
    return b;
  });
  overlay([el('h1', '', '🔧 Rohrwelt 🔧'), el('p', '', 'Wer ist heute der Rohr-Held?'), row(cards),
    el('p', 'small', 'Tipp: Musik mit 🎸 oben rechts an/aus.')]);
}

function showMenu() {
  G = null; $('hud').hidden = true;
  const n = S.level, p = levelParams(n), tool = TOOLS[S.tool - 1], next = TOOLS[S.tool];
  const kids = [el('h1', '', `Hallo ${playerName}! 👷`), avatarCanvas(playerName, S, 160),
    el('p', 'big', `🪙 ${S.coins} Münzen`),
    el('p', '', `Nächstes Level: ${n} – Welt ${p.w + 1}: ${p.world.name} ${p.world.icon}`),
    el('p', '', `Werkzeug: ${tool.icon} ${tool.name} (Stufe ${tool.tier}/20)`)];
  if (next && S.coins >= next.cost) kids.push(el('p', 'hinttext', `Du kannst dir ${next.icon} ${next.name} kaufen!`));
  kids.push(el('button', 'btn go', "▶️ Los geht's!", () => startLevel(n, 0)),
    row([el('button', 'btn', '🧰 Werkzeug-Laden', () => showTools()), el('button', 'btn', '🎩 Deko-Laden', () => showDeco())]),
    row([el('button', 'btn', '⏪ Level wählen', showLevels), el('button', 'btn', '👥 Spieler wechseln', showStart)]));
  overlay(kids);
}

function showLevels() {
  const grid = el('div', 'levels');
  for (let i = 1; i <= S.level; i++) grid.append(el('button', 'btn', `${levelParams(i).world.icon} ${i}`, () => startLevel(i, 0)));
  overlay([el('h2', '', '⏪ Level wählen'), grid, el('button', 'btn', '⬅️ Zurück', showMenu)]);
}

function showTools(keep) {
  const list = el('div', 'list');
  for (const t of TOOLS) {
    const st = tierStats(t.tier), r = el('div', 'item' + (t.tier <= S.tool ? ' owned' : t.tier === S.tool + 1 ? ' next' : ''));
    r.append(el('span', 'icon', t.icon), el('span', 'name', `${t.tier}. ${t.name}`), el('span', 'stats', `💪${t.tier} 🎒${st.carry} 👟${st.speed.toFixed(1)}`));
    if (t.tier <= S.tool) r.append(el('span', 'stats', t.tier === S.tool ? '✅ Deins!' : '✓'));
    else if (t.tier === S.tool + 1) {
      const b = el('button', 'btn', `🪙 ${t.cost}`, () => {
        if (S.coins < t.cost) return;
        S.coins -= t.cost; S.tool = t.tier; save(); Sound.sfx('coin'); showTools(true);
      });
      b.disabled = S.coins < t.cost; r.append(b);
    } else r.append(el('span', 'stats', `🔒 ${t.cost}`));
    list.append(r);
  }
  overlay([el('h2', '', '🧰 Werkzeug-Laden'), el('p', 'big', `🪙 ${S.coins}`),
    el('p', 'small', '💪 = weniger oft draufhauen · 🎒 = mehr Rohre in der Tasche · 👟 = schneller laufen'),
    list, el('button', 'btn', '⬅️ Zurück', showMenu)], keep);
}

function showDeco(keep) {
  const grid = el('div', 'grid');
  for (const d of DECOS) {
    const owned = S.owned.includes(d.id), worn = S.worn[d.slot] === d.id;
    const b = el('button', 'deco' + (worn ? ' worn' : ''));
    b.append(el('div', 'icon', d.icon), el('div', '', d.name), el('div', 'small', worn ? '👕 Trägst du' : owned ? 'Anziehen' : `🪙 ${d.cost}`));
    b.onclick = () => {
      if (!owned) {
        if (S.coins < d.cost) { Sound.sfx('boing'); return; }
        S.coins -= d.cost; S.owned.push(d.id); S.worn[d.slot] = d.id; Sound.sfx('coin');
      } else if (worn) delete S.worn[d.slot];
      else S.worn[d.slot] = d.id;
      save(); showDeco(true);
    };
    grid.append(b);
  }
  overlay([el('h2', '', '🎩 Deko-Laden'), avatarCanvas(playerName, S, 150), el('p', 'big', `🪙 ${S.coins}`),
    el('p', 'small', 'Antippen zum Kaufen, An- und Ausziehen.'), grid, el('button', 'btn', '⬅️ Zurück', showMenu)], keep);
}

// ---------- Level ----------
function startLevel(n, fails) {
  const lv = genLevel(n);
  G = { ...lv, fails, timeMax: Math.round(lv.timeMax * (1 + 0.3 * Math.min(fails, 3))), state: 'play', inv: [], wish: [],
    flowPos: 0, flowLimit: 0, targetFill: 0, particles: [], texts: [], sprayAcc: 0, lastSplash: -1, lastSec: -1, t: 0,
    stats: tierStats(S.tool), char: { x: lv.house.x, y: lv.house.y, z: 0, wps: [], face: 1, walking: false, riding: null, pending: null } };
  G.time = G.timeMax;
  closeOverlay(); $('hud').hidden = false;
  $('lvl').textContent = `Level ${n} · ${G.world.icon} ${G.world.name}`;
  $('coinbox').textContent = `🪙 ${S.coins}`;
  buildBar(); layout();
  if (n === 1) say('1️⃣ Tippe unten im Lager auf das passende Rohr. 2️⃣ Tippe auf das Leck. 3️⃣ Hau drauf! 🔨', 8000);
  else say((n - 1) % 5 === 0 && n <= 25 ? G.world.intro : `${G.fluid.name} soll ${G.fluid.goal} fließen! Flick die Lecks! 💦`, 5000);
  if (fails) say(`Neuer Versuch – diesmal mit mehr Zeit! ⏱️ Du schaffst das, ${playerName}!`, 4000);
}

function buildBar() {
  const hints = new Set(G.gapCells.filter(c => c.hinted && !c.placed).map(c => c.piece));
  const store = $('store');
  store.replaceChildren(...G.store.map(pc => {
    const b = el('button', 'piece' + (hints.has(pc) ? ' hint' : ''), null, () => wantPiece(pc));
    b.title = /U/.test(pc) ? 'Rohr nach oben' : /D/.test(pc) ? 'Rohr nach unten' : 'Rohr';
    b.append(pieceCanvas(pc)); return b;
  }));
  const inv = $('inv'), slots = [];
  for (let i = 0; i < G.stats.carry; i++) {
    const pc = G.inv[i], wi = i - G.inv.length, wish = !pc && G.wish[wi];
    const b = el('button', 'piece' + (pc ? '' : wish ? ' wish' : ' empty'));
    if (pc) { b.append(pieceCanvas(pc)); b.title = 'Zurücklegen'; b.onclick = () => { G.inv.splice(i, 1); Sound.sfx('pickup'); buildBar(); }; }
    else if (wish) { b.append(pieceCanvas(wish)); b.onclick = () => { G.wish.splice(wi, 1); buildBar(); }; }
    slots.push(b);
  }
  inv.replaceChildren(...slots);
  const t = TOOLS[S.tool - 1]; $('toolLbl').textContent = t.icon; $('toolLbl').title = t.name;
  store.classList.toggle('pulse', !G.inv.length && !G.wish.length && G.gapCells.some(c => !c.placed));
}

function atSpot(sp) {
  const ch = G.char;
  return !ch.wps.length && Math.abs(ch.z - sp.z) < 0.01 && Math.hypot(ch.x - sp.x, ch.y - sp.y) < 0.3;
}

function goTo(t, cb) {
  const ch = G.char;
  if (ch.riding) { ch.pending = () => goTo(t, cb); return; }
  if (G.wish.length && t !== G.house) { G.wish = []; buildBar(); }
  ch.onArrive = cb;
  if (Math.abs(ch.z - t.z) < 0.01) ch.wps = [t];
  else {
    const { s } = bestShaft(ch, t, G.shafts, G.stats.speed);
    ch.wps = [{ x: s.x, y: s.y, z: ch.z }, { x: s.x, y: s.y, z: t.z, ride: s }, t];
  }
}

function arriveHouse() {
  if (!G.wish.length) { say('Wähle unten im Lager 🏠 ein Rohrstück aus!'); return; }
  G.inv.push(...G.wish); G.wish = []; Sound.sfx('pickup'); buildBar();
  say('Eingepackt! 🎒 Jetzt ab zum Leck 💦', 2500);
}

function wantPiece(pc) {
  if (!G || G.state !== 'play') return;
  if (G.inv.length + G.wish.length >= G.stats.carry) {
    Sound.sfx('boing'); say('Die Tasche ist voll! 🎒 Tippe ein Teil in der Tasche an, um es zurückzulegen.'); return;
  }
  if (atSpot(G.house)) { G.inv.push(pc); Sound.sfx('pickup'); buildBar(); return; }
  G.wish.push(pc); buildBar();
  goTo(G.house, arriveHouse);
}

function onTap(sx, sy) {
  if (!G || G.state !== 'play') return;
  const h = screenToCell(sx, sy);
  if (!h) return;
  const { x, y, z } = h;
  // Gerade an einem Leck am Hämmern? Dann zählt ein Tipp in der Nähe als Schlag.
  const cur = G.gapCells.find(c => c.placed && !c.fixed && atSpot(standSpot(c)));
  if (cur && cur.z === z && Math.hypot(h.gx - cur.x - 0.5, h.gy - cur.y - 0.5) < 1.4) { hitGap(cur); return; }
  if (z === 0 && x === -1 && y === G.H - 1) { goTo(G.house, arriveHouse); return; }
  let best = null, bd = 0.85;
  for (const c of G.gapCells) {
    if (c.fixed || c.z !== z) continue;
    const d = Math.hypot(h.gx - c.x - 0.5, h.gy - c.y - 0.5);
    if (d < bd) { bd = d; best = c; }
  }
  if (best) {
    const sp = standSpot(best);
    if (atSpot(sp)) interactGap(best); else goTo(sp, () => interactGap(best));
    return;
  }
  goTo({ x: Math.min(G.W + 0.5, Math.max(-0.5, h.gx)), y: Math.min(G.H - 0.1, Math.max(0.1, h.gy)), z }, null);
}

function interactGap(c) {
  if (c.fixed || G.state !== 'play') return;
  if (c.placed) { hitGap(c); return; }
  const k = G.inv.indexOf(c.piece);
  if (k >= 0) {
    G.inv.splice(k, 1); c.placed = true; c.taps = c.tapsMax = tapsFor(G.size, S.tool);
    Sound.sfx('pickup'); floatText(c, 'Passt! 👍'); buildBar();
    say(`Jetzt ${c.taps}× draufhauen – tippe auf das Rohr! 🔨`, 2500);
  } else if (G.inv.length) {
    c.hinted = true; Sound.sfx('boing'); floatText(c, 'Passt nicht!'); buildBar();
    say('Boing! Das passt nicht. Schau genau, wo die Rohr-Enden sind! 🔍 (Das richtige leuchtet im Lager)');
  } else {
    Sound.sfx('boing'); say('Deine Tasche ist leer – hol ein Rohr im Lager 🏠');
  }
}

function hitGap(c) {
  c.taps--; c.hit = 0.3; Sound.sfx('clank');
  floatText(c, HIT_WORDS[Math.floor(Math.random() * HIT_WORDS.length)]);
  const p = P(c.x + 0.5, c.y + 0.5, c.z), s = L.CW / 60;
  for (let i = 0; i < 10; i++) spawn(p[0], p[1], (Math.random() - 0.5) * 300 * s, -Math.random() * 250 * s, '#fde047', 0.4, 2.5 * s, 600 * s);
  if (c.taps > 0) return;
  c.fixed = true; c.fixedT = G.t; Sound.sfx('fixed');
  const left = G.gapCells.filter(g => !g.fixed).length;
  say(left ? `Super! Dicht! 💪 Noch ${left} ${left === 1 ? 'Leck' : 'Lecks'}!` : 'Alles dicht! 🎉 Schau, wie es fließt!', 2500);
}

function win() {
  G.state = 'win';
  const bonus = Math.min(20, Math.floor(G.time / 3)), coins = 20 + 5 * G.n + bonus;
  S.coins += coins; S.level = Math.max(S.level, G.n + 1); save();
  $('coinbox').textContent = `🪙 ${S.coins}`;
  Sound.sfx('win');
  const t = P(G.W + 0.5, G.ty + 0.5, G.F - 1), s = L.CW / 60;
  for (let i = 0; i < 160; i++) spawn(t[0], t[1], (Math.random() - 0.5) * 600 * s, -(200 + Math.random() * 500) * s, `hsl(${Math.random() * 360},90%,60%)`, 2.2, 4 * s, 400 * s);
  const n = G.n, next = TOOLS[S.tool];
  setTimeout(() => {
    if (!G || G.state !== 'win') return;
    const kids = [el('h1', '', `Super, ${playerName}! 🎉`), avatarCanvas(playerName, S, 130),
      el('p', 'big', `${G.fluid.name} fließt ${G.fluid.goal}! ${G.fluid.icon}`),
      el('p', 'big', `+${coins} 🪙`), el('p', 'small', `(davon ${bonus} Zeit-Bonus) · Jetzt hast du 🪙 ${S.coins}`)];
    if (next && S.coins >= next.cost) kids.push(el('p', 'hinttext', `Du kannst dir ${next.icon} ${next.name} kaufen!`));
    kids.push(el('button', 'btn go', 'Nächstes Level ▶️', () => startLevel(n + 1, 0)), el('button', 'btn', '🏠 Menü & Läden', showMenu));
    overlay(kids);
  }, 1300);
}

function fail() {
  G.state = 'fail'; Sound.sfx('fail');
  const n = G.n, f = G.fails;
  overlay([el('h1', '', '⏰ Zeit um!'), el('p', 'big', `Oh nein – alles voller ${G.fluid.stuff}! 😅`),
    el('p', '', 'Kein Problem: Beim nächsten Versuch gibt es mehr Zeit! 💪'),
    el('button', 'btn go', 'Nochmal 🔁', () => startLevel(n, f + 1)), el('button', 'btn', '🏠 Menü', showMenu)]);
}

function pauseGame() {
  if (!G || G.state !== 'play') return;
  G.state = 'pause';
  overlay([el('h2', '', '☕ Pause'),
    el('button', 'btn go', 'Weiter ▶️', () => { closeOverlay(); G.state = 'play'; }),
    el('button', 'btn', 'Level neu starten 🔁', () => startLevel(G.n, G.fails)), el('button', 'btn', '🏠 Menü', showMenu)]);
}

function toggleMusic() {
  musicOn = !musicOn;
  try { localStorage.setItem('rohrwelt_music', musicOn ? '1' : '0'); } catch (e) { /* egal */ }
  Sound.init(); Sound.music(musicOn); $('btnMusic').textContent = musicOn ? '🎸' : '🔇';
}

// ---------- Update ----------
function spawn(x, y, vx, vy, col, life, size, grav) { G.particles.push({ x, y, vx, vy, col, life, max: life, size, grav }); }
function floatText(c, text) { const p = P(c.x + 0.5, c.y + 0.3, c.z); G.texts.push({ x: p[0], y: p[1] - L.CW * 0.5, text, life: 1.1 }); }
const edgeG = (c, d) => d === 'U' ? { x: c.x + 0.5, y: c.y + 0.5, z: c.z + 0.5 } : d === 'D' ? { x: c.x + 0.5, y: c.y + 0.5, z: c.z - 0.5 }
  : { x: c.x + 0.5 + DV[d][0] * 0.5, y: c.y + 0.5 + DV[d][1] * 0.5, z: c.z };
const centerG = c => ({ x: c.x + 0.5, y: c.y + 0.5, z: c.z });
const fluidColor = k => G.fluid.color === 'rainbow' ? `hsl(${(animT * 120 + k * 40) % 360},90%,60%)` : G.fluid.color;

function updateChar(dt) {
  const ch = G.char, wp = ch.wps[0];
  if (!wp) { ch.walking = false; return; }
  if (wp.ride) {
    ch.riding = wp.ride; ch.walking = false;
    const dz = wp.z - ch.z, st = wp.ride.speed * dt;
    if (Math.abs(dz) > st) { ch.z += Math.sign(dz) * st; return; }
    ch.z = wp.z; ch.wps.shift(); ch.riding = null;
    if (ch.pending) { const p = ch.pending; ch.pending = null; p(); }
    return;
  }
  const dx = wp.x - ch.x, dy = wp.y - ch.y, d = Math.hypot(dx, dy), st = G.stats.speed * dt;
  ch.walking = true; if (Math.abs(dx) > 0.01) ch.face = dx > 0 ? 1 : -1;
  if (d > st) { ch.x += dx / d * st; ch.y += dy / d * st; return; }
  ch.x = wp.x; ch.y = wp.y; ch.wps.shift();
  if (!ch.wps.length) { ch.walking = false; const cb = ch.onArrive; ch.onArrive = null; if (cb) cb(); }
}

function leak(c, dt) {
  const e = PG(edgeG(c, c.inD)), m = PG(centerG(c)), s = L.CW / 60;
  let dx = m[0] - e[0], dy = m[1] - e[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
  G.sprayAcc += dt * (c.placed ? 12 : 60);
  while (G.sprayAcc >= 1) {
    G.sprayAcc--;
    const sp = (60 + Math.random() * 90) * s;
    spawn(e[0], e[1], dx * sp + (Math.random() - 0.5) * 60 * s, dy * sp - (60 + Math.random() * 120) * s, fluidColor(Math.random() * 9), 0.9, (2 + Math.random() * 3) * s, 420 * s);
  }
  c.puddle = Math.min(1, c.puddle + dt * (c.placed ? 0.01 : 0.06));
}

function update(dt) {
  animT += dt;
  if (!G) return;
  G.t += dt;
  for (const p of G.particles) { p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  G.particles = G.particles.filter(p => p.life > 0).slice(-700);
  for (const t of G.texts) { t.y -= 40 * dt; t.life -= dt; }
  G.texts = G.texts.filter(t => t.life > 0);
  for (const c of G.gapCells) { if (c.hit > 0) c.hit -= dt; if (c.fixed) c.puddle = Math.max(0, c.puddle - dt * 0.3); }
  if (G.state === 'pause') return;
  updateChar(dt);
  let lim = G.cells.length;
  for (const c of G.gapCells) if (!c.fixed) { lim = c.i; break; }
  G.flowLimit = lim;
  if (G.flowPos < lim) G.flowPos = Math.min(lim, G.flowPos + dt * 4);
  const allFixed = lim === G.cells.length;
  if (G.state !== 'play') return;
  if (!allFixed) {
    G.time -= dt;
    const sec = Math.ceil(G.time);
    if (sec !== G.lastSec) { G.lastSec = sec; if (sec <= 10 && sec > 0) Sound.sfx('tick'); }
    if (G.time <= 0) { G.time = 0; fail(); return; }
    if (G.flowPos >= lim) {
      if (G.lastSplash !== lim) { G.lastSplash = lim; Sound.sfx('splash'); }
      leak(G.cells[lim], dt);
    }
  } else if (G.flowPos >= lim) {
    G.targetFill = Math.min(1, G.targetFill + dt * 0.8);
    if (G.targetFill >= 1) win();
  }
  const fr = G.time / G.timeMax, f = $('timefill');
  f.style.width = (fr * 100).toFixed(1) + '%';
  f.className = fr < 0.2 ? 'danger' : fr < 0.45 ? 'warn' : '';
  $('timetxt').textContent = `⏱️ ${Math.ceil(G.time)} s`;
}

// ---------- Zeichnen ----------
function layout() {
  if (!G) return;
  const { W, H, F } = G, kch = F > 1 ? 0.55 : 0.75, ksk = 0.45;
  const top = $('topbar').getBoundingClientRect().height + 8, bot = $('bottombar').getBoundingClientRect().height + 6;
  const aw = VW - 24, ah = Math.max(100, VH - top - bot);
  const CW = Math.min(aw / (W + 2 + H * kch * ksk), ah / ((F - 1) * (H * kch + 0.9) + H * kch + 1.3), 150);
  const CH = CW * kch, SK = CH * ksk, FG = H * CH + 0.9 * CW;
  const totalW = (W + 2) * CW + H * SK, totalH = (F - 1) * FG + H * CH + 1.3 * CW;
  L = { CW, CH, SK, FG, ox: (VW - totalW) / 2 + CW, oy: top + (ah - totalH) / 2 + CW + (F - 1) * FG };
}
const P = (gx, gy, z) => [L.ox + gx * L.CW + (G.H - gy) * L.SK, L.oy + gy * L.CH - z * L.FG];
const PG = p => P(p.x, p.y, p.z);
const tile = (x, y, z) => [P(x, y, z), P(x + 1, y, z), P(x + 1, y + 1, z), P(x, y + 1, z)];

function screenToCell(sx, sy) {
  for (let z = G.F - 1; z >= 0; z--) {
    const gy = (sy - L.oy + z * L.FG) / L.CH;
    if (gy < 0 || gy >= G.H) continue;
    const gx = (sx - L.ox - (G.H - gy) * L.SK) / L.CW;
    if (gx < -1 || gx >= G.W + 1) continue;
    return { x: Math.floor(gx), y: Math.floor(gy), z, gx, gy };
  }
  return null;
}

function drawSky(w) {
  const gr = ctx.createLinearGradient(0, 0, 0, VH);
  gr.addColorStop(0, w.sky[0]); gr.addColorStop(1, w.sky[1]); ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
  const i = WORLDS.indexOf(w);
  if (i === 4) {
    poly([[VW * 0.62, VH], [VW * 0.78, VH * 0.4], [VW * 0.86, VH * 0.4], [VW * 1.02, VH]], '#7c2d12');
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(animT * 3); circ(ctx, VW * 0.82, VH * 0.4, 30, '#fb923c'); ctx.globalAlpha = 1;
  } else circ(ctx, VW - 90, 110, 36, '#fde047');
  if (i === 1 || i === 3) for (let k = 0; k * 60 < VW; k++) {
    const h = (i === 3 ? 140 : 70) + ((k * 37) % 5) * 28;
    ctx.fillStyle = 'rgba(71,85,105,.25)'; ctx.fillRect(k * 60, VH - h, 50, h);
  }
  if (i === 2) for (const k of [0.12, 0.2]) {
    ctx.fillStyle = 'rgba(120,53,15,.35)'; ctx.fillRect(VW * k, VH * 0.35, 26, VH);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; circ(ctx, VW * k + 13 + Math.sin(animT + k * 9) * 8, VH * 0.33 - (animT * 15 % 40), 14);
  }
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  for (let k = 0; k < 4; k++) {
    const x = ((animT * 10 + k * VW / 3.3) % (VW + 200)) - 100, y = 100 + (k * 47) % 130;
    circ(ctx, x, y, 22); circ(ctx, x + 24, y - 8, 26); circ(ctx, x + 50, y, 20);
  }
}

function drawFloor(z) {
  const { W, H, world } = G, th = L.CW * 0.22;
  const a = P(-1, 0, z), b = P(W + 1, 0, z), c = P(W + 1, H, z), d = P(-1, H, z);
  poly([d, c, [c[0], c[1] + th], [d[0], d[1] + th]], shade(world.floor, -50));
  poly([c, b, [b[0], b[1] + th], [c[0], c[1] + th]], shade(world.floor, -70));
  poly([a, b, c, d], shade(world.floor, -20));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) poly(tile(x, y, z), (x + y) % 2 ? world.floor : world.floor2);
}

function drawPillars(front) {
  const { W, H, F } = G, y = front ? H : 0;
  ctx.strokeStyle = '#6b7280'; ctx.lineWidth = L.CW * 0.12; ctx.lineCap = 'butt';
  for (let z = 0; z < F - 1; z++) for (const x of [-1, W + 1]) { const a = P(x, y, z), b = P(x, y, z + 1); line(a, [b[0], b[1] + L.CW * 0.22]); }
}

function drawPipes() {
  const pw = L.CW * (0.13 + 0.02 * G.size), wob = Math.sin(animT * 25) * L.CW * 0.025, n = G.cells.length, segs = [];
  segs.push({ a: P(-0.5, 0.5, 0), b: PG(edgeG(G.cells[0], 'W')), fill: 1 });
  for (const c of G.cells) {
    if (c.gap && !c.placed) continue;
    const off = c.placed && !c.fixed ? wob : 0, sh = c.gap ? (c.fixed ? 'new' : 'loose') : '';
    const e1 = PG(edgeG(c, c.inD)), m = PG(centerG(c)), e2 = PG(edgeG(c, c.outD));
    const f = Math.max(0, Math.min(1, G.flowPos - c.i));
    e1[0] += off; m[0] += off; e2[0] += off;
    segs.push({ a: e1, b: m, fill: Math.min(1, f * 2), sh }, { a: m, b: e2, fill: Math.max(0, f * 2 - 1), sh });
  }
  segs.push({ a: PG(edgeG(G.cells[n - 1], 'E')), b: P(G.W + 0.5, G.ty + 0.5, G.F - 1), fill: G.flowPos >= n ? Math.min(1, G.targetFill * 3) : 0 });
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#263238'; ctx.lineWidth = pw + L.CW * 0.06; segs.forEach(s => line(s.a, s.b));
  ctx.lineWidth = pw; segs.forEach(s => { ctx.strokeStyle = s.sh === 'loose' ? '#fbbf24' : s.sh === 'new' ? '#e2e8f0' : '#94a3b8'; line(s.a, s.b); });
  ctx.lineWidth = pw * 0.55; segs.forEach((s, k) => { if (s.fill > 0) { ctx.strokeStyle = fluidColor(k); line(s.a, lerp(s.a, s.b, s.fill)); } });
  ctx.globalAlpha = 0.4; ctx.strokeStyle = '#fff'; ctx.lineWidth = pw * 0.15; const o = pw * 0.22;
  segs.forEach(s => line([s.a[0] - o, s.a[1] - o], [s.b[0] - o, s.b[1] - o])); ctx.globalAlpha = 1;
  // ▲/▼ an Steigrohren
  for (const c of G.cells) {
    if (c.gap && !c.placed) continue;
    const v = c.piece.includes('U') ? 'U' : c.piece.includes('D') ? 'D' : null;
    if (!v) continue;
    const m = PG(centerG(c));
    circ(ctx, m[0], m[1], pw * 0.8, v === 'U' ? '#f97316' : '#3b82f6');
    ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(pw)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v === 'U' ? '▲' : '▼', m[0], m[1] + 1);
  }
  for (const c of G.gapCells) {
    if (c.placed) continue;
    for (const d of [c.inD, c.outD]) { const p = PG(edgeG(c, d)); circ(ctx, p[0], p[1], pw * 0.62, '#263238'); circ(ctx, p[0], p[1], pw * 0.36, '#0b0f12'); }
    if (c.hinted) { // Tipp: gestrichelter Umriss des richtigen Teils
      ctx.save(); ctx.setLineDash([pw * 0.5, pw * 0.4]); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = pw * 0.35;
      const m = PG(centerG(c)); line(PG(edgeG(c, c.inD)), m); line(m, PG(edgeG(c, c.outD))); ctx.restore();
    }
  }
}

function drawShafts() {
  for (const s of G.shafts) {
    const a = P(s.x, s.y, 0), b = P(s.x, s.y, G.F - 1);
    ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = s.col; ctx.lineWidth = L.CW * 0.5; ctx.lineCap = 'round';
    line(a, [b[0], b[1] - L.CW * 0.3]); ctx.restore();
    for (let z = 0; z < G.F; z++) { const p = P(s.x, s.y, z); emoji(ctx, s.icon, p[0], p[1] - L.CW * 0.15, L.CW * 0.55); }
  }
}

function drawPlaces() {
  const CW = L.CW;
  const s = P(-0.5, 0.5, 0);   // Tank
  ctx.fillStyle = '#475569'; rr(ctx, s[0] - CW * 0.32, s[1] - CW * 0.8, CW * 0.64, CW * 0.85, CW * 0.12); ctx.fill();
  ctx.fillStyle = fluidColor(0); rr(ctx, s[0] - CW * 0.22, s[1] - CW * 0.6, CW * 0.44, CW * 0.55, CW * 0.08); ctx.fill();
  emoji(ctx, '🚰', s[0], s[1] - CW * 0.95, CW * 0.4);
  const t = P(G.W + 0.5, G.ty + 0.5, G.F - 1);   // Ziel
  emoji(ctx, G.fluid.icon, t[0], t[1] - CW * 0.35, CW * 0.75);
  ctx.fillStyle = '#fff'; ctx.fillRect(t[0] - CW * 0.35, t[1] + CW * 0.08, CW * 0.7, CW * 0.12);
  ctx.fillStyle = fluidColor(3); ctx.fillRect(t[0] - CW * 0.35, t[1] + CW * 0.08, CW * 0.7 * G.targetFill, CW * 0.12);
  const h = P(-0.5, G.H - 0.5, 0);   // Heimathaus
  emoji(ctx, '🏠', h[0], h[1] - CW * 0.3, CW * 0.9);
  ctx.font = `bold ${Math.round(CW * 0.2)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#1f2937'; ctx.fillText('Lager', h[0], h[1] + CW * 0.25);
}

function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawSky(G ? G.world : WORLDS[0]);
  if (!G) return;
  const CW = L.CW;
  if (G.F > 1) drawPillars(false);
  for (let z = 0; z < G.F; z++) drawFloor(z);
  if (G.F > 1) drawPillars(true);
  for (const c of G.gapCells) {
    if (!c.fixed) poly(tile(c.x, c.y, c.z), `rgba(239,68,68,${0.25 + 0.2 * Math.sin(animT * 6)})`);
    else if (G.t - c.fixedT < 1) poly(tile(c.x, c.y, c.z), `rgba(34,197,94,${1 - (G.t - c.fixedT)})`);
    if (c.puddle > 0) { const p = P(c.x + 0.5, c.y + 0.65, c.z); ctx.globalAlpha = 0.6; ctx.fillStyle = fluidColor(1); ellipse(ctx, p[0], p[1], CW * 0.55 * c.puddle, L.CH * 0.3 * c.puddle); ctx.globalAlpha = 1; }
  }
  drawShafts(); drawPlaces(); drawPipes();
  // Fortschritt beim Festhauen
  for (const c of G.gapCells) {
    if (!c.placed || c.fixed) continue;
    const p = P(c.x + 0.5, c.y + 0.5, c.z), bw = CW * 0.8, bx = p[0] - bw / 2, by = p[1] - CW * 0.75;
    ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, bw, CW * 0.14);
    ctx.fillStyle = '#22c55e'; ctx.fillRect(bx, by, bw * (1 - c.taps / c.tapsMax), CW * 0.14);
    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, CW * 0.14);
  }
  const ch = G.char, cp = P(ch.x, ch.y, ch.z);
  if (ch.riding && ch.riding.type === 'trampolin') cp[1] -= Math.abs(Math.sin(animT * 10)) * CW * 0.3;
  drawKid(ctx, cp[0], cp[1], CW * 0.85, playerName, S, animT, ch.walking, ch.face, TOOLS[S.tool - 1].icon);
  for (const c of G.gapCells) {
    if (c.hit <= 0) continue;
    const p = P(c.x + 0.5, c.y + 0.5, c.z), k = c.hit / 0.3, tool = TOOLS[S.tool - 1];
    if (S.tool >= 18) { // Kran kommt angeschwenkt
      const sz = CW * (1 + 0.25 * (S.tool - 18));
      ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2; line([p[0], p[1] - sz * 0.9], [p[0], p[1] - CW * 0.1 - k * CW * 0.2]);
      emoji(ctx, tool.icon, p[0] - sz * 0.25, p[1] - sz * 1.1, sz);
    } else emoji(ctx, tool.icon, p[0] + CW * 0.25, p[1] - CW * 0.3 - k * CW * 0.25, CW * (0.45 + S.tool * 0.02), -0.9 * k);
  }
  for (const p of G.particles) { ctx.globalAlpha = Math.max(0, p.life / p.max); circ(ctx, p.x, p.y, p.size, p.col); }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `bold ${Math.round(CW * 0.28)}px "Comic Sans MS", sans-serif`;
  ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.fillStyle = '#b91c1c';
  for (const t of G.texts) { ctx.globalAlpha = Math.min(1, t.life * 2); ctx.strokeText(t.text, t.x, t.y); ctx.fillText(t.text, t.x, t.y); }
  ctx.globalAlpha = 1;
}

function resize() {
  DPR = Math.min(2, devicePixelRatio || 1); VW = innerWidth; VH = innerHeight;
  cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR);
  layout();
}

function loop(ts) {
  const dt = Math.min(0.1, (ts - lastT) / 1000 || 0); lastT = ts;
  update(dt); render(); requestAnimationFrame(loop);
}

function init() {
  cv = $('cv'); ctx = cv.getContext('2d');
  try { musicOn = localStorage.getItem('rohrwelt_music') !== '0'; } catch (e) { /* egal */ }
  $('btnMusic').textContent = musicOn ? '🎸' : '🔇';
  addEventListener('resize', resize); resize();
  // Audio darf erst nach einer Berührung starten
  document.addEventListener('pointerdown', () => { Sound.init(); if (musicOn) Sound.music(true); }, true);
  cv.addEventListener('pointerdown', e => { e.preventDefault(); onTap(e.clientX, e.clientY); });
  $('btnPause').onclick = pauseGame; $('btnMusic').onclick = toggleMusic;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { Sound.pause(); pauseGame(); } else Sound.resume();
  });
  const m = /^#demo=(\d+)$/.exec(location.hash);   // Test-Abkürzung, speichert nichts
  if (m) { playerName = 'Adrian'; S = loadSave('Adrian'); demo = true; startLevel(+m[1], 0); } else showStart();
  requestAnimationFrame(loop);
}
if (typeof document !== 'undefined') init();
