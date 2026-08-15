export const config = { runtime: 'edge' };

// TEMPORARY AGGREGATE SCORER. Created 2026-08-15. Delete after the figures are
// read. Opaque, unlinked, noindex slug; no token, matching the owner-surface
// rule in CLAUDE.md.
//
// EMITS: counts and group statistics only.
//   participants_analysed, judgments_analysed, and for accuracy / sensitivity /
//   specificity: n, mean, sd, ci95_low, ci95_high, min, max, scored_100.
//   Arm B additionally emits two GROUP means and a Welch comparison.
//
// DOES NOT EMIT: participant codes, names, emails, countries, per-person rows,
// the code-to-arm map, record text, or the answer key. The key is used to score
// and never appears in the response.
//
// Reads SUPABASE_SERVICE_ROLE_KEY, which already exists in this deployment and
// is already used by api/people-9dd1ecdf6f8cdfd4.js, api/roster-8c3f1a9e7b2d6045.js
// and api/geo-4e8b2d7f9a1c3065.js. Nothing new is provisioned.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

const KEY = {
  R01:'GROUNDED',  R02:'UNGROUNDED',R03:'UNGROUNDED',R04:'GROUNDED',
  R05:'UNGROUNDED',R06:'GROUNDED',  R07:'UNGROUNDED',R08:'GROUNDED',
  R09:'UNGROUNDED',R10:'GROUNDED',  R11:'UNGROUNDED',R12:'GROUNDED',
  R13:'UNGROUNDED',R14:'GROUNDED',  R15:'UNGROUNDED',R16:'GROUNDED',
  R17:'UNGROUNDED',R18:'GROUNDED',  R19:'UNGROUNDED',R20:'GROUNDED',
  R21:'UNGROUNDED',R22:'GROUNDED',  R23:'UNGROUNDED',R24:'GROUNDED'
};

const NEEDED_MIN = 18;

const G = new Set(['ready','yes','grounded','rely','would_rely','adequate','supported']);
const U = new Set(['review_required','needs_work','needs work','gap','gap_identified',
                   'no','ungrounded','not_rely','would_not_rely','inadequate','unsupported']);

function predict(v){
  const d = String(v == null ? '' : v).trim().toLowerCase();
  if (G.has(d)) return 'GROUNDED';
  if (U.has(d)) return 'UNGROUNDED';
  return null;
}

// THE B2 ANSWER IS IN A DIFFERENT COLUMN. B1 applied the five conditions and
// their determination is in jrs_read. B2 answered a general reliance prompt and
// their answer is in rely; jrs_read is empty for every B2 row. Reading jrs_read
// for both dropped all 408 B2 rows as unscorable and excluded all 13 B2
// participants, which left by_arm with B1 only and no comparison at all.
// Matches scripts/export_arm_b_data.py line 154:
//   det = row.get('rely') if cond == 'B2' else row.get('jrs_read')
function answerOf(row){
  const b = String(row.batch == null ? '' : row.batch).toUpperCase();
  return b.indexOf('B2') >= 0 ? row.rely : row.jrs_read;
}

function mean(a){ return a.reduce(function(s,x){ return s+x; }, 0) / a.length; }

function sd(a){
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce(function(s,x){ return s+(x-m)*(x-m); }, 0) / (a.length-1));
}

const TCRIT = {1:12.706,2:4.303,3:3.182,4:2.776,5:2.571,6:2.447,7:2.365,8:2.306,
               9:2.262,10:2.228,11:2.201,12:2.179,13:2.160,14:2.145,15:2.131,
               16:2.120,17:2.110,18:2.101,19:2.093,20:2.086,21:2.080,22:2.074,
               23:2.069,24:2.064,25:2.060,26:2.056,27:2.052,28:2.048,29:2.045};

function tcrit(df){
  const k = Math.max(1, Math.round(df));
  return TCRIT[k] || 2.045;
}

function stats(a){
  if (!a.length) return null;
  const n = a.length;
  const m = mean(a);
  const s = sd(a);
  const h = n > 1 ? tcrit(n-1) * s / Math.sqrt(n) : null;
  return {
    n: n,
    mean: Number(m.toFixed(2)),
    sd: Number(s.toFixed(2)),
    ci95_low: h === null ? null : Number((m-h).toFixed(2)),
    ci95_high: h === null ? null : Number((m+h).toFixed(2)),
    min: Number(Math.min.apply(null, a).toFixed(2)),
    max: Number(Math.max.apply(null, a).toFixed(2)),
    scored_100: a.filter(function(x){ return x === 100; }).length
  };
}

async function pull(H){
  let rows = [];
  let from = 0;
  const page = 1000;
  for (;;){
    const url = SB + '/rest/v1/ai_pilot_reads'
              + '?select=reviewer_code,record_ref,jrs_read,rely,batch,created_at'
              + '&order=created_at.asc';
    const r = await fetch(url, { headers: Object.assign({}, H, { Range: from + '-' + (from + page - 1) }) });
    if (!r.ok) throw new Error('upstream ' + r.status);
    const chunk = await r.json();
    if (!chunk.length) break;
    rows = rows.concat(chunk);
    if (chunk.length < page) break;
    from += page;
  }
  return rows;
}

