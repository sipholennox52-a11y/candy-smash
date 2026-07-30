import { Router } from 'express';
import { db } from '../db.js';
import { defaultState } from '../state.js';
import {
  hashPassword, verifyPassword, signToken, newUserId,
} from '../auth.js';

export const authRouter = Router();

function isEmail(v) {
  return typeof v === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 254;
}
function isPassword(v) {
  return typeof v === 'string' && v.length >= 8 && v.length <= 200;
}

// Anonymous / device account: no PII, just an opaque id + token.
authRouter.post('/anonymous', (req, res) => {
  const id = newUserId();
  db.createUser({ id, anonymous: true, createdAt: new Date().toISOString() });
  db.setState(id, defaultState());
  res.json({ token: signToken(id), userId: id, anonymous: true });
});

authRouter.post('/register', (req, res) => {
  const { email, password } = req.body || {};
  if (!isEmail(email)) return res.status(400).json({ error: 'invalid_email' });
  if (!isPassword(password)) return res.status(400).json({ error: 'weak_password' });
  if (db.getUserByEmail(email)) return res.status(409).json({ error: 'email_taken' });

  const id = newUserId();
  db.createUser({
    id, email, passwordHash: hashPassword(password), createdAt: new Date().toISOString(),
  });
  db.setState(id, defaultState());
  res.json({ token: signToken(id), userId: id });
});

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!isEmail(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'invalid_credentials' });
  }
  const user = db.getUserByEmail(email);
  // Constant-ish response regardless of whether the user exists.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  res.json({ token: signToken(user.id), userId: user.id });
});
