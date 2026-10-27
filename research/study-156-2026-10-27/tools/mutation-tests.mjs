// 156-record study: mutation tests of the research profile. Each mutant is one exact text replacement in
// research-profile.mjs, applied to its own isolated copy of the 0.3.3 candidate (candidate/ is never touched).
// Defect re-introduction mutants put back the behaviour fixed by D1 to D18; operator mutants switch a rule off,
// flip a comparison or relax a requirement. Development partition only.
// A mutant is killed by:
//   probes       a research probe (tools/research-probes.mjs) or a regression probe (tools/regression-probes.mjs) fails
//   dev_labels   on development records, an agreement count with the reference gets worse (fewer FLAG on UNGROUNDED,
//                more FLAG on GROUNDED, more CLEAR on UNGROUNDED, fewer question checks passing)
//   any_change   any development graph differs from the unmutated baseline, compared without the compiler source
//                hash the graph carries (behaviour change only)
// A mutant whose search text does not occur exactly once is reported as invalid and not counted.
// Usage: node tools/mutation-tests.mjs <scratch>   (writes out/mutations/RESULTS.json)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isolate, loadEngine, VERSIONS } from './harness/engines.mjs';
import { runResearchProbes } from './research-probes.mjs';
import { runRegressionProbes } from './regression-probes.mjs';
import { ARMS, declare, compileRow } from './compile-row.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(PKG, '..', '..');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const REL = join('lib', VERSIONS['0.3.3-research-candidate'].dir, 'research-profile.mjs');
const M = (id, kind, target, find, replace) => ({ id, kind, target, find, replace });
// Equivalent by construction (no input can tell them apart from the unmutated code), recorded rather than hidden:
//   MU-27  restated already implies no basis anchors, and the requirement already needs anchors
//   MU-33  research linkage is checked only after the requirement, which already needs a cited quote covering an anchor
//   MU-34  the compiler holds sufficiency at review_required whatever the rule says (compiler.mjs, proposed supported)
export const EQUIVALENT = Object.freeze(['MU-27', 'MU-33', 'MU-34']);
export const MUTANTS = [
  M('MU-01', 'defect_reintroduction', 'D1', String.raw`(?:(?:was|were|been|is|are|has|have|had)\s+(?:\w+\s+){0,3}?approved|approved\s+(?:by|the|it|on|change|keeping|moving|a|an|its|CR-\d+)|(?:board|panel|manager|committee|sponsor|team|lead)\s+approved|approve|`, String.raw`(?:approved|approve|`),
  M('MU-02', 'defect_reintroduction', 'D9', String.raw`(?:\w+\s+){0,3}?approved`, String.raw`(?:\w+\s+){0}?approved`),
  M('MU-03', 'defect_reintroduction', 'D2', String.raw`['stated_absence', /\b(?:found no|`, String.raw`['stated_absence', /(?!)(?:found no|`),
  M('MU-04', 'defect_reintroduction', 'D3', String.raw`['D', 'award', /\baward(?:ed)?\b/i]`, String.raw`['D', 'award', /\bawarded?\b/i]`),
  M('MU-05', 'defect_reintroduction', 'D3', String.raw`/\b(?:was|were) published\b|\bpublished on\b/i`, String.raw`/\bpublished\b/i`),
  M('MU-06', 'defect_reintroduction', 'D4', String.raw`const AUTHORITY_TAIL = /^\s*(?:`, String.raw`const AUTHORITY_TAIL = /(?!)^\s*(?:`),
  M('MU-07', 'defect_reintroduction', 'D5', `a.excluded = 'decision_detail';`, `a.excluded = null;`),
  M('MU-08', 'defect_reintroduction', 'D6', String.raw`if (mod && /\b(?:the|its|their|this|that|a|an)\s+$/i.test(`, String.raw`if (mod && /(?:)/i.test(`),
  M('MU-09', 'defect_reintroduction', 'D7', `const ids = (pre.slice(ls).match(`, `const ids = (pre.match(`),
  M('MU-10', 'defect_reintroduction', 'D8', `const g = groups.find((x) => x.subjects.some((s) => u.subject_refs.includes(s)));`, `const g = null;`),
  M('MU-11', 'defect_reintroduction', 'D10', String.raw`\bretained (?:for|on|in)\b`, String.raw`\bretained\b`),
  M('MU-12', 'defect_reintroduction', 'D11', `if (!k && !contentWords) k = pick(`, `if (!k) k = pick(`),
  M('MU-13', 'defect_reintroduction', 'D13', String.raw`(?:release|lot|version|request)\s+\d+(?:\.\d+)?)\b/gi;`, String.raw`(?:release|lot|version|request)\s+\d+(?:\.\d+)?)\b/g;`),
  M('MU-14', 'defect_reintroduction', 'D14', String.raw`['E', 'repair', /\brepair(?:ed|s)?\b/i], `, ''),
  M('MU-15', 'defect_reintroduction', 'D15', String.raw`['quantity', /\b\d[\d,]*\s+(?:[a-z-]+\s+)?[a-z-]+s\b/g], `, ''),
  M('MU-16', 'defect_reintroduction', 'D16', `const anchorText = (e) => { const [s, t] = spanOf(e);`, `const anchorText = (e) => { const [s, t] = [e.start, e.end];`),
  M('MU-17', 'defect_reintroduction', 'D17', `|dated|held|made|given|carried|out|issued|completed|`, `|made|given|`),
  M('MU-18', 'defect_reintroduction', 'D18', `return hits.length ? hits[0] : null;`, `return hits.length === 1 ? hits[0] : null;`),
  M('MU-19', 'operator', 'RP-SRP-03', `if (sameEvent(a, b) && !sameDay(a.date, b.date)) {`, `if (sameEvent(a, b) && sameDay(a.date, b.date)) {`),
  M('MU-20', 'operator', 'RP-SRP-03', `const sameEvent = (x, y) => x.key && y.key && x.key === y.key && (!x.ids.length || !y.ids.length || x.ids.some((i) => y.ids.includes(i)));`, `const sameEvent = (x, y) => x.key && y.key && x.key === y.key;`),
  M('MU-21', 'operator', 'RP-SRP-05', `if (a.outcome !== b.outcome && a.subject_refs.some((s) => b.subject_refs.includes(s))) {`, `if (a.outcome !== b.outcome) {`),
  M('MU-22', 'operator', 'RP-SRP-07', `const restated = rules.has('RP-SRP-07') && !basisAnchors.length && rationaleUnits.some((u) => VACUOUS.test(u.text) || u.decision);`, `const restated = false;`),
  M('MU-23', 'operator', 'RP-SRP-07', `const noReason = rules.has('RP-SRP-07') && decisions.length > 0 && !rationaleUnits.length && !basisAnchors.length;`, `const noReason = false;`),
  M('MU-24', 'operator', 'RP-SRP-06', `const authorityOnly = rules.has('RP-SRP-06') && authorityUnits.length > 0 && !basisAnchors.length;`, `const authorityOnly = false;`),
  M('MU-25', 'operator', 'RP-SRP-08', `const unsupportedConclusion = rules.has('RP-SRP-08') && (added.length > 0 || unsupportedDecisions.length > 0);`, `const unsupportedConclusion = false;`),
  M('MU-26', 'operator', 'identifiable_basis', `r.requirement_visible = !!basisAnchors.length && !unsupportedConclusion && cited.some(anchorText);`, `r.requirement_visible = !!basisAnchors.length && !unsupportedConclusion;`),
  M('MU-27', 'operator', 'reasoning_traceability', `r.requirement_visible = !!decisions.length && !!basisAnchors.length && !restated && !unsupportedConclusion && rationaleCited;`, `r.requirement_visible = !!decisions.length && !!basisAnchors.length && !unsupportedConclusion && rationaleCited;`),
  M('MU-28', 'operator', 'RP-SRP-02', `if (inRanges(a.start, subjects)) a.excluded = 'subject_reference';`, `if (false) a.excluded = 'subject_reference';`),
  M('MU-29', 'operator', 'RP-SRP-02', `a.excluded = 'decision_date';`, `a.excluded = null;`),
  M('MU-30', 'operator', 'RP-SRP-02', `a.excluded = 'authority_citation';`, `a.excluded = null;`),
  M('MU-31', 'operator', 'reasoning_traceability', `const negated = (e) => e.assertion_type === 'stated_rationale' && NEGATED.test(e.quote);`, `const negated = (e) => false;`),
  M('MU-32', 'operator', 'chronology_integrity', `r.requirement_visible = events.length >= 2 && has('chronology_integrity', ['stated_date']);`, `r.requirement_visible = events.length >= 1;`),
  M('MU-33', 'operator', 'research linkage', `if (condition === 'identifiable_basis' || condition === 'reasoning_traceability') return list.some((e) => overlaps(e, (u) => u.basis_anchors.length > 0));`, `if (condition === 'identifiable_basis' || condition === 'reasoning_traceability') return true;`),
  M('MU-34', 'operator', 'sufficiency', `const r = { requirement_visible: false, visible_gaps: [], review_reasons: ['sufficiency_not_determinable_by_engine'], anchor: firstDecisionSection };`, `const r = { requirement_visible: true, visible_gaps: [], review_reasons: [], anchor: firstDecisionSection };`),
  M('MU-35', 'operator', 'profile gating', `const ok = problems.length === 0;`, `const ok = true;`),
];

