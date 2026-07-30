import crypto from 'node:crypto';
import { Router } from 'express';
import { config } from '../config.js';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { getSku } from '../catalog.js';
import { grantPurchase } from '../state.js';
import { stripe } from '../stripe.js';

export const purchaseRouter = Router();

purchaseRouter.use(requireAuth);

// Grant a SKU to a user exactly once (idempotent via the ledger).
function grantOnce(ledgerKey, userId, sku, meta) {
  if (db.hasPurchase(ledgerKey)) {
    return { granted: false, state: db.getState(userId) };
  }
  const next = grantPurchase(db.getState(userId), sku);
  db.setState(userId, next);
  db.recordPurchase(ledgerKey, { userId, sku: meta.skuId, provider: meta.provider });
  return { granted: true, state: next };
}

// --- Stripe (web): create a Checkout Session. Grant happens in the webhook. ---
purchaseRouter.post('/stripe/checkout', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'stripe_not_configured' });
  const skuId = req.body && req.body.sku;
  const sku = getSku(skuId);
  if (!sku) return res.status(400).json({ error: 'unknown_sku' });

  const purchaseId = 'pur_' + crypto.randomBytes(10).toString('hex');
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: config.stripe.successUrl,
      cancel_url: config.stripe.cancelUrl,
      client_reference_id: req.userId,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: sku.currency,
          unit_amount: sku.amountCents, // server-defined price, never client
          product_data: { name: sku.title },
        },
      }],
      // Metadata is echoed back on the webhook so we know who/what to grant.
      metadata: { userId: req.userId, sku: skuId, purchaseId },
    });
    res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('[stripe] checkout error', err.message);
    res.status(502).json({ error: 'stripe_error' });
  }
});

// --- Google Play Billing (Android): verify a purchase token server-side. ---
purchaseRouter.post('/google/verify', async (req, res) => {
  if (!config.google.enabled) return res.status(503).json({ error: 'google_not_configured' });
  const { sku: skuId, productId, purchaseToken } = req.body || {};
  const sku = getSku(skuId);
  if (!sku || typeof purchaseToken !== 'string' || typeof productId !== 'string') {
    return res.status(400).json({ error: 'invalid_request' });
  }

  // PRODUCTION: verify with the Google Play Developer API using the service
  // account, e.g. GET purchases.products.get for
  // (packageName, productId, purchaseToken); require purchaseState === 0
  // (purchased) and acknowledgementState handling, then acknowledge the
  // purchase. Only grant after a verified response.
  //
  //   const verified = await verifyWithGoogle(config.google, productId, purchaseToken);
  //   if (!verified) return res.status(400).json({ error: 'verification_failed' });
  return res.status(501).json({
    error: 'not_implemented',
    detail: 'Wire Google Play Developer API verification with GOOGLE_SERVICE_ACCOUNT_JSON before enabling.',
  });
});

// --- Apple In-App Purchase (iOS): verify a receipt server-side. ---
purchaseRouter.post('/apple/verify', async (req, res) => {
  if (!config.apple.enabled) return res.status(503).json({ error: 'apple_not_configured' });
  const { sku: skuId, receiptData } = req.body || {};
  const sku = getSku(skuId);
  if (!sku || typeof receiptData !== 'string') {
    return res.status(400).json({ error: 'invalid_request' });
  }

  // PRODUCTION: verify with Apple. Prefer the App Store Server API (JWT-signed)
  // or verifyReceipt with APPLE_SHARED_SECRET; validate bundle id, product id,
  // and transaction, handling the 21007 sandbox retry. Only grant after a
  // verified transaction, keyed by original_transaction_id for idempotency.
  return res.status(501).json({
    error: 'not_implemented',
    detail: 'Wire Apple receipt/transaction verification with APPLE_SHARED_SECRET before enabling.',
  });
});

export { grantOnce };
