export const config = { runtime: 'edge' };

// Post-gate activity statistics for the private status dashboard.
//
// WHY A SEPARATE ENDPOINT: on 2026-08-02 the field guides and the initiative
// support action moved behind a registration form. Everything recorded before
// that date is anonymous: a download count with no person attached, a support
// click nobody can contact. Mixing the two eras produces a number that looks
// bigger and means less. This endpoint reports ONLY activity from the gate
// forward, so every figure it returns stands behind a named, consented person.
//
// TRAINING IS THE ONE EXCEPTION and is reported all-time, because training
// enrollment always required identity and consent, so its earlier rows are the
// same kind of record as the post-gate ones.
//
// AGGREGATE ONLY. No name, email, or organization value ever leaves this
// endpoint; those fields are read in to compute distinct counts and discarded.
// The named list stays behind the owner token in /api/support-contacts.
// GET only.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// The date the registration gate went live. Everything before it is anonymous.
const GATE_START = '2026-08-02T00:00:00Z';

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

const TEST_SRC = ['verify','test','selftest'];
function isTestSrc(v){
  const s = String(v || '');
  if (!s) return false;
  if (TEST_SRC.indexOf(s) !== -1) return true;
  return s.indexOf('deploytest') === 0;
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

  const gateMs = Date.parse(GATE_START);

  // Contact rows: registrations, contributor confirmations, org pilots, and the
  // training stream. Training is pulled without a date filter on purpose.
  const contactsQ = SB + '/rest/v1/pilot_contacts'
    + '?select=created_at,organization,email,message,source'
    + '&source=in.(guide-register,support-register,contributor-confirm,org-pilot,training-enroll,training-complete)'
    + '&limit=20000';

  // Event rows carry the country, which the contact row does not.
  const eventsQ = SB + '/rest/v1/interaction_events'
    + '?select=source,payload,created_at'
    + '&created_at=gte.' + encodeURIComponent(GATE_START)
    + '&source=in.(guide-dl,support)&limit=20000';

  let rows = [], events = [];
  try {
    const [r1, r2] = await Promise.all([fetch(contactsQ, { headers: AH }), fetch(eventsQ, { headers: AH })]);
    if (!r1.ok){ const t = await r1.text(); return json({ error:'db_read_failed', status:r1.status, detail:String(t).slice(0,300) }, 502); }
    rows = await r1.json();
    if (r2.ok) events = await r2.json();
  } catch(e){ return json({ error:'db_unreachable' }, 502); }
  if (!Array.isArray(rows)) rows = [];
  if (!Array.isArray(events)) events = [];

  const startOfTodayUTC = new Date(); startOfTodayUTC.setUTCHours(0,0,0,0);
  const todayMs = startOfTodayUTC.getTime();

  const people = {}, orgs = {}, transferPeople = {};
  const byEdition = {}, byCampaign = {};
  let guide = 0, support = 0, contributors = 0, today = 0;
  let cContact = 0, cTransfer = 0, cNamed = 0;

  let trainEnroll = 0, trainComplete = 0, trainNamedConsent = 0, trainTransfer = 0;
  const trainPeople = {}, trainOrgs = {}, trainCountries = {};

  let pilotSessions = 0, pilotRecords = 0, pilotNamedOrgs = 0;
  const pilotOrgs = {};

  for (let i = 0; i < rows.length; i++){
    const r = rows[i] || {};
    const src = String(r.source || '');
    const t = r.created_at ? Date.parse(r.created_at) : NaN;
    let p = {};
    try { p = JSON.parse(r.message || '{}') || {}; } catch(e){ p = {}; }

    const em = (r.email == null ? '' : String(r.email)).trim().toLowerCase();
    const org = (r.organization == null ? '' : String(r.organization)).trim().toLowerCase();

    // Training: all-time, because it always required consent.
    if (src === 'training-enroll'){
      trainEnroll++;
      if (em) trainPeople[em] = 1;
      if (org) trainOrgs[org] = 1;
      if (p.consent_transfer === true) trainTransfer++;
      if (p.consent_named === true) trainNamedConsent++;
      continue;
    }
    if (src === 'training-complete'){
      trainComplete++;
      const cc = String(p.country || '').trim().toUpperCase();
      if (cc) trainCountries[cc] = (trainCountries[cc] || 0) + 1;
      continue;
    }

    // Everything else is only counted from the gate forward.
    if (isNaN(t) || t < gateMs) continue;

    if (src === 'org-pilot'){
      pilotSessions++;
      pilotRecords += (parseInt(p.records_run, 10) || 0);
      if (org) pilotOrgs[org] = 1;
      if (p.consent_named_org === true) pilotNamedOrgs++;
      continue;
    }

    if (src === 'guide-register') guide++;
    else if (src === 'support-register') support++;
    else if (src === 'contributor-confirm') contributors++;

    if (em) people[em] = 1;
    if (org) orgs[org] = 1;
    if (t >= todayMs) today++;

    if (p.consent_contact === true || src === 'contributor-confirm') cContact++;
    if (p.consent_transfer === true){ cTransfer++; if (em) transferPeople[em] = 1; }
    if (p.consent_named === true) cNamed++;

    if (p.edition)  byEdition[String(p.edition)]   = (byEdition[String(p.edition)] || 0) + 1;
    if (p.campaign) byCampaign[String(p.campaign)] = (byCampaign[String(p.campaign)] || 0) + 1;
  }

  // Country distribution, from the geo header captured on the event row at the
  // moment of the registered download or endorsement.
  const guideCountries = {}, supportCountries = {}, allCountries = {};
  let guideEvents = 0, supportEvents = 0;
  for (let i = 0; i < events.length; i++){
    const e = events[i] || {};
    const p = e.payload || {};
    if (isTestSrc(p.src)) continue;
    if (p.registered !== true) continue;          // pre-gate anonymous rows never counted
    const cc = String(p.country || '').trim().toUpperCase();
    if (String(e.source) === 'guide-dl'){
      guideEvents++;
      if (cc){ guideCountries[cc] = (guideCountries[cc] || 0) + 1; allCountries[cc] = (allCountries[cc] || 0) + 1; }
    } else {
      supportEvents++;
      if (cc){ supportCountries[cc] = (supportCountries[cc] || 0) + 1; allCountries[cc] = (allCountries[cc] || 0) + 1; }
    }
  }

  const registrations = guide + support + contributors;

  return json({
    gate_start: GATE_START,
    note: 'Registration, guide, initiative, and pilot figures count activity from the gate forward only. Training is all-time because it always required consent.',

    // Who registered since the gate.
    registrations: registrations,
    unique_people: Object.keys(people).length,
    organizations: Object.keys(orgs).length,
    today: today,
    guide_registrations: guide,
    support_registrations: support,
    contributor_confirmations: contributors,

    // What they took.
    by_edition: sortDesc(byEdition, 'edition'),
    by_campaign: sortDesc(byCampaign, 'campaign'),

    // Where they were.
    countries: Object.keys(allCountries).length,
    by_country: sortDesc(allCountries, 'country'),
    by_country_guide: sortDesc(guideCountries, 'country'),
    by_country_support: sortDesc(supportCountries, 'country'),
    geo_events: { guide: guideEvents, support: supportEvents },

    // What they agreed to.
    consented_contact: cContact,
    consented_transfer: cTransfer,
    consented_public_listing: cNamed,
    transferable_people: Object.keys(transferPeople).length,

    // Training, all-time.
    training: {
      enrollments: trainEnroll,
      unique_people: Object.keys(trainPeople).length,
      organizations: Object.keys(trainOrgs).length,
      completions: trainComplete,
      completion_rate_pct: trainEnroll ? Math.round((trainComplete / trainEnroll) * 1000) / 10 : 0,
      consented_transfer: trainTransfer,
      consented_public_listing: trainNamedConsent,
      countries: Object.keys(trainCountries).length,
      by_country: sortDesc(trainCountries, 'country')
    },

    // Records actually run through the standard, post-gate.
    records: {
      pilot_sessions: pilotSessions,
      organizations: Object.keys(pilotOrgs).length,
      records_reviewed: pilotRecords,
      orgs_consenting_to_be_named: pilotNamedOrgs
    }
  });
}
