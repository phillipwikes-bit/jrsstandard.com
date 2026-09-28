import { participantLinkPaused } from './_participant-pause.js';

const MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

function denied() {
  return new Response(JSON.stringify({ error: 'participant_link_invalid' }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}

function hex(bytes) {
  return Array.from(new Uint8Array(bytes)).map(x => x.toString(16).padStart(2, '0')).join('');
}

export async function participantLinkAccess(req, audience) {
  // No deployment secret means the temporary pause stays in force.
  const secret = (typeof process !== 'undefined' && process.env && process.env.PARTICIPANT_LINK_SECRET) || '';
  if (secret.length < 32) return participantLinkPaused();

  const url = new URL(req.url);
  let body = {};
  if (req.method === 'POST') {
    try { body = await req.clone().json(); } catch (e) { return denied(); }
  }
  const key = String(url.searchParams.get('k') || body.k || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const exp = String(url.searchParams.get('exp') || body.exp || '');
  const sig = String(url.searchParams.get('sig') || body.sig || '').toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const expiry = Number(exp);
  if (!/^[a-z0-9]{8,40}$/.test(key) || !/^\d{10}$/.test(exp) ||
      !Number.isSafeInteger(expiry) || expiry <= now || expiry > now + MAX_AGE_SECONDS ||
      !/^[0-9a-f]{64}$/.test(sig)) return denied();

  const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = hex(await crypto.subtle.sign('HMAC', cryptoKey,
    new TextEncoder().encode(audience + '\n' + key + '\n' + exp)));
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0 ? null : denied();
}
