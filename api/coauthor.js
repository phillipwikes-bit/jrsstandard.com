// Co-author confirmation endpoint. Vercel Edge Function.
//
// GET  /api/coauthor?k=<key>   resolves the key to the person and returns the
//                              values on file, so the page shows editable
//                              defaults rather than empty boxes.
// POST /api/coauthor           stores the confirmation.
//
// WHY THIS EXISTS, SEPARATELY FROM /api/contributor.
// research/CONSENT_AND_RELEASE_AUDIT_2026-08-13.md records two gaps this closes.
// Gap 2: consent is not assignment, and co-authored papers carry shared rights
// that a tick against publication wording does not transfer. Gap 1: no stored
// copy of the terms as they read on the day a person agreed, so the wording
// cannot be proved later. Every row written here carries TERMS_VERSION.
//
// NO TOKEN. Secured by the opaque per-person key, matching the contributor and
// honor surfaces. One person's link never exposes another's details.
//
// The three permissions are stored as three explicit values and never inferred
// from silence. A missing answer is rejected rather than defaulted, because a
// permission read out of an absent field is exactly the thing that is worthless
// when it matters.

import { ROSTER, TERMS_VERSION } from './_coauthor-roster.js';

export const config = { runtime: 'edge' };

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';
const TEST_KEY = 'selftest00';
const TEST_PERSON = {
  code: 'TEST-00', first: 'Test', name: 'Test Person',
  title: 'Test title', org: 'Test org', paper: 'the test study',
  role: 'co-author', org_note: ''
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// Three-state answer. Anything that is not an exact 'yes' or 'no' is null, and
// null is rejected upstream. Silence is never read as consent.
function choice(v) {
  var s = String(v == null ? '' : v).trim().toLowerCase();
  return (s === 'yes' || s === 'no') ? s : null;
}

function clean(v, max) {
  return String(v == null ? '' : v)
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max);
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const H = SERVICE ? {
    'apikey': SERVICE,
    'Authorization': 'Bearer ' + SERVICE,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  } : null;

  // ---- GET: resolve the key ------------------------------------------------
  if (req.method === 'GET') {
    const k = clean(new URL(req.url).searchParams.get('k'), 32).toLowerCase();
    const p = (k === TEST_KEY) ? TEST_PERSON : ROSTER[k];
    if (!p) return json({ ok: false, found: false }, 404);
    return json({
      ok: true, found: true,
      code: p.code, first: p.first, paper: p.paper, role: p.role,
      name_on_file: p.name, title_on_file: p.title, org_on_file: p.org,
      org_note: p.org_note || '',
      terms_version: TERMS_VERSION
    });
  }

  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let b = {};
  try { b = await req.json(); } catch (e) { return json({ error: 'bad_json' }, 400); }

  const k = clean(b.k, 32).toLowerCase();
  const isTest = (k === TEST_KEY);
  const person = isTest ? TEST_PERSON : ROSTER[k];
  if (!person) return json({ ok: false, found: false }, 404);

  const name  = clean(b.name, 120) || person.name;
  const title = clean(b.title, 160);
  const org   = clean(b.org, 160);
  const email = clean(b.email, 160);
  const note  = clean(b.note, 1200);

  // Three explicit permissions. Each must be an exact yes or no.
  const cPrint = choice(b.consent_print);
  const cUse   = choice(b.consent_use);
  const cKeep  = choice(b.consent_keep);

  if (cPrint === null || cUse === null || cKeep === null) {
    return json({ error: 'answer_required',
                  detail: 'All three answers are required. Nothing is assumed.' }, 400);
  }

  const payload = {
    kind: 'coauthor-confirm',
    terms_version: TERMS_VERSION,
    code: person.code,
    role: person.role,
    paper: person.paper,
    display_name: name,
    display_title: title,
    display_org: org,
    consent_print: (cPrint === 'yes'),
    consent_use: (cUse === 'yes'),
    consent_keep: (cKeep === 'yes'),
    note: note,
    name_on_file: person.name,
    title_on_file: person.title,
    org_on_file: person.org,
    country: String(req.headers.get('x-vercel-ip-country') || '')
      .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
    ts: new Date().toISOString()
  };

  if (isTest) return json({ ok: true, test: true, stored: false, payload: payload });

  if (!H) return json({ error: 'not_configured' }, 503);

  // The confirmation record IS the point of this endpoint. If the write fails
  // the request fails, so nothing is ever reported as confirmed when no row
  // exists to prove it.
  const res = await fetch(SB + '/rest/v1/pilot_contacts', {
    method: 'POST', headers: H,
    body: JSON.stringify({
      name: name, email: email, organization: org,
      message: JSON.stringify(payload),
      source: 'coauthor-confirm'
    })
  }).catch(function () { return null; });

  if (!res || !res.ok) {
    const detail = res ? await res.text().catch(function () { return ''; }) : 'network';
    return json({ error: 'db_insert_failed',
                  status: res ? res.status : 0,
                  detail: String(detail).slice(0, 300) }, 502);
  }

  return json({ ok: true, stored: true, terms_version: TERMS_VERSION });
}
