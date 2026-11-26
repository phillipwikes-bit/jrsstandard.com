#!/usr/bin/env node
// Scores one tool's answers on every track it answered.
// Usage: node benchmarks/record-check-v1/score.mjs <answers.json>
// answers.json: { "tool": "...", "F": {id: {serious, flagged_sentences}}, "E": {id: {flagged, wrong_figures}}, "A": {id: {flagged, dropped_dates, dropped_speakers}}, "B": {id: {lossier}}, "C": {id: {point: code}}, "D": {id: {flag}} }
import { readFileSync } from 'node:fs';
const here = new URL('./data/', import.meta.url);
const key = (t) => JSON.parse(readFileSync(new URL(`track-${t}.key.json`, here), 'utf8'));
const ans = JSON.parse(readFileSync(process.argv[2], 'utf8'));
export function wilson(k, n, z = 1.96) {
  if (!n) return null; const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [+(((c - h) / d)).toFixed(3), +(((c + h) / d)).toFixed(3)];
}
function fisher(a, b, c, d) {
  const lf = (n) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
  const n = a + b + c + d, r1 = a + b, c1 = a + c;
  const p = (x) => Math.exp(lf(c1) - lf(x) - lf(c1 - x) + lf(n - c1) - lf(r1 - x) - lf(n - c1 - r1 + x) - (lf(n) - lf(r1) - lf(n - r1)));
  const p0 = p(a); let s = 0; for (let x = Math.max(0, r1 + c1 - n); x <= Math.min(r1, c1); x++) { const v = p(x); if (v <= p0 * (1 + 1e-9)) s += v; } return Math.min(1, s);
}
const out = { tool: ans.tool || 'unnamed' };
const rate = (k, n) => ({ k, n, rate: n ? +(k / n).toFixed(3) : null, wilson95: wilson(k, n) });
if (ans.A) {
  const K = key('a'); let ip = 0, ni = 0, ac = 0, na = 0, dh = 0, dn = 0, sh = 0, sn = 0;
  const norm = (s) => String(s).toLowerCase().replace(/\s+/g, '');
  for (const [id, t] of Object.entries(K)) {
    const a = ans.A[id] || {}; const flagged = !!a.flagged;
    if (!t.altered) { ni++; if (!flagged) ip++; continue; }
    na++; if (flagged) ac++;
    const dd = (a.dropped_dates || []).map(String); for (const d of t.dropped_dates) { dn++; if (dd.some((x) => x === d || x.startsWith(d) || d.startsWith(x))) dh++; }
    const ds = new Set((a.dropped_speakers || []).map(norm)); for (const s of t.dropped_speakers) { sn++; if (ds.has(norm(s))) sh++; }
  }
  out.A = { unchanged_records_passed: rate(ip, ni), altered_records_flagged: rate(ac, na), dropped_dates_named: rate(dh, dn), dropped_speakers_named: rate(sh, sn) };
}
if (ans.B) {
  const K = key('b'); let ok = 0, n = 0; for (const [id, t] of Object.entries(K)) { n++; if ((ans.B[id] || {}).lossier === t.lossier) ok++; }
  out.B = { lossier_draft_identified: rate(ok, n) };
}
if (ans.C) {
  const K = key('c'); let ok = 0, n = 0, wronglyBacked = 0;
  for (const [id, pts] of Object.entries(K)) for (const [p, t] of Object.entries(pts)) { n++; const g = (ans.C[id] || {})[p]; if (g === t) ok++; if (g === 'S' && t !== 'S') wronglyBacked++; }
  out.C = { points_agreeing_with_key: rate(ok, n), points_wrongly_credited_as_backed: wronglyBacked };
}
if (ans.D) {
  const K = key('d'); let a = 0, b = 0, c = 0, d = 0;
  for (const [id, t] of Object.entries(K)) { const f = !!(ans.D[id] || {}).flag, y = t === 'not_affirmed'; if (f && y) a++; else if (f) b++; else if (y) c++; else d++; }
  out.D = { not_affirmed_if_flagged: rate(a, a + b), not_affirmed_if_not_flagged: rate(c, c + d), flagged_share: +((a + b) / (a + b + c + d)).toFixed(3), fisher_p: +fisher(a, b, c, d).toPrecision(3) };
}
if (ans.E) {
  const K = key('e'); let ip = 0, ni = 0, rp = 0, nr = 0, ac = 0, na = 0, named = 0, ec = 0, ne = 0;
  const digits = (x) => String(x).replace(/[^\d.]/g, '').replace(/\.0+$/, '');
  for (const [id, t] of Object.entries(K)) {
    const a = ans.E[id] || {}; const flagged = !!a.flagged;
    if (!t.altered) { ni++; if (!flagged) ip++; if (t.written_as) { nr++; if (!flagged) rp++; } continue; }
    na++; if (flagged) ac++;
    if ((a.wrong_figures || []).some((w) => digits(w) && digits(w) === digits(t.record_figure))) named++;
    if (t.from_elsewhere_in_source) { ne++; if (flagged) ec++; }
  }
  out.E = { unchanged_records_passed: rate(ip, ni), of_which_figure_written_another_way_passed: rate(rp, nr), altered_records_flagged: rate(ac, na), wrong_figure_named: rate(named, na), altered_with_a_figure_from_elsewhere_in_the_decision_flagged: rate(ec, ne) };
}
function scoreF(K, A) { let gc = 0, ng = 0, cf = 0, nc = 0, pair = 0, np = 0; const byKind = {};
  const norm = (x) => String(x).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const hits = (list, s) => { const t = norm(s); return (list || []).some((q) => { const u = norm(q); return u.length >= 20 && (t.includes(u) || u.includes(t)); }); };
  const good = {};
  for (const [id, t] of Object.entries(K)) if (!t.altered) { ng++; const ok = !(A[id] || {}).serious; if (ok) gc++; good[id.replace(/-good$/, '')] = ok; }
  for (const [id, t] of Object.entries(K)) if (t.altered) {
    nc++; const a = A[id] || {}; const ok = !!a.serious && hits(a.flagged_sentences, t.changed_sentence); if (ok) cf++;
    byKind[t.kind] = byKind[t.kind] || [0, 0]; byKind[t.kind][1]++; if (ok) byKind[t.kind][0]++;
    np++; if (ok && good[id.replace(/-changed$/, '')]) pair++;
  }
  return { good_drafts_without_serious_flag: rate(gc, ng), changed_sentence_flagged_as_serious: rate(cf, nc), both_in_the_same_pair: rate(pair, np), changed_sentence_flagged_by_kind: Object.fromEntries(Object.entries(byKind).map(([k, [a, b]]) => [k, rate(a, b)])) };
}
if (ans.F) out.F = scoreF(key('f'), ans.F);
// The sealed hold-out of good AI drafts (data/track-f-holdout.json; see FH_PROTOCOL.md).
if (ans.FH) out.FH = scoreF(key('f-holdout'), ans.FH);
// Second sealed hold-out (data/track-f-holdout-2.json; see FH2_PROTOCOL.md).
if (ans.FH2) out.FH2 = scoreF(key('f-holdout-2'), ans.FH2);
// Track G: fresh decisions, one changed sentence (see G_PROTOCOL.md).
if (ans.G) out.G = scoreF(key('g'), ans.G);
// Track G2: fresh decisions, one "not" removed (see G2_PROTOCOL.md).
if (ans.G2) out.G2 = scoreF(key('g2'), ans.G2);
console.log(JSON.stringify(out, null, 2));
