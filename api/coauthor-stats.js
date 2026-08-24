export const config = { runtime: 'edge' };

// Aggregate stats for the co-author confirmation tile on the private status
// dashboard, token-free. Reads coauthor-confirm rows from pilot_contacts using
// the server-side service-role key.
//
// NO PERSONAL DATA LEAVES THIS ENDPOINT. Name, email, organisation and the free
// text note are read into the function to compute counts and then discarded.
// Same posture as /api/contributor-stats and /api/enroll-stats.
//
// The per-code answers ARE returned, deliberately. A study code identifies
// nobody outside the private roster in /api/coauthor, and the three answers are
// the entire operational point: they tell the owner which co-author has agreed
// to what before anything is submitted or licensed. Counts alone would make the
// endpoint useless for the job it exists to do.
//
// GET only.

import { ROSTER, TERMS_VERSION } from './_coauthor-roster.js';

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    }
  });
}

export default async function handler(req){
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ error: 'not_configured' }, 503);

  const H = {
    'apikey': SERVICE,
    'Authorization': 'Bearer ' + SERVICE,
    'Content-Type': 'application/json'
  };

  // The roster is the denominator, imported rather than restated, so removing or
  // adding a co-author cannot leave a hand-written total behind.
  const expected = Object.keys(ROSTER).map(function(k){ return ROSTER[k].code; }).sort();

  let rows = [];
  try {
    const url = SB + '/rest/v1/pilot_contacts?select=created_at,organization,message'
      + '&source=eq.coauthor-confirm&limit=2000';
    const res = await fetch(url, { headers: H });
    if (!res.ok){
      const t = await res.text();
      return json({ error: 'db_read_failed', status: res.status,
                    detail: String(t).slice(0, 300) }, 502);
    }
    rows = await res.json();
  } catch (e) {
    return json({ error: 'db_unreachable' }, 502);
  }
  if (!Array.isArray(rows)) rows = [];

  // A co-author may reopen their link and change an answer. The latest row per
  // code is the one that counts, so a person who confirms twice is counted once
  // and their newest answer wins.
  const latest = {};
  for (let i = 0; i < rows.length; i++){
    const r = rows[i] || {};
    let p = {};
    try { p = JSON.parse(r.message || '{}') || {}; } catch (e) { p = {}; }
    const code = String(p.code || '');
    if (!code || code === 'TEST-00') continue;
    const t = r.created_at ? Date.parse(r.created_at) : 0;
    const prev = latest[code];
    if (!prev || t >= prev.t) latest[code] = { t: t, p: p, at: r.created_at || null };
  }

  const answered = [];
  let printYes = 0, useYes = 0, keepYes = 0;

  for (let i = 0; i < expected.length; i++){
    const code = expected[i];
    const e = latest[code];
    if (!e) continue;
    const p = e.p;
    if (p.consent_print === true) printYes++;
    if (p.consent_use === true)   useYes++;
    if (p.consent_keep === true)  keepYes++;
    answered.push({
      code: code,
      role: String(p.role || ''),
      paper: String(p.paper || ''),
      consent_print: p.consent_print === true,
      consent_use: p.consent_use === true,
      consent_keep: p.consent_keep === true,
      has_note: !!(p.note && String(p.note).length),
      terms_version: String(p.terms_version || ''),
      confirmed_at: e.at
    });
  }

  const outstanding = expected.filter(function(c){ return !latest[c]; });

  return json({
    generated_at: new Date().toISOString(),
    terms_version_current: TERMS_VERSION,
    expected: expected.length,
    confirmed: answered.length,
    outstanding: outstanding,
    consent_print_yes: printYes,
    consent_use_yes: useYes,
    consent_keep_yes: keepYes,
    answers: answered,
    note: 'Aggregate and per-code answers only. No name, email, organisation or '
        + 'free-text note is exposed by this endpoint. A code identifies nobody '
        + 'outside the private co-author roster.'
  });
}
