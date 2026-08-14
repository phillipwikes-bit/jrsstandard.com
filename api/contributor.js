export const config = { runtime: 'edge' };

// Per-person contributor confirmation endpoint.
//
// One unguessable link per person for the people who actually produced the
// study: the reviewers who completed the full international detection set, the
// article co-authors, and the domain pilot facilitators. The link does four
// jobs in one place, none of which the email round can do reliably:
//
//   1. Captures how each person wants their NAME and TITLE printed, plus a
//      current contact address, so the paper's contributor list is confirmed
//      by the contributor rather than transcribed from a registration form.
//   2. Records the naming election (printed by name, or counted anonymously in
//      the aggregate) as a forced choice, so silence is never read as consent.
//   3. Records the continuing-use and transfer permissions in writing, which is
//      what a successor's counsel asks for and what an email thread cannot show.
//   4. Releases what was promised: the two initiative sign-ups, the Investigator Field Guide,
//      the training, and the aggregate results summary.
//
// DELIBERATE OMISSION: comparison-arm reviewers (RR-### codes) are NOT in this
// roster and must not be added. That arm is blind; a JRS-branded page naming the
// standard would break the blind for anyone still reviewing, and the debrief for
// that group is a separate message drafted in research/Reviewer_Results_Release_Plan.md.
//
// RESULTS GATE: the results summary is served by this endpoint, never embedded
// in the page source, and only when RESULTS_RELEASED is true. The release rule
// set in the results plan is a single date after comparison-arm recruitment
// closes and the data are locked, so that no participant sees findings while
// others are still reviewing. Until then a submission returns the honest pending
// notice plus the figures that are already published on the site.
//
// Writes to the EXISTING private pilot_contacts table (RLS on, no anon read)
// via the service-role key, tagged source='contributor-confirm' so it never
// collides with training-enroll, guide-register, support-register, or pilot rows.
// Fields the table has no column for ride along as JSON in the message column,
// matching the /api/enroll and /api/access convention.

import { ROSTER } from './_contributor-roster.js';

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// Fallback date. If a contributor does not respond by this date, the paper uses
// the name and title already on file for them (or anonymity where that is the
// election on file). Shown on the page so the rule is visible, not implied.
const FALLBACK_DATE = 'Friday, 14 August 2026';

// Flip to true ONLY when both conditions in the results plan are met:
// comparison-arm recruitment closed AND the analysis locked. Until then the
// page tells contributors plainly why the summary is not there yet.
const RESULTS_RELEASED = false;
const RESULTS_EXPECTED = 'late August 2026';

// The roster itself lives in ./_contributor-roster.js, shared with
// api/contributor-stats.js so the two can never disagree on who is on it or how
// many there are. Its field semantics, including the named_on_file fallback
// rule, are documented there.
//
// The two completers who elected anonymity. Empty until 2026-08-14, when the
// codes surfaced: the roster CSV records RR-130 and RR-132 as "Anonymous by
// choice", and both joined the contributor roster the same day.
//
// THE DISTINCTION IS USER-VISIBLE AND IT WAS WRONG FOR THESE TWO.
//
//   false  an election to stay anonymous IS on file. The page says so and
//          offers to change it.
//   null   NO election is on file. The page says silence means the aggregate
//          without a name.
//
// Both fall back to anonymous, so nothing was ever at risk of being printed.
// But leaving these two at null would have told two people who explicitly
// chose anonymity that they had never made a choice, which is simply false.
const ANON_CODES = ['RR-130', 'RR-132'];

const FILES = {
  employment:    'JRS_Investigator_Field_Guide_Employment.pdf',
  fairhousing:   'JRS_Investigator_Field_Guide_FairHousing.pdf',
  international: 'JRS_Investigator_Field_Guide_International.pdf'
};

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' }
  });
}
function clean(v, n){ return (v == null ? '' : String(v)).trim().slice(0, n || 200); }
function keyOf(v){ return String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20); }

// Deploy and smoke-check key. Resolves through the whole path so a check can
// confirm the endpoint works, but never writes a row.
const TEST_KEY = 'selftest00';
const TEST_PERSON = { code:'TEST-00', kind:'panel', first:'Test', name:'Test Contributor', title:'Deploy check', org:'', named_on_file:true };

