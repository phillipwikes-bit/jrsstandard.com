// JRS ENGINE ACTIVITY — SERVER-MEDIATED PUBLIC READ
//
// BOARD DECISION BD-02 (B-013A), 2026-09-16. THIS IS THE REPLACEMENT READ PATH.
//
// WHY THIS EXISTS. engine_reviews currently grants anonymous SELECT, and
// engine-activity.html read it directly from the browser with the publishable
// key. That key ships in 22 pages, so the table was readable by anyone, and the
// row carries a per-condition note the prompt requires to be "grounded in the
// record text" plus finding.compliant_version, a model rewrite of the
// customer's passage up to 600 characters.
//
// THE SHIP-TOGETHER RULE (second-order question S-2). Revoking the grant
// without this endpoint leaves engine-activity.html visibly broken. The Board
// decided the revocation and this endpoint ship together. This file is the half
// that can be built without production authority; the grant change cannot.
//
// WHAT IT DELIBERATELY DOES NOT RETURN. Not `finding`, not `conditions[].note`,
// not compliant_version, not condition_triggered, not any free text. A public
// activity log needs to show THAT reviews happen and HOW THEY CAME OUT. It does
// not need the model's prose about someone's record, and the minimum necessary
// data is the whole point of the decision.
//
// It returns per-condition STATUS only (pass/review/gap), the determination,
// the run count, the consistency figure, the engine version and a timestamp
// truncated to the hour. The hour truncation is deliberate: an exact timestamp
// on a low-volume endpoint is a correlation handle back to a specific submission.
//
// This reads with the SERVICE ROLE key server-side, so it keeps working after
// the anonymous SELECT policy is revoked. That is the point.

export const config = { runtime: 'edge' };

const CONDITION_KEYS = [
  'basis_identification',
  'reasoning_traceability',
  'cold_reviewer_clarity',
  'accountability_support',
  'temporal_reconstructability',
];

const STATUSES = ['pass', 'review', 'gap'];

function json(body, status, cors) {
  const headers = {
    'Content-Type': 'application/json',
    // No caching: a shared cache holding this payload is a disclosure waiting
    // for a different reader, which is the same reasoning the owner surfaces use.
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer',
  };
  if (cors) headers['Access-Control-Allow-Origin'] = cors;
  return new Response(JSON.stringify(body), { status: status || 200, headers });
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return json({ ok: true }, 200, '*');
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const E = (typeof process !== 'undefined' && process.env) || {};
  const URLBASE = E.SUPABASE_URL || 'https://pjzxkeviouofdseagvpf.supabase.co';
  const SERVICE = E.SUPABASE_SERVICE_ROLE_KEY || '';

  // Fail closed and say nothing about configuration to a public caller.
  if (!SERVICE) return json({ error: 'unavailable' }, 503);

  // SELECT LIST IS THE CONTROL. Adding a column here is the way this endpoint
  // would leak, so the list is explicit and the free-text columns are absent.
  const select = 'created_at,determination,conditions,runs,overall_consistency,engine_version';
  let rows = [];
  try {
    const res = await fetch(
      URLBASE + '/rest/v1/engine_reviews?select=' + select + '&order=created_at.desc&limit=100',
      { headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE } });
    if (!res.ok) return json({ error: 'unavailable' }, 503);
    rows = await res.json();
  } catch (e) {
    return json({ error: 'unavailable' }, 503);
  }

  // PROJECTION. Statuses survive; every free-text field is dropped here rather
  // than relied upon to be absent from the select above. Two independent
  // controls, because one of them is a string that someone could edit.
  const out = (Array.isArray(rows) ? rows : []).map(function (r) {
    const conditions = {};
    const src = (r && r.conditions) || {};
    for (const k of CONDITION_KEYS) {
      const st = src[k] && src[k].status;
      conditions[k] = STATUSES.indexOf(st) === -1 ? null : st;
    }
    let hour = null;
    if (r && r.created_at) hour = String(r.created_at).slice(0, 13) + ':00Z';
    return {
      hour: hour,
      determination: (r && r.determination) || null,
      conditions: conditions,
      runs: (r && r.runs) || null,
      overall_consistency: (r && r.overall_consistency) != null ? r.overall_consistency : null,
      engine_version: (r && r.engine_version) || null,
    };
  });

  return json({
    reviews: out,
    count: out.length,
    disclosure: 'Per-condition statuses and routing only. No record text and no '
      + 'model-written text about a record is returned by this endpoint.',
  }, 200);
}
