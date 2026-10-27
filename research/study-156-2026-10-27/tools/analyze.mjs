// 156-record study: pre-specified analysis, written and frozen before the scored runs. Reads run outputs and test
// results; runs no Engine. Computes every metric named in protocol/ACCEPTANCE_CRITERIA_PROPOSED.json with its
// denominators, per-family counts and a seeded family-cluster bootstrap interval, and evaluates the criteria (owner
// approval NOT GIVEN). Every rate is agreement with an AI-authored or LLM-reproduced reference, not accuracy.
// Usage: node tools/analyze.mjs [--r1=run-1 --r2=run-2 --r3=run-3 --v1=vrun-1 --v2=vrun-2 --out=reports]
//   (writes <out>/ANALYSIS.json and <out>/ANALYSIS_TABLES.md; refuses to overwrite). The options exist so the frozen
//   script can be dry-run on development outputs before the freeze; the scored analysis uses the defaults.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(PKG, '..', '..');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const OPT = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const LB = { r1: OPT.r1 || 'run-1', r2: OPT.r2 || 'run-2', r3: OPT.r3 || 'run-3', v1: OPT.v1 || 'vrun-1', v2: OPT.v2 || 'vrun-2' };
const OUTDIR = OPT.out ? (OPT.out.startsWith('/') ? OPT.out : join(PKG, OPT.out)) : join(PKG, 'reports');
const OUTJ = join(OUTDIR, 'ANALYSIS.json'), OUTM = join(OUTDIR, 'ANALYSIS_TABLES.md');
for (const f of [OUTJ, OUTM]) if (existsSync(f)) { console.error(f + ' exists; it is preserved, not rebuilt'); process.exit(2); }
const inputs = {};
const load = (rel, optional = false) => { const p = join(PKG, rel); if (!existsSync(p)) { if (optional) { inputs[rel] = 'ABSENT'; return null; } throw new Error('missing input ' + rel); } const b = readFileSync(p); inputs[rel] = sha(b); return JSON.parse(b.toString('utf8')); };
const R1 = load('out/' + LB.r1 + '/RESULTS.json'), R2 = load('out/' + LB.r2 + '/RESULTS.json'), R3 = load('out/' + LB.r3 + '/RESULTS.json', true);
const V1 = load('out/' + LB.v1 + '/RESULTS.json'), V2 = load('out/' + LB.v2 + '/RESULTS.json', true);
const T = { research: load('out/research-probes/RESULTS.json'), regression: load('out/regression-probes/RESULTS.json'), mutations: load('out/mutations/RESULTS.json'), transport: load('out/transport/RESULTS.json'),
  differential: load('out/differential/DIFFERENTIAL_DEFAULT_PATH.json'), recovery: load('out/recovery/RESULTS.json', true),
  feature: Object.fromEntries(['0.3.1-candidate', '0.3.2-candidate', '0.3.3-research-candidate'].map((v) => [v, load('out/feature-probes/' + v + '.json')])) };