async function purgeTestRows(H){
  // pilot_contacts.message is TEXT holding serialized JSON, not jsonb, so a
  // message->>field filter matches nothing. Match the serialized text instead.
  const pat = '*' + encodeURIComponent('"code":"TEST-00"') + '*';
  try {
    await fetch(SB + '/rest/v1/pilot_contacts?source=eq.contributor-confirm&message=like.' + pat,
      { method: 'DELETE', headers: H });
  } catch (e) { /* best-effort */ }
  // Link-open rows written by a deploy check or a curl smoke test. Two rules,
  // because neither alone is sufficient.
  //
  // A bare curl sends no src, so a tag filter would miss it: matched on the
  // user-agent instead.
  //
  // A smoke test that SPOOFS a browser user-agent defeats both, so every
  // link-open row written before the guard shipped is also cleared. That cutoff
  // is safe and exact: link-open logging began on 2026-08-09, no contributor
  // link has been sent, and the only honor link distributed was accepted before
  // this logging existed. Every row before the cutoff is therefore synthetic by
  // construction. Remove this second rule once real opens are being recorded.
  // Everything before this stamp is an owner preview by construction: only one
  // honor link had been distributed at that point, and it was accepted before
  // link logging existed. Advance this stamp only when it is again true that
  // nothing real sits behind it.
  const LOG_CUTOFF = '2026-08-09T18:00:00Z';
  try {
    for (const src of ['contributor-link', 'honor-link', 'recheck-link', 'honor-cert']) {
      await fetch(SB + '/rest/v1/interaction_events?source=eq.' + src + '&payload-%3E%3Euser_agent=like.*curl*',
        { method: 'DELETE', headers: H });
      await fetch(SB + '/rest/v1/interaction_events?source=eq.' + src + '&created_at=lt.' + encodeURIComponent(LOG_CUTOFF),
        { method: 'DELETE', headers: H });
    }
  } catch (e) { /* best-effort */ }
  // Reviewer-evaluation rows carrying a deploy-check tag. The guard in
  // /api/reviewer-eval stops new ones, but a row written before that guard
  // deployed would otherwise sit permanently in the research baseline, which is
  // the one table in the programme that must hold only real answers.
  try {
    for (const tag of ['selftest', 'test', 'verify', 'owner']) {
      await fetch(SB + '/rest/v1/interaction_events?source=eq.reviewer-eval&payload-%3E%3Esrc=eq.' + tag,
        { method: 'DELETE', headers: H });
    }
  } catch (e) { /* best-effort */ }
  // Endorsement rows written by an end-to-end check of /api/support. The write
  // there is suppressed for the standard test tags, but proving the write path
  // works at all requires a tag that is NOT suppressed, so e2echeck writes a
  // real row on purpose and this removes it afterwards. Without this the only
  // way to verify the endorsement counter is to permanently inflate it by one.
  try {
    for (const tag of ['e2echeck', 'selftest', 'test', 'verify', 'owner']) {
      await fetch(SB + '/rest/v1/interaction_events?source=eq.support&payload-%3E%3Esrc=eq.' + tag,
        { method: 'DELETE', headers: H });
    }
  } catch (e) { /* best-effort */ }
  // The twelve endorsement rows written on 2026-08-11 while verifying that the
  // /api/support redirect chain worked for both campaigns across six referral
  // tags. They carry genuine src tags, so no tag filter can reach them. They are
  // bracketed by timestamp instead, and the bracket is exact: the previous real
  // endorsement is dated 2026-08-04T09:03Z, nothing was recorded in between
  // because the write was broken, and the twelve landed inside a six second
  // window. Nothing genuine can fall inside these bounds.
  const E2E_FROM = '2026-08-11T08:36:45Z';
  const E2E_TO   = '2026-08-11T08:37:00Z';
  // Second bracket: three rows written at 20:18Z while confirming the endorsement
  // redirect was not being served from edge cache. Same six-second signature, and
  // the last one is the reason /api/support now refuses to record a non-browser
  // agent at all, so this list should not need extending again.
  const E2E2_FROM = '2026-08-11T20:18:35Z';
  const E2E2_TO   = '2026-08-11T20:18:45Z';
  // Third bracket: one row at 20:20:46Z, the demonstration that a real browser
  // user agent DOES record while curl does not. It proved the fix and it is not
  // a supporter, so it comes out like the others.
  const E2E3_FROM = '2026-08-11T20:20:40Z';
  const E2E3_TO   = '2026-08-11T20:20:52Z';
  try {
    for (const w of [[E2E_FROM, E2E_TO], [E2E2_FROM, E2E2_TO], [E2E3_FROM, E2E3_TO]]) {
      await fetch(SB + '/rest/v1/interaction_events?source=eq.support'
        + '&created_at=gte.' + encodeURIComponent(w[0])
        + '&created_at=lte.' + encodeURIComponent(w[1]),
        { method: 'DELETE', headers: H });
    }
  } catch (e) { /* best-effort */ }
  // The five guide-download rows written on 2026-08-11 while verifying that
  // every shape of ?e= link had stopped redirecting to the consent form. They
  // carry genuine src tags (email, site, signature, footer, guides) because
  // those tags were the thing under test, so no tag filter can reach them.
  // Bracketed by timestamp: five downloads landed one second apart inside a
  // five second window, one per link shape, in the order the check ran.
  const DL_FROM = '2026-08-11T04:16:07Z';
  const DL_TO   = '2026-08-11T04:16:13Z';
  try {
    await fetch(SB + '/rest/v1/interaction_events?source=eq.guide-dl'
      + '&created_at=gte.' + encodeURIComponent(DL_FROM)
      + '&created_at=lte.' + encodeURIComponent(DL_TO),
      { method: 'DELETE', headers: H });
  } catch (e) { /* best-effort */ }
  // eval-view rows from an end-to-end check of the evaluation open counter.
  // Same reason as the endorsement check: proving the counter writes at all
  // needs a tag the write guard does not suppress, so e2echeck writes a real
  // row on purpose and this removes it. Without it, confirming that a zero is
  // a true zero would permanently add one to the funnel denominator.
  try {
    for (const tag of ['e2echeck', 'selftest', 'test', 'verify', 'owner']) {
      await fetch(SB + '/rest/v1/interaction_events?source=eq.eval-view&payload-%3E%3Esrc=eq.' + tag,
        { method: 'DELETE', headers: H });
    }
  } catch (e) { /* best-effort */ }
  // Arrival rows from an end-to-end check of the two counters added on
  // 2026-08-11. Same reason as the others: proving a counter writes requires a
  // tag the write guard does not suppress.
  try {
    for (const src of ['reviewer-view', 'train-view']) {
      for (const tag of ['e2echeck', 'selftest', 'test', 'verify', 'owner']) {
        await fetch(SB + '/rest/v1/interaction_events?source=eq.' + src + '&payload-%3E%3Esrc=eq.' + tag,
          { method: 'DELETE', headers: H });
      }
    }
  } catch (e) { /* best-effort */ }
  // Gate telemetry rows carrying a deploy-check tag. Same reason: a test view or
  // field_touched row lands in the funnel denominator that the conversion report
  // is computed from, where it reads as a real visitor who abandoned.
  try {
    for (const tag of ['selftest', 'test', 'verify', 'owner']) {
      await fetch(SB + '/rest/v1/interaction_events?source=eq.gate-view&payload-%3E%3Esrc=eq.' + tag,
        { method: 'DELETE', headers: H });
    }
  } catch (e) { /* best-effort */ }
}

