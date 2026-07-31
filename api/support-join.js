export const config = { runtime: 'edge' };

// Named-supporter capture for the JRS initiatives. Writes a consented supporter
// (name, organization, optional email, campaign) to the EXISTING private
// pilot_contacts table via the service-role key. Same posture as /api/enroll:
// pilot_contacts is RLS-locked (no anon read), so the PII stays server-side.
// Supporter rows are tagged source='support' with the campaign preserved in the
// message JSON, so they never collide with training-enroll or real pilot contacts.
// Name and explicit consent are required; email is optional (a supporter may be
// listed without leaving contact details). Insert only; nothing reads PII back.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function json(o, s){ return new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' } }); }
function clean(v, n){ return (v == null ? '' : String(v)).trim().slice(0, n || 200); }
function normCampaign(c){
  c = String(c || '').toLowerCase().replace(/[^a-z]/g, '');
  if (c === 'rtkw' || c === 'rights' || c === 'righttoknowwhy') return 'rtkw';
  if (c === 'defend' || c === 'decisions' || c === 'decisionsyoucandefend') return 'defend';
  return 'general';
}

export default async function handler(req){
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'POST, GET, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' } });
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (req.method === 'GET') return json({ ok:true, serviceKey: !!SERVICE });
  if (req.method !== 'POST') return json({ error:'method_not_allowed' }, 405);
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);

  let b; try { b = await req.json(); } catch(e){ return json({ error:'invalid_json' }, 400); }
  const name = clean(b.name, 200);
  const email = clean(b.email, 200);
  if (!name) return json({ error:'name_required' }, 400);
  if (email && (email.indexOf('@') < 1 || email.indexOf('.') < 0)) return json({ error:'valid_email_required' }, 400);
  if (b.consent_contact !== true) return json({ error:'consent_required' }, 400);

  const payload = {
    kind: 'support',
    campaign: normCampaign(b.campaign),
    role: clean(b.role, 200),
    consent_contact: true,
    consent_transfer: b.consent_transfer === true,
    consent_listed: b.consent_listed === true,
    page_source: clean(b.source, 80),
    ts: new Date().toISOString()
  };

  const row = {
    name: name,
    email: email,
    organization: clean(b.organization, 200),
    message: JSON.stringify(payload),
    source: 'support'
  };

  const res = await fetch(SB + '/rest/v1/pilot_contacts', {
    method:'POST',
    headers:{ 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE, 'Content-Type':'application/json', 'Prefer':'return=minimal' },
    body: JSON.stringify(row)
  });
  if (!res.ok){ const t = await res.text(); return json({ error:'db_insert_failed', status:res.status, detail:String(t).slice(0,300) }, 502); }
  return json({ ok:true });
}
