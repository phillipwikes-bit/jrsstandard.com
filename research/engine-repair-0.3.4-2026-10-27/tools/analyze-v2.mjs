// 0.3.4 repair package: pre-specified analysis 2.0, written and frozen before the scored runs. Reads run outputs and
// test results; runs no Engine. Derived from the study's tools/analyze.mjs 1.0 (unchanged there): the same E1, question,
// control, determinism and variant computations, plus the 0.3.3 comparison, the repair suites, and the proposed
// criteria S156-AC-2.0 (owner approval NOT GIVEN).
// Every study record, variant and suite construction is exposed development material for 0.3.4
// (registers/EXPOSURE_REGISTER.json). Every rate below is development evidence: agreement with an AI-authored or
// LLM-reproduced reference on material the rule author has seen. None is accuracy, and none is evaluation evidence.
// Criteria that apply only to fresh evaluation material are reported as NOT EVALUABLE, with their development value.
// Usage: node tools/analyze-v2.mjs [--r1=run-1 --r2=run-2 --r3=run-3 --v1=vrun-1 --v2=vrun-2 --out=reports]
//   (writes <out>/ANALYSIS_V2.json and <out>/ANALYSIS_TABLES_V2.md; refuses to overwrite)
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const STUDY = join(PKG, '..', 'study-156-2026-10-27');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const OPT = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const LB = { r1: OPT.r1 || 'run-1', r2: OPT.r2 || 'run-2', r3: OPT.r3 || 'run-3', v1: OPT.v1 || 'vrun-1', v2: OPT.v2 || 'vrun-2' };
const OUTDIR = OPT.out ? (OPT.out.startsWith('/') ? OPT.out : join(PKG, OPT.out)) : join(PKG, 'reports');
const OUTJ = join(OUTDIR, 'ANALYSIS_V2.json'), OUTM = join(OUTDIR, 'ANALYSIS_TABLES_V2.md');
for (const f of [OUTJ, OUTM]) if (existsSync(f)) { console.error(f + ' exists; it is preserved, not rebuilt'); process.exit(2); }
const inputs = {};
const load = (base, rel, optional = false) => { const p = join(base, rel); const key = (base === STUDY ? 'study:' : '') + rel; if (!existsSync(p)) { if (optional) { inputs[key] = 'ABSENT'; return null; } throw new Error('missing input ' + key); } const b = readFileSync(p); inputs[key] = sha(b); return JSON.parse(b.toString('utf8')); };
const L = (rel, optional) => load(PKG, rel, optional);
const C4 = '0.3.4-research-candidate', C3 = '0.3.3-research-candidate';
const R1 = L('out/' + LB.r1 + '/RESULTS.json'), R2 = L('out/' + LB.r2 + '/RESULTS.json'), R3 = L('out/' + LB.r3 + '/RESULTS.json', true);
const V1 = L('out/' + LB.v1 + '/RESULTS.json'), V2 = L('out/' + LB.v2 + '/RESULTS.json', true);
const T = { regression: L('out/regression-probes-v2-' + C4 + '/RESULTS.json'), regression033: L('out/regression-probes-v2-' + C3 + '/RESULTS.json', true), suites: L('out/study-suites-' + C4 + '/RESULTS.json'),
  differential: L('out/differential-' + C4 + '/DIFFERENTIAL_DEFAULT_PATH.json'), mutations: L('out/mutations-v2/RESULTS.json'), transport: L('out/transport/RESULTS.json'), recovery: L('out/recovery-v2/RESULTS.json', true),
  paired4: L('out/paired-' + C4 + '/RESULTS.json'), paired3: L('out/paired-' + C3 + '/RESULTS.json', true), inj4: L('out/injection-' + C4 + '/RESULTS.json'), inj3: L('out/injection-' + C3 + '/RESULTS.json', true),
  wd4: L('out/wording-' + C4 + '/RESULTS.json'), wd3: L('out/wording-' + C3 + '/RESULTS.json', true), ctl4: L('out/controls-' + C4 + '/RESULTS.json'), ctl3: L('out/controls-' + C3 + '/RESULTS.json', true),
  corrected: L('out/corrected-v5-0.3.3/RESULTS.json', true), vcheck: L('out/variant-spec-v2-check/RESULTS.json', true), repro: L('out/reproduction-0.3.3/RESULTS.json', true) };
const AC = L('protocol/ACCEPTANCE_CRITERIA_V2_PROPOSED.json'), TC = L('registers/TOOL_CORRECTIONS.json'), LABELS = L('registers/LABEL_STATUS_REGISTER.json');
const SA = load(STUDY, 'reports/ANALYSIS.json');
const RESEARCH_ARMS = ['A2', 'A3', 'A4', 'A5', 'A3R', 'A4R', 'ADV'], MOCK_ARMS = ['A3', 'A4', 'A5', 'A3R', 'A4R', 'ADV', 'A6', 'A6c'], ALL_ARMS = ['A0', 'A0b', 'A0c', 'A1', 'A2', 'A3', 'A4', 'A5', 'A3R', 'A4R', 'ADV', 'A6', 'A6c'];
const group = (r) => r.cohort === 'synthetic_record' ? (r.partition === 'development' ? 'dev_synthetic' : 'eval_synthetic') : r.cohort === 'original_study_record' ? (r.scope_class === 'NOT_EXCLUDED' ? 'dev_originals' : 'out_of_scope_originals') : 'public_cases';
const GROUPS = ['dev_synthetic', 'eval_synthetic', 'dev_originals', 'all_eligible'];
const inGroup = (r, g) => g === 'all_eligible' ? ['dev_synthetic', 'eval_synthetic', 'dev_originals'].includes(group(r)) : group(r) === g;
const cluster = (r) => r.family || (r.cohort === 'original_study_record' ? 'ORIG' : 'PUB');
const ratio = (a, b) => (b ? Number((a / b).toFixed(4)) : null);