// Results block. Pending state still carries the figures already published on
// the public research pages, so the page has something real on it either way.
function resultsBlock(){
  if (!RESULTS_RELEASED) {
    return {
      status: 'pending',
      expected: RESULTS_EXPECTED,
      heading: 'Your results summary',
      why: 'Data collection is not closed yet. The summary goes to every contributor on a single date once collection closes and the analysis is locked, so that nobody sees findings while other reviewers are still working. That is a design safeguard, not a delay for its own sake.',
      published: [
        'An international panel of experienced professionals independently reviewed the same set of 24 constructed records, spanning 10 countries on 5 continents.',
        'Reads were scored against an answer key fixed and independently verified before any scoring took place.',
        'Three AI systems from three different vendors applied the same review to the same records and agreed 84 percent of the time. That figure measures consistency of application, not correctness, and the two are kept apart deliberately.'
      ],
      closing: 'You are on the list to receive the full summary in ' + RESULTS_EXPECTED + '. It will be aggregate. Individual results are held confidentially, and if you want your own, ask and it goes to you privately and to nobody else.'
    };
  }
  return {
    status: 'released',
    heading: 'What the study found',
    published: [
      'Reviewers on the panel identified the records correctly 82.8 percent of the time (95 percent confidence interval 71.0 to 94.6, 15 reviewers, 360 reads, sensitivity 86.1, specificity 79.4). That clears the threshold set in advance, before any data were examined. Experienced professionals working independently across 10 countries can identify records whose reasoning cannot be reconstructed.',
      'Three AI systems from three different vendors applied the same review to the same records and agreed 84 percent of the time. That is consistency of application rather than correctness.',
      'What the study did not establish: it did not show that the standard improves on unaided professional judgment. A separate comparison was built to test exactly that, and at the sample size reached the result is not statistically conclusive. It is reported as an open question rather than a win.'
    ],
    closing: 'Results are reported in aggregate only. Individual results are held confidentially and are not included here. If you would like to know your own, ask and it goes to you privately.'
  };
}

