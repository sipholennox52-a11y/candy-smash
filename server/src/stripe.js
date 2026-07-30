import Stripe from 'stripe';
import { config } from './config.js';

// Single Stripe client, created only when a secret key is configured.
export const stripe = config.stripe.enabled
  ? new Stripe(config.stripe.secretKey, { apiVersion: '2024-06-20' })
  : null;
