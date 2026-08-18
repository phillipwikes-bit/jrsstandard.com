export const config = { runtime: 'edge' };

// Appendix C: crossed reviewer and item variance, computed server-side.
//
// WHY THIS EXISTS. The analysis needs the per-read judgments in ai_pilot_reads,
// which are behind row-level security. The first attempt at it was a local
// script that demanded SUPABASE_SERVICE_ROLE_KEY in the owner's shell. That was
// the wrong shape: the service key already lives here, in this deployment's
// environment, and every other private figure in this programme is served the
// same way. Asking the owner to export a key to run an analysis the site can
// run itself is friction with no security benefit.
//
// OPAQUE SLUG, NO TOKEN. Same protection as api/people-9dd1ecdf6f8cdfd4.js,
// api/roster-8c3f1a9e7b2d6045.js and api/geo-4e8b2d7f9a1c3065.js. Never linked
// from a public page, noindex by virtue of being an API route, and rotated by
// renaming the file if the slug ever leaks.
//
// THE ANSWER KEY IS NOT IN THE RESPONSE, DELIBERATELY. Scoring needs the key,
// so the key is held below and used. What comes back is per-record ACCURACY and
// nothing that says which records were grounded and which were unsupported.
// Publishing accuracy beside the class would be publishing the key: a reader
// who sees "R07 unsupported, 62 percent" learns R07's classification for free.
// The class column lives in research/Verified_Key.md, which is not deployed,
// and the manuscript joins the two privately.
//
// Returns aggregate statistics only. No reviewer name appears anywhere; the
// reviewer table is keyed on study codes, which is what the paper prints.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// The verified answer key. Identical to scripts/verify_detection_accuracy.py,
// scripts/export_arm_b_data.py and research/Verified_Key.md. Fixed before any
// accuracy analysis was run and independently reproduced 24 of 24 by blind
// raters. 12 grounded, 12 ungrounded.
const KEY = {
  R01: 'GROUNDED',   R02: 'UNGROUNDED', R03: 'UNGROUNDED', R04: 'GROUNDED',
  R05: 'UNGROUNDED', R06: 'GROUNDED',   R07: 'UNGROUNDED', R08: 'GROUNDED',
  R09: 'UNGROUNDED', R10: 'GROUNDED',   R11: 'UNGROUNDED', R12: 'GROUNDED',
  R13: 'UNGROUNDED', R14: 'GROUNDED',   R15: 'UNGROUNDED', R16: 'GROUNDED',
  R17: 'UNGROUNDED', R18: 'GROUNDED',   R19: 'UNGROUNDED', R20: 'GROUNDED',
  R21: 'UNGROUNDED', R22: 'GROUNDED',   R23: 'UNGROUNDED', R24: 'GROUNDED'
};

// Token sets, identical to scripts/verify_detection_accuracy.py. A read that
// maps to neither is unscorable and is counted, never guessed at.
const GROUNDED_TOK = new Set(['ready', 'yes', 'grounded', 'rely', 'would_rely',
                              'adequate', 'supported']);
const UNGROUND_TOK = new Set(['review_required', 'needs_work', 'needs work', 'gap',
                              'gap_identified', 'no', 'ungrounded', 'not_rely',
                              'would_not_rely', 'inadequate', 'unsupported']);

const MIN_READS = 18;   // the pre-registered exclusion rule, 18 of 24
const CORPUS_SIZE = 24;
const SINGULAR_SD = 0.02;

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer'
    }
  });
}

function predict(det){
  const d = String(det == null ? '' : det).trim().toLowerCase();
  if (GROUNDED_TOK.has(d)) return 'GROUNDED';
  if (UNGROUND_TOK.has(d)) return 'UNGROUNDED';
  return null;
}