function publicPerson(p){
  return {
    code: p.code, kind: p.kind, first: p.first,
    name_on_file: p.name, title_on_file: p.title, org_on_file: p.org,
    named_on_file: (ANON_CODES.indexOf(p.code) !== -1) ? false : p.named_on_file,
    note: p.note || '',
    fallback_date: FALLBACK_DATE
  };
}

export default async function handler(req){
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin':'*',
      'Access-Control-Allow-Methods':'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type'
    }});
  }

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const H = SERVICE ? {
    'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
    'Content-Type': 'application/json', 'Prefer': 'return=minimal'
  } : null;

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const k = keyOf(url.searchParams.get('k'));
    if (H) await purgeTestRows(H);
    if (!k) return json({ ok:true, serviceKey: !!SERVICE });
    const p = (k === TEST_KEY) ? TEST_PERSON : ROSTER[k];
    if (!p) return json({ ok:false, error:'unknown_key' }, 404);

    // Link-open ping. Without it a contributor link that returns nothing is
    // indistinguishable from one nobody clicked, so "0 of 20 confirmed" cannot
    // be read. Records the participant code and never the key, so the event log
    // cannot be turned back into a set of working links. Best-effort: a failed
    // ping must never stop the page rendering. The internal test key is skipped
    // so deploy checks do not inflate the count.
    const tsrc = String(url.searchParams.get('src') || '').toLowerCase();
    // ?src=owner or ?owner=1 suppresses the log, so an owner preview never counts
    // as external engagement.
    const isCheck = tsrc === 'owner' || url.searchParams.get('owner') === '1' || tsrc === 'verify' || tsrc === 'test' || tsrc === 'selftest' || tsrc.indexOf('deploytest') === 0;
    if (SERVICE && H && k !== TEST_KEY && !isCheck) {
      try {
        const ua = String(req.headers.get('user-agent') || '').slice(0, 300);
        await fetch(SB + '/rest/v1/interaction_events', { method:'POST', headers:H,
          body: JSON.stringify({ source:'contributor-link', type:'view', payload:{
            code: p.code || '',
            kind: p.kind || '',
            country: String(req.headers.get('x-vercel-ip-country') || '')
              .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
            user_agent: ua,
            is_mobile: /Mobi|Android|iPhone|iPad|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(ua)
          }}) });
      } catch (e) { /* never block the page */ }
    }

    return json({ ok:true, person: publicPerson(p) });
  }

  if (req.method !== 'POST') return json({ error:'method_not_allowed' }, 405);
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);

  let b; try { b = await req.json(); } catch(e){ return json({ error:'invalid_json' }, 400); }

  const k = keyOf(b.k);
  const isTest = (k === TEST_KEY);
  const person = isTest ? TEST_PERSON : ROSTER[k];
  if (!person) return json({ error:'unknown_key' }, 404);

  const name  = clean(b.name, 200);
  const title = clean(b.title, 250);
  const org   = clean(b.organization, 200);
  const email = clean(b.email, 200);
  const link  = clean(b.profile, 300);

  // Forced choices. Each must be an explicit yes or no; an unanswered question
  // is rejected rather than defaulted, so a permission can never be inferred.
  function choice(v){ v = String(v || '').toLowerCase(); return (v === 'yes' || v === 'no') ? v : ''; }
  const cName     = choice(b.consent_named);
  const cUse      = choice(b.consent_use);
  const cTransfer = choice(b.consent_transfer);
  if (!cName)     return json({ error:'naming_choice_required' }, 400);
  if (!cUse)      return json({ error:'use_choice_required' }, 400);
  if (!cTransfer) return json({ error:'transfer_choice_required' }, 400);

  // ANONYMITY IS NOT CONDITIONAL ON IDENTIFYING YOURSELF.
  //
  // Until 2026-08-13 name, title, organization and email were hard-required
  // before this endpoint would accept a confirmation, including from a person
  // whose election on file was anonymous. That made "you may stay anonymous"
  // an offer you could only accept by first disclosing who you are.
  //
  // A contributor electing anonymity now confirms with the three permission
  // choices alone. Nothing else is demanded, and the fields they omit are
  // stored empty rather than inferred from the roster.
  const wantsNamed = (cName === 'yes');
  if (wantsNamed) {
    if (!name)  return json({ error:'name_required' }, 400);
    if (!title) return json({ error:'title_required' }, 400);
    if (!org)   return json({ error:'organization_required' }, 400);
    if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) {
      return json({ error:'valid_email_required' }, 400);
    }
  } else if (email && (email.indexOf('@') < 1 || email.indexOf('.') < 0)) {
    // An anonymous contributor may still leave an address so the results can
    // reach them. If they do, it has to be a real one; if they do not, that is
    // an accepted answer and not an error.
    return json({ error:'valid_email_required' }, 400);
  }

  const payload = {
    kind: 'contributor-confirm',
    code: person.code,
    role: person.kind,
    display_name: name,
    display_title: title,
    profile: link,
    consent_contact: true,
    consent_named: (cName === 'yes'),
    consent_use: (cUse === 'yes'),
    consent_transfer: (cTransfer === 'yes'),
    support_rtkw: b.support_rtkw === true,
    support_defend: b.support_defend === true,
    country: String(req.headers.get('x-vercel-ip-country') || '')
      .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
    name_on_file: person.name,
    title_on_file: person.title,
    ts: new Date().toISOString()
  };

  const row = {
    name: name,
    email: email,
    organization: org,
    message: JSON.stringify(payload),
    source: 'contributor-confirm'
  };

  await purgeTestRows(H);

  if (!isTest) {
    // The confirmation record is the point of this endpoint. If it fails the
    // request fails, so a results summary is never released against a
    // confirmation that was not stored.
    const res = await fetch(SB + '/rest/v1/pilot_contacts', {
      method: 'POST', headers: H, body: JSON.stringify(row)
    });
    if (!res.ok) {
      const t = await res.text();
      return json({ error:'db_insert_failed', status:res.status, detail:String(t).slice(0,300) }, 502);
    }

    // Initiative sign-ups, when elected. Written as ordinary support
    // registrations so the supporter counts on the dashboard stay true, and
    // named because the checkbox on the page says the name will be listed.
    const camps = [];
    if (payload.support_rtkw)   camps.push('rtkw');
    if (payload.support_defend) camps.push('defend');
    for (let i = 0; i < camps.length; i++){
      try {
        await fetch(SB + '/rest/v1/pilot_contacts', {
          method: 'POST', headers: H, body: JSON.stringify({
            name: name, email: email, organization: org,
            source: 'support-register',
            message: JSON.stringify({
              kind: 'support-register', title: title, page_source: 'contributor',
              campaign: camps[i], consent_contact: true,
              consent_transfer: payload.consent_transfer, consent_named: true,
              ts: payload.ts
            })
          })
        });
        await fetch(SB + '/rest/v1/interaction_events', {
          method: 'POST', headers: H, body: JSON.stringify({
            source: 'support', type: 'endorse',
            payload: { campaign: camps[i], src: 'contributor', registered: true }
          })
        });
      } catch(e){ /* the confirmation is already stored; a counter must not undo it */ }
    }
  }

  return json({
    ok: true,
    test: isTest || undefined,
    first: person.first,
    guides: {
      employment:    '/' + FILES.employment,
      fairhousing:   '/' + FILES.fairhousing,
      international: '/' + FILES.international
    },
    training: '/training.html?access=reviewer&focus=1',
    results: resultsBlock()
  });
}
