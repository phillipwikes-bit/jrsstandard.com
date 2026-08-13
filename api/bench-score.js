export const config = { runtime: 'edge' };

// BENCHMARK CALIBRATION SCORING. Offer 3.
//
// A licensed user POSTs their determinations for the record set. This scores
// them against the held-out key and returns ONLY an aggregate calibration
// report plus a comparison against the human rater distribution.
//
// WHAT IT NEVER RETURNS, under any input:
//   - the key itself, whole or per record
//   - which specific records were right or wrong
//   - the five-condition scoring logic
//   - any per-record label
// Per-record feedback is exactly how a licensee reconstructs the key across a
// few runs, so the response is aggregate-only by construction rather than by
// filtering at the end. There is no code path here that puts a per-record
// verdict into the response body.
//
// WHERE THE KEY LIVES, and why this returns 503 today.
//
// The detection-set key is NOT in this repository and NOT in any table this
// endpoint can read. It is held in research/, which is deliberately excluded
// from the deploy, and its integrity is the entire reason Offer 3 can be
// licensed more than once.
//
// It is provisioned by setting BENCH_KEY_JSON in the server environment, as a
// JSON object of { record_id: determination }. Until that exists this endpoint
// returns 503 key_not_provisioned. It does NOT fall back to bench_gold, which
// holds three synthetic placeholder rows and is anon-readable, and it does not
// fall back to bench_outcomes, which is the Rung 3 real-case outcome table and
// is a different thing entirely. Scoring a licensee against either would
// produce a confident, meaningless number. An endpoint that cannot score must
// say so rather than score against whatever data it can reach.
//
// TOKEN-GATED because a licensee paid for a run and the run is the product.
// BENCH_SCORE_TOKENS is a comma-separated list of issued tokens.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function json(o, s) {
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    }
  });
}

function norm(v) {
  return String(v == null ? '' : v).trim().toLowerCase().replace(/[\s-]+/g, '_');
}

// Agreement, chance-corrected. Gwet's AC1 on two raters over k categories, the
// same coefficient the reliability study reports, so a licensee's figure and
// the published one are the same statistic rather than two different ones.
function ac1(agree, n, cats, pA, pB) {
  if (!n) return null;
  const po = agree / n;
  let pe = 0;
  const k = cats.length;
  if (k < 2) return null;
  for (let i = 0; i < k; i++) {
    const pi = ((pA[cats[i]] || 0) / n + (pB[cats[i]] || 0) / n) / 2;
    pe += pi * (1 - pi);
  }
  pe = pe / (k - 1);
  if (pe >= 1) return null;
  return Math.round(((po - pe) / (1 - pe)) * 1000) / 1000;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const env = (typeof process !== 'undefined' && process.env) || {};

  // Licence check.
  const tokens = String(env.BENCH_SCORE_TOKENS || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
  const auth = String(req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!tokens.length) return json({ error: 'licensing_not_provisioned' }, 503);
  if (!auth || tokens.indexOf(auth) === -1) return json({ error: 'unauthorized' }, 401);

  // Key check. No fallback, deliberately.
  let KEY = null;
  try {
    KEY = JSON.parse(env.BENCH_KEY_JSON || 'null');
  } catch (e) { KEY = null; }
  if (!KEY || typeof KEY !== 'object' || !Object.keys(KEY).length) {
    return json({
      error: 'key_not_provisioned',
      detail: 'The held-out key is not present in this environment. Scoring is refused rather '
            + 'than performed against substitute data. No partial result is returned.'
    }, 503);
  }

  let body;
  try { body = await req.json(); } catch (e) { return json({ error: 'bad_json' }, 400); }

  const subs = (body && body.submissions);
  if (!Array.isArray(subs) || !subs.length) {
    return json({ error: 'submissions_required',
      detail: 'Expected { submissions: [ { record_id, determination } ] }.' }, 400);
  }
  if (subs.length > 500) return json({ error: 'too_many_submissions' }, 413);

  // Score. Nothing per-record leaves this block.
  const keyIds = Object.keys(KEY);
  let matched = 0, agreed = 0, unknown = 0;
  const theirs = {}, mine = {};
  for (let i = 0; i < subs.length; i++) {
    const s = subs[i] || {};
    const id = String(s.record_id || '');
    const det = norm(s.determination);
    if (!Object.prototype.hasOwnProperty.call(KEY, id)) { unknown++; continue; }
    const gold = norm(KEY[id]);
    matched++;
    theirs[det] = (theirs[det] || 0) + 1;
    mine[gold] = (mine[gold] || 0) + 1;
    if (det === gold) agreed++;
  }

  if (!matched) {
    return json({ error: 'no_recognised_records',
      detail: 'None of the submitted record_ids belong to the licensed set.' }, 400);
  }

  const cats = Object.keys(mine).concat(Object.keys(theirs)).filter(function (v, i, a) { return a.indexOf(v) === i; });
  const pct = Math.round((agreed / matched) * 1000) / 10;

  // Human rater comparison, read from the published aggregate rather than
  // restated here, so this endpoint cannot drift from the panel figures.
  let human = null;
  try {
    const r = await fetch('https://jrsstandard.com/api/panel-stats');
    if (r.ok) {
      const p = await r.json();
      human = {
        expert_reviewers: p.detection_completers,
        expert_countries: p.detection_countries,
        note: 'Detection panel figures read live from /api/panel-stats at scoring time, '
            + 'not restated in this endpoint.'
      };
    }
  } catch (e) { human = null; }

  return json({
    generated_at: new Date().toISOString(),
    calibration: {
      records_scored: matched,
      records_not_in_set: unknown,
      agreement_with_key_pct: pct,
      ac1_vs_key: ac1(agreed, matched, cats, theirs, mine),
      your_distribution: theirs
    },
    human_rater_comparison: human,
    disclosure: 'Aggregate only. Per-record results, the key, and the five-condition scoring '
              + 'logic are never returned, because per-record feedback across repeated runs '
              + 'would reconstruct the key and end the benchmark for everyone using it.',
    limits: 'This measures agreement with a credentialed human panel on CONSTRUCTED records. '
          + 'It is not evidence of real-world outcomes, and it is not a certification. JRS is '
          + 'under operational validation.'
  });
}
