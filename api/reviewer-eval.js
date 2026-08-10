export const config = { runtime: 'edge' };

// Reviewer evaluation: anonymized baseline metrics.
//
// WHY IT EXISTS. The programme can say how well the five conditions are applied
// by reviewers under study conditions. It cannot yet say what record review looks
// like in the organizations those reviewers come from: how many people read a
// record before it is final, whether a second reader exists at all, how often a
// record goes back to its drafter, and whether AI-assisted drafting has arrived.
// That baseline is the field-evidence gap in the asset, and no amount of further
// accuracy testing fills it.
//
// WHAT IS STORED, AND WHAT IS NOT. Two separate rows, on purpose:
//
//   1. The EVALUATION goes to interaction_events as source='reviewer-eval',
//      type='evaluation'. It carries only the answers, the sector, the country
//      code and a coarse organization size. No name, no email, no employer, no
//      free-text that could identify a workplace. That row is the research
//      record and it is anonymous by construction, which is what lets the
//      question set ask about weaknesses in a reader's own organization and get
//      an honest answer.
//
//   2. The IDENTITY, only if the reviewer wants a certificate, goes to the
//      private pilot_contacts table as source='reviewer-cert'. It carries name,
//      email and the printed title, and it carries a completion code. It does
//      NOT carry the answers.
//
// The two rows share nothing that links them beyond a coarse timestamp. A person
// who wants a certificate is therefore not trading their candour for it, and the
// aggregate baseline cannot be turned back into "this named person said their
// employer has no second reader".
//
// Aggregates are exposed by /api/asset-stats. Individual rows are never public.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// The question set. Held here rather than in the page so the page cannot be
// edited to submit a different instrument, and so one file is the record of what
// was asked. Keys are stable: renaming one breaks comparability with rows
// already collected.
const QUESTIONS = {
  q_readers:    ['One, the author only', 'Two', 'Three or more', 'It varies', 'Not sure'],
  q_second:     ['Always', 'For high-risk matters only', 'Rarely', 'Never', 'Not sure'],
  q_returned:   ['Often', 'Sometimes', 'Rarely', 'Never', 'Not sure'],
  q_basis:      ['Always recorded', 'Usually recorded', 'Sometimes recorded', 'Rarely recorded', 'Not sure'],
  q_ai:         ['Yes, routinely', 'Yes, occasionally', 'No', 'Not permitted', 'Not sure'],
  q_ai_policy:  ['Written policy in force', 'Policy in draft', 'No policy', 'Not sure'],
  q_reconstruct:['Confident', 'Somewhat confident', 'Not confident', 'Not sure'],
  q_audited:    ['Yes, within the last year', 'Yes, more than a year ago', 'No', 'Not sure'],
  q_useful:     ['1', '2', '3', '4', '5']
};

const SECTORS = ['Government or public agency','Healthcare','Financial services','Higher education',
                 'Technology','Manufacturing or industrial','Professional services or consulting',
                 'Legal','Nonprofit or NGO','Other','Prefer not to say'];

const SIZES = ['Under 50','50 to 249','250 to 999','1,000 to 9,999','10,000 or more','Prefer not to say'];

const ROLES = ['Compliance','HR or employee relations','Legal','Audit','AI governance',
               'Investigations','Records or information governance','Other','Prefer not to say'];

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
function clean(v, n){ return (v == null ? '' : String(v)).trim().slice(0, n || 200); }
function oneOf(v, list){ const s = clean(v, 80); return list.indexOf(s) >= 0 ? s : ''; }

// Completion code. Derived from the submission time and a short random tail so
// two reviewers finishing in the same second do not collide. It is printed on the
// certificate and is the only handle a holder needs to quote.
function completionCode(){
  const n = Date.now().toString(36).toUpperCase().slice(-5);
  let tail = '';
  const AL = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const buf = new Uint8Array(3);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 3; i++) tail += AL[buf[i] % AL.length];
  return 'JRS-R-' + n + tail;
}

export default async function handler(req){
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }});
  }

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';

  // GET serves the instrument, so the page renders from one definition rather
  // than duplicating the question set in markup.
  if (req.method === 'GET') {
    return json({ ok: true, questions: QUESTIONS, sectors: SECTORS, sizes: SIZES, roles: ROLES });
  }

  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!SERVICE) return json({ error: 'service_key_missing' }, 503);

  let b; try { b = await req.json(); } catch(e){ return json({ error: 'invalid_json' }, 400); }

  const H = { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
              'Content-Type': 'application/json', 'Prefer': 'return=minimal' };

  const country = String(req.headers.get('x-vercel-ip-country') || '')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '';

  // Answers, each validated against its own option list. An answer that is not on
  // the list is dropped rather than stored, so a hand-crafted POST cannot inject
  // free text into the research record.
  const answers = {};
  let answered = 0;
  Object.keys(QUESTIONS).forEach(function(k){
    const v = oneOf((b.answers || {})[k], QUESTIONS[k]);
    answers[k] = v;
    if (v) answered++;
  });

  const sector = oneOf(b.sector, SECTORS);
  const size   = oneOf(b.org_size, SIZES);
  const role   = oneOf(b.role, ROLES);

  if (answered === 0) return json({ error: 'no_answers' }, 400);
  if (b.consent_research !== true) return json({ error: 'consent_required' }, 400);

  // ROW 1: the anonymous research record. No identity of any kind.
  try {
    await fetch(SB + '/rest/v1/interaction_events', {
      method: 'POST', headers: H,
      body: JSON.stringify({ source: 'reviewer-eval', type: 'evaluation', payload: {
        answers: answers,
        answered_count: answered,
        total_questions: Object.keys(QUESTIONS).length,
        sector: sector,
        org_size: size,
        role: role,
        modules_completed: Math.max(0, Math.min(6, parseInt(b.modules_completed, 10) || 0)),
        country: country,
        src: clean(b.src, 40).toLowerCase().replace(/[^a-z0-9_-]/g, '')
      }})
    });
  } catch (e) {
    return json({ error: 'record_failed' }, 502);
  }

  // ROW 2: identity, only if a certificate was asked for, and never with the
  // answers attached.
  let code = '';
  const wantsCert = b.want_certificate === true;
  if (wantsCert) {
    const name  = clean(b.name, 200);
    const email = clean(b.email, 200);
    if (!name) return json({ error: 'name_required', recorded: true }, 400);
    if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) {
      return json({ error: 'valid_email_required', recorded: true }, 400);
    }
    if (b.consent_contact !== true) return json({ error: 'consent_contact_required', recorded: true }, 400);

    code = completionCode();
    const payload = {
      kind: 'reviewer-cert',
      completion_code: code,
      printed_name: name,
      printed_title: clean(b.title, 300),
      country: country,
      modules_completed: Math.max(0, Math.min(6, parseInt(b.modules_completed, 10) || 0)),
      consent_contact: true,
      consent_transfer: true,
      consent_public_list: b.consent_public_list === true,
      ts: new Date().toISOString()
    };
    const res = await fetch(SB + '/rest/v1/pilot_contacts', {
      method: 'POST',
      headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ name: name, email: email,
                             organization: clean(b.organization, 200),
                             message: JSON.stringify(payload), source: 'reviewer-cert' })
    });
    if (!res.ok) {
      const t = await res.text();
      return json({ error: 'cert_insert_failed', recorded: true,
                    status: res.status, detail: String(t).slice(0, 300) }, 502);
    }
  }

  return json({ ok: true, recorded: true, answered: answered,
                total: Object.keys(QUESTIONS).length,
                certificate: wantsCert, code: code });
}
