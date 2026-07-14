export const config = { runtime: 'edge' };

// Records a training completion event, keyed by the enrollee's email, into
// pilot_contacts (source='training-complete') using the server-side service-role
// key. Append-only; returns no PII. The admin read (api/enroll-admin) matches
// these to enrollments by email, so an orphan completion for a non-enrolled email
// simply never shows up. POST only.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function json(o, s){ return new Response(JSON.stringify(o), { status: s||200, headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' } }); }
function clean(v, n){ return (v==null ? '' : String(v)).trim().slice(0, n||200); }

export default async function handler(req){
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'POST, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' } });
  if (req.method !== 'POST') return json({ error:'method_not_allowed' }, 405);
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);

  let b; try { b = await req.json(); } catch(e){ return json({ error:'invalid_json' }, 400); }
  const email = clean(b.email, 200);
  if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) return json({ error:'valid_email_required' }, 400);

  const row = {
    name: '',
    email: email,
    organization: '',
    message: JSON.stringify({ kind:'training-complete', ts:new Date().toISOString() }),
    source: 'training-complete'
  };
  const res = await fetch(SB + '/rest/v1/pilot_contacts', {
    method:'POST',
    headers:{ 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE, 'Content-Type':'application/json', 'Prefer':'return=minimal' },
    body: JSON.stringify(row)
  });
  if (!res.ok){ const t = await res.text(); return json({ error:'db_insert_failed', status:res.status, detail:String(t).slice(0,300) }, 502); }
  return json({ ok:true });
}
