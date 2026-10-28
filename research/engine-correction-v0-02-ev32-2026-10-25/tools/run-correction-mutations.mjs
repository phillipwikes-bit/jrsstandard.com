// Mutations against the RP-CON-02 correction in 0.3.2-candidate. Each mutation is one exact text
// replacement in a temporary copy of the candidate. The probe set (RC-01 to RC-05, V0 EV-32 and V0 EV-01)
// is compiled directly with the mutated copy and compared with the sealed 0.3.2 expectations. A mutation
// is detected if any probe differs or errors. Survivors are recorded, never repaired.
// Usage: node tools/run-correction-mutations.mjs <scratch-parent>
import { attempts, installNetGuard } from './v0/harness/net-guard.mjs';
installNetGuard();
import { readFileSync, writeFileSync, cpSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const V0C = join(PKG, '..', 'validation-readiness-gate-v0-2026-10-25', 'corpus');
const SCRATCH = process.argv[2];
const G = 'lib/engine-evidence-graph-v0.3.2-candidate/';
const C = ['reconstructability', 'identifiable_basis', 'chronology_integrity', 'reasoning_traceability', 'sufficiency'];
const text = (b) => b.envelope.content[0].text;
const probes = [];
for (const [dir, id] of [['regression', 'RC-01'], ['regression', 'RC-02'], ['regression', 'RC-03'], ['regression', 'RC-04'], ['regression', 'RC-05'], ['regression-supplement', 'RC-06']]) {
  const spec = JSON.parse(readFileSync(join(PKG, dir, 'cases', id + '.spec.json'), 'utf8'));
  const record = spec.record_source.startsWith('V0 sealed corpus ') ? readFileSync(join(V0C, spec.record_source.replace('V0 sealed corpus ', '')), 'utf8') : readFileSync(join(PKG, 'regression-supplement', spec.record_source.replace('regression-supplement ', '')), 'utf8');
  probes.push({ id, record, response: text(JSON.parse(readFileSync(join(PKG, dir, 'cases', id + '.candidate.json'), 'utf8'))), expected: spec.expected['0.3.2-candidate'] });
}
const delta = JSON.parse(readFileSync(join(PKG, 'regression/V0_EXPECTED_DELTA.json'), 'utf8')).deltas;
for (const id of ['EV-32', 'EV-01']) {
  const e = JSON.parse(readFileSync(join(V0C, 'expectations', id + '.expected.json'), 'utf8')).graph;
  if (delta[id]) { Object.assign(e.statuses, delta[id].statuses); e.conflict_kinds = delta[id].conflict_kinds; }
  probes.push({ id, record: readFileSync(join(V0C, 'cases', id + '.record.txt'), 'utf8'), response: text(JSON.parse(readFileSync(join(V0C, 'cases', id + '.candidate.json'), 'utf8'))), expected: { intake_decision: e.intake_decision, statuses: e.statuses, conflict_kinds: e.conflict_kinds } });
}
async function runProbes(root, tag) {
  const { compileEvidenceGraph } = await import(pathToFileURL(join(root, G, 'compiler.mjs')).href + '?' + tag);
  return probes.map((p) => {
    try {
      const submission = { submission_metadata: { submission_id: p.id }, scope_declaration: { record_type: 'supplier_access_exception_draft', record_state: 'completed_draft', content_origin: 'synthetic_engineering_fixture', hr_content: false, regulated_decision_content: false },
        declared_versions: { contract_version: 'jrs-engine-local-0.3.0-evidence-graph', compiler_version: '0.3.2-candidate', prompt_version: 'jrs-engine-local-0.3.0/prompt-1', codebook_version: '1.0' },
        requested_outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], record_text: p.record };
      const g = compileEvidenceGraph({ submission, candidateResponseText: p.response, executionMode: 'local_mocked', clock: '2026-10-25T00:00:00.000Z', fixtureId: p.id });
      const st = Object.fromEntries(g.findings.map((f) => [f.condition_id, f.status]));
      const ok = g.intake.decision === p.expected.intake_decision && C.every((c) => st[c] === p.expected.statuses[c]) && JSON.stringify(g.conflicts.map((k) => k.kind).sort()) === JSON.stringify(p.expected.conflict_kinds);
      return { id: p.id, pass: ok };
    } catch (e) { return { id: p.id, pass: false, error: String(e.message).slice(0, 160) }; }
  });
}
const M = [
  ['X01', 'contradictions.mjs', 'Remove the event-role skip', "          if (ra && rb && ra !== rb) continue;\n", ''],
  ['X02', 'contradictions.mjs', 'Treat an unknown role as a different role (not conservative)', 'if (ra && rb && ra !== rb) continue;', 'if (ra !== rb) continue;'],
  ['X03', 'contradictions.mjs', 'Skip comparison even when roles are equal', 'if (ra && rb && ra !== rb) continue;', 'if (ra && rb) continue;'],
  ['X04', 'contradictions.mjs', 'Ignore the rule-pack gate (rule never active)', "if (rules.has('RP-CON-02') && vals[i].assertion_type !== 'stated_decision') {", "if (false && vals[i].assertion_type !== 'stated_decision') {"],
  ['X05', 'contradictions.mjs', 'Break the span-overlap test in eventRoleOf', 'events.filter((ev) => ev.start < t && s < ev.end)', 'events.filter((ev) => ev.start >= t && s < ev.end)'],
  ['X06', 'contradictions.mjs', 'eventRoleOf always unknown', 'return roles.length === 1 ? roles[0] : null;', 'return null;'],
  ['X07', 'compiler.mjs', 'Compiler stops passing dated events to K6', 'detectEvidenceConflicts(allVerified, events, rules)', 'detectEvidenceConflicts(allVerified, [], rules)'],
  ['X08', 'compiler.mjs', 'Compiler stops passing active rules to K6', 'detectEvidenceConflicts(allVerified, events, rules)', 'detectEvidenceConflicts(allVerified, events)'],
  ['X09', 'rule-packs.mjs', 'RP-CON-02 not listed as implemented (pack set must fail closed)', "'RP-SCO-01', 'RP-CON-02']);", "'RP-SCO-01']);"],
  ['X10', 'rule-packs/RPK-ECR.json', 'RPK-ECR content altered without re-signing', '"pack_version": "1.0.0"', '"pack_version": "1.0.1"'],
  ['X11', 'rule-packs/RPK-ECR.json', 'RPK-ECR bound to the wrong candidate version', '"candidate_version": "0.3.2-candidate"', '"candidate_version": "0.3.1-candidate"'],
  ['X12', 'contract.mjs', 'Compiler version label reverted to 0.3.1', "export const COMPILER_VERSION = '0.3.2-candidate';", "export const COMPILER_VERSION = '0.3.1-candidate';"],
  ['X13', 'contradictions.mjs', 'Extend the role skip to decision assertions', "&& vals[i].assertion_type !== 'stated_decision') {", ') {'],
];
const tmp = mkdtempSync(join(SCRATCH, 'v002-mut-'));
const base = join(tmp, 'base'); cpSync(join(PKG, 'candidate'), base, { recursive: true });
const baseline = await runProbes(base, 'base');
const results = [];
for (const [id, file, description, find, replace] of M) {
  const root = join(tmp, id); cpSync(join(PKG, 'candidate'), root, { recursive: true });
  const p = join(root, G, file); const src = readFileSync(p, 'utf8'); const n = src.split(find).length - 1;
  if (n !== 1) { results.push({ id, file, description, applied: false, detected: false, problem: 'find_occurs_' + n }); continue; }
  writeFileSync(p, src.replace(find, replace));
  const r = await runProbes(root, id);
  results.push({ id, file, description, applied: true, detected: r.some((x) => !x.pass), failing_probes: r.filter((x) => !x.pass).map((x) => x.id + (x.error ? ' (error: ' + x.error + ')' : '')) });
}
rmSync(tmp, { recursive: true, force: true });
const out = { results_format: 'jrs-v0-02-correction-mutations/1.0.0', date: new Date().toISOString(), baseline: { probes: baseline.length, passing: baseline.filter((x) => x.pass).length, failures: baseline.filter((x) => !x.pass) },
  totals: { mutations: results.length, applied: results.filter((x) => x.applied).length, detected: results.filter((x) => x.detected).length, survivors: results.filter((x) => !x.detected).map((x) => x.id) }, network_attempts: attempts.length, mutations: results };
writeFileSync(join(PKG, 'MUTATION_RESULTS.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify({ baseline: out.baseline.passing + '/' + out.baseline.probes, totals: out.totals, network: attempts.length }));
for (const r of results) console.log(r.id, r.detected ? 'detected' : 'SURVIVED', (r.failing_probes || []).join(', ').slice(0, 200));
