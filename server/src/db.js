// Minimal JSON-file persistence for the scaffold. It is intentionally simple
// and synchronous so the server runs with zero native dependencies.
//
// PRODUCTION: replace this module with a real database (Postgres, etc.) using
// transactions. Keep the same function signatures so callers don't change.
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const dataDir = path.resolve(config.dataDir);
const dbFile = path.join(dataDir, 'db.json');

function ensure() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify(emptyDb(), null, 2));
}

function emptyDb() {
  return { users: {}, states: {}, purchases: {} };
}

function read() {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch {
    return emptyDb();
  }
}

function write(db) {
  ensure();
  // Atomic-ish write: write to temp then rename.
  const tmp = dbFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, dbFile);
}

export const db = {
  getUser(id) {
    return read().users[id] || null;
  },
  getUserByEmail(email) {
    const users = read().users;
    return Object.values(users).find((u) => u.email === email) || null;
  },
  createUser(user) {
    const d = read();
    d.users[user.id] = user;
    write(d);
    return user;
  },

  getState(userId) {
    return read().states[userId] || null;
  },
  setState(userId, state) {
    const d = read();
    d.states[userId] = state;
    write(d);
    return state;
  },

  // Idempotency ledger: key is `${provider}:${providerTxnId}`.
  hasPurchase(key) {
    return Boolean(read().purchases[key]);
  },
  recordPurchase(key, record) {
    const d = read();
    if (d.purchases[key]) return d.purchases[key];
    d.purchases[key] = { ...record, key, at: new Date().toISOString() };
    write(d);
    return d.purchases[key];
  },
};
