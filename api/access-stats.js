export const config = { runtime: 'edge' };

// Aggregate stats for the consented-registration tiles on the private status
// dashboard, token-free. Reads guide-register and support-register rows from
// pilot_contacts using the server-side service-role key and returns ONLY counts.
//
// No personal data (name, email, organization) ever leaves this endpoint. Those
// fields are read into the function purely to compute distinct and consent
// counts, then discarded. This mirrors /api/enroll-stats exactly, which is the
// established safe pattern for reporting on the private PII table.
//
// Registrations are created by /api/access, which gates the Investigator Field
// Guide downloads and the initiative support action behind a short form
// capturing identity and explicit consent. The counts here are the ones that
// matter for diligence, because unlike an anonymous download or an anonymous
// support click, every row behind these numbers is contactable and, where the
// transfer box was ticked, conveyable. GET only.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-store' }
  });
}

function sortDesc(obj, keyName){
  return Object.keys(obj)
    .map(function(k){ var o = {}; o[keyName] = k; o.count = obj[k]; return o; })
    .sort(function(a, b){ return b.count - a.count; });
}

export default async function handler(req){
  if (req.method === 'OPTIONS') {
    return new Response(null, { status:204, headers:{
      'Access-Control-Allow-Origin':'*',
      'Access-Control-Allow-Methods':'GET, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type'
    }});
  }
  if (req.method !== 'GET') return json({ error:'method_not_allowed' }, 405);

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);
  const AH = { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE };

  const q = SB + '/rest/v1/pilot_contacts'
    + '?select=created_at,organization,email,message,source'
    + '&source=in.(guide-register,support-register)&limit=10000';

  let rows;
  try {
    const res = await fetch(q, { headers: AH });
    if (!res.ok){ const t = await res.text(); return json({ error:'db_read_failed', status:res.status, detail:String(t).slice(0,300) }, 502); }
    rows = await res.json();
  } catch(e){ return json({ error:'db_unreachable' }, 502); }
  if (!Array.isArray(rows)) rows = [];

  const startOfTodayUTC = new Date(); startOfTodayUTC.setUTCHours(0,0,0,0);
  const sinceMs = startOfTodayUTC.getTime();

  const peopleAll = {}, orgsAll = {}, transferPeople = {};
  const byEdition = {}, byCampaign = {};
  let guide = 0, support = 0, today = 0;
  let consentTransfer = 0, consentNamed = 0;

  for (let i = 0; i < rows.length; i++){
    const r = rows[i] || {};
    const isSupport = String(r.source || '') === 'support-register';
    if (isSupport) support++; else guide++;

    const em = (r.email == null ? '' : String(r.email)).trim().toLowerCase();
    if (em) peopleAll[em] = 1;
    const org = (r.organization == null ? '' : String(r.organization)).trim().toLowerCase();
    if (org) orgsAll[org] = 1;

    const t = r.created_at ? Date.parse(r.created_at) : NaN;
    if (!isNaN(t) && t >= sinceMs) today++;

    let p = {};
    try { p = JSON.parse(r.message || '{}') || {}; } catch(e){ p = {}; }
    if (p.consent_transfer === true){ consentTransfer++; if (em) transferPeople[em] = 1; }
    if (p.consent_named === true) consentNamed++;

    if (isSupport){
      const c = String(p.campaign || 'general');
      byCampaign[c] = (byCampaign[c] || 0) + 1;
    } else {
      const e = String(p.edition || 'unknown');
      byEdition[e] = (byEdition[e] || 0) + 1;
    }
  }

  return json({
    // Headline: every one of these is a named, contactable person who consented.
    registrations: rows.length,
    unique_people: Object.keys(peopleAll).length,
    organizations: Object.keys(orgsAll).length,
    today: today,

    // Split by what they registered for.
    guide_registrations: guide,
    support_registrations: support,
    by_edition: sortDesc(byEdition, 'edition'),
    by_campaign: sortDesc(byCampaign, 'campaign'),

    // Consent tiers. contact is required for every row, so it equals the total.
    consented_contact: rows.length,
    consented_transfer: consentTransfer,
    consented_named: consentNamed,

    // The diligence number: distinct people whose record may be conveyed.
    transferable_people: Object.keys(transferPeople).length
  });
}
