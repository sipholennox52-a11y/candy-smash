// Optional backend client for Candy Blast Saga.
//
// The game works fully offline without this. To enable server-authoritative
// accounts + verified payments, set window.CANDYBLAST_API_BASE (e.g. in a
// small inline config or build step) and include this file before game.js,
// then call CandyBlastAPI.* from your integration.
//
// Nothing here runs automatically — it's a thin, dependency-free wrapper so the
// static demo stays intact and CSP-safe (same-origin fetch only).
(function () {
  'use strict';

  const BASE = (typeof window !== 'undefined' && window.CANDYBLAST_API_BASE) || '';
  const TOKEN_KEY = 'candyblast_token';

  function token() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }
  function setToken(t) {
    try { if (t) localStorage.setItem(TOKEN_KEY, t); } catch {}
  }

  async function req(path, { method = 'GET', body, auth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && token()) headers.Authorization = 'Bearer ' + token();
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || res.statusText), { status: res.status, data });
    return data;
  }

  const CandyBlastAPI = {
    isEnabled() { return Boolean(BASE); },

    async anonymous() {
      const d = await req('/api/auth/anonymous', { method: 'POST', auth: false });
      setToken(d.token);
      return d;
    },
    async register(email, password) {
      const d = await req('/api/auth/register', { method: 'POST', auth: false, body: { email, password } });
      setToken(d.token);
      return d;
    },
    async login(email, password) {
      const d = await req('/api/auth/login', { method: 'POST', auth: false, body: { email, password } });
      setToken(d.token);
      return d;
    },

    getState() { return req('/api/state').then((d) => d.state); },
    syncState(state) { return req('/api/state', { method: 'PUT', body: { state } }).then((d) => d.state); },

    // Web payments: returns a Stripe Checkout URL to redirect to.
    async stripeCheckout(sku) {
      const d = await req('/api/purchase/stripe/checkout', { method: 'POST', body: { sku } });
      return d.url;
    },
    verifyGoogle(payload) { return req('/api/purchase/google/verify', { method: 'POST', body: payload }); },
    verifyApple(payload) { return req('/api/purchase/apple/verify', { method: 'POST', body: payload }); },
  };

  if (typeof window !== 'undefined') window.CandyBlastAPI = CandyBlastAPI;
})();