// ------------------------------------------------------------------ seeded family-cluster bootstrap (as 1.0)
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function clusterBootstrap(rows, num, den, B = 10000, seed = 156) {
  const fams = [...new Set(rows.map(cluster))].sort();
  if (fams.length < 2) return null;
  const by = Object.fromEntries(fams.map((f) => [f, rows.filter((r) => cluster(r) === f)]));
  const rnd = mulberry32(seed), vals = [];
  for (let b = 0; b < B; b++) { let n = 0, d = 0; for (let k = 0; k < fams.length; k++) { const f = fams[Math.floor(rnd() * fams.length)]; for (const r of by[f]) { if (den(r)) { d++; if (num(r)) n++; } } } if (d) vals.push(n / d); }
  if (!vals.length) return null;
  vals.sort((a, b) => a - b);
  const q = (p) => Number(vals[Math.min(vals.length - 1, Math.floor(p * vals.length))].toFixed(4));
  return { clusters: fams.length, resamples: B, seed, lower_2_5: q(0.025), upper_97_5: q(0.975), note: 'Families resampled with replacement; with ' + fams.length + ' clusters the interval is coarse, and every family is exposed.' };
}

// ------------------------------------------------------------------ dispositions and the 156-record accounting (study definitions)
const byArm = (R) => { const o = {}; for (const r of R.rows) { o[r.arm] = o[r.arm] || {}; o[r.arm][r.disposition] = (o[r.arm][r.disposition] || 0) + 1; } return o; };
const recordRows = new Map();
for (const r of R1.rows) { if (!recordRows.has(r.id)) recordRows.set(r.id, { id: r.id, cohort: r.cohort, family: r.family || null, type: r.type || null, reference: r.reference || null, scope_class: r.scope_class, partition: r.partition }); recordRows.get(r.id)[r.arm] = r.disposition; }
const recordDisposition = (x) => x.cohort === 'public_case' ? 'not_run: source text not held; retrieval needs authorization; rights and privacy NOT ESTABLISHED'
  : group(x) === 'out_of_scope_originals' ? (x.A2 === 'correct_refusal' ? 'correct_refusal (research profile); mock arms not run: scope decision SC-1 required' : 'UNEXPECTED: ' + x.A2)
    : ['A3', 'A4', 'A5', 'A3R', 'A4R'].every((a) => x[a] === 'substantive_mock') ? 'substantive (mock candidates, every research arm)'
      : ['A3', 'A4', 'A5', 'A3R', 'A4R'].some((a) => x[a] === 'technical_failure') ? 'technical_failure in at least one research arm'
        : 'partial in at least one research arm (' + ['A3', 'A4', 'A5', 'A3R', 'A4R'].filter((a) => x[a] === 'partial').join(', ') + ')';
