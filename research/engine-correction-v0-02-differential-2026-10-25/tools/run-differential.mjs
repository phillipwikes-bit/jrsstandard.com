// 0.3.1 against 0.3.2 on every earlier-phase input. Method: METHOD_PRESPECIFIED.md. Offline only.
// Usage: node tools/run-differential.mjs <scratch-parent>
import { attempts, installNetGuard } from '../../engine-correction-v0-02-ev32-2026-10-25/tools/v0/harness/net-guard.mjs';
installNetGuard();
import { readFileSync, writeFileSync, cpSync, mkdtempSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createIsolatedCopy, verifyAndDelete } from '../../engine-correction-v0-02-ev32-2026-10-25/tools/v0/harness/isolate.mjs';
import * as V from '../../engine-correction-v0-02-ev32-2026-10-25/tools/v0/controls.mjs';
const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CORR = join(HERE, '..', 'engine-correction-v0-02-ev32-2026-10-25');
const P7T = join(HERE, '..', 'engine-remediation-phase7-2026-10-19', 'tooling');
const SCRATCH = process.argv[2];
const sha = (b) => createHash('sha256').update(b).digest('hex');
const { existingInputs, phase7Inputs } = await import(pathToFileURL(join(P7T, 'inputs.mjs')).href);
const { submissionFor } = await import(pathToFileURL(join(P7T, 'scenario-schema.mjs')).href);
const inputs = [...(await existingInputs()), ...phase7Inputs().map((s) => ({ id: s.scenario_id, family: 'phase7-scenario', submission: submissionFor(s), response: s.candidate_response_text, mode: s.execution_mode }))];

const iso31 = createIsolatedCopy(SCRATCH);
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const tmp32 = mkdtempSync(join(SCRATCH, 'diff032-'));
cpSync(join(CORR, 'candidate'), tmp32, { recursive: true });
const rows = readFileSync(join(CORR, 'CANDIDATE_0.3.2_MANIFEST_SHA256.txt'), 'utf8').split('\n').filter(Boolean);
for (const l of rows) if (sha(readFileSync(join(tmp32, l.slice(66)))) !== l.slice(0, 64)) throw new Error('0.3.2 copy mismatch ' + l.slice(66));
if (walk(tmp32).length !== rows.length) throw new Error('0.3.2 copy has unlisted files');
const imp = (root, dir, f) => import(pathToFileURL(join(root, 'lib', dir, f)).href);
const c31 = (await imp(iso31.root, 'engine-evidence-graph-v0.3.1-candidate', 'compiler.mjs')).compileEvidenceGraph;
const c32 = (await imp(tmp32, 'engine-evidence-graph-v0.3.2-candidate', 'compiler.mjs')).compileEvidenceGraph;
const vg32 = (await imp(tmp32, 'engine-evidence-graph-v0.3.2-candidate', 'graph-validate.mjs')).validateGraph;

const mapV = (sub, to) => { const s = JSON.parse(JSON.stringify(sub === undefined ? null : sub)); if (s && s.declared_versions && s.declared_versions.compiler_version === '0.3.0-local') s.declared_versions.compiler_version = to; return s; };
const run = (compile, i, to) => { try { return { graph: compile({ submission: mapV(i.submission, to), candidateResponseText: i.response, executionMode: i.mode, clock: '2026-10-19T00:00:00Z', fixtureId: i.id }), error: null }; } catch (e) { return { graph: null, error: String(e.message).slice(0, 200) }; } };
const summary = (r) => r.graph ? (({ span_origins, ...o }) => o)(V.observe(r.graph)) : { error: true };
const results = [];
for (const i of inputs) {
  const a = run(c31, i, '0.3.1-candidate'), b = run(c32, i, '0.3.2-candidate');
  const sa = summary(a), sb = summary(b);
  const same = V.canonical(sa) === V.canonical(sb) && !!a.error === !!b.error;
  let classification = same ? 'no_behavioural_difference' : 'unexpected_regression';
  if (!same && a.graph && b.graph) {
    const lost = sa.conflict_kinds.filter((k) => k === 'cited_evidence_conflict').length - sb.conflict_kinds.filter((k) => k === 'cited_evidence_conflict').length;
    const cec = a.graph.conflicts.filter((k) => k.kind === 'cited_evidence_conflict');
    const affected = new Set(cec.flatMap((k) => k.affects));
    const restA = Object.assign({}, sa, { conflict_kinds: sa.conflict_kinds.filter((k) => k !== 'cited_evidence_conflict'), statuses: Object.fromEntries(Object.entries(sa.statuses).filter(([c]) => !affected.has(c))) });
    const restB = Object.assign({}, sb, { conflict_kinds: sb.conflict_kinds.filter((k) => k !== 'cited_evidence_conflict'), statuses: Object.fromEntries(Object.entries(sb.statuses).filter(([c]) => !affected.has(c))) });
    if (lost > 0 && V.canonical(restA) === V.canonical(restB)) classification = 'declared_rp_con_02_difference';
  }
  const mech = b.graph ? [...V.checkGraphValid(b.graph, i.submission && i.submission.record_text, vg32), ...(typeof (i.submission || {}).record_text === 'string' ? V.checkOffsets(b.graph, i.submission.record_text) : []), ...V.checkLinkage(b.graph), ...V.checkAmbiguity(b.graph), ...V.checkMonotonic(b.graph), ...V.checkReviewRoute(b.graph)] : [];
  results.push({ id: i.id, family: i.family, classification, v031: sa, v032: sb, v031_error: a.error, v032_error: b.error, v032_mechanical: mech });
}
const end31 = verifyAndDelete(iso31);
const after = walk(tmp32).length; rmSync(tmp32, { recursive: true, force: true });
const by = (k) => results.filter((r) => r.classification === k).map((r) => r.id);
const fam = {}; for (const r of results) fam[r.family] = (fam[r.family] || 0) + 1;
const out = { results_format: 'jrs-v0-02-differential/1.0.0', date: new Date().toISOString(), method: 'METHOD_PRESPECIFIED.md', release_status: 'NO_GO_NOT_VERIFIED', b018: 'OPEN',
  totals: { inputs: results.length, by_family: fam, no_behavioural_difference: by('no_behavioural_difference').length, declared_rp_con_02_difference: by('declared_rp_con_02_difference'), unexpected_regression: by('unexpected_regression'),
    compile_errors_031: results.filter((r) => r.v031_error).length, compile_errors_032: results.filter((r) => r.v032_error).length, v032_mechanical_failures: results.reduce((n, r) => n + r.v032_mechanical.length, 0),
    network_attempts: attempts.length, isolated_031_unchanged_and_deleted: end31.unchanged && end31.deleted, isolated_032_file_count_unchanged: after === rows.length },
  results };
writeFileSync(join(HERE, 'DIFFERENTIAL_RESULTS.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out.totals));
