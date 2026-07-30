# Candy Blast Saga — Server

Optional server-authoritative backend for accounts, economy, and **verified**
payments. The web/Android game works fully offline without this server; the
backend is what makes purchases and progression tamper-resistant and enables
real money.

> Status: **scaffold**. Stripe web checkout is fully wired (needs your keys).
> Google Play and Apple verification endpoints are structured with the exact
> verification steps to implement, and return `501 Not Implemented` until wired.

## Why this exists

The client can never be trusted with the economy. Here the server:

- Owns the product **catalog** and prices (`src/catalog.js`) — the client sends
  a SKU id, never an amount or a coin count.
- Reconciles client-proposed progress so it can only *spend*, never mint coins
  (`src/state.js` → `reconcile`).
- Grants paid items **only after** a verified payment, exactly once
  (idempotency ledger in `src/db.js`).
- Keeps all provider secrets server-side.

## Run locally

```bash
cd server
cp .env.example .env      # fill in what you have; blanks disable that provider
npm install
npm run dev               # http://localhost:8787/api/health
```

With no secrets set, auth + state work and payments report "disabled" on
`/api/health`.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/anonymous` | – | Create an anonymous device account, returns JWT |
| POST | `/api/auth/register` | – | Email + password account |
| POST | `/api/auth/login` | – | Login, returns JWT |
| GET  | `/api/state` | Bearer | Authoritative game state |
| PUT  | `/api/state` | Bearer | Propose progress (server reconciles) |
| POST | `/api/purchase/stripe/checkout` | Bearer | Create Stripe Checkout session `{ sku }` |
| POST | `/api/purchase/google/verify` | Bearer | Verify Play purchase `{ sku, productId, purchaseToken }` |
| POST | `/api/purchase/apple/verify` | Bearer | Verify Apple receipt `{ sku, receiptData }` |
| POST | `/api/webhooks/stripe` | signature | Stripe events (grants coins on `checkout.session.completed`) |

## Secrets you must provide for real payments

- **Stripe**: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`. Test locally with
  `stripe listen --forward-to localhost:8787/api/webhooks/stripe`.
- **Google Play**: `GOOGLE_SERVICE_ACCOUNT_JSON` (service account with
  Android Publisher access) + `GOOGLE_PACKAGE_NAME`.
- **Apple**: `APPLE_SHARED_SECRET` (App Store Connect).

Never put these in the client or commit them. Use your host's secret manager.

## Security notes

- `helmet`, locked-down CORS (`CORS_ORIGIN`), and rate limiting are enabled.
- Passwords hashed with `scrypt` + per-user salt; JWTs signed HS256.
- The JSON file store (`src/db.js`) is for local dev only — swap for Postgres
  with transactions in production; keep the same function signatures.
- `NODE_ENV=production` makes missing `JWT_SECRET` a hard error.
