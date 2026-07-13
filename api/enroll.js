export const config = { runtime: 'edge' };

// Training enrollment capture. Writes a consented registration (name, organization,
// title, email) to training_registrations using the server-side service-role key,
// so it works with no management token. PII is never exposed: this endpoint only
// inserts; nothing reads registrations back through it. Requires a valid email and
// explicit contact consent, or it refuses to store.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function json(o, s){ return new Response(JSON.stringify(o), { status: s||200, headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' } }); }
function clean(v, n){ return (v==null ? '' : String(v)).trim().slice(0, n||200); }

export default async function handler(req){
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'POST, GET, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' } });
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (req.method === 'GET') return json({ ok:true, serviceKey: !!SERVICE });
  if (req.method !== 'POST') return json({ error:'method_not_allowed' }, 405);
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);

  let b; try { b = await req.json(); } catch(e){ return json({ error:'invalid_json' }, 400); }
  const email = clean(b.email, 200);
  const name = clean(b.name, 200);
  if (!name) return json({ error:'name_required' }, 400);
  if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) return json({ error:'valid_email_required' }, 400);
  if (b.consent_contact !== true) return json({ error:'consent_required' }, 400);

  const row = {
    name: name,
    organization: clean(b.organization, 200),
    title: clean(b.title, 200),
    email: email,
    audience: clean(b.audience, 32) || 'public',
    source: clean(b.source, 80),
    consent_contact: true,
    consent_transfer: b.consent_transfer === true
  };

  const res = await fetch(SB + '/rest/v1/training_registrations', {
    method:'POST',
    headers:{ 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE, 'Content-Type':'application/json', 'Prefer':'return=minimal' },
    body: JSON.stringify(row)
  });
  if (!res.ok){ const t = await res.text(); return json({ error:'db_insert_failed', status:res.status, detail:String(t).slice(0,300) }, 502); }
  return json({ ok:true });
}