const inv = JSON.parse(readFileSync(join(PKG, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
const register = JSON.parse(readFileSync(join(PKG, 'records', 'synthetic', 'CONSTRUCTION_REGISTER.json'), 'utf8'));
const dev = inv.entries.filter((e) => e.full_text_available && e.scope_class === 'NOT_EXCLUDED' && (e.partition === 'development' || e.cohort === 'original_study_record'));
const ARM_IDS = ['A2', 'A3', 'A3R', 'A4R'];
function devRun(E) {
  const rows = [];
  for (const e of dev) {
    const text = readFileSync(join(ROOT, e.extracted_text_path), 'utf8');
    const designed = (register.records.find((r) => r.id === e.source_id) || {}).designed || null;
    for (const a of ARMS.filter((x) => ARM_IDS.includes(x.id))) {
      const cand = a.mock ? JSON.parse(readFileSync(join(PKG, 'mocks', a.mock, e.source_id + '.json'), 'utf8')).envelope.content[0].text : null;
      const r = compileRow(E, a, { text, declaration: declare(e), cand, designed, eligible: true, clock: '2026-10-27T12:00:00.000Z', fixtureId: e.source_id, rpv: E.research.RESEARCH_PROMPT_VERSION });
      rows.push({ arm: a.id, id: e.source_id, reference: e.reference_findings[0].value, e1: r.e1 || null, e2: r.e2, disposition: r.disposition, digest: r.behaviour_digest || r.error });
    }
  }
  const s = { flag_on_ungrounded: 0, flag_on_grounded: 0, clear_on_ungrounded: 0, question_checks_passed: 0, technical_failures: 0 };
  for (const r of rows) {
    if (r.disposition === 'technical_failure') s.technical_failures++;
    if (r.e1 === 'FLAG' && r.reference === 'UNGROUNDED') s.flag_on_ungrounded++;
    if (r.e1 === 'FLAG' && r.reference === 'GROUNDED') s.flag_on_grounded++;
    if (r.e1 === 'CLEAR' && r.reference === 'UNGROUNDED') s.clear_on_ungrounded++;
    for (const q of Object.values(r.e2 || {})) if (q.pass) s.question_checks_passed++;
  }
  return { rows, summary: s };
}
async function evaluate(scratch, mutant) {
  const iso = isolate('0.3.3-research-candidate', scratch, { requireManifest: existsSync(join(PKG, 'CANDIDATE_0.3.3_MANIFEST_SHA256.txt')) });
  let applied = null;
  if (mutant) {
    const p = join(iso.root, REL); const src = readFileSync(p, 'utf8');
    const n = src.split(mutant.find).length - 1;
    if (n !== 1) { iso.release(); return { invalid: 'search text occurs ' + n + ' times' }; }
    writeFileSync(p, src.replace(mutant.find, () => mutant.replace)); applied = sha(readFileSync(p));
  }
  let E;
  try { E = await loadEngine(iso); } catch (e) { iso.release(); return { load_error: String(e && e.message).slice(0, 200), mutated_sha256: applied }; }
  const probes = await runResearchProbes(E), regress = await runRegressionProbes(E), d = devRun(E);
  const rel = iso.release();
  return { mutated_sha256: applied, research_probe_failures: probes.filter((r) => !r.ok).map((r) => r.id), regression_probe_failures: regress.filter((r) => !r.ok).map((r) => r.id + ':' + r.defect), dev: d, isolated_copy_changed: rel.changed };
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const scratch = process.argv[2];
  if (!scratch) { console.error('usage: mutation-tests.mjs <scratch>'); process.exit(2); }
  const f = join(PKG, 'out', 'mutations', 'RESULTS.json');
  if (existsSync(f)) { console.error(f + ' exists'); process.exit(2); }
  mkdirSync(scratch, { recursive: true });
  const base = await evaluate(scratch, null);
  if (base.research_probe_failures.length || base.regression_probe_failures.length) { console.error('baseline does not pass its own probes', base.research_probe_failures, base.regression_probe_failures); process.exit(3); }
  const baseDigest = new Map(base.dev.rows.map((r) => [r.arm + '/' + r.id, r.digest]));
  const results = [];
  for (const m of MUTANTS) {
    const r = await evaluate(scratch, m);
    const row = { id: m.id, kind: m.kind, target: m.target, find_sha256: sha(m.find) };
    if (r.invalid) { results.push(Object.assign(row, { status: 'invalid', reason: r.invalid })); continue; }
    if (r.load_error) { results.push(Object.assign(row, { status: 'killed', killed_by: ['load_error'], load_error: r.load_error })); continue; }
    const s = r.dev.summary, b = base.dev.summary;
    const worse = s.flag_on_ungrounded < b.flag_on_ungrounded || s.flag_on_grounded > b.flag_on_grounded || s.clear_on_ungrounded > b.clear_on_ungrounded || s.question_checks_passed < b.question_checks_passed || s.technical_failures > b.technical_failures;
    const changed = r.dev.rows.filter((x) => baseDigest.get(x.arm + '/' + x.id) !== x.digest).length;
    const by = [];
    if (r.research_probe_failures.length || r.regression_probe_failures.length) by.push('probes');
    if (worse) by.push('dev_labels');
    if (changed) by.push('any_change');
    results.push(Object.assign(row, { status: by.length ? 'killed' : EQUIVALENT.includes(m.id) ? 'survived_equivalent' : 'survived', killed_by: by, research_probe_failures: r.research_probe_failures, regression_probe_failures: r.regression_probe_failures,
      dev_summary: s, dev_rows_changed: changed, mutated_sha256: r.mutated_sha256 }));
  }
  const valid = results.filter((r) => r.status !== 'invalid');
  const count = (f) => valid.filter(f).length;
  const out = { results_format: 'jrs-study-156-mutations/1.0.0', target_file: REL, baseline: { dev_summary: base.dev.summary, research_probes_failed: 0, regression_probes_failed: 0 }, network_attempts: attempts.length,
    totals: { mutants: MUTANTS.length, valid: valid.length, invalid: results.length - valid.length, killed_by_probes: count((r) => r.killed_by.includes('probes') || r.killed_by.includes('load_error')), killed_by_dev_labels: count((r) => r.killed_by.includes('dev_labels')),
      killed_any: count((r) => r.status === 'killed'), survived: count((r) => r.status === 'survived'), survived_equivalent: count((r) => r.status === 'survived_equivalent'), killed_only_by_change: count((r) => r.killed_by.length === 1 && r.killed_by[0] === 'any_change') },
    note: 'Kill rates measure how much of the research rule code the probes and development records exercise. They are not accuracy.', results };
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(out.totals), 'network', attempts.length);
  for (const r of results) console.log(r.id, r.target, r.status, (r.killed_by || []).join('+'), r.reason || '', r.research_probe_failures ? 'rp:' + r.research_probe_failures.length + ' rg:' + r.regression_probe_failures.join(',') : '');
}
