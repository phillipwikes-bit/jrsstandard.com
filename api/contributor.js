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
//   4. Releases what was promised: the two initiative sign-ups, the Investigator
//      Investigator Guides, and the training.
//
// SUPERSEDED 2026-08-14: comparison-arm reviewers ARE now in this roster.
// They were excluded because a JRS-branded page naming the standard tells an
// unaided-arm reviewer that the standard exists. The owner directed on
// 2026-08-14 that every completer receives the same confirmation link, and all
// 20 comparison completers were added on that instruction.
//
// STUDY STATUS: the comparison study is OPEN and closes 2026-08-15. Anyone who
// has already completed their 24 records is done reviewing, so a link reaching a
// completer cannot change work they have already submitted.
//
// The original reasoning is kept rather than deleted: if a blind study is ever
// run again, this is the constraint that applies and the reason it applies.
//
// RESULTS SUMMARY REMOVED 2026-08-16 on the owner's instruction. This endpoint
// previously served a gated aggregate findings summary from the POST branch. It
// returns no study findings of any kind now. If a summary is ever restored it
// must go back on the same terms it came off: POST branch only, after all three
// forced choices validate, never in the page source and never on GET.
//
// Writes to the EXISTING private pilot_contacts table (RLS on, no anon read)
// via the service-role key, tagged source='contributor-confirm' so it never
// collides with training-enroll, guide-register, support-register, or pilot rows.
// Fields the table has no column for ride along as JSON in the message column,
// matching the /api/enroll and /api/access convention.

import { ROSTER } from './_contributor-roster.js';
import { participantLinkAccess } from './_participant-auth.js';

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// Fallback date. If a contributor does not respond by this date, the paper uses
// the name and title already on file for them (or anonymity where that is the
// election on file). Shown on the page so the rule is visible, not implied.
const FALLBACK_DATE = 'Saturday, 5 September 2026';

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
//
// V-AI-08 WAS ADDED HERE ON 2026-08-29 AND REMOVED THE SAME DAY. The addition
// recorded an anonymity election on file for her. She never made one. The
// 2026-08-16 credit removal was made at the owner's instruction, and every
// line of the roster entry says so; nothing in the record says she withdrew.
// Recording an election she did not make is the same class of error as
// ignoring one she did.
//
// Her accurate state is no election on file, which is named_on_file: null on
// her roster row. The page then tells her that silence means the aggregate
// without a name, which is true, commits her to nothing, and leaves the
// choice hers until she uses her link.
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

// purgeTestRows was removed on 2026-11-26 (blocker B-019). It ran on every
// participant confirmation and deleted rows by assumption (all link opens before
// a cutoff date, reviewer evaluations tagged 'owner' or 'test'). A read-only
// count that day found no row matching any of its rules, so nothing depended on
// it. The deploy check above never writes a row, so no cleanup is needed here;
// any future cleanup is an owner-run, row-by-row operation, never a side effect
// of a participant action. scripts/check_zero_drift.py guards against its return.

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
  const denied = await participantLinkAccess(req, 'contributor');
  if (denied) return denied;
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
    // Historical automatic test cleanup is not run on a participant read.
    // It deletes rows and requires separate, evidence-preserving review.
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

  if (!isTest) {
    // The confirmation record is the point of this endpoint. If it fails the
    // request fails, so nothing is released against a confirmation that was
    // not stored.
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
    training: '/training.html?access=reviewer&focus=1'
  });
}
