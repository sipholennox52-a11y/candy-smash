// Server-authoritative game state. Mirrors the client's sanitize logic but is
// the source of truth: the client may PROPOSE progress, the server validates
// and clamps it, and only the server grants paid items.
const MAX_LIVES = 5;

export function defaultState() {
  return {
    coins: 50,
    lives: 5,
    level: 1,
    boosters: { hammer: 1, bomb: 1, shuffle: 1 },
    lastLifeAt: Date.now(),
  };
}

export function sanitizeState(input) {
  const d = defaultState();
  const s = input && typeof input === 'object' ? input : {};
  const num = (v, fallback) => (Number.isFinite(v) ? v : fallback);

  const out = {
    coins: Math.max(0, Math.floor(num(s.coins, d.coins))),
    lives: Math.max(0, Math.min(MAX_LIVES, Math.floor(num(s.lives, d.lives)))),
    level: Number.isFinite(s.level) && s.level >= 1 ? Math.floor(s.level) : d.level,
    lastLifeAt: num(s.lastLifeAt, Date.now()),
    boosters: {},
  };

  const b = s.boosters && typeof s.boosters === 'object' ? s.boosters : {};
  for (const k of ['hammer', 'bomb', 'shuffle']) {
    out.boosters[k] = Math.max(0, Math.floor(num(b[k], d.boosters[k])));
  }
  return out;
}

// Accept a client-proposed state but never let it grant free currency/items:
// coins/boosters/level may only stay the same or DECREASE relative to the
// stored server state (spending), except via verified purchases. Lives may
// decrease freely and regenerate on the server clock.
export function reconcile(serverState, proposed) {
  const cur = sanitizeState(serverState);
  const next = sanitizeState(proposed);

  return {
    coins: Math.min(cur.coins, next.coins),
    lives: Math.min(cur.lives, next.lives),
    // Progression may advance by at most one level per sync to curb tampering.
    level: Math.min(cur.level + 1, Math.max(cur.level, next.level)),
    lastLifeAt: cur.lastLifeAt,
    boosters: {
      hammer: Math.min(cur.boosters.hammer, next.boosters.hammer),
      bomb: Math.min(cur.boosters.bomb, next.boosters.bomb),
      shuffle: Math.min(cur.boosters.shuffle, next.boosters.shuffle),
    },
  };
}

export function grantPurchase(serverState, sku) {
  const s = sanitizeState(serverState);
  if (sku.coins) s.coins += sku.coins;
  if (sku.boosters) {
    for (const k of ['hammer', 'bomb', 'shuffle']) {
      if (sku.boosters[k]) s.boosters[k] += sku.boosters[k];
    }
  }
  return s;
}
