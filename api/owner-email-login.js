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
// Neon Auth's trusted-origin list includes the stable Vercel Git branch
// alias for this isolated preview, not every immutable deployment URL.
// The browser request is separately required to be same-origin below.
// Only the exact configured preview branch may use its existing trusted alias.
// Do not add wildcards or disable the provider's origin verification.
const OWNER_PREVIEW_REF='fix/owner-dashboard-mainline-integration-2026-11-02';
const OWNER_PREVIEW_ALIAS='jrsstandard-com-git-fix-owner-das-a30b69-phillip-wikes-projects.vercel.app';
const JRS_PREVIEW_REF='fix/jrs-training-mobile-a11y-quality-2026-11-02';
const JRS_PREVIEW_ALIAS='jrsstandard-com-git-fix-jrs-train-decb75-phillip-wikes-projects.vercel.app';
function neonRequestOrigin(browserOrigin) {
  const env=(typeof process!=='undefined'&&process.env)||{};
  if (env.VERCEL_ENV !== 'preview') return browserOrigin;
  const branchUrl=env.VERCEL_BRANCH_URL || '';
  // Keep per-branch trusted origins exact. Reject contradictory aliases.
  for (const [branch, alias] of [
    [OWNER_PREVIEW_REF, OWNER_PREVIEW_ALIAS],
    [JRS_PREVIEW_REF, JRS_PREVIEW_ALIAS],
  ]) {
    if ((env.VERCEL_GIT_COMMIT_REF === branch || branchUrl === alias) &&
        (!branchUrl || branchUrl === alias)) {
      return 'https://'+alias;
    }
  }
  return browserOrigin;
}

async function callNeon(base, route, origin, payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(base + route, {
      method: 'POST', redirect: 'manual', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'Origin': origin, 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
  } finally { clearTimeout(timeout); }
}
// Record only provider status and a constrained error identifier. Never log the
// owner email, OTP, response body, cookies, or authentication credentials.
async function logDeliveryFailure(response) {
  let code = 'unknown';
  try {
    const body = await response.clone().json();
    const candidate = typeof body?.code === 'string' ? body.code
      : typeof body?.error === 'string' ? body.error
      : typeof body?.error?.code === 'string' ? body.error.code : '';
    if (/^[A-Za-z0-9_-]{1,64}$/.test(candidate)) code = candidate;
  } catch { /* Upstream may not return JSON. */ }
  console.error('jrs_owner_email_provider_failure', JSON.stringify({
    phase: 'send', status: response.status, code
  }));
}

export default async function handler(request) {
  const cfg = settings();
  if (request.method === 'GET') return cfg
    ? reply({ ready: true, mode: 'email_code', code_length: 6 })
    : reply({ ready: false, error: 'owner_email_signin_unavailable' }, 503);
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405, { Allow: 'GET, POST' });
  if (!cfg) return reply({ error: 'owner_email_signin_unavailable' }, 503);
  const origin = new URL(request.url).origin;
  const trustedProviderOrigin = neonRequestOrigin(origin);
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
      const response = await callNeon(cfg.base, '/email-otp/send-verification-otp', trustedProviderOrigin,
        { email: cfg.email, type: 'sign-in' });
      if (!response.ok) {
        await logDeliveryFailure(response);
        return response.status === 429
          ? reply({ error: 'rate_limited' }, 429)
          : reply({ error: 'email_code_provider_unavailable' }, 502);
      }
      return reply({ requested: true, note: 'If email delivery is enabled, check your owner Gmail inbox.' }, 202);
    }
    if (body.action === 'verify') {
      if (typeof body.otp !== 'string' || !/^\d{6}$/.test(body.otp)) return reply({ error: 'six_digit_code_required' }, 400);
      const response = await callNeon(cfg.base, '/sign-in/email-otp', trustedProviderOrigin,
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
  } catch (err) {
    // Only a constrained transport code is logged. Never log the recipient,
    // raw exception message, OTP, authorization, or upstream response body.
    const candidate = String(err?.cause?.code || 'unavailable');
    const code = /^[A-Z][A-Z0-9_]{1,40}$/.test(candidate) ? candidate : 'unavailable';
    console.error('jrs_owner_email_service_failure', JSON.stringify({
      phase: body.action === 'send' ? 'send' : 'verify',
      kind: err?.name === 'AbortError' ? 'timeout' : 'transport', code
    }));
    return reply({ error: 'email_code_service_unavailable' }, 502);
  }
}