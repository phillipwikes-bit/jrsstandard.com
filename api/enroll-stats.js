export const config = { runtime: 'edge' };

// Aggregate stats for the private training-adoption dashboard tile, token-free.
// Reads training-enroll rows from pilot_contacts using the server-side
// service-role key and returns ONLY counts. No personal data (name, email,
// organization) ever leaves this endpoint: those fields are read into the
// function to compute distinct/consent counts and then discarded. This replaces
// the training_stats database view, which cannot be created without a management
// token. GET only.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// Country backfill for rows that predate geo capture (2026-07-17) lives in
// api/_country-backfill.js, shared with api/people-9dd1ecdf6f8cdfd4.js so the
// two endpoints cannot report different countries for the same person.
import { COMPLETION_COUNTRY_BACKFILL, sha256hex } from './_country-backfill.js';

function json(o, s){ return new Response(JSON.stringify(o), { status: s||200, headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-store' } }); }


export default async function handler(req){
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' } });
  if (req.method !== 'GET') return json({ error:'method_not_allowed' }, 405);
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);
  const AH = { 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE };

  const url = SB + '/rest/v1/pilot_contacts?select=created_at,organization,email,message&source=eq.training-enroll&limit=10000';
  let rows;
  try {
    const res = await fetch(url, { headers: AH });
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

  // Completions by country. Read training-complete rows, dedup by email, take
  // the stored country (message.country) and backfill by email-hash when absent.
  const compCountry = {}; // email -> ISO code or '' (unresolved)
  try {
    const cr = await fetch(SB + '/rest/v1/pilot_contacts?select=email,message&source=eq.training-complete&limit=10000', { headers: AH });
    const done = cr.ok ? await cr.json() : [];
    if (Array.isArray(done)){
      for (let i=0; i<done.length; i++){
        const em = (done[i].email==null ? '' : String(done[i].email)).trim().toLowerCase();
        if (!em) continue;
        if (!(em in compCountry)) compCountry[em] = '';
        let cc = '';
        try { cc = String((JSON.parse(done[i].message||'{}')||{}).country || '').toUpperCase().replace(/[^A-Z]/g,'').slice(0,2); } catch(e){ cc = ''; }
        if (cc && !compCountry[em]) compCountry[em] = cc;
      }
    }
    // Backfill unresolved completions (rows present but no stored country).
    const emails = Object.keys(compCountry);
    for (let i=0; i<emails.length; i++){
      if (!compCountry[emails[i]]){
        const h = await sha256hex(emails[i]);
        if (COMPLETION_COUNTRY_BACKFILL[h]) compCountry[emails[i]] = COMPLETION_COUNTRY_BACKFILL[h];
      }
    }
    // Add known completers who enrolled but never wrote a training-complete row
    // (panel reviewers via ?src=panel). Only enrolled emails in the records map
    // are added, each once, with the recorded country.
    const enrolled = Object.keys(people);
    for (let i=0; i<enrolled.length; i++){
      if (!(enrolled[i] in compCountry)){
        const h = await sha256hex(enrolled[i]);
        if (COMPLETION_COUNTRY_BACKFILL[h]) compCountry[enrolled[i]] = COMPLETION_COUNTRY_BACKFILL[h];
      }
    }
  } catch(e){ /* leave compCountry as-is; completions block is best-effort */ }

  const byCountry = {};
  let completions = 0;
  Object.keys(compCountry).forEach(function(em){
    completions++;
    const c = compCountry[em] || 'unknown';
    byCountry[c] = (byCountry[c] || 0) + 1;
  });
  const completions_by_country = Object.keys(byCountry)
    .map(function(c){ return { country: c, count: byCountry[c] }; })
    .sort(function(a,b){ return b.count - a.count; });
  const completions_countries = completions_by_country.filter(function(x){ return x.country !== 'unknown'; }).length;

  return json({
    enrollments: rows.length,
    unique_people: Object.keys(people).length,
    organizations: Object.keys(orgs).length,
    consented_contact: consentedContact,
    consented_transfer: consentedTransfer,
    today: today,
    completions: completions,
    completions_countries: completions_countries,
    completions_by_country: completions_by_country
  });
}
