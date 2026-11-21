// Selbsttest der Level-Logik:  node test.js
const assert = require('assert');
const g = require('./game.js');

for (let n = 1; n <= 40; n++) for (let r = 0; r < 40; r++) {
  const L = g.genLevel(n), c = L.cells;
  assert.deepStrictEqual([c[0].x, c[0].y, c[0].z], [0, 0, 0]);
  const e = c[c.length - 1];
  assert.deepStrictEqual([e.x, e.y, e.z], [L.W - 1, L.ty, L.F - 1]);
  const seen = new Set();
  c.forEach((p, i) => {
    const k = p.x + ',' + p.y + ',' + p.z;
    assert(!seen.has(k), 'Zelle doppelt'); seen.add(k);
    assert(p.x >= 0 && p.x < L.W && p.y >= 0 && p.y < L.H && p.z >= 0 && p.z < L.F, 'außerhalb');
    if (i) { const q = c[i - 1], d = g.DV[p.inD]; assert.deepStrictEqual([p.x + d[0], p.y + d[1], p.z + d[2]], [q.x, q.y, q.z]); }
    if (i < c.length - 1) { const q = c[i + 1], d = g.DV[p.outD]; assert.deepStrictEqual([p.x + d[0], p.y + d[1], p.z + d[2]], [q.x, q.y, q.z]); }
  });
  assert(L.gapCells.length >= 2, 'zu wenige Lecks');
  for (const a of L.gapCells) {
    assert(L.store.includes(a.piece), 'Lager fehlt ' + a.piece);
    for (const b of L.gapCells) assert(a === b || Math.abs(a.i - b.i) > 1, 'Lecks nebeneinander');
  }
  assert(Number.isFinite(L.timeMax) && L.timeMax >= 30, 'Zeit ' + L.timeMax);
}
assert.strictEqual(g.tapsFor(1, 1), 3);
assert.strictEqual(g.tapsFor(5, 20), 2);
assert.strictEqual(g.TOOLS.length, 20);
console.log('OK – alle Level-Checks bestanden');
