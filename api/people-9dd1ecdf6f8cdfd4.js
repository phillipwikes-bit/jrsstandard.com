export const config = { runtime: 'edge' };

// Country resolution is shared with api/enroll-stats.js so the two endpoints can
// never report a different country for the same person.
import { resolveCountries } from './_country-backfill.js';

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
  'pilot':               'Pilot contact',
  // Added 2026-08-12. These three streams existed in the table and appeared in
  // no owner-readable list, so a recommendation request, a certificate request
  // and an honor quote were all invisible unless a token was typed into a URL
  // by hand. This endpoint needs no token: it is secured by its opaque URL, the
  // same model the roster, geo and supporters pages already use.
  'reviewer-eval-incentive': 'Asked for a LinkedIn recommendation',
  'reviewer-cert':           'Asked for a certificate',
  'honor-accept':            'Accepted the Honor'
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

  // WHO COMPLETED TRAINING, BY NAME.
  //
  // api/complete.js writes the completion row with name:'' on purpose, keyed by
  // email only, so a completion row alone cannot say who completed. The name
  // lives on the enrolment row. Joining the two by email is the only way to
  // answer "who completed training", and without it the list showed four
  // nameless rows.
  //
  // Email is used as the join key and is never exposed by this join beyond the
  // rows that already carry it.
  const completedEmails = {}, completedOn = {}, nameByEmail = {};
  for (let i = 0; i < rows.length; i++){
    const r = rows[i] || {};
    const em = String(r.email || '').trim().toLowerCase();
    if (!em) continue;
    // Any row that carries a name can supply it to a row that does not.
    if (!nameByEmail[em] && String(r.name || '').trim()) nameByEmail[em] = String(r.name).trim();
    if (String(r.source || '') !== 'training-complete') continue;
    completedEmails[em] = true;
    if (!completedOn[em] || String(r.created_at || '') > completedOn[em]) completedOn[em] = r.created_at || '';
  }

  // COUNTRY FOR EVERY PERSON, NOT JUST THE ROWS THAT HAPPENED TO CAPTURE ONE.
  // Resolved per person across all their rows, then from the documented
  // reviewer-records backfill, then reported as not on file. Never invented.
  const geo = await resolveCountries(rows);

  const out = [];
  for (let i = 0; i < rows.length; i++){
    const r = rows[i] || {};
    let p = {};
    try { p = JSON.parse(r.message || '{}') || {}; } catch(e){ p = {}; }
    if (isTest(p.page_source) || isTest(p.src)) continue;
    if (String(p.code || '') === 'TEST-00') continue;
    // A DIAGNOSTIC TEST row from 2026-06-03 sat in this list as if it were a
    // person. An owner list is a work list, so a row nobody has to act on does
    // not belong in it.
    if (String(r.source || '') === 'diagnostic') continue;
    if (String(r.name || '').toUpperCase() === 'DIAGNOSTIC TEST') continue;

    const src = String(r.source || '');

    // One plain-English line saying what this person actually did.
    let detail = '';
    if (src === 'guide-register')      detail = EDITION[String(p.edition || '')] || 'Investigator Field Guide';
    else if (src === 'support-register' || src === 'support') detail = CAMPAIGN[String(p.campaign || '')] || 'Initiative';
    else if (src === 'contributor-confirm') detail = 'Code ' + (p.code || '') + (p.consent_named === true ? ', named in paper' : ', anonymous in paper');
    else if (src === 'org-pilot')      detail = (p.records_run || 0) + ' records run' + (p.sector ? ', ' + p.sector : '');
    else if (src === 'training-enroll') detail = p.audience === 'panel' ? 'Panel channel' : 'Public channel';
    else if (src === 'training-complete') detail = 'Certificate issued';
    else if (src === 'reviewer-eval-incentive') detail = 'Wants a recommendation written' + (p.linkedin_url ? '' : ', no LinkedIn URL supplied');
    else if (src === 'reviewer-cert') detail = 'Completion code ' + (p.completion_code || 'not recorded');
    else if (src === 'honor-accept') detail = (p.honor_code || 'Honor')
      + (p.quote ? (p.quote_clearance === true ? ', quote CLEARED for publication' : ', quote NOT cleared')
                 : ', no quote supplied');

    out.push({
      date: r.created_at || '',
      // A completion row is written with no name, so it is filled from the
      // enrolment row that shares the email. Without this the four completions
      // read as four blanks on the owner sheet.
      name: (String(r.name || '').trim() || nameByEmail[String(r.email || '').trim().toLowerCase()] || ''),
      name_from_join: !String(r.name || '').trim() && !!nameByEmail[String(r.email || '').trim().toLowerCase()],
      email: (r.email == null ? '' : String(r.email)),
      organization: (r.organization == null ? '' : String(r.organization)),
      title: String(p.title || p.display_title || ''),
      country: String(p.country || '').toUpperCase()
               || geo.code[String(r.email || '').trim().toLowerCase()] || '',
      // 'captured'        recorded at submission on one of this person's rows
      // 'reviewer records' read from the dated roster, row predates geo capture
      // 'not on file'      established nowhere in the repository
      country_source: String(p.country || '')
        ? 'captured'
        : (geo.source[String(r.email || '').trim().toLowerCase()] || 'not on file'),
      activity: LABEL[src] || src,
      source: src,
      detail: detail,
      consent_contact: p.consent_contact === true,
      consent_transfer: p.consent_transfer === true,
      consent_public: (p.consent_named === true) || (p.consent_named_org === true) || (p.consent_public_list === true),
      campaign: String(p.campaign || ''),
      edition: String(p.edition || ''),
      records_run: parseInt(p.records_run, 10) || 0,
      // Set on the enrolment row, which is the row that carries the name.
      training_completed: (src === 'training-enroll')
        ? (completedEmails[String(r.email || '').trim().toLowerCase()] === true)
        : (src === 'training-complete'),
      training_completed_on: (src === 'training-enroll')
        ? (completedOn[String(r.email || '').trim().toLowerCase()] || '')
        : (r.created_at || ''),
      // Carried through so the owner can act without a second lookup. The quote
      // travels with its clearance flag, never on its own: a quote without its
      // clearance must not be treated as publishable.
      linkedin_url: String(p.linkedin_url || ''),
      completion_code: String(p.completion_code || ''),
      honor_code: String(p.honor_code || ''),
      quote: String(p.quote || ''),
      quote_cleared_for_publication: p.quote_clearance === true,
      byline_ok: p.byline_ok === true
    });
  }

  // Named training completions, so a buyer sees people rather than a count.
  const trainingCompletedNames = [];
  for (let i = 0; i < out.length; i++){
    if (out[i].source === 'training-enroll' && out[i].training_completed) {
      trainingCompletedNames.push({ name: out[i].name, organization: out[i].organization,
                                    country: out[i].country, completed_on: out[i].training_completed_on });
    }
  }

  // Roll-up so the page can show totals without recomputing them.
  const emails = {}, orgs = {}, countries = {}, noCountry = {};
  let publicOk = 0, transferOk = 0, recordsRun = 0;
  for (let i = 0; i < out.length; i++){
    const e = out[i];
    if (e.email) emails[e.email.toLowerCase()] = 1;
    if (e.organization) orgs[e.organization.toLowerCase()] = 1;
    if (e.country) countries[e.country] = 1;
    else if (e.name) noCountry[e.name] = 1;
    if (e.consent_public) publicOk++;
    if (e.consent_transfer) transferOk++;
    recordsRun += e.records_run;
  }
  // Named, so an unresolved country is a work item rather than a silent blank.
  const peopleNoCountry = Object.keys(noCountry).sort();

  return json({
    training_completed_named: trainingCompletedNames,
    training_completed_named_count: trainingCompletedNames.length,
    training_completion_note: 'Names come from the enrolment row joined to the completion row '
      + 'by email, because api/complete.js writes the completion with no name by design. '
      + '/api/enroll-stats reports a higher completion figure than the number of rows here: '
      + 'it adds panel reviewers who enrolled via ?src=panel and completed per the reviewer '
      + 'records without ever writing a training-complete row. Those are held in a documented '
      + 'SHA-256 backfill map in api/_country-backfill.js, not invented here. Row-verified '
      + 'completions are the conservative figure and are what this list shows.',
    country_note: 'Every person carries a country and country_source. "captured" means it was '
      + 'recorded at submission on one of that person\'s rows. "reviewer records" means the row '
      + 'predates geo capture on 2026-07-17 and the country was read from '
      + 'research/Expert_Roster_All_Studies_2026-08-06.csv, cited per entry in '
      + 'api/_country-backfill.js. "not on file" means it is established nowhere in the '
      + 'repository and REQUIRES USER INPUT; no country is ever inferred to fill one of those.',
    people_without_country: peopleNoCountry,
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
