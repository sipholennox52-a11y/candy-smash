import { Router } from 'express';
import { config } from '../config.js';
import { db } from '../db.js';
import { getSku } from '../catalog.js';
import { grantPurchase } from '../state.js';
import { stripe } from '../stripe.js';

export const webhookRouter = Router();

// Stripe webhook. MUST receive the raw body for signature verification, so this
// route is mounted with express.raw() BEFORE the JSON body parser.
webhookRouter.post('/stripe', (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'stripe_not_configured' });

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (err) {
    console.error('[stripe] bad signature', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};
    const sku = getSku(meta.sku);
    // Idempotency: one grant per Checkout Session id.
    const ledgerKey = `stripe:${session.id}`;

    if (sku && meta.userId && session.payment_status === 'paid' && !db.hasPurchase(ledgerKey)) {
      const next = grantPurchase(db.getState(meta.userId), sku);
      db.setState(meta.userId, next);
      db.recordPurchase(ledgerKey, { userId: meta.userId, sku: meta.sku, provider: 'stripe' });
      console.log(`[stripe] granted ${meta.sku} to ${meta.userId}`);
    }
  }

  // Always 200 quickly so Stripe stops retrying once received.
  res.json({ received: true });
});
