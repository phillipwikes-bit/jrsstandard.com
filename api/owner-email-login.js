// Private owner email-code sign-in; uses existing branch-scoped Neon Auth.
// No browser-supplied recipient, public records, or credential disclosure.
export const config = { runtime: 'edge' };
import { createOwnerCookie } from './_owner-auth.js';
function reply(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff', ...extra,
  }});
}
function settings() {
  const env = (typeof process !== 'undefined' && process.env) || {};
  const email = typeof env.JRS_OWNER_EMAIL === 'string' ? env.JRS_OWNER_EMAIL.trim().toLowerCase() : '';
  const signingSecret = env.OWNER_DASHBOARD_TOKEN || '';
  const base = typeof env.NEON_AUTH_BASE_URL === 'string' ? env.NEON_AUTH_BASE_URL.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || signingSecret.length < 32 || !base) return null;
  let url;
  try { url = new URL(base); } catch { return null; }
  // Prevent a manipulated setting from forwarding a sign-in code to another host.
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.neon.tech') || url.username || url.password || url.search || url.hash) return null;
  if (!/^\/(?:[A-Za-z0-9_./-]+)$/.test(url.pathname)) return null;
  return { email, base: url.href.replace(/\/$/, '') };
}
async function callNeon(base, route, origin, payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(base + route, {
      method: 'POST', redirect: 'error', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'Origin': origin, 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
  } finally { clearTimeout(timeout); }
}
export default async function handler(request) {
  const cfg = settings();
  if (request.method === 'GET') return cfg
    ? reply({ ready: true, mode: 'email_code', code_length: 6 })
    : reply({ ready: false, error: 'owner_email_signin_unavailable' }, 503);
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405, { Allow: 'GET, POST' });
  if (!cfg) return reply({ error: 'owner_email_signin_unavailable' }, 503);
  const origin = new URL(request.url).origin;
  if (request.headers.get('origin') !== origin ||
      !String(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json'))
    return reply({ error: 'request_not_allowed' }, 403);
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return reply({ error: 'request_not_allowed' }, 403);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 250) return reply({ error: 'request_too_large' }, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({ error: 'bad_request' }, 400);
  } catch { return reply({ error: 'bad_request' }, 400); }
  // The browser may never select the recipient or supply the master secret.
  if (Object.hasOwn(body, 'email') || Object.hasOwn(body, 'token')) return reply({ error: 'unsupported_field' }, 400);
  try {
    if (body.action === 'send') {
      const response = await callNeon(cfg.base, '/email-otp/send-verification-otp', origin,
        { email: cfg.email, type: 'sign-in' });
      if (response.status === 429) return reply({ error: 'rate_limited' }, 429);
      if (!response.ok) return reply({ error: 'email_code_provider_unavailable' }, 502);
      return reply({ requested: true, note: 'If email delivery is enabled, check your owner Gmail inbox.' }, 202);
    }
    if (body.action === 'verify') {
      if (typeof body.otp !== 'string' || !/^\d{6}$/.test(body.otp)) return reply({ error: 'six_digit_code_required' }, 400);
      const response = await callNeon(cfg.base, '/sign-in/email-otp', origin,
        { email: cfg.email, otp: body.otp, name: 'JRS Owner' });
      if (!response.ok) return reply({ error: response.status === 429 ? 'rate_limited' : 'invalid_or_expired_code' },
        response.status === 429 ? 429 : 401);
      const data = await response.json();
      if (!data || !data.user || typeof data.user.email !== 'string' ||
          data.user.email.toLowerCase() !== cfg.email || data.user.emailVerified === false ||
          (typeof data.token !== 'string' && !data.session))
        return reply({ error: 'identity_not_verified' }, 403);
      return reply({ authenticated: true }, 200, { 'Set-Cookie': await createOwnerCookie() });
    }
    return reply({ error: 'unknown_action' }, 400);
  } catch { return reply({ error: 'email_code_service_unavailable' }, 502); }
}