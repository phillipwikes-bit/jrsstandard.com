export const config = { runtime: 'edge' };

// OWNER-ONLY view of the named initiative supporters held in the private,
// RLS-locked pilot_contacts table (source='support'). This returns PII
// (name, organization, optional email) and is therefore token-gated: the
// caller must present ?token= equal to BENCH_ADMIN_TOKEN or RUN_TOKEN (the
// same tokens already set in Vercel). Without a valid token it returns 401 and
// no data. The PUBLIC dashboard (/api/support-stats) stays counts-only, which
// is what supporters were promised on supported.html ("public status pages
// show counts only; your details stay private"). This endpoint exists so the
// owner can see and export the consented list without exposing it publicly.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

const CAMPAIGN_LABEL = {
  rtkw: 'The Right to Know Why',
  defend: 'The Decisions You Can Defend',
  general: 'General'
};

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-store' }
  });
}

export default async function handler(req){
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' } });

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const ADMIN = env.BENCH_ADMIN_TOKEN || '';
  const RUN = env.RUN_TOKEN || '';

  let token = '';
  try { token = new URL(req.url).searchParams.get('token') || ''; } catch(e){ token = ''; }

  // Auth gate: a valid owner token is required before any PII is returned.
  if (!((ADMIN && token === ADMIN) || (RUN && token === RUN))) {
    return json({ error:'unauthorized' }, 401);
  }
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);

  const res = await fetch(
    SB + '/rest/v1/pilot_contacts?source=eq.support&select=name,email,organization,message,created_at&order=created_at.desc',
    { headers: { 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE } }
  );
  if (!res.ok){ const t = await res.text(); return json({ error:'db_read_failed', status:res.status, detail:String(t).slice(0,300) }, 502); }

  const rows = await res.json();
  const contacts = rows.map(function(r){
    let p = {};
    try { p = JSON.parse(r.message || '{}'); } catch(e){ p = {}; }
    const camp = p.campaign || 'general';
    return {
      name: r.name || '',
      organization: r.organization || '',
      email: r.email || '',
      campaign: camp,
      campaign_label: CAMPAIGN_LABEL[camp] || camp,
      role: p.role || '',
      page_source: p.page_source || '',
      consent_contact: p.consent_contact === true,
      consent_transfer: p.consent_transfer === true,
      consent_listed: p.consent_listed === true,
      created_at: r.created_at || ''
    };
  });

  const by_campaign = {};
  contacts.forEach(function(c){ by_campaign[c.campaign] = (by_campaign[c.campaign] || 0) + 1; });

  return json({ ok:true, count: contacts.length, by_campaign: by_campaign, contacts: contacts });
}
