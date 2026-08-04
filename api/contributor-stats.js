export const config = { runtime: 'edge' };

// Aggregate stats for the contributor-confirmation tile on the private status
// dashboard, token-free. Reads contributor-confirm rows from pilot_contacts
// using the server-side service-role key and returns ONLY counts and the roster
// codes that have responded.
//
// No personal data (name, email, organization, or the wording a contributor
// chose) ever leaves this endpoint. Those fields are read into the function to
// compute distinct and consent counts, then discarded. Same safe pattern as
// /api/enroll-stats and /api/access-stats.
//
// The codes list is included deliberately: it is the owner's outstanding-chase
// list before the fallback date, and a bare study code identifies nobody
// outside the private roster held in /api/contributor. GET only.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// Keep in step with the roster in api/contributor.js. Used only to report how
// many contributors are still outstanding.
const ROSTER_SIZE = 20;

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-store' }
  });
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
    + '?select=created_at,organization,message'
    + '&source=eq.contributor-confirm&limit=2000';

  let rows;
  try {
    const res = await fetch(q, { headers: AH });
    if (!res.ok){ const t = await res.text(); return json({ error:'db_read_failed', status:res.status, detail:String(t).slice(0,300) }, 502); }
    rows = await res.json();
  } catch(e){ return json({ error:'db_unreachable' }, 502); }
  if (!Array.isArray(rows)) rows = [];

  const startOfTodayUTC = new Date(); startOfTodayUTC.setUTCHours(0,0,0,0);
  const sinceMs = startOfTodayUTC.getTime();

  // A contributor may reopen their link and correct their wording. The latest
  // row per code is the one that counts, so consent tallies are never inflated
  // by a person confirming twice.
  const latest = {};
  let today = 0;
  for (let i = 0; i < rows.length; i++){
    const r = rows[i] || {};
    let p = {};
    try { p = JSON.parse(r.message || '{}') || {}; } catch(e){ p = {}; }
    const code = String(p.code || '');
    if (!code || code === 'TEST-00') continue;

    const t = r.created_at ? Date.parse(r.created_at) : 0;
    if (t && t >= sinceMs) today++;

    const prev = latest[code];
    if (!prev || t >= prev.t) latest[code] = { t: t, p: p, org: String(r.organization || '').trim().toLowerCase() };
  }

  const codes = Object.keys(latest).sort();
  const orgs = {};
  let named = 0, anon = 0, use = 0, transfer = 0, rtkw = 0, defend = 0;
  let panel = 0, author = 0, facil = 0;

  for (let i = 0; i < codes.length; i++){
    const e = latest[codes[i]], p = e.p;
    if (e.org) orgs[e.org] = 1;
    if (p.consent_named === true) named++; else anon++;
    if (p.consent_use === true) use++;
    if (p.consent_transfer === true) transfer++;
    if (p.support_rtkw === true) rtkw++;
    if (p.support_defend === true) defend++;
    if (p.role === 'author') author++;
    else if (p.role === 'facil') facil++;
    else panel++;
  }

  return json({
    roster: ROSTER_SIZE,
    confirmed: codes.length,
    outstanding: Math.max(0, ROSTER_SIZE - codes.length),
    today: today,
    organizations: Object.keys(orgs).length,

    // How the paper's contributor list resolves on current elections.
    named_in_paper: named,
    anonymous_in_paper: anon,

    // Permissions. These are the rights a successor's counsel asks about.
    consented_use: use,
    consented_transfer: transfer,

    // Registry sign-ups taken from the contributor links.
    support_rtkw: rtkw,
    support_defend: defend,

    by_role: { panel: panel, author: author, facilitator: facil },
    confirmed_codes: codes
  });
}
