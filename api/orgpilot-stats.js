export const config = { runtime: 'edge' };

// Aggregate stats for the organization mini-pilot tiles on the status page.
// Reads org-pilot rows from pilot_contacts with the service-role key and
// returns ONLY counts. No personal data and no organization name leaves this
// endpoint unless the participant explicitly ticked the public-naming consent,
// in which case the organization name appears in named_organizations and
// nowhere else. Record text is never involved because it is never stored.
// GET only.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

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

  const q = SB + '/rest/v1/pilot_contacts?select=created_at,organization,message&source=eq.org-pilot&limit=10000';
  let rows;
  try {
    const res = await fetch(q, { headers: AH });
    if (!res.ok){ const t = await res.text(); return json({ error:'db_read_failed', status:res.status, detail:String(t).slice(0,300) }, 502); }
    rows = await res.json();
  } catch(e){ return json({ error:'db_unreachable' }, 502); }
  if (!Array.isArray(rows)) rows = [];

  const startOfTodayUTC = new Date(); startOfTodayUTC.setUTCHours(0,0,0,0);
  const sinceMs = startOfTodayUTC.getTime();

  const orgs = {}, sectors = {}, countries = {}, named = {};
  let sessions = 0, recordsRun = 0, today = 0;
  const routing = { low:0, moderate:0, high:0, critical:0 };
  const conditions = { pass:0, needs_attention:0, fail:0 };

  for (let i = 0; i < rows.length; i++){
    const r = rows[i] || {};
    sessions++;

    const orgRaw = (r.organization == null ? '' : String(r.organization)).trim();
    const orgKey = orgRaw.toLowerCase();
    if (orgKey) orgs[orgKey] = 1;

    const t = r.created_at ? Date.parse(r.created_at) : NaN;
    if (!isNaN(t) && t >= sinceMs) today++;

    let p = {};
    try { p = JSON.parse(r.message || '{}') || {}; } catch(e){ p = {}; }

    recordsRun += (parseInt(p.records_run, 10) || 0);

    const sec = String(p.sector || '').trim();
    if (sec) sectors[sec] = (sectors[sec] || 0) + 1;
    const cc = String(p.country || '').trim();
    if (cc) countries[cc] = (countries[cc] || 0) + 1;

    // Organization names are published only with explicit consent.
    if (p.consent_named_org === true && orgRaw) named[orgRaw] = 1;

    const rt = p.routing || {};
    routing.low      += (parseInt(rt.low, 10) || 0);
    routing.moderate += (parseInt(rt.moderate, 10) || 0);
    routing.high     += (parseInt(rt.high, 10) || 0);
    routing.critical += (parseInt(rt.critical, 10) || 0);

    const cd = p.conditions || {};
    conditions.pass            += (parseInt(cd.pass, 10) || 0);
    conditions.needs_attention += (parseInt(cd.needs_attention, 10) || 0);
    conditions.fail            += (parseInt(cd.fail, 10) || 0);
  }

  const bySector = Object.keys(sectors)
    .map(function(s){ return { sector: s, count: sectors[s] }; })
    .sort(function(a,b){ return b.count - a.count; });

  const condTotal = conditions.pass + conditions.needs_attention + conditions.fail;
  const flaggedPct = condTotal
    ? Math.round(1000 * (conditions.needs_attention + conditions.fail) / condTotal) / 10
    : null;

  return json({
    organizations: Object.keys(orgs).length,
    sessions: sessions,
    records_run: recordsRun,
    countries: Object.keys(countries).length,
    today: today,
    by_sector: bySector,
    routing: routing,
    conditions: conditions,
    // Share of all condition assessments that were not a clean pass. This is the
    // field-usage signal: how often real organizational records fell short.
    flagged_condition_pct: flaggedPct,
    named_organizations: Object.keys(named).sort()
  });
}
