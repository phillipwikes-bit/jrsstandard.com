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
//   3. The INCENTIVE CONTACT, only if the reviewer asks for a peer-reviewer
//      recommendation, goes to pilot_contacts as source='reviewer-eval-incentive'.
//      It carries name, work email, LinkedIn URL and the consent flags. It does
//      NOT carry the answers, and it carries NO completion code, NO row id and no
//      other value present on the evaluation row. There is deliberately no
//      foreign key, join key or shared identifier of any kind between the two:
//      the only thing they have in common is a coarse timestamp, and that is the
//      whole point.
//
//      This exists because an evaluation submitted without the certificate box
//      produced a research data point and no transferable contact at all. The
//      recommendation is the exchange, and it is offered for the contribution
//      itself rather than as an endorsement of professional competence that has
//      not been observed.
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

// LinkedIn URL. Accepted only if it is a LinkedIn host, so the field cannot be
// used to store an arbitrary link or a javascript: payload that a later
// dashboard might render. A bare handle or a linkedin.com/in/ path is
// normalised; anything else is dropped rather than stored.
function linkedIn(v){
  let s = clean(v, 300).replace(/\s+/g, '');
  if (!s) return '';
  s = s.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  if (/^[a-zA-Z0-9._-]{3,100}$/.test(s)) return 'https://www.linkedin.com/in/' + s;
  if (!/^([a-z]{2,3}\.)?linkedin\.com\//i.test(s)) return '';
  if (/[<>"'\\]/.test(s)) return '';
  // Only prepend www when there is no regional subdomain already: uk.linkedin.com
  // must not become www.uk.linkedin.com, which is not a host that resolves.
  return 'https://' + (/^linkedin\.com\//i.test(s) ? 'www.' : '') + s;
}

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
  const url = new URL(req.url);

  // GET serves the instrument, so the page renders from one definition rather
  // than duplicating the question set in markup.
  //
  // It also logs the open. Without this, "how many people clicked the
  // evaluation" was unanswerable: the first event the system could see was a
  // completed submission, so a page nobody finished and a page nobody opened
  // looked identical. The event carries no answer and no identity, only the
  // source tag, country and device, and it is guarded against deploy checks.
  if (req.method === 'GET') {
    const gsrc = String(url.searchParams.get('src') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const gCheck = gsrc === 'owner' || url.searchParams.get('owner') === '1'
                || gsrc === 'verify' || gsrc === 'test' || gsrc === 'selftest'
                || gsrc.indexOf('deploytest') === 0;
    if (SERVICE && !gCheck) {
      try {
        const ua = String(req.headers.get('user-agent') || '').slice(0, 300);
        await fetch(SB + '/rest/v1/interaction_events', {
          method: 'POST',
          headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
                     'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ source: 'eval-view', type: 'view', payload: {
            src: gsrc,
            country: String(req.headers.get('x-vercel-ip-country') || '')
              .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
            user_agent: ua,
            is_mobile: /Mobi|Android|iPhone|iPad|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(ua)
          }})
        });
      } catch (e) { /* a view ping must never block the instrument loading */ }
    }
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

  // A smoke test of this endpoint would otherwise write a fabricated row into the
  // research baseline, which is the one table in the programme that must contain
  // only real answers. src=selftest, test, verify, owner or deploytest* validates
  // the whole path and writes nothing.
  const srcTag = clean(b.src, 40).toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const isCheck = srcTag === 'owner' || srcTag === 'verify' || srcTag === 'test'
               || srcTag === 'selftest' || srcTag.indexOf('deploytest') === 0;

  if (answered === 0) return json({ error: 'no_answers' }, 400);
  if (b.consent_research !== true) return json({ error: 'consent_required' }, 400);

  // Contact validation runs BEFORE the test-mode branch. Otherwise a malformed
  // name or email returns 200 whenever a test tag is present, which means the
  // validation cannot be verified by the audit that is supposed to verify it.
  // THE CERTIFICATE OFFER IS WITHDRAWN FROM THIS ENDPOINT, 2026-08-18, on the
  // owner's instruction: a certificate is issued for completing the training,
  // and submitting this evaluation is not that.
  //
  // The evaluation is reachable without touching the training at all. It sits
  // at the end of a public funnel that starts at /api/support?c=rtkw and
  // /api/support?c=defend, goes through access.html and lands here, so anyone
  // following an initiative link from LinkedIn could obtain a certificate
  // without opening a single module. One person did, which is how this was
  // found.
  //
  // HARD REFUSAL, NOT A FLAG. wantsCert is pinned false regardless of what the
  // request body says, so a stale cached page, a replayed request or a hand-
  // rolled POST cannot issue a code either. The certificate fields are no
  // longer read at all, so no name or email arrives here through this path.
  //
  // Codes ALREADY ISSUED stay valid: /api/reviewer-cert renders from the code
  // and is untouched. Withdrawing the offer does not retract what was given.
  //
  // If a training-gated certificate is wanted, it belongs to the training flow,
  // which is the only surface that can observe a training completion. It does
  // not belong here.
  const wantsCert = false;

  const wantsRec = b.want_recommendation === true;
  const recName  = clean(b.rec_name, 200);
  const recEmail = clean(b.rec_email, 200);
  const recLi    = linkedIn(b.linkedin_url);
  if (wantsRec) {
    if (!recName) return json({ error: 'rec_name_required' }, 400);
    if (!recEmail || recEmail.indexOf('@') < 1 || recEmail.indexOf('.') < 0) {
      return json({ error: 'rec_valid_email_required' }, 400);
    }
  }

  // ROW 1: the anonymous research record. No identity of any kind.
  if (isCheck) {
    return json({ ok: true, recorded: false, check: true, answered: answered,
                  total: Object.keys(QUESTIONS).length,
                  certificate: false,
                  certificate_withdrawn: 'issued for training completion only, 2026-08-18',
                  incentive: wantsRec,
                  incentive_linkedin_normalised: recLi,
                  code: '' });
  }
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
  //
  // DEAD BY CONSTRUCTION since 2026-08-18: wantsCert is pinned false above, so
  // this block never runs and no reviewer-cert row is written from here any
  // more. It is left standing rather than deleted because it is the exact
  // shape a training-gated certificate would need, and rewriting it from
  // scratch later is how the consent handling in it would get lost.
  let code = '';
  if (wantsCert) {
    const name  = certName;
    const email = certEmail;
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

  // ROW 3: the incentive contact. Written only when the reviewer asks for a peer
  // reviewer recommendation. Carries identity and consent and nothing else.
  //
  // ISOLATION IS ENFORCED BY WHAT THIS OBJECT DOES NOT CONTAIN. There is no
  // completion code, no evaluation id, no answer, no answered_count, no sector,
  // no org size and no role. Nothing written here appears on the evaluation row,
  // so the two cannot be joined by any value, only by a coarse timestamp, and a
  // timestamp shared by every submission in the same minute is not an identifier.
  let incentive = false;
  if (wantsRec) {
    const iName  = recName;
    const iEmail = recEmail;
    const iLi    = recLi;
    const iPayload = {
      kind: 'reviewer-eval-incentive',
      request: 'linkedin-peer-reviewer-recommendation',
      printed_name: iName,
      linkedin_url: iLi,
      country: country,
      consent_contact: true,
      consent_research_followup: true,
      consent_transfer: true,
      ts: new Date().toISOString()
    };
    const iRes = await fetch(SB + '/rest/v1/pilot_contacts', {
      method: 'POST',
      headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ name: iName, email: iEmail, organization: '',
                             message: JSON.stringify(iPayload),
                             source: 'reviewer-eval-incentive' })
    });
    if (!iRes.ok) {
      const t = await iRes.text();
      return json({ error: 'incentive_insert_failed', recorded: true,
                    status: iRes.status, detail: String(t).slice(0, 300) }, 502);
    }
    incentive = true;
  }

  return json({ ok: true, recorded: true, answered: answered,
                total: Object.keys(QUESTIONS).length,
                certificate: false,
                certificate_withdrawn: 'issued for training completion only, 2026-08-18',
                code: '', incentive: incentive });
}
