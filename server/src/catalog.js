// Server-authoritative product catalog. The CLIENT NEVER decides what a
// purchase grants — the server looks up the SKU here. Prices are in the
// smallest currency unit (cents) for Stripe.
export const CATALOG = {
  coins_300:  { title: 'Handful of Coins', coins: 300,  amountCents: 199,  currency: 'usd' },
  coins_1000: { title: 'Bag of Coins',      coins: 1000, amountCents: 499,  currency: 'usd' },
  coins_2500: { title: 'Chest of Coins',    coins: 2500, amountCents: 999,  currency: 'usd' },
  coins_7000: { title: 'Vault of Coins',    coins: 7000, amountCents: 1999, currency: 'usd' },
  starter_pack: {
    title: 'Starter Pack',
    coins: 500,
    boosters: { hammer: 3, bomb: 3, shuffle: 3 },
    amountCents: 399,
    currency: 'usd',
  },
};

export function getSku(sku) {
  return Object.prototype.hasOwnProperty.call(CATALOG, sku) ? CATALOG[sku] : null;
}