const AC = load('protocol/ACCEPTANCE_CRITERIA_PROPOSED.json'), PLAN = load('protocol/REQUEST_AND_COST_PLAN.json');
const inv = JSON.parse(readFileSync(join(PKG, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
const RESEARCH_ARMS = ['A2', 'A3', 'A4', 'A5', 'A3R', 'A4R'], MOCK_ARMS = ['A3', 'A4', 'A5', 'A3R', 'A4R', 'A6'], ALL_ARMS = ['A0', 'A0b', 'A1', 'A2', 'A3', 'A4', 'A5', 'A3R', 'A4R', 'A6'];
const group = (r) => r.cohort === 'synthetic_record' ? (r.partition === 'development' ? 'dev_synthetic' : 'eval_synthetic') : r.cohort === 'original_study_record' ? (r.scope_class === 'NOT_EXCLUDED' ? 'dev_originals' : 'out_of_scope_originals') : 'public_cases';
const cluster = (r) => r.family || (r.cohort === 'original_study_record' ? 'ORIG' : 'PUB');
const ratio = (a, b) => (b ? Number((a / b).toFixed(4)) : null);

// ------------------------------------------------------------------ seeded family-cluster bootstrap
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function clusterBootstrap(rows, num, den, B = 10000, seed = 156) {
  const fams = [...new Set(rows.map(cluster))].sort();
  if (fams.length < 2) return null;
  const by = Object.fromEntries(fams.map((f) => [f, rows.filter((r) => cluster(r) === f)]));
  const rnd = mulberry32(seed), vals = [];
  for (let b = 0; b < B; b++) { let n = 0, d = 0; for (let k = 0; k < fams.length; k++) { const f = fams[Math.floor(rnd() * fams.length)]; for (const r of by[f]) { if (den(r)) { d++; if (num(r)) n++; } } } if (d) vals.push(n / d); }
  vals.sort((a, b) => a - b);
  const q = (p) => Number(vals[Math.min(vals.length - 1, Math.floor(p * vals.length))].toFixed(4));
  return { clusters: fams.length, resamples: B, seed, lower_2_5: q(0.025), upper_97_5: q(0.975), note: 'Families resampled with replacement; with ' + fams.length + ' clusters the interval is coarse.' };
}

// ------------------------------------------------------------------ dispositions
const byArm = (R) => { const o = {}; for (const r of R.rows) { o[r.arm] = o[r.arm] || {}; o[r.arm][r.disposition] = (o[r.arm][r.disposition] || 0) + 1; } return o; };
const recordRows = new Map();
for (const r of R1.rows) { if (!recordRows.has(r.id)) recordRows.set(r.id, { id: r.id, cohort: r.cohort, group: null, family: r.family || null, type: r.type || null, reference: r.reference || null }); recordRows.get(r.id)[r.arm] = r.disposition; }
for (const e of inv.entries) { const x = recordRows.get(e.source_id); if (x) { x.group = group({ cohort: e.cohort, partition: e.partition, scope_class: e.scope_class }); if (!x.reference) x.reference = e.reference_findings[0].value; } }
const recordDisposition = (x) => x.cohort === 'public_case' ? 'not_run: source text not held; retrieval needs authorization; rights and privacy NOT ESTABLISHED'
  : x.group === 'out_of_scope_originals' ? (x.A2 === 'correct_refusal' ? 'correct_refusal (research profile); mock arms not run: scope decision SC-1 required' : 'UNEXPECTED: ' + x.A2)
    : ['A3', 'A4', 'A5', 'A3R', 'A4R'].every((a) => x[a] === 'substantive_mock') ? 'substantive (mock candidates, every research arm)'
      : ['A3', 'A4', 'A5', 'A3R', 'A4R'].some((a) => x[a] === 'technical_failure') ? 'technical_failure in at least one research arm'
        : 'partial in at least one research arm (' + ['A3', 'A4', 'A5', 'A3R', 'A4R'].filter((a) => x[a] === 'partial').join(', ') + ')';
const records = [...recordRows.values()].map((x) => Object.assign(x, { record_disposition: recordDisposition(x) }));
const dispSummary = {}; for (const x of records) { const k = x.record_disposition.replace(/ \(A.*$/, ''); dispSummary[k] = (dispSummary[k] || 0) + 1; }

// ------------------------------------------------------------------ E1 agreement
const scored = (R) => R.rows.filter((r) => r.e1);
function e1Block(rows) {
  const counts = {}; for (const r of rows) { counts[r.reference] = counts[r.reference] || { FLAG: 0, CLEAR: 0, INDETERMINATE: 0, NOT_ASSESSED: 0 }; counts[r.reference][r.e1]++; }
  const U = rows.filter((r) => r.reference === 'UNGROUNDED'), G = rows.filter((r) => r.reference === 'GROUNDED'), F = rows.filter((r) => r.e1 === 'FLAG'), GnS = G.filter((r) => r.type !== 'S');
  const rates = { sensitivity: { value: ratio(U.filter((r) => r.e1 === 'FLAG').length, U.length), num: U.filter((r) => r.e1 === 'FLAG').length, den: U.length },
    false_alarm: { value: ratio(G.filter((r) => r.e1 === 'FLAG').length, G.length), num: G.filter((r) => r.e1 === 'FLAG').length, den: G.length },
    false_reassurance: { value: ratio(U.filter((r) => r.e1 === 'CLEAR').length, U.length), num: U.filter((r) => r.e1 === 'CLEAR').length, den: U.length },
    precision: { value: ratio(F.filter((r) => r.reference === 'UNGROUNDED').length, F.length), num: F.filter((r) => r.reference === 'UNGROUNDED').length, den: F.length },
    abstention: { value: ratio(rows.filter((r) => ['INDETERMINATE', 'NOT_ASSESSED'].includes(r.e1)).length, rows.length), num: rows.filter((r) => ['INDETERMINATE', 'NOT_ASSESSED'].includes(r.e1)).length, den: rows.length },
    abstention_grounded_excluding_S: { value: ratio(GnS.filter((r) => ['INDETERMINATE', 'NOT_ASSESSED'].includes(r.e1)).length, GnS.length), num: GnS.filter((r) => ['INDETERMINATE', 'NOT_ASSESSED'].includes(r.e1)).length, den: GnS.length },
    coverage: { value: ratio(rows.filter((r) => ['FLAG', 'CLEAR'].includes(r.e1)).length, rows.length), num: rows.filter((r) => ['FLAG', 'CLEAR'].includes(r.e1)).length, den: rows.length } };
  const boot = { sensitivity: clusterBootstrap(rows, (r) => r.e1 === 'FLAG', (r) => r.reference === 'UNGROUNDED'), false_alarm: clusterBootstrap(rows, (r) => r.e1 === 'FLAG', (r) => r.reference === 'GROUNDED'),
    false_reassurance: clusterBootstrap(rows, (r) => r.e1 === 'CLEAR', (r) => r.reference === 'UNGROUNDED') };
  const by_family = {}; for (const r of rows) { const f = cluster(r); by_family[f] = by_family[f] || {}; const k = r.reference + ':' + r.e1; by_family[f][k] = (by_family[f][k] || 0) + 1; }
  const by_type = {}; for (const r of rows) { const t = r.type || 'original'; by_type[t] = by_type[t] || {}; by_type[t][r.e1] = (by_type[t][r.e1] || 0) + 1; }
  return { records: rows.length, counts, rates, bootstrap: boot, by_family, by_type };
}
const e1 = {};
for (const a of ALL_ARMS) { e1[a] = {}; for (const gname of ['dev_synthetic', 'eval_synthetic', 'dev_originals']) { const rows = scored(R1).filter((r) => r.arm === a && group(r) === gname); if (rows.length) e1[a][gname] = e1Block(rows); } }

// ------------------------------------------------------------------ question checks
const questions = {};
for (const a of ALL_ARMS) { questions[a] = {}; for (const gname of ['dev_synthetic', 'eval_synthetic']) { const q = {}; for (const r of R1.rows.filter((x) => x.arm === a && group(x) === gname && x.e2)) for (const [k, v] of Object.entries(r.e2)) { q[k] = q[k] || { pass: 0, total: 0, failed: [] }; q[k].total++; if (v.pass) q[k].pass++; else q[k].failed.push(r.id); } if (Object.keys(q).length) questions[a][gname] = q; } }

// ------------------------------------------------------------------ cognitive controls
const FLAW = new Set(['no_identifiable_basis_evidence', 'conclusion_without_identifiable_basis', 'conclusion_without_stated_basis', 'conclusion_restated_as_basis', 'authority_reference_without_linked_facts', 'no_locatable_conclusion', 'same_event_date_conflict', 'decision_outcome_conflict']);
const SIGNATURE = { U: 'no_identifiable_basis_evidence', A: 'authority_reference_without_linked_facts', C: 'conclusion_restated_as_basis', M: 'conclusion_without_identifiable_basis', S: 'same_event_date_conflict' };
const DATE = /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b|\b\d{4}-\d{2}-\d{2}\b/;
const textOf = new Map(inv.entries.filter((e) => e.full_text_available).map((e) => [e.source_id, readFileSync(join(ROOT, e.extracted_text_path), 'utf8')]));
function controlsBlock(rows) {
  const s = { graphs: rows.length, controls: 0, words: 0, withheld: 0, redundant_same_defect: 0, span_linked: 0, span_links_valid_graphs: 0, contradictions: 0, all_four_fields: 'not checked here (template completeness is checked by the research probes)',
    flaw_controls: 0, flaw_controls_valid: 0, flaw_controls_false: 0, no_dates_controls: 0, no_dates_controls_correct: 0, other_controls: 0, by_defect: {},
    clean_grounded_records: 0, controls_on_clean_grounded: 0, signature_recall: {} };
  for (const r of rows) {
    const c = r.controls || {}; s.controls += c.controls || 0; s.words += c.words || 0; s.withheld += c.withheld || 0; s.redundant_same_defect += c.redundant_same_defect || 0; s.span_linked += c.span_linked || 0;
    if (c.span_links_valid) s.span_links_valid_graphs++; s.contradictions += (c.contradictions || []).length;
    for (const d of r.control_defects || []) {
      s.by_defect[d] = (s.by_defect[d] || 0) + 1;
      if (FLAW.has(d)) { s.flaw_controls++; if (r.reference === 'UNGROUNDED' || (d === 'same_event_date_conflict' && r.type === 'S')) s.flaw_controls_valid++; else s.flaw_controls_false++; }
      else if (d === 'no_explicit_dates') { s.no_dates_controls++; if (!DATE.test(textOf.get(r.id) || '')) s.no_dates_controls_correct++; }
      else s.other_controls++;
    }
    if (r.reference === 'GROUNDED' && r.type !== 'S') { s.clean_grounded_records++; s.controls_on_clean_grounded += (r.control_defects || []).length; }
  }
  for (const [t, d] of Object.entries(SIGNATURE)) { const rs = rows.filter((r) => r.type === t); if (rs.length) s.signature_recall[t] = { defect: d, present: rs.filter((r) => (r.control_defects || []).includes(d)).length, records: rs.length }; }
  s.detect_validity = ratio(s.flaw_controls_valid, s.flaw_controls);
  s.controls_per_clean_grounded_record = ratio(s.controls_on_clean_grounded, s.clean_grounded_records);
  s.span_links_valid_fraction = ratio(s.span_links_valid_graphs, s.graphs);
  return s;
}
const controls = {};
for (const a of [...RESEARCH_ARMS, 'A6']) { controls[a] = {}; for (const gname of ['dev_synthetic', 'eval_synthetic', 'dev_originals']) { const rows = R1.rows.filter((r) => r.arm === a && group(r) === gname && r.controls); if (rows.length) controls[a][gname] = controlsBlock(rows); } }
const unavailable = {}; for (const a of ALL_ARMS) unavailable[a] = R1.rows.filter((r) => r.arm === a && !r.controls).length;

// ------------------------------------------------------------------ determinism
function compareRuns(A, B, keyOf, digestOf) {
  if (!A || !B) return { compared: 0, identical: 0, fraction: null, note: 'input absent' };
  const m = new Map(B.rows.map((r) => [keyOf(r), r]));
  let compared = 0, identical = 0, dispSame = 0; const differ = [];
  for (const r of A.rows) { const o = m.get(keyOf(r)); const d1 = digestOf(r); if (!o || !d1) continue; compared++; if (d1 === digestOf(o)) identical++; else differ.push(keyOf(r)); if (r.disposition === o.disposition) dispSame++; }
  return { compared, identical, fraction: ratio(identical, compared), dispositions_same: dispSame, differing: differ.slice(0, 20) };
}
const determinism = { run1_run2: compareRuns(R1, R2, (r) => r.arm + '/' + r.id, (r) => r.graph_digest), run1_run3_cross_environment: compareRuns(R1, R3, (r) => r.arm + '/' + r.id, (r) => r.graph_digest),
  vrun1_vrun2: compareRuns(V1, V2, (r) => r.arm + '/' + r.variant_id, (r) => r.variant && r.variant.graph_digest), environments: { run1: R1.environment || null, run3: R3 ? R3.environment || null : null } };

// ------------------------------------------------------------------ variants
const variants = {};
for (const r of V1.rows) {
  const p = r.partition === 'evaluation' ? 'evaluation' : 'development'; variants[p] = variants[p] || {}; variants[p][r.type] = variants[p][r.type] || {}; const v = variants[p][r.type][r.arm] = variants[p][r.type][r.arm] || { pass: 0, total: 0, not_constructible: 0, failed_checks: {}, failures_by_base_reference: {}, failures_by_base_type: {} };
  if (r.disposition === 'not_constructible') { v.not_constructible++; continue; }
  v.total++; if (r.relation.pass) v.pass++; else { for (const c of r.relation.checks.filter((x) => !x.pass)) v.failed_checks[c.name] = (v.failed_checks[c.name] || 0) + 1; v.failures_by_base_reference[r.base_reference] = (v.failures_by_base_reference[r.base_reference] || 0) + 1; const t = r.base_construction_type || 'original'; v.failures_by_base_type[t] = (v.failures_by_base_type[t] || 0) + 1; }
}
for (const p of Object.values(variants)) for (const t of Object.values(p)) for (const v of Object.values(t)) v.fraction = ratio(v.pass, v.total);
const phrasing = new Map(readFileSync(join(PKG, 'variants', 'VARIANTS.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((v) => v.type === 'V7' && v.constructible).map((v) => [v.variant_id, (/phrasing (\d)/.exec(v.construction) || [])[1] || '?']));
const injection = {}; for (const r of V1.rows.filter((x) => x.type === 'V7' && x.arm === 'A2' && x.variant)) { const k = (r.partition === 'evaluation' ? 'evaluation' : 'development') + ':phrasing_' + phrasing.get(r.variant_id); injection[k] = injection[k] || { detected: 0, total: 0 }; injection[k].total++; if (r.variant.instruction_risk === 'detected') injection[k].detected++; }

// ------------------------------------------------------------------ performance, cost, tests, safety
const perf = {}; for (const a of ALL_ARMS) { const ms = R1.rows.filter((r) => r.arm === a && typeof r.ms === 'number').map((r) => r.ms).sort((x, y) => x - y); if (ms.length) perf[a] = { compiles: ms.length, mean_ms: Number((ms.reduce((n, x) => n + x, 0) / ms.length).toFixed(3)), p50_ms: ms[Math.floor(ms.length / 2)], p95_ms: ms[Math.min(ms.length - 1, Math.floor(ms.length * 0.95))], max_ms: ms[ms.length - 1] }; }
const allRunRows = [...R1.rows, ...R2.rows, ...(R3 ? R3.rows : [])];
const allVarRows = [...V1.rows, ...(V2 ? V2.rows : [])];
const safety = { scope_leaks: allRunRows.filter((r) => r.disposition === 'scope_leak').length, technical_failures: allRunRows.filter((r) => r.disposition === 'technical_failure').length + allVarRows.filter((r) => r.disposition === 'technical_failure').length,
  guard_violations: allRunRows.filter((r) => (r.guards || []).length).length + allVarRows.filter((r) => r.variant && (r.variant.guards || []).length).length,
  network_attempts: [R1, R2, R3, V1, V2, T.research, T.regression, T.mutations, T.transport, T.differential, T.recovery, ...Object.values(T.feature)].filter(Boolean).reduce((n, x) => n + (x.network_attempts ?? (x.totals && x.totals.network_attempts) ?? 0), 0) };
const frac = (x) => (x && x.totals ? ratio(x.totals.passed, x.totals.probes || x.totals.tests) : null);
const nonEq = T.mutations.results.filter((r) => r.status !== 'invalid' && r.status !== 'survived_equivalent');
const tests = { research_probes: T.research.totals, regression_probes: T.regression.totals, transport: T.transport.totals, recovery: T.recovery ? T.recovery.totals : 'ABSENT',
  feature_probes: Object.fromEntries(Object.entries(T.feature).map(([v, x]) => [v, x.totals])), differential: T.differential.totals || null,
  mutations: Object.assign({}, T.mutations.totals, { non_equivalent: nonEq.length, killed_by_probes_non_equivalent: nonEq.filter((r) => r.killed_by.includes('probes') || r.killed_by.includes('load_error')).length }) };
const diffFraction = (() => { const d = T.differential.totals || {}; const n = d.inputs || d.compared || d.total; const same = d.identical; return n ? ratio(same, n) : null; })();
const cost = { model_calls: 0, tokens: 0, usd: 0, note: 'Offline study: no model was called.', planned_live: PLAN.totals.base, reviewer_time: 'NOT MEASURED: no reviewer session took place' };

// ------------------------------------------------------------------ criteria
const E = (a, k, f = 'value') => (e1[a] && e1[a].eval_synthetic ? e1[a].eval_synthetic.rates[k][f] : null);
const CE = (a, k) => (controls[a] && controls[a].eval_synthetic ? controls[a].eval_synthetic[k] : null);
const M = {
  scope_leaks: safety.scope_leaks, technical_failures: safety.technical_failures, guard_violations: safety.guard_violations, network_attempts: safety.network_attempts,
  differential_identical_fraction: diffFraction, feature_probes_pass_fraction: frac(T.feature['0.3.3-research-candidate']),
  replay_digest_identical_fraction: (() => { const a = determinism.run1_run2, b = determinism.vrun1_vrun2; return a.compared && b.compared ? ratio(a.identical + b.identical, a.compared + b.compared) : null; })(),
  cross_environment_digest_identical_fraction: determinism.run1_run3_cross_environment.fraction,
  default_engines_correct_refusal_fraction: ratio(R1.rows.filter((r) => ['A0', 'A0b'].includes(r.arm) && r.disposition === 'correct_refusal').length, R1.rows.filter((r) => ['A0', 'A0b'].includes(r.arm) && !String(r.disposition).startsWith('not_run')).length),
  research_out_of_scope_refusal_fraction: ratio(R1.rows.filter((r) => r.arm === 'A2' && group(r) === 'out_of_scope_originals' && r.disposition === 'correct_refusal').length, R1.rows.filter((r) => r.arm === 'A2' && group(r) === 'out_of_scope_originals').length),
  research_incorrect_refusals: R1.rows.filter((r) => RESEARCH_ARMS.includes(r.arm) && r.disposition === 'incorrect_refusal').length,
  'eval_clear_on_ungrounded:A4': E('A4', 'false_reassurance', 'num'), 'eval_clear_on_ungrounded:A4R': E('A4R', 'false_reassurance', 'num'),
  'eval_sensitivity:A3R': E('A3R', 'sensitivity'), 'eval_false_alarm:A3R': E('A3R', 'false_alarm'), 'eval_abstention_grounded_excluding_S:A3R': E('A3R', 'abstention_grounded_excluding_S'),
  'eval_question_pass_fraction_min:A2,A3,A4,A5,A3R,A4R': (() => { let m = null; for (const a of RESEARCH_ARMS) for (const q of Object.values((questions[a] || {}).eval_synthetic || {})) m = Math.min(m === null ? 1 : m, q.pass / q.total); return m === null ? null : Number(m.toFixed(4)); })(),
  control_span_links_valid_fraction: (() => { let v = 0, n = 0; for (const a of RESEARCH_ARMS) for (const g of Object.values(controls[a])) { v += g.span_links_valid_graphs; n += g.graphs; } return ratio(v, n); })(),
  control_contradictions: (() => { let n = 0; for (const a of RESEARCH_ARMS) for (const g of Object.values(controls[a])) n += g.contradictions; return n; })(),
  'eval_controls_per_grounded_record_mean:A3R': CE('A3R', 'controls_per_clean_grounded_record'), 'eval_redundant_controls:A3R': CE('A3R', 'redundant_same_defect'), 'eval_detect_validity:A3R': CE('A3R', 'detect_validity'),
  regression_probes_pass_fraction: frac(T.regression), research_probes_pass_fraction: frac(T.research),
  mutation_kill_fraction_by_probes_non_equivalent: ratio(tests.mutations.killed_by_probes_non_equivalent, tests.mutations.non_equivalent), transport_tests_pass_fraction: frac(T.transport),
};
const op = (o, x, v) => (x === null || x === undefined ? null : o === '==' ? x === v : o === '>=' ? x >= v : o === '<=' ? x <= v : null);
const criteria = AC.criteria.map((c) => {
  if (c.per_type) { const res = Object.entries(c.per_type).map(([t, thr]) => { const v = variants.evaluation && variants.evaluation[t] && variants.evaluation[t].A3R; const x = v ? v.fraction : null; return { type: t, value: x, threshold: thr, pass: x === null ? null : x >= thr }; });
    return { id: c.id, area: c.area, metric: c.metric, per_type: res, pass: res.some((r) => r.pass === false) ? false : res.every((r) => r.pass === true) ? true : null, prediction: c.prediction }; }
  const x = M[c.metric]; return { id: c.id, area: c.area, metric: c.metric, value: x === undefined ? null : x, op: c.op, threshold: c.value, pass: op(c.op, x, c.value), prediction: c.prediction };
});

const out = { format: 'jrs-study-156-analysis/1.0.0', built_at_utc: new Date().toISOString(), run_labels: LB, release_status: 'NO_GO_NOT_VERIFIED', b018: 'OPEN', criteria_status: AC.status,
  statement: 'Offline mechanical study with mock candidate policies; no model was run. Every rate compares Engine output with an AI-authored or LLM-reproduced reference. It is agreement, not accuracy. No partition is a holdout.',
  inputs, dispositions: { by_arm_run1: byArm(R1), record_summary: dispSummary, records }, e1, questions, controls, controls_unavailable_rows: unavailable, determinism, variants, injection_detection_A2: injection, performance: perf, cost, tests, safety, metrics: M, criteria };
mkdirSync(OUTDIR, { recursive: true });
writeFileSync(OUTJ, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });

// ------------------------------------------------------------------ tables (markdown)
const pct = (x) => (x === null || x === undefined ? 'n/a' : (x * 100).toFixed(1) + '%');
const ci = (b) => (b ? ' [' + pct(b.lower_2_5) + ', ' + pct(b.upper_97_5) + ']' : '');
const L = ['# Analysis Tables (generated by tools/analyze.mjs)', '', 'Generated ' + out.built_at_utc + ' from ' + Object.values(LB).join(', ') + '. Agreement with AI-authored or LLM-reproduced references; not accuracy. Intervals in brackets: family-cluster bootstrap over ' + ((e1.A3R && e1.A3R.eval_synthetic && e1.A3R.eval_synthetic.bootstrap.sensitivity) || {}).clusters + ' evaluation families; coarse.', ''];
L.push('## 1. Dispositions, run-1 (rows per arm)', '', '| Arm | ' + ['substantive_mock', 'partial', 'correct_refusal', 'incorrect_refusal', 'backstop_passed', 'not_assessed:no_candidate', 'technical_failure', 'scope_leak', 'not_run:scope_decision_SC1_required', 'not_run:source_text_not_held'].join(' | ') + ' |', '|' + '---|'.repeat(11));
for (const a of ALL_ARMS) { const d = out.dispositions.by_arm_run1[a] || {}; L.push('| ' + a + ' | ' + ['substantive_mock', 'partial', 'correct_refusal', 'incorrect_refusal', 'backstop_passed', 'not_assessed:no_candidate', 'technical_failure', 'scope_leak', 'not_run:scope_decision_SC1_required', 'not_run:source_text_not_held'].map((k) => d[k] || 0).join(' | ') + ' |'); }
L.push('', '**Per-record summary (156 records):**', '', '| Disposition | Records |', '|---|---|', ...Object.entries(dispSummary).map(([k, v]) => '| ' + k + ' | ' + v + ' |'), '');
for (const gname of ['eval_synthetic', 'dev_synthetic', 'dev_originals']) {
  L.push('## 2. E1 agreement: ' + gname, '', '| Arm | UNGROUNDED F/C/I/N | GROUNDED F/C/I/N | Sensitivity | False alarm | False reassurance | Precision | Abstention | Coverage |', '|---|---|---|---|---|---|---|---|---|');
  for (const a of MOCK_ARMS) { const b = e1[a] && e1[a][gname]; if (!b) continue; const c = (k) => { const x = b.counts[k] || {}; return [x.FLAG || 0, x.CLEAR || 0, x.INDETERMINATE || 0, x.NOT_ASSESSED || 0].join('/'); };
    const r = b.rates; L.push('| ' + a + ' | ' + c('UNGROUNDED') + ' | ' + c('GROUNDED') + ' | ' + r.sensitivity.num + '/' + r.sensitivity.den + ' ' + pct(r.sensitivity.value) + ci(b.bootstrap.sensitivity) + ' | ' + r.false_alarm.num + '/' + r.false_alarm.den + ' ' + pct(r.false_alarm.value) + ci(b.bootstrap.false_alarm) + ' | ' + r.false_reassurance.num + '/' + r.false_reassurance.den + ' ' + pct(r.false_reassurance.value) + ' | ' + pct(r.precision.value) + ' | ' + pct(r.abstention.value) + ' | ' + pct(r.coverage.value) + ' |'); }
  L.push('');
}
L.push('## 3. Question checks (evaluation partition)', '', '| Arm | Q1 | Q2 | Q3 | Q4 |', '|---|---|---|---|---|');
for (const a of ALL_ARMS) { const q = (questions[a] || {}).eval_synthetic; if (!q) continue; L.push('| ' + a + ' | ' + ['q1', 'q2', 'q3', 'q4'].map((k) => (q[k] ? q[k].pass + '/' + q[k].total : 'n/a')).join(' | ') + ' |'); }
L.push('', '## 4. Cognitive controls (evaluation partition)', '', '| Arm | Graphs | Controls | Per clean grounded record | Redundant | Contradictions | Span links valid | Detect validity | Flaw controls valid/false |', '|---|---|---|---|---|---|---|---|---|');
for (const a of [...RESEARCH_ARMS, 'A6']) { const s = controls[a] && controls[a].eval_synthetic; if (!s) continue; L.push('| ' + a + ' | ' + s.graphs + ' | ' + s.controls + ' | ' + s.controls_per_clean_grounded_record + ' | ' + s.redundant_same_defect + ' | ' + s.contradictions + ' | ' + pct(s.span_links_valid_fraction) + ' | ' + pct(s.detect_validity) + ' | ' + s.flaw_controls_valid + '/' + s.flaw_controls_false + ' |'); }
L.push('', '## 5. Variants (evaluation partition): relation held / variants', '', '| Type | ' + ['A2', 'A3', 'A4', 'A3R', 'A4R'].join(' | ') + ' |', '|---|---|---|---|---|---|');
for (const t of ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8']) { const row = (variants.evaluation || {})[t] || {}; L.push('| ' + t + ' | ' + ['A2', 'A3', 'A4', 'A3R', 'A4R'].map((a) => (row[a] ? row[a].pass + '/' + row[a].total : 'n/a')).join(' | ') + ' |'); }
L.push('', '## 6. Determinism', '', '| Comparison | Compared | Identical |', '|---|---|---|');
for (const [k, v] of Object.entries(determinism).filter(([k]) => k !== 'environments')) L.push('| ' + k + ' | ' + v.compared + ' | ' + v.identical + ' (' + pct(v.fraction) + ') |');
L.push('', '## 7. Proposed acceptance criteria (owner approval NOT GIVEN)', '', '| ID | Metric | Value | Threshold | Result | Prediction |', '|---|---|---|---|---|---|');
for (const c of criteria) L.push('| ' + c.id + ' | ' + c.metric + ' | ' + (c.per_type ? c.per_type.map((x) => x.type + ' ' + pct(x.value)).join(', ') : JSON.stringify(c.value)) + ' | ' + (c.per_type ? c.per_type.map((x) => x.type + ' ' + pct(x.threshold)).join(', ') : c.op + ' ' + c.threshold) + ' | ' + (c.pass === true ? 'met' : c.pass === false ? 'NOT MET' : 'not evaluable') + ' | ' + c.prediction + ' |');
writeFileSync(OUTM, L.join('\n') + '\n', { flag: 'wx' });
console.log('criteria met', criteria.filter((c) => c.pass === true).length, 'not met', criteria.filter((c) => c.pass === false).length, 'not evaluable', criteria.filter((c) => c.pass === null).length);
