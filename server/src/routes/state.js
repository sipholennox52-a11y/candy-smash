import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { defaultState, sanitizeState, reconcile } from '../state.js';

export const stateRouter = Router();

stateRouter.use(requireAuth);

// Fetch the authoritative state.
stateRouter.get('/', (req, res) => {
  let s = db.getState(req.userId);
  if (!s) s = db.setState(req.userId, defaultState());
  res.json({ state: sanitizeState(s) });
});

// Client proposes progress; server reconciles (can only spend, not mint).
// Paid items are granted exclusively through the /purchase routes.
stateRouter.put('/', (req, res) => {
  const proposed = req.body && req.body.state;
  if (!proposed || typeof proposed !== 'object') {
    return res.status(400).json({ error: 'invalid_state' });
  }
  const current = db.getState(req.userId) || defaultState();
  const next = reconcile(current, proposed);
  db.setState(req.userId, next);
  res.json({ state: next });
});
