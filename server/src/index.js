import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { stateRouter } from './routes/state.js';
import { purchaseRouter } from './routes/purchases.js';
import { webhookRouter } from './routes/webhooks.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());

// Lock CORS to the configured game origin(s).
app.use(cors({
  origin(origin, cb) {
    // Allow same-origin / server-to-server (no Origin header) and configured origins.
    if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Stripe webhook needs the RAW body for signature verification — mount it
// BEFORE the JSON parser.
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRouter);

// JSON for everything else, with a small body limit.
app.use(express.json({ limit: '32kb' }));

// Basic rate limiting to blunt abuse/brute force.
const limiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
app.use('/api', limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth', authLimiter);

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  payments: {
    stripe: config.stripe.enabled,
    google: config.google.enabled,
    apple: config.apple.enabled,
  },
}));

app.use('/api/auth', authRouter);
app.use('/api/state', stateRouter);
app.use('/api/purchase', purchaseRouter);

// Fallthrough error handler (e.g. CORS rejection).
app.use((err, _req, res, _next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'cors_forbidden' });
  }
  console.error('[server] error', err && err.message);
  res.status(500).json({ error: 'internal_error' });
});

app.listen(config.port, () => {
  console.log(`Candy Blast server listening on :${config.port}`);
  console.log(`  CORS origins: ${config.corsOrigins.join(', ')}`);
  console.log(`  Stripe: ${config.stripe.enabled ? 'enabled' : 'disabled'} | Google: ${config.google.enabled ? 'enabled' : 'disabled'} | Apple: ${config.apple.enabled ? 'enabled' : 'disabled'}`);
});

export { app };
