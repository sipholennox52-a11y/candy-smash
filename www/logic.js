/*
 * Candy Blast Saga — pure game logic.
 *
 * These functions contain the game's core rules with no DOM or timer
 * dependencies, so they can be unit tested in Node and reused by game.js in
 * the browser. The module works both as a browser global (window.CandyLogic)
 * and as a CommonJS module (module.exports).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.CandyLogic = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Score target and move budget for a given level number. */
  function levelConfig(n) {
    return { target: 800 + n * 400, moves: Math.max(12, 24 - Math.floor(n / 3)) };
  }

  /** True when two cells are orthogonally adjacent (Manhattan distance 1). */
  function isAdjacent(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
  }

  /** Format milliseconds as a MM:SS countdown string. */
  function fmt(ms) {
    const s = Math.ceil(ms / 1000);
    return `${String((s / 60) | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  /** Swap the contents of two cells in place. */
  function swap(grid, a, b) {
    const t = grid[a.r][a.c];
    grid[a.r][a.c] = grid[b.r][b.c];
    grid[b.r][b.c] = t;
  }

  /**
   * Find every cell that is part of a horizontal or vertical run of 3+ of the
   * same candy type. Returns a list of unique { r, c } positions.
   */
  function findMatches(grid) {
    const rows = grid.length;
    const cols = rows > 0 ? grid[0].length : 0;
    const hit = new Set();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols - 2; c++) {
      const t = grid[r][c];
      if (t !== null && t === grid[r][c + 1] && t === grid[r][c + 2]) {
        let e = c + 2;
        while (e + 1 < cols && grid[r][e + 1] === t) e++;
        for (let i = c; i <= e; i++) hit.add(r + ',' + i);
      }
    }
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows - 2; r++) {
      const t = grid[r][c];
      if (t !== null && t === grid[r + 1][c] && t === grid[r + 2][c]) {
        let e = r + 2;
        while (e + 1 < rows && grid[e + 1][c] === t) e++;
        for (let i = r; i <= e; i++) hit.add(i + ',' + c);
      }
    }
    return [...hit].map(s => { const [r, c] = s.split(',').map(Number); return { r, c }; });
  }

  /** Number of stars (1-3) awarded for a final score against the target. */
  function computeStars(score, target) {
    return score >= target * 1.5 ? 3 : score >= target * 1.2 ? 2 : 1;
  }

  /**
   * Apply gravity: existing (non-null) candies fall to the bottom of each
   * column and empty cells above are refilled with new random candies.
   * Mutates and returns the grid. `rng` defaults to Math.random.
   */
  function collapse(grid, types, rng) {
    rng = rng || Math.random;
    const rows = grid.length;
    const cols = rows > 0 ? grid[0].length : 0;
    for (let c = 0; c < cols; c++) {
      let write = rows - 1;
      for (let r = rows - 1; r >= 0; r--) {
        if (grid[r][c] !== null) { grid[write][c] = grid[r][c]; write--; }
      }
      for (let r = write; r >= 0; r--) grid[r][c] = (rng() * types) | 0;
    }
    return grid;
  }

  /**
   * Pick a candy type for cell (r, c) that does not immediately create a
   * horizontal or vertical run of 3 with already-filled cells above/left.
   */
  function randNoMatch(grid, r, c, types, rng) {
    rng = rng || Math.random;
    let t;
    do { t = (rng() * types) | 0; }
    while (
      (c >= 2 && grid[r][c - 1] === t && grid[r][c - 2] === t) ||
      (r >= 2 && grid[r - 1][c] === t && grid[r - 2][c] === t)
    );
    return t;
  }

  /** Merge persisted state (raw JSON string) over defaults; tolerant of junk. */
  function mergeSave(defaults, raw) {
    try {
      return raw ? Object.assign({}, defaults, JSON.parse(raw)) : Object.assign({}, defaults);
    } catch { return Object.assign({}, defaults); }
  }

  /** Decrement a life (floored at 0); reset the regen clock when below max. */
  function loseLife(state, now, maxLives) {
    const lives = Math.max(0, state.lives - 1);
    const lastLifeAt = lives < maxLives ? now : state.lastLifeAt;
    return { lives, lastLifeAt };
  }

  /**
   * Regenerate at most one life if enough time has elapsed. Returns the new
   * { lives, lastLifeAt } plus `added` (0 or 1). Mirrors the game's tick.
   */
  function regenLives(state, now, regenMs, maxLives) {
    if (state.lives < maxLives && now - state.lastLifeAt >= regenMs) {
      return { lives: state.lives + 1, lastLifeAt: now, added: 1 };
    }
    return { lives: state.lives, lastLifeAt: state.lastLifeAt, added: 0 };
  }

  return {
    levelConfig,
    isAdjacent,
    fmt,
    swap,
    findMatches,
    computeStars,
    collapse,
    randNoMatch,
    mergeSave,
    loseLife,
    regenLives,
  };
});