async function fetchReads(SERVICE){
  const H = { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, Accept: 'application/json' };
  const rows = [];
  let from = 0;
  const page = 1000;
  for (;;) {
    const url = SB + '/rest/v1/ai_pilot_reads'
      + '?select=reviewer_code,record_ref,jrs_read,rely,batch,created_at'
      + '&order=created_at.asc';
    const res = await fetch(url, {
      headers: Object.assign({}, H, { Range: from + '-' + (from + page - 1) })
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error('ai_pilot_reads ' + res.status + ': ' + String(t).slice(0, 200));
    }
    const chunk = await res.json();
    if (!chunk.length) break;
    for (let i = 0; i < chunk.length; i++) rows.push(chunk[i]);
    if (chunk.length < page) break;
    from += page;
  }
  return rows;
}

// --- Crossed random-intercept logistic model -------------------------------
//
//   correct_ij ~ Bernoulli(p_ij),  logit(p_ij) = beta0 + u_i + v_j
//     u_i ~ N(0, sRev^2)   reviewer i
//     v_j ~ N(0, sRec^2)   record j
//
// Laplace-approximated ML. The log-determinant uses the EXACT crossed Hessian
// via a Schur complement and a Cholesky, not a diagonal approximation. A
// diagonal one drops the only term coupling the two random factors, and on
// simulated data with a true record SD of 0.600 it returned 0.000. A component
// collapsing to zero is exactly what someone would quote as "record difficulty
// does not matter", so the shortcut produced a confident wrong answer to the
// question this endpoint exists to answer.

function sigmoid(x){
  if (x >= 0) { const z = Math.exp(-x); return 1 / (1 + z); }
  const z = Math.exp(x); return z / (1 + z);
}

function penalisedMode(y, ri, ci, nRev, nRec, beta0, sRev, sRec){
  const u = new Array(nRev).fill(0);
  const v = new Array(nRec).fill(0);
  const pu = 1 / (sRev * sRev);
  const pv = 1 / (sRec * sRec);
  for (let it = 0; it < 60; it++) {
    const gu = new Array(nRev), hu = new Array(nRev);
    const gv = new Array(nRec), hv = new Array(nRec);
    for (let k = 0; k < nRev; k++) { gu[k] = -pu * u[k]; hu[k] = pu; }
    for (let k = 0; k < nRec; k++) { gv[k] = -pv * v[k]; hv[k] = pv; }
    for (let t = 0; t < y.length; t++) {
      const i = ri[t], j = ci[t];
      const p = sigmoid(beta0 + u[i] + v[j]);
      const resid = y[t] - p;
      const w = p * (1 - p);
      gu[i] += resid; gv[j] += resid;
      hu[i] += w;     hv[j] += w;
    }
    let step = 0;
    for (let k = 0; k < nRev; k++) { const d = gu[k] / hu[k]; u[k] += d; step = Math.max(step, Math.abs(d)); }
    for (let k = 0; k < nRec; k++) { const d = gv[k] / hv[k]; v[k] += d; step = Math.max(step, Math.abs(d)); }
    if (step < 1e-10) break;
  }
  return { u: u, v: v };
}

function logdetHessian(y, ri, ci, nRev, nRec, beta0, u, v, pu, pv){
  const du = new Array(nRev).fill(pu);
  const dv = new Array(nRec).fill(pv);
  const C = [];
  for (let i = 0; i < nRev; i++) C.push(new Array(nRec).fill(0));
  for (let t = 0; t < y.length; t++) {
    const i = ri[t], j = ci[t];
    const p = sigmoid(beta0 + u[i] + v[j]);
    const w = p * (1 - p);
    du[i] += w; dv[j] += w; C[i][j] += w;
  }
  // S = Dv - C^T Du^-1 C
  const S = [];
  for (let a = 0; a < nRec; a++) S.push(new Array(nRec).fill(0));
  for (let a = 0; a < nRec; a++) S[a][a] = dv[a];
  for (let i = 0; i < nRev; i++) {
    const inv = 1 / du[i];
    const row = C[i];
    for (let a = 0; a < nRec; a++) {
      const ra = row[a];
      if (ra === 0) continue;
      const raInv = ra * inv;
      for (let b = a; b < nRec; b++) if (row[b] !== 0) S[a][b] -= raInv * row[b];
    }
  }
  for (let a = 0; a < nRec; a++) for (let b = 0; b < a; b++) S[a][b] = S[b][a];

  let logdetS = 0;
  const L = [];
  for (let a = 0; a < nRec; a++) L.push(new Array(nRec).fill(0));
  for (let a = 0; a < nRec; a++) {
    let acc = S[a][a];
    for (let k = 0; k < a; k++) acc -= L[a][k] * L[a][k];
    if (acc <= 1e-14) return null;
    L[a][a] = Math.sqrt(acc);
    logdetS += 2 * Math.log(L[a][a]);
    for (let b = a + 1; b < nRec; b++) {
      let s = S[b][a];
      for (let k = 0; k < a; k++) s -= L[b][k] * L[a][k];
      L[b][a] = s / L[a][a];
    }
  }
  let out = logdetS;
  for (let i = 0; i < nRev; i++) out += Math.log(du[i]);
  return out;
}

function negLogLik(params, y, ri, ci, nRev, nRec){
  const beta0 = params[0];
  const sRev = Math.exp(params[1]);
  const sRec = Math.exp(params[2]);
  if (!(sRev > 1e-3 && sRev < 20 && sRec > 1e-3 && sRec < 20)) return 1e12;
  const mode = penalisedMode(y, ri, ci, nRev, nRec, beta0, sRev, sRec);
  const u = mode.u, v = mode.v;

  let ll = 0;
  for (let t = 0; t < y.length; t++) {
    let p = sigmoid(beta0 + u[ri[t]] + v[ci[t]]);
    if (p < 1e-12) p = 1e-12;
    if (p > 1 - 1e-12) p = 1 - 1e-12;
    ll += y[t] * Math.log(p) + (1 - y[t]) * Math.log(1 - p);
  }
  const pu = 1 / (sRev * sRev), pv = 1 / (sRec * sRec);
  const L2PI = Math.log(2 * Math.PI);
  for (let k = 0; k < nRev; k++) ll += -0.5 * pu * u[k] * u[k] - 0.5 * L2PI - Math.log(sRev);
  for (let k = 0; k < nRec; k++) ll += -0.5 * pv * v[k] * v[k] - 0.5 * L2PI - Math.log(sRec);

  const logdet = logdetHessian(y, ri, ci, nRev, nRec, beta0, u, v, pu, pv);
  if (logdet === null) return 1e12;
  ll += 0.5 * (nRev + nRec) * L2PI - 0.5 * logdet;
  return -ll;
}

function nelderMead(f, x0, args, iters){
  const n = x0.length;
  let pts = [x0.slice()];
  for (let k = 0; k < n; k++) {
    const p = x0.slice();
    p[k] += (p[k] === 0) ? 0.35 : 0.35 * Math.abs(p[k]);
    pts.push(p);
  }
  let vals = pts.map(function(p){ return f.apply(null, [p].concat(args)); });
  for (let it = 0; it < (iters || 800); it++) {
    const order = vals.map(function(v, i){ return i; })
                      .sort(function(a, b){ return vals[a] - vals[b]; });
    pts = order.map(function(i){ return pts[i]; });
    vals = order.map(function(i){ return vals[i]; });
    if (Math.abs(vals[n] - vals[0]) < 1e-9) break;
    const cen = new Array(n).fill(0);
    for (let k = 0; k < n; k++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += pts[i][k];
      cen[k] = s / n;
    }
    const ref = cen.map(function(c, k){ return c + 1.0 * (c - pts[n][k]); });
    const fref = f.apply(null, [ref].concat(args));
    if (fref < vals[0]) {
      const exp = cen.map(function(c, k){ return c + 2.0 * (c - pts[n][k]); });
      const fexp = f.apply(null, [exp].concat(args));
      if (fexp < fref) { pts[n] = exp; vals[n] = fexp; } else { pts[n] = ref; vals[n] = fref; }
    } else if (fref < vals[n - 1]) {
      pts[n] = ref; vals[n] = fref;
    } else {
      const con = cen.map(function(c, k){ return c + 0.5 * (pts[n][k] - c); });
      const fcon = f.apply(null, [con].concat(args));
      if (fcon < vals[n]) { pts[n] = con; vals[n] = fcon; }
      else {
        for (let k = 1; k <= n; k++) {
          pts[k] = pts[k].map(function(x, m){ return pts[0][m] + 0.5 * (x - pts[0][m]); });
          vals[k] = f.apply(null, [pts[k]].concat(args));
        }
      }
    }
  }
  let best = 0;
  for (let i = 1; i <= n; i++) if (vals[i] < vals[best]) best = i;
  return { x: pts[best], f: vals[best] };
}

function fitCrossed(scored){
  const revs = Array.from(new Set(scored.map(function(s){ return s[0]; }))).sort();
  const recs = Array.from(new Set(scored.map(function(s){ return s[1]; }))).sort();
  const riOf = {}, ciOf = {};
  revs.forEach(function(c, i){ riOf[c] = i; });
  recs.forEach(function(c, i){ ciOf[c] = i; });
  const y = scored.map(function(s){ return s[2]; });
  const ri = scored.map(function(s){ return riOf[s[0]]; });
  const ci = scored.map(function(s){ return ciOf[s[1]]; });

  let mean = y.reduce(function(a, b){ return a + b; }, 0) / y.length;
  if (mean < 1e-6) mean = 1e-6;
  if (mean > 1 - 1e-6) mean = 1 - 1e-6;
  const x0 = [Math.log(mean / (1 - mean)), Math.log(0.8), Math.log(0.5)];
  const res = nelderMead(negLogLik, x0, [y, ri, ci, revs.length, recs.length], 800);

  const beta0 = res.x[0];
  const sRev = Math.exp(res.x[1]);
  const sRec = Math.exp(res.x[2]);
  const varRev = sRev * sRev, varRec = sRec * sRec;
  const resid = (Math.PI * Math.PI) / 3;
  const total = varRev + varRec + resid;
  return {
    n_obs: y.length,
    n_reviewers: revs.length,
    n_records: recs.length,
    intercept_logit: beta0,
    intercept_probability: sigmoid(beta0),
    sd_reviewer: sRev,
    sd_record: sRec,
    var_reviewer: varRev,
    var_record: varRec,
    icc_reviewer: varRev / total,
    icc_record: varRec / total,
    neg_loglik: res.f,
    singular_fit: (sRev < SINGULAR_SD || sRec < SINGULAR_SD)
  };
}

// Profile-likelihood interval for one SD, holding the other free. A BOUNDARY
// ESTIMATE IS NOT A ZERO: at 16 reviewers by 24 records the record component is
// weakly identified, and a correct estimator lands on the boundary on roughly
// one dataset in six with a genuinely non-zero true value. The interval is what
// stops that reading.
function profileSd(scored, which, fit){
  const revs = Array.from(new Set(scored.map(function(s){ return s[0]; }))).sort();
  const recs = Array.from(new Set(scored.map(function(s){ return s[1]; }))).sort();
  const riOf = {}, ciOf = {};
  revs.forEach(function(c, i){ riOf[c] = i; });
  recs.forEach(function(c, i){ ciOf[c] = i; });
  const y = scored.map(function(s){ return s[2]; });
  const ri = scored.map(function(s){ return riOf[s[0]]; });
  const ci = scored.map(function(s){ return ciOf[s[1]]; });
  const nRev = revs.length, nRec = recs.length;
  const thresh = fit.neg_loglik + 1.92;

  const lo = 0.001, hi = 3.0, steps = 20;
  const inside = [];
  for (let k = 0; k < steps; k++) {
    const val = lo * Math.pow(hi / lo, k / (steps - 1));
    const f = (which === 'record')
      ? function(p){ return negLogLik([p[0], p[1], Math.log(val)], y, ri, ci, nRev, nRec); }
      : function(p){ return negLogLik([p[0], Math.log(val), p[1]], y, ri, ci, nRev, nRec); };
    const seed = (which === 'record')
      ? [fit.intercept_logit, Math.log(Math.max(fit.sd_reviewer, 0.01))]
      : [fit.intercept_logit, Math.log(Math.max(fit.sd_record, 0.01))];
    const r = nelderMead(function(p){ return f(p); }, seed, [], 120);
    if (r.f <= thresh) inside.push(val);
  }
  if (!inside.length) return null;
  return [Math.min.apply(null, inside), Math.max.apply(null, inside)];
}

export default async function handler(req){
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }});
  }

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) {
    return json({ ok: false, error: 'service_key_missing',
                  detail: 'This deployment has no SUPABASE_SERVICE_ROLE_KEY, so the '
                        + 'per-read table cannot be reached. Nothing is estimated '
                        + 'in its absence.' }, 503);
  }

  let rows;
  try {
    rows = await fetchReads(SERVICE);
  } catch (e) {
    return json({ ok: false, error: 'read_failed', detail: String(e.message || e) }, 502);
  }
  if (!rows.length) {
    return json({ ok: false, error: 'no_rows',
                  detail: 'ai_pilot_reads returned nothing. An empty array here is a '
                        + 'row-level-security refusal, not an empty table.' }, 502);
  }

  // Latest submission per (reviewer, record), matching the pre-registered rule.
  const latest = {};
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const k = String(r.reviewer_code) + '|' + String(r.record_ref);
    if (!latest[k] || String(r.created_at) >= String(latest[k].created_at)) latest[k] = r;
  }
  const dedup = Object.keys(latest).map(function(k){ return latest[k]; });

  // The detection panel is the Arm A reviewer codes. Arm B carries its own
  // codes and its own paper, and mixing them would answer a different question.
  const panel = dedup.filter(function(r){ return /^V-AI-\d+$/i.test(String(r.reviewer_code || '')); });

  const perParticipant = {};
  for (let i = 0; i < panel.length; i++) {
    const c = String(panel[i].reviewer_code);
    perParticipant[c] = (perParticipant[c] || 0) + 1;
  }
  const kept = {}, dropped = [];
  Object.keys(perParticipant).forEach(function(c){
    if (perParticipant[c] >= MIN_READS) kept[c] = 1; else dropped.push(c);
  });

  const scored = [];
  let unscorable = 0;
  for (let i = 0; i < panel.length; i++) {
    const r = panel[i];
    const code = String(r.reviewer_code);
    if (!kept[code]) continue;
    const ref = String(r.record_ref || '').toUpperCase();
    const truth = KEY[ref];
    const pred = predict(r.jrs_read);
    if (!truth || !pred) { unscorable++; continue; }
    scored.push([code, ref, pred === truth ? 1 : 0]);
  }
  if (scored.length < 10) {
    return json({ ok: false, error: 'too_few_scorable', scorable: scored.length }, 502);
  }

  const fit = fitCrossed(scored);
  const profRev = profileSd(scored, 'reviewer', fit);
  const profRec = profileSd(scored, 'record', fit);

  const byRecord = {}, byReviewer = {};
  for (let i = 0; i < scored.length; i++) {
    const rev = scored[i][0], rec = scored[i][1], ok = scored[i][2];
    if (!byRecord[rec]) byRecord[rec] = [0, 0];
    if (!byReviewer[rev]) byReviewer[rev] = [0, 0];
    byRecord[rec][0] += ok; byRecord[rec][1] += 1;
    byReviewer[rev][0] += ok; byReviewer[rev][1] += 1;
  }
  const items = Object.keys(byRecord).sort().map(function(rec){
    return { record: rec, correct: byRecord[rec][0], reads: byRecord[rec][1],
             accuracy: 100 * byRecord[rec][0] / byRecord[rec][1] };
  }).sort(function(a, b){ return a.accuracy - b.accuracy; });
  const reviewers = Object.keys(byReviewer).sort().map(function(rev){
    return { reviewer: rev, correct: byReviewer[rev][0], reads: byReviewer[rev][1],
             accuracy: 100 * byReviewer[rev][0] / byReviewer[rev][1] };
  }).sort(function(a, b){ return a.accuracy - b.accuracy; });

  return json({
    ok: true,
    model: 'correct ~ 1 + (1 | reviewer) + (1 | record)',
    method: 'Laplace-approximated ML, exact crossed Hessian via Schur complement '
          + 'and Cholesky, Nelder-Mead over beta0 and the two log SDs',
    exclusion_rule: 'pre-registered: fewer than ' + MIN_READS + ' of ' + CORPUS_SIZE
                  + ' graded reads excluded from analysis',
    participants_retained: Object.keys(kept).length,
    participants_excluded: dropped.length,
    unscorable_rows: unscorable,
    fit: fit,
    profile_95: {
      sd_reviewer: profRev ? { low: profRev[0], high: profRev[1] } : null,
      sd_record: profRec ? { low: profRec[0], high: profRec[1] } : null,
      note: 'Profile-likelihood interval at the 1.92-nat drop. A point estimate '
          + 'near zero must be read with this interval and never reported as '
          + '"no variance": at this sample size a correct estimator lands on the '
          + 'boundary on roughly one dataset in six with a genuinely non-zero '
          + 'true value.'
    },
    by_record: items,
    by_reviewer: reviewers,
    key_disclosure: 'The grounded/ungrounded class of each record is NOT in this '
                  + 'response. Publishing accuracy beside the class would publish '
                  + 'the answer key. The class is held in research/Verified_Key.md, '
                  + 'which is not deployed.',
    status: fit.singular_fit
      ? 'SINGULAR FIT: at least one variance component is at the boundary. Report '
      + 'the profile interval, not the point estimate, and do not write that the '
      + 'component is zero.'
      : 'converged'
  });
}
