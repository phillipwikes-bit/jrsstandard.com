export const config = { runtime: 'edge' };

// Records a locally self-attested training completion event into pilot_contacts
// (source='training-complete') using a server-held service role. This is not
// email ownership, enrollment authentication or professional certification.
// Limit duplicate email-keyed rows, bound public request size and reject
// cross-origin browser submissions. No personal information is returned.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function json(o, s){ return new Response(JSON.stringify(o), { status: s||200, headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' } }); }
function clean(v, n){ return (v==null ? '' : String(v)).trim().slice(0, n||200); }

export default async function handler(req){
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'POST, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' } });
  if (req.method !== 'POST') return json({ error:'method_not_allowed' }, 405);
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin)
    return json({ error:'origin_not_allowed' }, 403);
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ error:'service_unavailable' }, 503);

  // Completion carries a single email address; larger payloads are invalid.
  const suppliedLength = Number(req.headers.get('content-length') || '0');
  if (suppliedLength > 2048) return json({ error:'request_too_large' }, 413);
  let b;
  try {
    const raw = await req.text();
    if (raw.length > 2048) return json({ error:'request_too_large' }, 413);
    b = JSON.parse(raw);
    if (!b || typeof b !== 'object' || Array.isArray(b))
      return json({ error:'invalid_json' }, 400);
  } catch(e) { return json({ error:'invalid_json' }, 400); }
  const email = clean(b.email, 200);
  if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) return json({ error:'valid_email_required' }, 400);

  // Completer's country from the edge geo header (ISO 3166-1 alpha-2). Best effort;
  // null if unavailable. Stored in the message JSON, no schema change needed.
  const country = String(req.headers.get('x-vercel-ip-country')||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,2) || null;
  const row = {
    name: '',
    email: email,
    organization: '',
    message: JSON.stringify({ kind:'training-complete', ts:new Date().toISOString(), country: country }),
    source: 'training-complete'
  };
  const headers = { 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE,
    'Content-Type':'application/json', 'Prefer':'return=minimal' };
  try {
    // Repeated browser retries must not inflate self-reported completion counts.
    // The lookup is not an identity check and is never disclosed to the caller.
    const existing = await fetch(SB + '/rest/v1/pilot_contacts?select=id'
      + '&source=eq.training-complete&email=eq.' + encodeURIComponent(email)
      + '&limit=1', { headers });
    if (!existing.ok) return json({ error:'service_unavailable' }, 502);
    const rows = await existing.json();
    if (!Array.isArray(rows)) return json({ error:'service_unavailable' }, 502);
    if (rows.length) return json({ ok:true });
    const res = await fetch(SB + '/rest/v1/pilot_contacts', {
      method:'POST', headers, body: JSON.stringify(row)
    });
    if (!res.ok) return json({ error:'service_unavailable' }, 502);
    return json({ ok:true });
  } catch(e) {
    return json({ error:'service_unavailable' }, 502);
  }
}
