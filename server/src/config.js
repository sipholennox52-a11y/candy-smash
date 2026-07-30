import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

function required(name, value) {
  if (!value) {
    // Fail fast in production; tolerate in development with a warning.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required env var: ${name}`);
    }
    return undefined;
  }
  return value;
}

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  jwtSecret = crypto.randomBytes(32).toString('hex');
  console.warn('[config] JWT_SECRET not set — using an ephemeral dev secret. Tokens reset on restart.');
}

export const config = {
  port: Number(process.env.PORT || 8787),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:8000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  jwtSecret,
  dataDir: process.env.DATA_DIR || './data',

  stripe: {
    secretKey: required('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY),
    webhookSecret: required('STRIPE_WEBHOOK_SECRET', process.env.STRIPE_WEBHOOK_SECRET),
    successUrl: process.env.CHECKOUT_SUCCESS_URL || 'http://localhost:8000/index.html?purchase=success',
    cancelUrl: process.env.CHECKOUT_CANCEL_URL || 'http://localhost:8000/index.html?purchase=cancel',
    enabled: Boolean(process.env.STRIPE_SECRET_KEY),
  },

  google: {
    serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    packageName: process.env.GOOGLE_PACKAGE_NAME || 'com.candyblast.app',
    enabled: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  },

  apple: {
    sharedSecret: process.env.APPLE_SHARED_SECRET,
    enabled: Boolean(process.env.APPLE_SHARED_SECRET),
  },
};
