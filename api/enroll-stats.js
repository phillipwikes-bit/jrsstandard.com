export const config = { runtime: 'edge' };

// Aggregate stats for the private training-adoption dashboard tile, token-free.
// Reads training-enroll rows from pilot_contacts using the server-side
// service-role key and returns ONLY counts. No personal data (name, email,
// organization) ever leaves this endpoint: those fields are read into the
// function to compute distinct/consent counts and then discarded. This replaces
// the training_stats database view, which cannot be created without a management
// token. GET only.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function json(o, s){ return new Response(JSON.stringify(o), { status: s||200, headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-store' } }); }

export default async function handler(req){
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' } });
  if (req.method !== 'GET') return json({ error:'method_not_allowed' }, 405);
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);

  const url = SB + '/rest/v1/pilot_contacts?select=created_at,organization,email,message&source=eq.training-enroll&limit=10000';
  let rows;
  try {
    const res = await fetch(url, { headers:{ 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE } });
    if (!res.ok){ const t = await res.text(); return json({ error:'db_read_failed', status:res.status, detail:String(t).slice(0,300) }, 502); }
    rows = await res.json();
  } catch(e){ return json({ error:'db_unreachable' }, 502); }
  if (!Array.isArray(rows)) rows = [];

  const startOfTodayUTC = new Date(); startOfTodayUTC.setUTCHours(0,0,0,0);
  const sinceMs = startOfTodayUTC.getTime();

  const orgs = {};
  const people = {};
  let today = 0, consentedContact = 0, consentedTransfer = 0;

  for (let i=0; i<rows.length; i++){
    const r = rows[i] || {};
    const org = (r.organization==null ? '' : String(r.organization)).trim().toLowerCase();
    if (org) orgs[org] = 1;
    const em = (r.email==null ? '' : String(r.email)).trim().toLowerCase();
    if (em) people[em] = 1;
    const t = r.created_at ? Date.parse(r.created_at) : NaN;
    if (!isNaN(t) && t >= sinceMs) today++;
    let p = {};
    try { p = JSON.parse(r.message||'{}') || {}; } catch(e){ p = {}; }
    if (p.consent_contact === true) consentedContact++;
    if (p.consent_transfer === true) consentedTransfer++;
  }

  return json({
    enrollments: rows.length,
    unique_people: Object.keys(people).length,
    organizations: Object.keys(orgs).length,
    consented_contact: consentedContact,
    consented_transfer: consentedTransfer,
    today: today
  });
}