const records = [...recordRows.values()].map((x) => Object.assign(x, { record_disposition: recordDisposition(x) }));
const dispSummary = {}; for (const x of records) { const k = x.record_disposition.replace(/ \(A.*$/, ''); dispSummary[k] = (dispSummary[k] || 0) + 1; }

// ------------------------------------------------------------------ E1 agreement (as 1.0)
const scored = (R) => R.rows.filter((r) => r.e1);
function e1Block(rows) {
  const counts = {}; for (const r of rows) { counts[r.reference] = counts[r.reference] || { FLAG: 0, CLEAR: 0, INDETERMINATE: 0, NOT_ASSESSED: 0 }; counts[r.reference][r.e1]++; }
  const U = rows.filter((r) => r.reference === 'UNGROUNDED'), G = rows.filter((r) => r.reference === 'GROUNDED'), F = rows.filter((r) => r.e1 === 'FLAG'), GnS = G.filter((r) => r.type !== 'S');
  const abst = (x) => ['INDETERMINATE', 'NOT_ASSESSED'].includes(x.e1);
  const rates = { sensitivity: { value: ratio(U.filter((r) => r.e1 === 'FLAG').length, U.length), num: U.filter((r) => r.e1 === 'FLAG').length, den: U.length },
    false_alarm: { value: ratio(G.filter((r) => r.e1 === 'FLAG').length, G.length), num: G.filter((r) => r.e1 === 'FLAG').length, den: G.length },
    false_reassurance: { value: ratio(U.filter((r) => r.e1 === 'CLEAR').length, U.length), num: U.filter((r) => r.e1 === 'CLEAR').length, den: U.length },
    precision: { value: ratio(F.filter((r) => r.reference === 'UNGROUNDED').length, F.length), num: F.filter((r) => r.reference === 'UNGROUNDED').length, den: F.length },
    abstention: { value: ratio(rows.filter(abst).length, rows.length), num: rows.filter(abst).length, den: rows.length },
    abstention_grounded_excluding_S: { value: ratio(GnS.filter(abst).length, GnS.length), num: GnS.filter(abst).length, den: GnS.length },
    coverage: { value: ratio(rows.filter((r) => ['FLAG', 'CLEAR'].includes(r.e1)).length, rows.length), num: rows.filter((r) => ['FLAG', 'CLEAR'].includes(r.e1)).length, den: rows.length } };
  const boot = { sensitivity: clusterBootstrap(rows, (r) => r.e1 === 'FLAG', (r) => r.reference === 'UNGROUNDED'), false_alarm: clusterBootstrap(rows, (r) => r.e1 === 'FLAG', (r) => r.reference === 'GROUNDED'),
    false_reassurance: clusterBootstrap(rows, (r) => r.e1 === 'CLEAR', (r) => r.reference === 'UNGROUNDED') };
  const by_family = {}; for (const r of rows) { const f = cluster(r); by_family[f] = by_family[f] || {}; const k = r.reference + ':' + r.e1; by_family[f][k] = (by_family[f][k] || 0) + 1; }
  const by_type = {}; for (const r of rows) { const t = r.type || 'original'; by_type[t] = by_type[t] || {}; by_type[t][r.e1] = (by_type[t][r.e1] || 0) + 1; }
  const grounded_flags = G.filter((r) => r.e1 === 'FLAG').map((r) => r.id), ungrounded_not_flagged = U.filter((r) => r.e1 !== 'FLAG').map((r) => r.id + ':' + r.e1);
  return { records: rows.length, counts, rates, bootstrap: boot, by_family, by_type, grounded_flags, ungrounded_not_flagged };
}
const e1 = {};
for (const a of ALL_ARMS) { e1[a] = {}; for (const g of GROUPS) { const rows = scored(R1).filter((r) => r.arm === a && inGroup(r, g)); if (rows.length) e1[a][g] = e1Block(rows); } }

// ------------------------------------------------------------------ question checks (as 1.0)
const questions = {};
for (const a of ALL_ARMS) { questions[a] = {}; for (const g of ['dev_synthetic', 'eval_synthetic']) { const q = {}; for (const r of R1.rows.filter((x) => x.arm === a && inGroup(x, g) && x.e2)) for (const [k, v] of Object.entries(r.e2)) { q[k] = q[k] || { pass: 0, total: 0, failed: [] }; q[k].total++; if (v.pass) q[k].pass++; else q[k].failed.push(r.id); } if (Object.keys(q).length) questions[a][g] = q; } }

// ------------------------------------------------------------------ cognitive controls (as 1.0; the defect names are unchanged in 0.3.4)
const FLAW = new Set(['no_identifiable_basis_evidence', 'conclusion_without_identifiable_basis', 'conclusion_without_stated_basis', 'conclusion_restated_as_basis', 'authority_reference_without_linked_facts', 'no_locatable_conclusion', 'same_event_date_conflict', 'decision_outcome_conflict']);
const SIGNATURE = { U: 'no_identifiable_basis_evidence', A: 'authority_reference_without_linked_facts', C: 'conclusion_restated_as_basis', M: 'conclusion_without_identifiable_basis', S: 'same_event_date_conflict' };
const DATE = /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b|\b\d{4}-\d{2}-\d{2}\b/;
const inv = JSON.parse(readFileSync(join(STUDY, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
const textOf = new Map(inv.entries.filter((e) => e.full_text_available).map((e) => [e.source_id, readFileSync(join(STUDY, '..', '..', e.extracted_text_path), 'utf8')]));
function controlsBlock(rows) {
  const s = { graphs: rows.length, controls: 0, words: 0, withheld: 0, redundant_same_defect: 0, span_linked: 0, span_links_valid_graphs: 0, contradictions: 0,
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
  s.span_linked_fraction = ratio(s.span_linked, s.controls);
  s.words_per_graph = ratio(s.words, s.graphs);
  return s;
}
const controls = {};
for (const a of [...RESEARCH_ARMS, 'A6', 'A6c']) { controls[a] = {}; for (const g of GROUPS) { const rows = R1.rows.filter((r) => r.arm === a && inGroup(r, g) && r.controls); if (rows.length) controls[a][g] = controlsBlock(rows); } }

// ------------------------------------------------------------------ determinism: compiler only (scripted candidates are fixed files; model variability is NOT TESTED)
function compareRuns(A, B, keyOf, digestOf) {
  if (!A || !B) return { compared: 0, identical: 0, fraction: null, note: 'input absent' };
  const m = new Map(B.rows.map((r) => [keyOf(r), r]));
  let compared = 0, identical = 0, dispSame = 0; const differ = [];
  for (const r of A.rows) { const o = m.get(keyOf(r)); const d1 = digestOf(r); if (!o || !d1) continue; compared++; if (d1 === digestOf(o)) identical++; else differ.push(keyOf(r)); if (r.disposition === o.disposition) dispSame++; }
  return { compared, identical, fraction: ratio(identical, compared), dispositions_same: dispSame, differing: differ.slice(0, 20) };
}
const determinism = { run1_run2: compareRuns(R1, R2, (r) => r.arm + '/' + r.id, (r) => r.graph_digest), run1_run3_cross_environment: compareRuns(R1, R3, (r) => r.arm + '/' + r.id, (r) => r.graph_digest),
  vrun1_vrun2: compareRuns(V1, V2, (r) => r.arm + '/' + r.variant_id, (r) => r.variant && r.variant.graph_digest), environments: { run1: R1.environment || null, run2: R2.environment || null, run3: R3 ? R3.environment || null : null },
  scope: 'Compiler determinism on fixed inputs. Scripted-candidate changes are measured separately (paired suite, variants). Model variability is NOT TESTED: no model was run.' };

// ------------------------------------------------------------------ variants (as 1.0, plus the irrelevant-addition view)
const vpart = (r) => (r.partition === 'evaluation' ? 'evaluation' : r.partition === 'development' ? 'development' : 'original');
const variants = {};
for (const r of V1.rows) {
  for (const p of [vpart(r), 'all']) {
    variants[p] = variants[p] || {}; variants[p][r.type] = variants[p][r.type] || {}; const v = variants[p][r.type][r.arm] = variants[p][r.type][r.arm] || { pass: 0, total: 0, not_constructible: 0, clear_on_ungrounded: 0, failed_checks: {}, failures_by_base_reference: {}, failures_by_base_type: {} };
    if (r.disposition === 'not_constructible') { v.not_constructible++; continue; }
    v.total++; if (r.relation.pass) v.pass++; else { for (const c of r.relation.checks.filter((x) => !x.pass)) v.failed_checks[c.name] = (v.failed_checks[c.name] || 0) + 1; v.failures_by_base_reference[r.base_reference] = (v.failures_by_base_reference[r.base_reference] || 0) + 1; const t = r.base_construction_type || 'original'; v.failures_by_base_type[t] = (v.failures_by_base_type[t] || 0) + 1; }
    if (r.base_reference === 'UNGROUNDED' && r.variant && r.variant.e1 === 'CLEAR') v.clear_on_ungrounded++;
  }
}
for (const p of Object.values(variants)) for (const t of Object.values(p)) for (const v of Object.values(t)) v.fraction = ratio(v.pass, v.total);
const irrelevantAddition = {};
for (const r of V1.rows.filter((x) => (x.type === 'V2' || x.type === 'V6') && x.disposition !== 'not_constructible' && x.base_reference === 'UNGROUNDED')) {
  const k = r.type + '/' + r.arm; const t = irrelevantAddition[k] = irrelevantAddition[k] || { n: 0, base_flag: 0, variant_flag: 0, flag_lost: 0, clear: 0, newly_supported_via_inserted: 0 };
  t.n++; if (r.base.e1 === 'FLAG') t.base_flag++; if (r.variant.e1 === 'FLAG') t.variant_flag++; if (r.base.e1 === 'FLAG' && r.variant.e1 !== 'FLAG') t.flag_lost++; if (r.variant.e1 === 'CLEAR') t.clear++; if ((r.newly_supported_via_inserted || []).length) t.newly_supported_via_inserted++;
}
const vfileText = readFileSync(join(PKG, 'variants-v2', 'VARIANTS_V2.jsonl')); inputs['variants-v2/VARIANTS_V2.jsonl'] = sha(vfileText);
const phrasing = new Map(vfileText.toString('utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((v) => v.type === 'V7' && v.constructible).map((v) => [v.variant_id, (/phrasing (\d)/.exec(v.construction) || [])[1] || '?']));
const injection = {}; for (const r of V1.rows.filter((x) => x.type === 'V7' && x.arm === 'A2' && x.variant)) { const k = vpart(r) + ':phrasing_' + phrasing.get(r.variant_id); injection[k] = injection[k] || { detected: 0, total: 0 }; injection[k].total++; if (r.variant.instruction_risk === 'detected') injection[k].detected++; }

// ------------------------------------------------------------------ default path
const defaultPath = { rows: R1.rows.filter((r) => r.equals_arm).length, equal: R1.rows.filter((r) => r.equals_arm && r.default_path_equal).length,
  differing: R1.rows.filter((r) => r.equals_arm && !r.default_path_equal).map((r) => r.arm + '/' + r.id), A0c: byArm(R1).A0c || {}, A6c: byArm(R1).A6c || {} };

// ------------------------------------------------------------------ suites
const pairedTally = (P) => { if (!P) return null; const t = {}; for (const r of P.rows) { const k = r.reference + '/' + r.kind + '/' + (r.arm || '-'); const x = t[k] = t[k] || { n: 0, pass: 0, fail: 0, not_constructible: 0, clear: 0, flag: 0, flag_lost: 0 };
  x.n++; if (!r.constructible) { x.not_constructible++; continue; } if (r.pass === true) x.pass++; if (r.pass === false) x.fail++; if (r.variant_e1 === 'CLEAR') x.clear++; if (r.variant_e1 === 'FLAG') x.flag++; if (r.base_e1 === 'FLAG' && r.variant_e1 !== 'FLAG') x.flag_lost++; } return t; };
const injSummary = (I) => { if (!I) return null; const rows = I.rows; const att = rows.filter((r) => r.category !== 'benign_discussion'), ben = rows.filter((r) => r.category === 'benign_discussion');
  const flawDet = att.filter((r) => r.detected && r.reference === 'UNGROUNDED' && r.compiles.ORACLE_R.base_e1 === 'FLAG');
  return { attack_rows: att.length, detected: att.filter((r) => r.detected).length, detection_fraction: ratio(att.filter((r) => r.detected).length, att.length),
    missed_cases: [...new Set(att.filter((r) => !r.detected).map((r) => r.case))].sort(), quarantined_fraction: ratio(att.filter((r) => r.quarantined).length, att.length),
    injected_anchor_counted: att.filter((r) => r.injected_anchors_counted.length).length, obeying_candidate_clear: rows.filter((r) => r.compiles['OBEY-SUPPORT'].instruction_followed_in_output).length,
    suppress_hid_flag: rows.filter((r) => r.compiles['OBEY-SUPPRESS'].instruction_followed_in_output).length, format_change_accepted: rows.filter((r) => r.compiles['OBEY-FORMAT'].instruction_followed_in_output).length,
    flag_kept_when_detected: { kept: flawDet.filter((r) => r.compiles.ORACLE_R.e1 === 'FLAG').length, of: flawDet.length, fraction: ratio(flawDet.filter((r) => r.compiles.ORACLE_R.e1 === 'FLAG').length, flawDet.length) },
    benign_rows: ben.length, benign_detected: ben.filter((r) => r.detected).length, benign_detected_fraction: ratio(ben.filter((r) => r.detected).length, ben.length), benign_detected_cases: [...new Set(ben.filter((r) => r.detected).map((r) => r.case))].sort(),
    by_category: I.by_category }; };
const wdSummary = (W) => { if (!W) return null; const cap = W.rows.filter((r) => r.class === 'capability'), bnd = W.rows.filter((r) => r.class === 'boundary');
  return { capability: cap.length, capability_as_intended: cap.filter((r) => r.ok).length, capability_failed: cap.filter((r) => !r.ok).map((r) => r.id), boundary: bnd.length, boundary_missed_as_recorded: bnd.filter((r) => r.ok).length, boundary_unexpectedly_handled: bnd.filter((r) => !r.ok).map((r) => r.id) }; };
const ctlSummary = (Cx) => { if (!Cx) return null; let controls = 0, linked = 0, ungrounded = 0, graphs = 0, redundant = 0; for (const s of Object.values(Cx.summary)) { controls += s.controls; linked += s.span_linked; ungrounded += s.ungrounded_controls || 0; graphs += s.graphs; redundant += s.redundant_same_defect; }
  return { graphs, controls, span_linked: linked, controls_with_record_passage_fraction: ratio(linked, controls), ungrounded_controls: ungrounded, redundant_same_defect: redundant, by_arm_partition: Cx.summary }; };
const nonEq = T.mutations.results.filter((r) => r.status !== 'invalid' && r.status !== 'survived_equivalent');
const byTests = (r) => r.killed_by.some((k) => ['probes', 'paired', 'load_error', 'run_error'].includes(k));
const repairMutants = nonEq.filter((r) => /^MV-/.test(r.id));   // MV-xx target the 0.3.4 repairs; MU-xx-p are the study's mutants, ported
const tests = { regression_probes_v2: T.regression.totals, regression_probes_v2_on_0_3_3: T.regression033 ? Object.assign({}, T.regression033.totals, { failed_ids: T.regression033.results.filter((r) => !r.ok).map((r) => r.id + ' ' + r.defect) }) : 'ABSENT',
  study_suites_on_0_3_4: T.suites.totals, differential: T.differential.totals, transport: T.transport.totals, recovery: T.recovery ? T.recovery.totals : 'ABSENT',
  mutations: Object.assign({}, T.mutations.totals, { non_equivalent: nonEq.length, killed_by_tests_non_equivalent: nonEq.filter(byTests).length, repair_mutants: repairMutants.length,
    repair_mutants_not_killed_by_a_test: repairMutants.filter((r) => !byTests(r)).map((r) => r.id), survivors: nonEq.filter((r) => r.status === 'survived').map((r) => r.id), equivalent: T.mutations.results.filter((r) => r.status === 'survived_equivalent').map((r) => r.id) }),
  paired: { '0.3.4': pairedTally(T.paired4), '0.3.3': pairedTally(T.paired3) }, injection: { '0.3.4': injSummary(T.inj4), '0.3.3': injSummary(T.inj3) },
  wording: { '0.3.4': wdSummary(T.wd4), '0.3.3': wdSummary(T.wd3) }, controls_suite: { '0.3.4': ctlSummary(T.ctl4), '0.3.3': ctlSummary(T.ctl3) },
  corrected_v5_0_3_3: T.corrected ? T.corrected.totals : 'ABSENT', variant_spec_check: T.vcheck ? T.vcheck.totals : 'ABSENT', reproduction_0_3_3: T.repro ? { cases: (T.repro.cases || []).length, network_attempts: T.repro.network_attempts } : 'ABSENT' };

// ------------------------------------------------------------------ comparison with the frozen 0.3.3 study analysis (same records, same scoring; different mocks only for -R arms)
const cmp = {};
for (const a of ['A3', 'A4', 'A5', 'A3R', 'A4R']) for (const g of ['dev_synthetic', 'eval_synthetic', 'dev_originals']) {
  const s = SA.e1 && SA.e1[a] && SA.e1[a][g], n = e1[a] && e1[a][g];
  if (s || n) cmp[a + '/' + g] = Object.fromEntries(['sensitivity', 'false_alarm', 'false_reassurance', 'abstention'].map((k) => [k, { '0.3.3': s ? s.rates[k] : null, '0.3.4': n ? n.rates[k] : null }]));
}
const cmpVariants = {};
for (const p of ['development', 'evaluation']) for (const t of ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8']) for (const a of ['A2', 'A3', 'A4', 'A3R', 'A4R']) {
  const s = SA.variants && SA.variants[p] && SA.variants[p][t] && SA.variants[p][t][a], n = variants[p] && variants[p][t] && variants[p][t][a];
  cmpVariants[p + '/' + t + '/' + a] = { '0.3.3': s ? { pass: s.pass, total: s.total } : null, '0.3.4': n ? { pass: n.pass, total: n.total, clear_on_ungrounded: n.clear_on_ungrounded } : null, note: t === 'V5' ? '0.3.3 used generator 1.0 (HF-05); 0.3.4 uses 2.0; see tests.corrected_v5_0_3_3' : undefined };
}

// ------------------------------------------------------------------ performance and safety
const perf = {}; for (const a of ALL_ARMS) { const ms = R1.rows.filter((r) => r.arm === a && typeof r.ms === 'number').map((r) => r.ms).sort((x, y) => x - y); if (ms.length) perf[a] = { compiles: ms.length, mean_ms: Number((ms.reduce((n, x) => n + x, 0) / ms.length).toFixed(3)), p50_ms: ms[Math.floor(ms.length / 2)], p95_ms: ms[Math.min(ms.length - 1, Math.floor(ms.length * 0.95))], max_ms: ms[ms.length - 1] }; }
const allRunRows = [R1, R2, R3].filter(Boolean).flatMap((R) => R.rows), allVarRows = [V1, V2].filter(Boolean).flatMap((R) => R.rows);
const netInputs = [R1, R2, R3, V1, V2, T.regression, T.regression033, T.suites, T.mutations, T.transport, T.differential, T.recovery, T.paired4, T.paired3, T.inj4, T.inj3, T.wd4, T.wd3, T.ctl4, T.ctl3, T.corrected, T.repro].filter(Boolean);
const safety = { scope_leaks: allRunRows.filter((r) => r.disposition === 'scope_leak').length, technical_failures: allRunRows.filter((r) => r.disposition === 'technical_failure').length + allVarRows.filter((r) => r.disposition === 'technical_failure').length,
  guard_violations: allRunRows.filter((r) => (r.guards || []).length).length + allVarRows.filter((r) => r.variant && (r.variant.guards || []).length).length,
  network_attempts: netInputs.reduce((n, x) => n + (x.network_attempts ?? (x.totals && x.totals.network_attempts) ?? x.network_attempts_parent ?? 0), 0), network_inputs_counted: netInputs.length };
const cost = { model_calls: 0, tokens: 0, usd: 0, note: 'Offline: no model was called. The live preflight is proposed, not run (protocol/LIVE_PREFLIGHT_PROPOSAL.md).', reviewer_time: 'NOT MEASURED: no reviewer session took place' };

// ------------------------------------------------------------------ metrics for S156-AC-2.0-proposed
const E = (a, k, g = 'all_eligible', f = 'value') => (e1[a] && e1[a][g] ? e1[a][g].rates[k][f] : null);
const CE = (a, k, g = 'all_eligible') => (controls[a] && controls[a][g] ? controls[a][g][k] : null);
const frac = (x) => (x && x.totals ? ratio(x.totals.passed, x.totals.probes || x.totals.tests) : null);
const qmin = (g) => { let m = null; for (const a of ['A2', 'A3', 'A4', 'A5', 'A3R', 'A4R']) for (const q of Object.values((questions[a] || {})[g] || {})) m = Math.min(m === null ? 1 : m, q.pass / q.total); return m === null ? null : Number(m.toFixed(4)); };
const qminAll = (() => { const vals = ['dev_synthetic', 'eval_synthetic'].map(qmin).filter((x) => x !== null); return vals.length ? Math.min(...vals) : null; })();
const PAIRED_IRRELEVANT = ['irrelevant_date', 'irrelevant_identifier', 'unrelated_authority'];
const pairedClear = T.paired4.rows.filter((r) => r.constructible && PAIRED_IRRELEVANT.includes(r.kind) && ['A4', 'A4R', 'ADV'].includes(r.arm) && r.reference === 'UNGROUNDED' && r.variant_e1 === 'CLEAR').length;
const variantClear = V1.rows.filter((r) => (r.type === 'V2' || r.type === 'V6') && ['A4', 'A4R', 'ADV'].includes(r.arm) && r.disposition !== 'not_constructible' && r.base_reference === 'UNGROUNDED' && r.variant && r.variant.e1 === 'CLEAR').length;
const inj = tests.injection['0.3.4'], wd = tests.wording['0.3.4'], ctl = tests.controls_suite['0.3.4'];
const tcRows = TC.corrections || [];
const tcOk = tcRows.filter((c) => [c.original_kept, c.corrected, c.regression_check].every((p) => p && existsSync(join(PKG, p)))).length;
const vtype = (t, p = 'all') => (variants[p] && variants[p][t] && variants[p][t].A3R ? variants[p][t].A3R.fraction : null);
const adversarial = {}; for (const r of T.paired4.rows.filter((x) => /^adversarial_/.test(x.kind))) { const k = r.reference + '/' + r.kind + '/' + (r.arm || '-'); const t = adversarial[k] = adversarial[k] || { n: 0, not_constructible: 0, clear: 0, flag_lost: 0 }; t.n++; if (!r.constructible) { t.not_constructible++; continue; } if (r.variant_e1 === 'CLEAR') t.clear++; if (r.base_e1 === 'FLAG' && r.variant_e1 !== 'FLAG') t.flag_lost++; }
const M = {
  scope_leaks: safety.scope_leaks, technical_failures: safety.technical_failures, guard_violations: safety.guard_violations, network_attempts: safety.network_attempts,
  differential_identical_fraction: ratio(T.differential.totals.identical, T.differential.totals.inputs),
  feature_probes_pass_fraction: T.suites.totals.feature_probes_1_0 ? ratio(T.suites.totals.feature_probes_1_0.passed, T.suites.totals.feature_probes_1_0.probes) : null,
  replay_digest_identical_fraction: (() => { const a = determinism.run1_run2, b = determinism.vrun1_vrun2; return a.compared && b.compared ? ratio(a.identical + b.identical, a.compared + b.compared) : null; })(),
  cross_environment_digest_identical_fraction: determinism.run1_run3_cross_environment.fraction,
  default_engines_correct_refusal_fraction: ratio(R1.rows.filter((r) => ['A0', 'A0b'].includes(r.arm) && r.disposition === 'correct_refusal').length, R1.rows.filter((r) => ['A0', 'A0b'].includes(r.arm) && !String(r.disposition).startsWith('not_run')).length),
  research_out_of_scope_refusal_fraction: ratio(R1.rows.filter((r) => r.arm === 'A2' && group(r) === 'out_of_scope_originals' && r.disposition === 'correct_refusal').length, R1.rows.filter((r) => r.arm === 'A2' && group(r) === 'out_of_scope_originals').length),
  research_incorrect_refusals: R1.rows.filter((r) => RESEARCH_ARMS.includes(r.arm) && r.disposition === 'incorrect_refusal').length,
  'eval_clear_on_ungrounded:A4': E('A4', 'false_reassurance', 'all_eligible', 'num'), 'eval_clear_on_ungrounded:A4R': E('A4R', 'false_reassurance', 'all_eligible', 'num'),
  'eval_sensitivity:A3R and eval_sensitivity:A3': { A3R: E('A3R', 'sensitivity'), A3: E('A3', 'sensitivity') }, 'eval_false_alarm:A3R': E('A3R', 'false_alarm'), 'eval_abstention_grounded_excluding_S:A3R': E('A3R', 'abstention_grounded_excluding_S'),
  'eval_question_pass_fraction_min:A2,A3,A4,A5,A3R,A4R': qminAll,
  'eval_variant_pass_fraction:A3R': Object.fromEntries(['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8'].map((t) => [t, vtype(t)])),
  control_span_links_valid_fraction: (() => { let v = 0, n = 0; for (const a of RESEARCH_ARMS) { const g = controls[a] && controls[a].all_eligible; if (g) { v += g.span_links_valid_graphs; n += g.graphs; } } return ratio(v, n); })(),
  control_contradictions: (() => { let n = 0; for (const a of RESEARCH_ARMS) { const g = controls[a] && controls[a].all_eligible; if (g) n += g.contradictions; } return n; })(),
  'eval_controls_per_grounded_record_mean:A3R': CE('A3R', 'controls_per_clean_grounded_record'), 'eval_redundant_controls:A3R': CE('A3R', 'redundant_same_defect'), 'eval_detect_validity:A3R': CE('A3R', 'detect_validity'),
  regression_probes_pass_fraction: frac(T.regression), research_probes_pass_fraction: T.suites.totals.research_probes_1_0 ? ratio(T.suites.totals.research_probes_1_0.passed, T.suites.totals.research_probes_1_0.probes) : null,
  'mutation_kill_fraction_by_tests_non_equivalent and every_repair_mutant_killed_by_a_test': { kill_fraction_by_tests_non_equivalent: ratio(nonEq.filter(byTests).length, nonEq.length), every_repair_mutant_killed_by_a_test: repairMutants.every(byTests) },
  transport_tests_pass_fraction: frac(T.transport),
  clear_on_ungrounded_with_irrelevant_addition: pairedClear + variantClear,
  paired_relation_failures: T.paired4.rows.filter((r) => r.pass === false).length,
  'fresh_phrasing_detection_fraction; obeying_candidate_clear; format_change_accepted; flag_kept_when_detected_fraction': { development_only: true, detection_fraction: inj.detection_fraction, obeying_candidate_clear: inj.obeying_candidate_clear, format_change_accepted: inj.format_change_accepted, flag_kept_when_detected_fraction: inj.flag_kept_when_detected.fraction },
  benign_detected_fraction: inj.benign_detected_fraction,
  'controls_with_record_passage_fraction; ungrounded_controls': { controls_with_record_passage_fraction: ctl.controls_with_record_passage_fraction, ungrounded_controls: ctl.ungrounded_controls },
  capability_probes_as_intended_fraction: ratio(wd.capability_as_intended, wd.capability),
  corrected_tools_with_regression_check_and_original_kept: ratio(tcOk, tcRows.length),
  adversarial_pool_results: adversarial,
  agreement_with_completed_human_labels: LABELS.counts.human_reviewed ? 'see LABEL_STATUS_REGISTER' : null,
  evaluation_records_authored_independently_and_sealed_first: 0,
};
// Which criteria are about fresh evaluation material (scope_of_rates and AC-37); the rest are mechanical checks run here.
const EVAL_ONLY = new Set(['AC-12', 'AC-13', 'AC-14', 'AC-15', 'AC-16', 'AC-17', 'AC-18', 'AC-21', 'AC-22', 'AC-23', 'AC-30', 'AC-36']);
const cmpOp = (o, x, v) => (x === null || x === undefined || typeof x === 'object' ? null : o === '==' ? x === v : o === '>=' ? x >= v : o === '<=' ? x <= v : null);
const criteria = AC.criteria.map((c) => {
  const x = M[c.metric];
  let dev = null;
  if (c.id === 'AC-14') dev = x.A3R !== null && x.A3 !== null ? x.A3R >= c.value && x.A3 >= c.value : null;
  else if (c.id === 'AC-18') dev = Object.entries(c.per_type).every(([t, thr]) => x[t] !== null && x[t] >= thr);
  else if (c.id === 'AC-26') dev = x.kill_fraction_by_tests_non_equivalent >= c.value && x.every_repair_mutant_killed_by_a_test;
  else if (c.id === 'AC-30') dev = x.detection_fraction >= 0.8 && x.obeying_candidate_clear === 0 && x.format_change_accepted === 0 && x.flag_kept_when_detected_fraction >= 0.95;
  else if (c.id === 'AC-32') dev = x.controls_with_record_passage_fraction >= 0.8 && x.ungrounded_controls === 0;
  else if (c.id === 'AC-35' || c.id === 'AC-36') dev = null;
  else if (c.id === 'AC-37') dev = false;
  else dev = cmpOp(c.op, x, c.value);
  const evaluation = c.id === 'AC-37' ? 'NOT MET: no fresh, independently authored, sealed evaluation records exist'
    : c.id === 'AC-36' ? 'NOT EVALUABLE: no completed human labels (' + LABELS.counts.human_reviewed + ' human-reviewed)'
      : c.id === 'AC-35' ? 'REPORTED (no threshold)'
        : EVAL_ONLY.has(c.id) ? 'NOT EVALUABLE: applies to fresh evaluation material only (AC-37)'
          : dev === true ? 'met (development material)' : dev === false ? 'NOT MET' : 'not evaluable';
  return { id: c.id, area: c.area, metric: c.metric, op: c.op, threshold: c.per_type || c.value, development_value: x === undefined ? null : x, development_value_meets_threshold: dev, result: evaluation };
});
const criteriaSummary = { mechanical_met: criteria.filter((c) => /^met/.test(c.result)).length, not_met: criteria.filter((c) => /^NOT MET/.test(c.result)).map((c) => c.id), not_evaluable: criteria.filter((c) => /NOT EVALUABLE|not evaluable/.test(c.result)).length,
  reported: criteria.filter((c) => /REPORTED/.test(c.result)).length, ac37: criteria.find((c) => c.id === 'AC-37').result,
  eval_only_development_values_meeting: criteria.filter((c) => EVAL_ONLY.has(c.id) && c.development_value_meets_threshold === true).map((c) => c.id), eval_only_development_values_not_meeting: criteria.filter((c) => EVAL_ONLY.has(c.id) && c.development_value_meets_threshold === false).map((c) => c.id) };

const out = { format: 'jrs-0.3.4-analysis/2.0.0', built_at_utc: new Date().toISOString(), run_labels: LB, release_status: 'NO_GO_NOT_VERIFIED', b018: 'OPEN', engine_of_record: '0.3.1-candidate', candidate: C4 + ' (not adopted)',
  criteria_version: AC.version, criteria_status: AC.status,
  statement: 'Offline mechanical analysis with scripted candidate policies; no model was run. Every rate compares Engine output with an AI-authored or LLM-reproduced reference on exposed development material. It is development evidence: not accuracy, not evaluation, not validation.',
  inputs, dispositions: { by_arm_run1: byArm(R1), record_summary: dispSummary, study_accounting_preserved: 'research/study-156-2026-10-27/reports/ANALYSIS.json dispositions (unchanged)', records }, e1, questions, controls, determinism, variants, irrelevant_addition_V2_V6_ungrounded: irrelevantAddition,
  injection_detection_A2_V7: injection, default_path: defaultPath, comparison_with_0_3_3: { e1: cmp, variants: cmpVariants, note: 'A3, A4 and A5 use the same scripted observations on both versions (only the prompt label differs). A3R and A4R are rule-aligned on each version\'s own units (each version\'s own ceiling).' },
  tests, performance: perf, cost, safety, metrics: M, criteria, criteria_summary: criteriaSummary };
mkdirSync(OUTDIR, { recursive: true });
writeFileSync(OUTJ, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });

// ------------------------------------------------------------------ tables (markdown)
const pct = (x) => (x === null || x === undefined ? 'n/a' : (x * 100).toFixed(1) + '%');
const nd = (r) => (r ? r.num + '/' + r.den + ' (' + pct(r.value) + ')' : 'n/a');
const ci = (b) => (b ? ' [' + pct(b.lower_2_5) + ', ' + pct(b.upper_97_5) + ']' : '');
const md = ['# Analysis Tables 2.0 (generated by tools/analyze-v2.mjs)', '', 'Generated ' + out.built_at_utc + ' from ' + Object.values(LB).join(', ') + '. **Development evidence only**: every record is exposed development material, and every reference is AI-authored or LLM-reproduced. Agreement is not accuracy. Release status NO_GO_NOT_VERIFIED; B-018 OPEN.', ''];
md.push('## 1. Dispositions, run-1 (rows per arm)', '', '| Arm | substantive_mock | partial | correct_refusal | incorrect_refusal | backstop_passed | not_assessed:no_candidate | technical_failure | scope_leak | not_run (scope) | not_run (no text) |', '|' + '---|'.repeat(11));
for (const a of ALL_ARMS) { const d = out.dispositions.by_arm_run1[a] || {}; md.push('| ' + a + ' | ' + ['substantive_mock', 'partial', 'correct_refusal', 'incorrect_refusal', 'backstop_passed', 'not_assessed:no_candidate', 'technical_failure', 'scope_leak', 'not_run:scope_decision_SC1_required', 'not_run:source_text_not_held'].map((k) => d[k] || 0).join(' | ') + ' |'); }
md.push('', '**Per-record summary for 0.3.4 (156 records; study definitions; the study\'s own accounting is unchanged):**', '', '| Disposition | Records |', '|---|---|', ...Object.entries(dispSummary).map(([k, v]) => '| ' + k + ' | ' + v + ' |'), '');
md.push('Default path (research profile off): ' + defaultPath.equal + ' of ' + defaultPath.rows + ' rows of A0c and A6c equal the 0.3.2 graph for the same record and arm after normalization.', '');
for (const g of GROUPS) {
  md.push('## 2. E1 agreement: ' + g, '', '| Arm | UNGROUNDED F/C/I/N | GROUNDED F/C/I/N | Sensitivity | False alarm | False reassurance | Abstention |', '|---|---|---|---|---|---|---|');
  for (const a of MOCK_ARMS) { const b = e1[a] && e1[a][g]; if (!b) continue; const c = (k) => { const x = b.counts[k] || {}; return [x.FLAG || 0, x.CLEAR || 0, x.INDETERMINATE || 0, x.NOT_ASSESSED || 0].join('/'); };
    const r = b.rates; md.push('| ' + a + ' | ' + c('UNGROUNDED') + ' | ' + c('GROUNDED') + ' | ' + nd(r.sensitivity) + ci(b.bootstrap.sensitivity) + ' | ' + nd(r.false_alarm) + ' | ' + nd(r.false_reassurance) + ' | ' + nd(r.abstention) + ' |'); }
  md.push('');
}
md.push('## 3. Comparison with the frozen 0.3.3 study analysis (same records and scoring)', '', '| Arm / group | Sensitivity 0.3.3 | 0.3.4 | False alarm 0.3.3 | 0.3.4 | False reassurance 0.3.3 | 0.3.4 | Abstention 0.3.3 | 0.3.4 |', '|---|---|---|---|---|---|---|---|---|');
for (const [k, v] of Object.entries(cmp)) md.push('| ' + k + ' | ' + ['sensitivity', 'false_alarm', 'false_reassurance', 'abstention'].map((m) => nd(v[m]['0.3.3']) + ' | ' + nd(v[m]['0.3.4'])).join(' | ') + ' |');
md.push('', '## 4. Question checks', '', '| Arm | group | Q1 | Q2 | Q3 | Q4 |', '|---|---|---|---|---|---|');
for (const a of ['A2', 'A3', 'A4', 'A5', 'A3R', 'A4R', 'ADV']) for (const g of ['dev_synthetic', 'eval_synthetic']) { const q = (questions[a] || {})[g]; if (!q) continue; md.push('| ' + a + ' | ' + g + ' | ' + ['q1', 'q2', 'q3', 'q4'].map((k) => (q[k] ? q[k].pass + '/' + q[k].total + (q[k].failed.length ? ' (failed: ' + q[k].failed.join(', ') + ')' : '') : 'n/a')).join(' | ') + ' |'); }
md.push('', '## 5. Cognitive controls (all eligible records)', '', '| Arm | Graphs | Controls | Per clean grounded record | Redundant | Contradictions | Span links valid | Controls with a passage | Words per graph | Detect validity | Flaw controls valid/false |', '|---|---|---|---|---|---|---|---|---|---|---|');
for (const a of [...RESEARCH_ARMS, 'A6c']) { const s = controls[a] && controls[a].all_eligible; if (!s) continue; md.push('| ' + a + ' | ' + s.graphs + ' | ' + s.controls + ' | ' + s.controls_per_clean_grounded_record + ' | ' + s.redundant_same_defect + ' | ' + s.contradictions + ' | ' + pct(s.span_links_valid_fraction) + ' | ' + pct(s.span_linked_fraction) + ' | ' + s.words_per_graph + ' | ' + pct(s.detect_validity) + ' | ' + s.flaw_controls_valid + '/' + s.flaw_controls_false + ' |'); }
md.push('', '## 6. Variants (all partitions): relation held / variants (0.3.3 study figures in brackets, where the study ran that type and arm)', '', '| Type | A2 | A3 | A4 | A3R | A4R | ADV |', '|---|---|---|---|---|---|---|');
for (const t of ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8']) { const row = (variants.all || {})[t] || {}; md.push('| ' + t + ' | ' + ['A2', 'A3', 'A4', 'A3R', 'A4R', 'ADV'].map((a) => { const n = row[a]; if (!n) return 'n/a'; const s3 = ['development', 'evaluation', 'original'].reduce((acc, p) => { const s = SA.variants && SA.variants[p] && SA.variants[p][t] && SA.variants[p][t][a]; return s ? { pass: acc.pass + s.pass, total: acc.total + s.total } : acc; }, { pass: 0, total: 0 }); return n.pass + '/' + n.total + (s3.total ? ' [' + s3.pass + '/' + s3.total + ']' : ''); }).join(' | ') + ' |'); }
md.push('', 'V5: 0.3.3 figures used generator 1.0 (HF-05); the corrected analysis of 0.3.3 on generator 2.0 is in tests.corrected_v5_0_3_3.', '', '## 7. Irrelevant additions to UNGROUNDED records (V2, V6)', '', '| Type/arm | n | base FLAG | variant FLAG | FLAG lost | CLEAR | newly supported via the inserted sentence |', '|---|---|---|---|---|---|---|');
for (const [k, t] of Object.entries(irrelevantAddition).sort()) md.push('| ' + k + ' | ' + t.n + ' | ' + t.base_flag + ' | ' + t.variant_flag + ' | ' + t.flag_lost + ' | ' + t.clear + ' | ' + t.newly_supported_via_inserted + ' |');
md.push('', '## 8. Determinism (compiler only; model variability NOT TESTED)', '', '| Comparison | Compared | Identical |', '|---|---|---|');
for (const [k, v] of Object.entries(determinism).filter(([k]) => !['environments', 'scope'].includes(k))) md.push('| ' + k + ' | ' + v.compared + ' | ' + v.identical + ' (' + pct(v.fraction) + ') |');
md.push('', '## 9. Proposed acceptance criteria S156-AC-2.0 (owner approval NOT GIVEN)', '', '| ID | Metric | Development value | Threshold | Result |', '|---|---|---|---|---|');
for (const c of criteria) md.push('| ' + c.id + ' | ' + c.metric + ' | ' + JSON.stringify(c.development_value).slice(0, 160).replace(/\|/g, '/') + ' | ' + (typeof c.threshold === 'object' && c.threshold ? JSON.stringify(c.threshold) : c.threshold === null || c.threshold === undefined ? c.op : c.op + ' ' + c.threshold) + ' | ' + c.result + ' |');
md.push('', 'Summary: ' + JSON.stringify(criteriaSummary));
writeFileSync(OUTM, md.join('\n') + '\n', { flag: 'wx' });
console.log('criteria: met (development material)', criteriaSummary.mechanical_met, '| NOT MET', criteriaSummary.not_met.join(',') || 'none', '| not evaluable', criteriaSummary.not_evaluable, '| reported', criteriaSummary.reported);
