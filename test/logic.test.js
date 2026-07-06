'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../www/logic.js');

/** Deterministic RNG that cycles through a fixed sequence of [0,1) values. */
function seq(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

/** Build a grid from an array of row arrays (copies each row). */
function makeGrid(rows) {
  return rows.map(row => row.slice());
}

/** Sort match positions for order-independent comparison. */
function sortPos(list) {
  return list.slice().sort((a, b) => a.r - b.r || a.c - b.c);
}

test('levelConfig scales target and shrinks moves with a floor of 12', () => {
  assert.deepEqual(L.levelConfig(1), { target: 1200, moves: 24 });
  assert.deepEqual(L.levelConfig(3), { target: 2000, moves: 23 });
  // moves = max(12, 24 - floor(n/3)); at n=36 the raw value hits the floor.
  assert.equal(L.levelConfig(36).moves, 12);
  assert.equal(L.levelConfig(100).moves, 12);
  assert.equal(L.levelConfig(0).target, 800);
});

test('isAdjacent is true only for orthogonal neighbours', () => {
  const c = { r: 3, c: 3 };
  assert.equal(L.isAdjacent(c, { r: 3, c: 4 }), true);
  assert.equal(L.isAdjacent(c, { r: 4, c: 3 }), true);
  assert.equal(L.isAdjacent(c, { r: 2, c: 3 }), true);
  assert.equal(L.isAdjacent(c, { r: 4, c: 4 }), false); // diagonal
  assert.equal(L.isAdjacent(c, { r: 3, c: 5 }), false); // two away
  assert.equal(L.isAdjacent(c, { r: 3, c: 3 }), false); // same cell
});

test('fmt renders zero-padded MM:SS and rounds up partial seconds', () => {
  assert.equal(L.fmt(0), '00:00');
  assert.equal(L.fmt(1000), '00:01');
  assert.equal(L.fmt(1), '00:01'); // rounds up
  assert.equal(L.fmt(59 * 1000), '00:59');
  assert.equal(L.fmt(60 * 1000), '01:00');
  assert.equal(L.fmt(9 * 60 * 1000 + 59 * 1000), '09:59');
  assert.equal(L.fmt(600 * 1000), '10:00');
});

test('swap exchanges two cells in place', () => {
  const grid = makeGrid([[1, 2], [3, 4]]);
  L.swap(grid, { r: 0, c: 0 }, { r: 1, c: 1 });
  assert.deepEqual(grid, [[4, 2], [3, 1]]);
  // swapping back restores the original board
  L.swap(grid, { r: 0, c: 0 }, { r: 1, c: 1 });
  assert.deepEqual(grid, [[1, 2], [3, 4]]);
});

test('findMatches detects horizontal runs including runs longer than 3', () => {
  const grid = makeGrid([
    [0, 0, 0, 1],
    [2, 3, 4, 5],
    [1, 1, 1, 1],
    [5, 4, 3, 2],
  ]);
  const matches = sortPos(L.findMatches(grid));
  assert.deepEqual(matches, sortPos([
    { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 },
    { r: 2, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 2 }, { r: 2, c: 3 },
  ]));
});

test('findMatches detects vertical runs', () => {
  const grid = makeGrid([
    [7, 1, 2],
    [7, 3, 4],
    [7, 5, 6],
    [0, 8, 9],
  ]);
  const matches = sortPos(L.findMatches(grid));
  assert.deepEqual(matches, sortPos([
    { r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 },
  ]));
});

test('findMatches ignores runs of exactly two and null cells', () => {
  const grid = makeGrid([
    [0, 0, 1],
    [null, null, null],
    [2, 2, 3],
  ]);
  assert.deepEqual(L.findMatches(grid), []);
});

test('findMatches returns empty for an empty grid', () => {
  assert.deepEqual(L.findMatches([]), []);
});

test('findMatches counts an intersecting cell once', () => {
  // Plus-shape: row 1 all 5s and column 1 all 5s share cell (1,1).
  const grid = makeGrid([
    [9, 5, 9],
    [5, 5, 5],
    [9, 5, 9],
  ]);
  const matches = L.findMatches(grid);
  const keys = matches.map(p => `${p.r},${p.c}`);
  assert.equal(new Set(keys).size, keys.length); // no duplicates
  assert.ok(keys.includes('1,1'));
  assert.equal(matches.length, 5);
});

test('computeStars awards 1/2/3 stars at the right thresholds', () => {
  assert.equal(L.computeStars(999, 1000), 1);
  assert.equal(L.computeStars(1000, 1000), 1);
  assert.equal(L.computeStars(1200, 1000), 2); // exactly 1.2x
  assert.equal(L.computeStars(1499, 1000), 2);
  assert.equal(L.computeStars(1500, 1000), 3); // exactly 1.5x
  assert.equal(L.computeStars(3000, 1000), 3);
});

test('collapse drops candies down and refills empties from the top', () => {
  // Column layout (top->bottom): [1, null, 2, null] should settle to
  // [fill, fill, 1, 2] with fills coming from the rng.
  const grid = makeGrid([
    [1],
    [null],
    [2],
    [null],
  ]);
  L.collapse(grid, 6, seq([0, 0.5]));
  assert.equal(grid[2][0], 1);
  assert.equal(grid[3][0], 2);
  // refill writes bottom-up from the last empty row: row1 = (0*6)|0 = 0,
  // then row0 = (0.5*6)|0 = 3.
  assert.equal(grid[1][0], 0);
  assert.equal(grid[0][0], 3);
});

test('collapse leaves a full column untouched', () => {
  const grid = makeGrid([[3], [4], [5]]);
  L.collapse(grid, 6, () => 0);
  assert.deepEqual(grid, [[3], [4], [5]]);
});

test('collapse refills a fully empty column entirely from rng', () => {
  const grid = makeGrid([[null], [null]]);
  L.collapse(grid, 6, seq([0.999, 0]));
  // write proceeds bottom-up: row1 first (0.999*6|0=5), then row0 (0*6|0=0)
  assert.equal(grid[1][0], 5);
  assert.equal(grid[0][0], 0);
});

test('randNoMatch avoids completing a horizontal triple', () => {
  const grid = makeGrid([[2, 2, null]]);
  // rng first yields 2 (would match), then 4 (safe) -> must pick 4.
  const t = L.randNoMatch(grid, 0, 2, 6, seq([2 / 6, 4 / 6]));
  assert.equal(t, 4);
});

test('randNoMatch avoids completing a vertical triple', () => {
  const grid = makeGrid([[3], [3], [null]]);
  const t = L.randNoMatch(grid, 2, 0, 6, seq([3 / 6, 1 / 6]));
  assert.equal(t, 1);
});

test('randNoMatch accepts the first value when it forms no run', () => {
  const grid = makeGrid([[0, 1, null]]);
  const t = L.randNoMatch(grid, 0, 2, 6, seq([5 / 6]));
  assert.equal(t, 5);
});

test('mergeSave returns a defaults copy when raw is empty', () => {
  const defaults = { coins: 50, lives: 5 };
  const out = L.mergeSave(defaults, null);
  assert.deepEqual(out, defaults);
  assert.notEqual(out, defaults); // must be a copy, not the same reference
});

test('mergeSave overlays persisted values over defaults', () => {
  const defaults = { coins: 50, lives: 5, level: 1 };
  const out = L.mergeSave(defaults, JSON.stringify({ coins: 999, level: 7 }));
  assert.deepEqual(out, { coins: 999, lives: 5, level: 7 });
});

test('mergeSave falls back to defaults on invalid JSON', () => {
  const defaults = { coins: 50 };
  assert.deepEqual(L.mergeSave(defaults, '{not valid json'), { coins: 50 });
});

test('loseLife floors at zero and resets the regen clock below max', () => {
  const now = 1000;
  const a = L.loseLife({ lives: 3, lastLifeAt: 0 }, now, 5);
  assert.deepEqual(a, { lives: 2, lastLifeAt: now });

  const b = L.loseLife({ lives: 0, lastLifeAt: 42 }, now, 5);
  assert.deepEqual(b, { lives: 0, lastLifeAt: now });
});

test('loseLife keeps the clock when still at max lives', () => {
  const out = L.loseLife({ lives: 5, lastLifeAt: 42 }, 1000, 5);
  // 5 -> 4 is below max, so the clock resets to now
  assert.deepEqual(out, { lives: 4, lastLifeAt: 1000 });
});

test('regenLives adds one life once enough time has elapsed', () => {
  const out = L.regenLives({ lives: 2, lastLifeAt: 0 }, 60000, 60000, 5);
  assert.deepEqual(out, { lives: 3, lastLifeAt: 60000, added: 1 });
});

test('regenLives does nothing before the interval elapses', () => {
  const out = L.regenLives({ lives: 2, lastLifeAt: 0 }, 59999, 60000, 5);
  assert.deepEqual(out, { lives: 2, lastLifeAt: 0, added: 0 });
});

test('regenLives does nothing when already at max lives', () => {
  const out = L.regenLives({ lives: 5, lastLifeAt: 0 }, 999999, 60000, 5);
  assert.deepEqual(out, { lives: 5, lastLifeAt: 0, added: 0 });
});
