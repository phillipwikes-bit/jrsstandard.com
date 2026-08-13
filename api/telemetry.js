export const config = { runtime: 'edge' };

// GENERIC LINK-CLICK TELEMETRY SINK.
//
// Created 2026-08-13 because the mandated client dispatcher posts to
// /api/telemetry and that endpoint did not exist. Wiring links to a missing
// route would have been the "phantom dependency" the same directive forbids, so
// the endpoint is built rather than the links pointed at nothing.
//
// SCOPE: this counts clicks on links that are NOT already counted server-side.
// /api/dl and /api/support already record inside their own 302 and are stronger
// than any client beacon, because a redirect cannot be blocked or raced. Those
// are deliberately excluded by the client, not duplicated here.
//
// TOKEN-LESS: no JWT, no OAuth, no SDK, no npm dependency. The browser posts
// plain JSON with no credentials. The service-role key is read from the server
// environment only, exactly as every other write endpoint here does.
//
// PII: the payload is capped and filtered. Only an origin path, a target, a
// coarse label, a country from the edge header and a truncated user agent are
// stored. Query strings are stripped from both URLs before writing, because a
// URL is the most common place a personal identifier leaks into a log.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// Deploy and smoke checks record nothing, matching the guard in /api/dl and
// /api/support so verification cannot pollute live counts.
const TEST_SRC = ['verify', 'test', 'selftest'];

// Non-browser agents do not click links. Same regex as /api/support, which was
// added after four rounds of self-inflicted analytics pollution.
const NOT_A_PERSON = /googlebot|bingbot|baiduspider|yandexbot|duckduckbot|applebot|GoogleOther|facebookexternalhit|bot|spider|crawl|slurp|preview|headless|curl|wget|python-requests|libwww|okhttp|java\/|go-http/i;

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// Strip the query string and cap the length. A path is enough to know which link
// was clicked; a query string is where identifiers leak.
function safePath(u){
  const s = String(u || '');
  try {
    const url = new URL(s, 'https://jrsstandard.com');
    return (url.pathname || '/').slice(0, 200);
  } catch (e) {
    return s.split('?')[0].slice(0, 200);
  }
}

function tag(v, n){
  return String(v == null ? '' : v).replace(/[^A-Za-z0-9 _.\-\/]/g, '').slice(0, n || 60);
}

export default async function handler(req){
  if (req.method === 'OPTIONS') return json({ ok: true });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let b = {};
  try {
    const raw = await req.text();
    // Hard cap before parsing. A beacon body is small; anything large is not ours.
    if (raw.length > 4000) return json({ ok: true, recorded: false, reason: 'oversize' });
    b = JSON.parse(raw || '{}') || {};
  } catch (e) {
    return json({ ok: true, recorded: false, reason: 'unparseable' });
  }

  const meta = (b && typeof b.meta === 'object' && b.meta) || {};
  const src = tag(meta.src, 40).toLowerCase();
  if (src && TEST_SRC.indexOf(src) !== -1) return json({ ok: true, recorded: false, reason: 'deploy_check' });
  if (src.indexOf('deploytest') === 0) return json({ ok: true, recorded: false, reason: 'deploy_check' });

  const ua = String(req.headers.get('user-agent') || '');
  if (!ua || NOT_A_PERSON.test(ua)) return json({ ok: true, recorded: false, reason: 'not_a_person' });

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ ok: true, recorded: false, reason: 'no_service_key' });

  const country = String(req.headers.get('x-vercel-ip-country') || '')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || null;

  try {
    await fetch(SB + '/rest/v1/interaction_events', {
      method: 'POST',
      headers: {
        'apikey': SERVICE,
        'Authorization': 'Bearer ' + SERVICE,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        source: 'link-click',
        type: 'click',
        payload: {
          origin: safePath(b.origin_url),
          target: safePath(b.target_url),
          label: tag(meta.label, 80),
          src: src || 'none',
          country: country,
          user_agent: ua.slice(0, 300)
        }
      })
    });
  } catch (e) {
    // A telemetry write must never surface to the reader.
    return json({ ok: true, recorded: false, reason: 'write_failed' });
  }

  return json({ ok: true, recorded: true });
}