function score(rows, armMap){
  const latest = {};
  for (const r of rows){
    latest[r.reviewer_code + '|' + String(r.record_ref).toUpperCase()] = r;
  }
  const by = {};
  for (const k in latest){
    const r = latest[k];
    if (!by[r.reviewer_code]) by[r.reviewer_code] = [];
    by[r.reviewer_code].push(r);
  }
  const acc = [];
  const sens = [];
  const spec = [];
  const armAcc = {};
  const unmapped = {};
  let excluded = 0;
  let unscorable = 0;
  let analysed = 0;
  for (const code in by){
    const pairs = [];
    for (const r of by[code]){
      const raw = answerOf(r);
      const p = predict(raw);
      const t = KEY[String(r.record_ref || '').toUpperCase()];
      if (p && t){
        pairs.push([p, t]);
      } else {
        unscorable++;
        if (!p) unmapped[String(raw)] = (unmapped[String(raw)] || 0) + 1;
      }
    }
    if (pairs.length < NEEDED_MIN){ excluded++; continue; }
    analysed += pairs.length;
    const hit = function(a){ return a.filter(function(x){ return x[0] === x[1]; }).length; };
    const pos = pairs.filter(function(x){ return x[1] === 'UNGROUNDED'; });
    const neg = pairs.filter(function(x){ return x[1] === 'GROUNDED'; });
    const a = Number((100 * hit(pairs) / pairs.length).toFixed(2));
    acc.push(a);
    if (pos.length) sens.push(Number((100 * hit(pos) / pos.length).toFixed(2)));
    if (neg.length) spec.push(Number((100 * hit(neg) / neg.length).toFixed(2)));
    if (armMap){
      const arm = armMap[code] || 'unassigned';
      if (!armAcc[arm]) armAcc[arm] = [];
      armAcc[arm].push(a);
    }
  }
  const out = {
    participants_analysed: acc.length,
    participants_excluded_below_18_of_24: excluded,
    judgments_analysed: analysed,
    judgments_unscorable: unscorable,
    unmapped_answer_values: unmapped,
    accuracy: stats(acc),
    sensitivity: stats(sens),
    specificity: stats(spec)
  };
  if (armMap){
    const arms = Object.keys(armAcc).sort();
    out.by_arm = {};
    for (const a of arms) out.by_arm[a] = stats(armAcc[a]);
    if (arms.length === 2){
      const A = armAcc[arms[0]];
      const B = armAcc[arms[1]];
      const na = A.length;
      const nb = B.length;
      const va = sd(A) * sd(A);
      const vb = sd(B) * sd(B);
      const diff = mean(A) - mean(B);
      const se = Math.sqrt(va/na + vb/nb);
      let df = null;
      let t = null;
      if (se > 0 && na > 1 && nb > 1){
        t = diff / se;
        df = Math.pow(va/na + vb/nb, 2)
           / (Math.pow(va/na, 2)/(na-1) + Math.pow(vb/nb, 2)/(nb-1));
      }
      const sp = Math.sqrt(((na-1)*va + (nb-1)*vb) / (na + nb - 2));
      // No substituted degrees of freedom. If df could not be computed the
      // interval is reported as null rather than derived from a stand-in value,
      // which is the same rule the rest of this codebase follows for a figure
      // that cannot be computed.
      const ci = (df === null || se <= 0) ? [null, null] : [
        Number((diff - tcrit(df)*se).toFixed(2)),
        Number((diff + tcrit(df)*se).toFixed(2))
      ];
      out.arm_comparison = {
        arms: arms,
        mean_difference: Number(diff.toFixed(2)),
        welch_t: t === null ? null : Number(t.toFixed(3)),
        welch_df: df === null ? null : Number(df.toFixed(1)),
        cohens_d: sp > 0 ? Number((diff/sp).toFixed(3)) : null,
        diff_ci95_low: ci[0],
        diff_ci95_high: ci[1]
      };
    }
  }
  return out;
}

export default async function handler(){
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE){
    return new Response(JSON.stringify({ error: 'service_key_not_present' }), {
      status: 503, headers: { 'Content-Type': 'application/json' }
    });
  }
  const H = { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE };
  let all;
  try {
    all = await pull(H);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'upstream_error' }), {
      status: 502, headers: { 'Content-Type': 'application/json' }
    });
  }

  const batches = {};
  const readVals = {};
  const refs = {};
  const refsUnmatched = {};
  for (const r of all){
    const b = r.batch == null ? '(null)' : r.batch;
    batches[b] = (batches[b] || 0) + 1;
    const v = String(answerOf(r));
    readVals[v] = (readVals[v] || 0) + 1;
    const rr = String(r.record_ref).toUpperCase();
    refs[rr] = 1;
    if (!KEY[rr]) refsUnmatched[rr] = (refsUnmatched[rr] || 0) + 1;
  }
  let matching = 0;
  for (const k in refs){ if (KEY[k]) matching++; }

  const isB = function(r){ return String(r.batch || '').toLowerCase().indexOf('armb') === 0; };
  const detection = all.filter(function(r){ return !isB(r); });
  const armb = all.filter(isB);

  let armMap = null;
  try {
    const r = await fetch(SB + '/rest/v1/armb_progress?select=code,arm_code', { headers: H });
    if (r.ok){
      armMap = {};
      const rows = await r.json();
      for (const row of rows) armMap[row.code] = row.arm_code;
    }
  } catch (e) {
    armMap = null;
  }

  const body = {
    generated_at: new Date().toISOString(),
    source: 'ai_pilot_reads scored against research/Verified_Key.md',
    exclusion_rule: 'fewer than ' + NEEDED_MIN + ' of 24 scorable records excluded (pre-registered)',
    shape: {
      rows_total: all.length,
      batches: batches,
      distinct_record_refs: Object.keys(refs).length,
      record_refs_matching_key: matching,
      record_refs_NOT_in_key: refsUnmatched,
      answer_values: readVals
    },
    detection_panel: score(detection, null),
    arm_b: score(armb, armMap),
    disclosure: 'Aggregate only. No participant code, no per-person row, no code-to-arm map, no record text, no answer key.'
  };

  return new Response(JSON.stringify(body, null, 1), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store'
    }
  });
}
