import { ownerAccess } from './_owner-auth.js';
import { fetchAll } from './_sb-fetch.js';
import { participantGroup, permissionState } from './_owner-record-groups.js';
export const config = { runtime: 'edge' };

// Country resolution is shared with api/enroll-stats.js so the two endpoints can
// never report a different country for the same person.
import { resolveCountries } from './_country-backfill.js';

// OWNER-ONLY named list of every person in the private contact table.
//
// Authentication relies on the signed owner session or authorized bearer
// credential, never on the obscurity of this route. The page and API are
// private and fail closed when the underlying source is incomplete.
//
// It covers every stream in one place, so there is one list to look at:
//   guide-register       Investigator Guide registrations (which edition)
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
  'site-inquiry':        'Website inquiry',
  'guide-register':      'Investigator Guide',
  'support-register':    'Initiative',
  'contributor-confirm': 'Study contributor',
  'training-enroll':     'Training enrollment',
  'training-complete':   'Training completed',
  'org-pilot':           'Ran records',
  'support':             'Initiative (pre-gate)',
  'pilot':               'Pilot contact',
  // These three historical streams require separate owner follow-up.
  // They remain visible only inside the authenticated private directory.
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

// Historical test metadata are only REVIEW FLAGS. A marker can be attached
// to a legitimate contact, and this private record must not silently exclude
// either a genuine person or a diagnostic row from the stored population.
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
    headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store, private', 'X-Robots-Tag':'noindex, nofollow', 'Referrer-Policy':'no-referrer' }
  });
}

export default async function handler(req){
  const denied=await ownerAccess(req);
  if(denied)return denied;
  if (req.method === 'OPTIONS') {
    return new Response(null, { status:204, headers:{
      
      'Access-Control-Allow-Methods':'GET, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type'
    }});
  }
  if (req.method !== 'GET') return json({ error:'method_not_allowed' }, 405);

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);

  // Never present a partial participant population as a complete roster.
  // The shared reader reports incomplete pages without throwing. Require
  // complete=true before any names, email addresses or derived totals return.
  // Fix the upper time boundary before pagination. Without it, a new
  // insertion between pages can shift offset boundaries and hide a record
  // without producing an HTTP error. This is not a transaction snapshot.
  const snapshotUtc=new Date().toISOString();
  const result=await fetchAll(SB,
    'pilot_contacts?select=created_at,name,email,organization,message,source'
      +'&created_at=lte.'+encodeURIComponent(snapshotUtc)
      +'&order=created_at.desc',
    {apikey:SERVICE,Authorization:'Bearer '+SERVICE});
  if(!result.complete||!Array.isArray(result.rows))
    return json({error:'private_participant_source_incomplete',complete:false},502);
  const rows=result.rows;

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
  let possibleTestRows = 0;
  for (let i = 0; i < rows.length; i++){
    const r = rows[i] || {};
    let p = {};
    try { p = JSON.parse(r.message || '{}') || {}; } catch(e){ p = {}; }
    const src = String(r.source || '');
    const possibleTest = isTest(p.page_source) || isTest(p.src)
      || String(p.code || '') === 'TEST-00'
      || src === 'diagnostic'
      || String(r.name || '').trim().toUpperCase() === 'DIAGNOSTIC TEST';
    if (possibleTest) possibleTestRows++;
    // No source row is discarded on the basis of a self-declared field,
    // diagnostic source, code or free-text name. All remain owner-reviewable.
    // Public naming choices are purpose-specific, not a blanket permission.
    // Keep each source flag separately and choose the relevant display scope.
    const namedResearch = permissionState(p,['consent_named']);
    const namedOrganization = permissionState(p,['consent_named_org']);
    const listedSupporter = permissionState(p,['consent_public_list']);
    const publicPermissionKey = src === 'contributor-confirm' ? 'consent_named'
      : src === 'org-pilot' ? 'consent_named_org'
      : (src === 'support-register' || src === 'support') ? 'consent_public_list' : '';
    const publicPermission = publicPermissionKey ? permissionState(p,[publicPermissionKey]) : 'not-recorded';
    const publicScope = publicPermissionKey === 'consent_named' ? 'Research attribution'
      : publicPermissionKey === 'consent_named_org' ? 'Organization naming'
      : publicPermissionKey === 'consent_public_list' ? 'Supporter listing'
      : 'No established public-naming scope';
    const contactPermission = permissionState(p,['consent_contact','consent_to_contact']);

    // One plain-English line saying what this person actually did.
    let detail = '';
    if (src === 'guide-register')      detail = EDITION[String(p.edition || '')] || 'Investigator Guide';
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
      source_position: i,
      possible_test_marker: possibleTest,
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
      activity_family: participantGroup(src,p),
      inquiry_category: src==='site-inquiry' ? String(p.category||'') : '',
      commercial_purpose: src==='site-inquiry' && p.category==='commercial' ? String(p.commercial_purpose||'') : '',
      detail: detail,
      consent_contact: contactPermission === 'recorded-yes',
      consent_transfer: permissionState(p,['consent_transfer']) === 'recorded-yes',
      consent_public: publicPermission === 'recorded-yes',
      // Preserve exact unknown, negative, and conflicting permission states.
      // Research attribution, organization naming and supporter listing are
      // separately scoped. None authorizes buyer outreach or data transfer.
      consent_contact_state: contactPermission,
      consent_transfer_state: permissionState(p,['consent_transfer']),
      consent_public_state: publicPermission,
      publication_scope: publicScope,
      consent_research_named_state: namedResearch,
      consent_organization_named_state: namedOrganization,
      consent_supporter_listed_state: listedSupporter,
      campaign: String(p.campaign || ''),
      edition: String(p.edition || ''),
      records_run: parseInt(p.records_run, 10) || 0,
      // Set on the enrolment row, which is the row that carries the name.
      training_completed: (src === 'training-enroll')
        ? (completedEmails[String(r.email || '').trim().toLowerCase()] === true)
        : (src === 'training-complete'),
      // EMPTY UNLESS THEY ACTUALLY COMPLETED. This previously fell back to
      // r.created_at for every non-enrolment row, so 46 of 58 rows carried a
      // "training completed on" date for people who never took the training:
      // the row's own creation time wearing a completion date's name. The
      // table guards the field on training_completed and looked correct; the
      // CSV export at programme-status-9872fb93cc94.html:1515 did not, so an
      // exported file asserted 46 completions that did not happen.
      training_completed_on: (src === 'training-enroll')
        ? (completedOn[String(r.email || '').trim().toLowerCase()] || '')
        : (src === 'training-complete' ? (r.created_at || '') : ''),
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

  // Source-population integrity is a hard requirement, not a best-effort
  // display rule. No record may vanish between a complete read and the list.
  if (out.length !== rows.length)
    return json({error:'private_participant_reconciliation_failed',complete:false},502);

  // Named training completions for owner review, not buyer qualification.
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
    complete: true,
    source_row_count: rows.length,
    retained_source_rows: out.length,
    coverage_through_utc: snapshotUtc,
    pagination_basis: 'Created-at descending with a fixed UTC upper bound; not a transactional snapshot',
    possible_test_rows: possibleTestRows,
    test_marker_basis: 'Historical diagnostic, deploy or test metadata only. Flagged for owner review, not independently verified as synthetic; no source record excluded.',
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
