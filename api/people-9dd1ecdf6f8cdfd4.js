export const config = { runtime: 'edge' };

// OWNER-ONLY named list of every person in the private contact table.
//
// Secured by this opaque, unlinked, noindex URL, so it needs NO token. Same
// model already used by api/roster-8c3f1a9e7b2d6045.js, the acquisition page,
// and the supporters page. If this URL ever leaks, rename this file and its
// page to rotate it.
//
// It covers every stream in one place, so there is one list to look at:
//   guide-register       Investigator Field Guide registrations (which edition)
//   support-register     initiative registrations (which campaign)
//   contributor-confirm  study contributors confirming name and title
//   training-enroll      training enrollments
//   training-complete    training completions
//   org-pilot            organizations that ran records through the standard
//   pilot / support      older rows kept so nothing is hidden
//
// Every row carries its consent flags, so it is obvious at a glance who may be
// named publicly and whose details may transfer to a successor.
//
// Country: pilot_contacts has no country column, so country rides in the JSON
// payload. It is captured from the edge geo header at the moment the person
// submits. Rows written before that capture was added show a blank country.
// GET only.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

const LABEL = {
  'guide-register':      'Investigator Field Guide',
  'support-register':    'Initiative',
  'contributor-confirm': 'Study contributor',
  'training-enroll':     'Training enrollment',
  'training-complete':   'Training completed',
  'org-pilot':           'Ran records',
  'support':             'Initiative (pre-gate)',
  'pilot':               'Pilot contact'
};

const EDITION = {
  employment:    'EEO / Employment',
  fairhousing:   'Fair Housing',
  international: 'International'
};

const CAMPAIGN = {
  rtkw:    'The Right to Know Why',
  defend:  'The Decisions You Can Defend',
  general: 'General'
};

// Deploy and smoke-check rows never appear in the owner's list.
const TEST_SRC = ['verify','test','selftest'];
function isTest(v){
  const s = String(v || '');
  if (!s) return false;
  if (TEST_SRC.indexOf(s) !== -1) return true;
  return s.indexOf('deploytest') === 0;
}

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

  const q = SB + '/rest/v1/pilot_contacts'
    + '?select=created_at,name,email,organization,message,source'
    + '&order=created_at.desc&limit=20000';

  let rows;
  try {
    const res = await fetch(q, { headers: { 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE } });
    if (!res.ok){ const t = await res.text(); return json({ error:'db_read_failed', status:res.status, detail:String(t).slice(0,300) }, 502); }
    rows = await res.json();
  } catch(e){ return json({ error:'db_unreachable' }, 502); }
  if (!Array.isArray(rows)) rows = [];

  const out = [];
  for (let i = 0; i < rows.length; i++){
    const r = rows[i] || {};
    let p = {};
    try { p = JSON.parse(r.message || '{}') || {}; } catch(e){ p = {}; }
    if (isTest(p.page_source) || isTest(p.src)) continue;
    if (String(p.code || '') === 'TEST-00') continue;

    const src = String(r.source || '');

    // One plain-English line saying what this person actually did.
    let detail = '';
    if (src === 'guide-register')      detail = EDITION[String(p.edition || '')] || 'Investigator Field Guide';
    else if (src === 'support-register' || src === 'support') detail = CAMPAIGN[String(p.campaign || '')] || 'Initiative';
    else if (src === 'contributor-confirm') detail = 'Code ' + (p.code || '') + (p.consent_named === true ? ', named in paper' : ', anonymous in paper');
    else if (src === 'org-pilot')      detail = (p.records_run || 0) + ' records run' + (p.sector ? ', ' + p.sector : '');
    else if (src === 'training-enroll') detail = p.audience === 'panel' ? 'Panel channel' : 'Public channel';
    else if (src === 'training-complete') detail = 'Certificate issued';

    out.push({
      date: r.created_at || '',
      name: (r.name == null ? '' : String(r.name)),
      email: (r.email == null ? '' : String(r.email)),
      organization: (r.organization == null ? '' : String(r.organization)),
      title: String(p.title || p.display_title || ''),
      country: String(p.country || '').toUpperCase(),
      activity: LABEL[src] || src,
      source: src,
      detail: detail,
      consent_contact: p.consent_contact === true,
      consent_transfer: p.consent_transfer === true,
      consent_public: (p.consent_named === true) || (p.consent_named_org === true) || (p.consent_public_list === true),
      campaign: String(p.campaign || ''),
      edition: String(p.edition || ''),
      records_run: parseInt(p.records_run, 10) || 0
    });
  }

  // Roll-up so the page can show totals without recomputing them.
  const emails = {}, orgs = {}, countries = {};
  let publicOk = 0, transferOk = 0, recordsRun = 0;
  for (let i = 0; i < out.length; i++){
    const e = out[i];
    if (e.email) emails[e.email.toLowerCase()] = 1;
    if (e.organization) orgs[e.organization.toLowerCase()] = 1;
    if (e.country) countries[e.country] = 1;
    if (e.consent_public) publicOk++;
    if (e.consent_transfer) transferOk++;
    recordsRun += e.records_run;
  }

  return json({
    ok: true,
    total_rows: out.length,
    unique_people: Object.keys(emails).length,
    organizations: Object.keys(orgs).length,
    countries: Object.keys(countries).length,
    consent_public_rows: publicOk,
    consent_transfer_rows: transferOk,
    records_run: recordsRun,
    people: out
  });
}
