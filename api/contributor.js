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

// Roster. Keys are unguessable per person so one contributor's link never
// exposes another's details. Titles are the ones on file from registration and
// from the study record; they are shown back as editable defaults, not asserted.
//
// named_on_file:
//   true  = an election to be named is on file, so that is the fallback.
//   null  = NO election is on file. The fallback is anonymous, deliberately:
//           a name is never printed on silence alone.
// Two completers elected anonymity and the specific codes are not recorded in
// this repository. Add them to ANON_CODES below and their fallback becomes
// anonymous and the naming question is phrased as a chance to change it.
const ANON_CODES = [];

const ROSTER = {
  'upbtroc754': { code:'V-AI-01', kind:'panel',  first:'Jake',      name:'Jake McDonough',      title:'AI governance',                                         org:'SAEONYX Global Holdings', named_on_file:true },
  '08c17ihb60': { code:'V-AI-03', kind:'panel',  first:'Frank',     name:'Frank Schouten',      title:'AI Governance and Assurance',                           org:'AEGF',                    named_on_file:true },
  'im06wa5vd4': { code:'V-AI-06', kind:'panel',  first:'Nitin',     name:'Dr Nitin Deshpande',  title:'Chief Human Resources Officer',                         org:'',                        named_on_file:true },
  'u63k28aizs': { code:'V-AI-07', kind:'panel',  first:'Saurabh',   name:'Saurabh Nanda',       title:'General Manager, APAC',                                 org:'',                        named_on_file:true },
  'agbhlh6n4d': { code:'V-AI-08', kind:'panel',  first:'Gabriela',  name:'Gabriela Cortez',     title:'Civil rights records and bilingual intake',             org:'',                        named_on_file:true },
  's3ln3ud13s': { code:'V-AI-10', kind:'panel',  first:'Lawal',     name:'Lawal Olabanji',      title:'Operations and records management',                     org:'ALTV',                    named_on_file:true },
  'h5dypgmtdu': { code:'V-AI-11', kind:'panel',  first:'Andrey',    name:'Andrey Ekhmenin',     title:'Founder, EAS; governance diagnostics and post-execution review', org:'EAS',            named_on_file:true },
  'xoam4zq6yh': { code:'V-AI-12', kind:'author', first:'Kyle',      name:'Kyle McMullan',       title:'Chief Audit Executive',                                 org:'',                        named_on_file:true, note:'panel reviewer and co-author, Business Ethics paper' },
  'hpyvpad2sk': { code:'V-AI-16', kind:'panel',  first:'Gabriela',  name:'Dr Gabriela Bar',     title:'Attorney, PhD; AI ethics advisor',                      org:'',                        named_on_file:true },
  '2s7eencte4': { code:'V-AI-20', kind:'panel',  first:'Hekim',     name:'Hekim Colpan',        title:'AI Governance and Compliance Manager; ISO/IEC 42001 auditor', org:'',                  named_on_file:true },
  'h7a376209q': { code:'V-AI-23', kind:'panel',  first:'Niloofar',  name:'Niloofar Kandi',      title:'',                                                      org:'',                        named_on_file:null },
  'vxieh79z7v': { code:'V-AI-24', kind:'panel',  first:'SungSoo',   name:'SungSoo In',          title:'AI Governance and Responsible AI',                      org:'',                        named_on_file:true },
  'jusnt4chyx': { code:'V-AI-27', kind:'panel',  first:'Sidharth',  name:'Sidharth Borah',      title:'Advocate, High Court of Delhi; Partner, Gurinder and Partners', org:'',                named_on_file:true },
  'si81km0m1r': { code:'V-AI-28', kind:'panel',  first:'Nigel',     name:'Nigel Hee',           title:'AI Ethics, Safety and Governance',                      org:'University of Glasgow',   named_on_file:true },
  's3ud3trom6': { code:'V-AI-29', kind:'panel',  first:'Marguerite', name:'Marguerite Maroudis, PhD', title:'AI and law; data protection officer and AI governance consultant', org:'TechLegalExperts', named_on_file:true },
  '42zgubzfq8': { code:'V-AI-30', kind:'panel',  first:'Andres',    name:'Andres Lage Freire',  title:'AI Governance Lead and Responsible AI Architect',       org:'',                        named_on_file:true },

  '6dyc0l2757': { code:'M-01',    kind:'author', first:'Ubayet',    name:'Ubayet Hossain, FRM', title:'Associate Director, Model Validation',                  org:'KPMG India',              named_on_file:true, note:'methodology co-author' },
  '1wlgcn02gn': { code:'E-08',    kind:'author', first:'Stacyann', name:'Stacyann Young',      title:'Public records and FOIL practice',                      org:'',                        named_on_file:true, note:'co-author and facilitator, public records pilot' },
  'zobi7fgt8q': { code:'V-HR-01', kind:'facil',  first:'Tanvi',     name:'Tanvi Pokhriyal',     title:'HR and employment compliance',                          org:'',                        named_on_file:true, note:'facilitator, HR and employment pilot' },
  'qtgiiqlcqk': { code:'V-HC-01', kind:'facil',  first:'Keith',     name:'Keith Carrington, EJD, MBA', title:'Healthcare compliance',                          org:'',                        named_on_file:true, note:'facilitator, healthcare compliance pilot' }
};

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

  if (!name)  return json({ error:'name_required' }, 400);
  if (!title) return json({ error:'title_required' }, 400);
  if (!org)   return json({ error:'organization_required' }, 400);
  if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) return json({ error:'valid_email_required' }, 400);

  // Forced choices. Each must be an explicit yes or no; an unanswered question
  // is rejected rather than defaulted, so a permission can never be inferred.
  function choice(v){ v = String(v || '').toLowerCase(); return (v === 'yes' || v === 'no') ? v : ''; }
  const cName     = choice(b.consent_named);
  const cUse      = choice(b.consent_use);
  const cTransfer = choice(b.consent_transfer);
  if (!cName)     return json({ error:'naming_choice_required' }, 400);
  if (!cUse)      return json({ error:'use_choice_required' }, 400);
  if (!cTransfer) return json({ error:'transfer_choice_required' }, 400);

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
