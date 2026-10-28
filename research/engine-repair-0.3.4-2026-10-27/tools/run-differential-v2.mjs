// 0.3.4 repair package: default-path identity of a research candidate against 0.3.2-candidate (differential 2.0).
// A copy of the study's 1.0 runner (unchanged there) with the candidate version as an argument, so the same inputs
// and normalization compare 0.3.4 (and, as a check of the copy, 0.3.3) against 0.3.2.
//
// 156-record study: default-path identity of 0.3.3-research-candidate against 0.3.2-candidate.
// Every earlier-phase input (the 244 used by the V0-02 differential), the 60 V0 corpus cases and the six
// correction regression cases are compiled by both versions WITHOUT a research profile. The whole graph is
// compared after normalizing only what must differ: version labels, the compiler and pack content hashes, and
// the identifiers derived from them (run_id, graph_sha256). Any other difference is a failure.
// Usage: node tools/run-differential-v2.mjs <candidate-version> <scratch>   (writes out/differential-<version>/DIFFERENTIAL_DEFAULT_PATH.json)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isolate, loadEngine } from './harness/engines.mjs';   // repair harness 2.0
import { normalizeDefaultGraph as normalize } from './compile-row-v2.mjs';   // the normalization below, moved there unchanged so the scored runner shares it

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const R = join(PKG, '..');
const [CANDIDATE, SCRATCH] = process.argv.slice(2);
if (!CANDIDATE || !SCRATCH) { console.error('usage: run-differential-v2.mjs <candidate-version> <scratch>'); process.exit(2); }
const OUT = join(PKG, 'out', 'differential-' + CANDIDATE, 'DIFFERENTIAL_DEFAULT_PATH.json');
if (existsSync(OUT)) { console.error('exists: ' + OUT); process.exit(2); }
mkdirSync(dirname(OUT), { recursive: true });

const P7T = join(R, 'engine-remediation-phase7-2026-10-19', 'tooling');
const { existingInputs, phase7Inputs } = await import(pathToFileURL(join(P7T, 'inputs.mjs')).href);
const { submissionFor } = await import(pathToFileURL(join(P7T, 'scenario-schema.mjs')).href);
const inputs = [...(await existingInputs()), ...phase7Inputs().map((s) => ({ id: s.scenario_id, family: 'phase7-scenario', submission: submissionFor(s), response: s.candidate_response_text, mode: s.execution_mode }))];
const V0C = join(R, 'validation-readiness-gate-v0-2026-10-25', 'corpus');
const SCOPE = { record_type: 'supplier_access_exception_draft', record_state: 'completed_draft', content_origin: 'synthetic_engineering_fixture', hr_content: false, regulated_decision_content: false };
for (const f of readdirSync(join(V0C, 'expectations')).sort()) {
  const id = f.replace('.expected.json', '');
  const env = JSON.parse(readFileSync(join(V0C, 'cases', id + '.candidate.json'), 'utf8')).envelope || {};
  const text = Array.isArray(env.content) && env.content[0] && typeof env.content[0].text === 'string' ? env.content[0].text : null;
  inputs.push({ id: 'V0:' + id, family: 'v0-corpus', submission: { submission_metadata: { submission_id: id }, scope_declaration: SCOPE, declared_versions: { compiler_version: '0.3.0-local' },
    requested_outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], record_text: readFileSync(join(V0C, 'cases', id + '.record.txt'), 'utf8') }, response: text, mode: 'local_mocked' });
}
const CORR = join(R, 'engine-correction-v0-02-ev32-2026-10-25');
for (const d of ['regression', 'regression-supplement']) for (const f of readdirSync(join(CORR, d, 'cases')).filter((x) => x.endsWith('.spec.json')).sort()) {
  const spec = JSON.parse(readFileSync(join(CORR, d, 'cases', f), 'utf8'));
  const rec = spec.record_source.startsWith('V0 sealed corpus ') ? readFileSync(join(V0C, spec.record_source.replace('V0 sealed corpus ', '')), 'utf8') : readFileSync(join(CORR, 'regression-supplement', spec.record_source.replace('regression-supplement ', '')), 'utf8');
  const env = JSON.parse(readFileSync(join(CORR, d, 'cases', spec.case_id + '.candidate.json'), 'utf8')).envelope;
  inputs.push({ id: 'RC:' + spec.case_id, family: 'correction-regression', submission: { submission_metadata: { submission_id: spec.case_id }, scope_declaration: SCOPE, declared_versions: { compiler_version: '0.3.0-local' },
    requested_outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], record_text: rec }, response: env.content[0].text, mode: 'local_mocked' });
}

const iso2 = isolate('0.3.2-candidate', SCRATCH), iso3 = isolate(CANDIDATE, SCRATCH, { requireManifest: CANDIDATE !== '0.3.4-research-candidate' || existsSync(join(PKG, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt')) });
const E2 = await loadEngine(iso2), E3 = await loadEngine(iso3);
const dv = (E, s) => { const x = JSON.parse(JSON.stringify(s === undefined ? null : s)); if (x && x.declared_versions) { const d = x.declared_versions;
  if (d.compiler_version === '0.3.0-local' && !d.contract_version) x.declared_versions = Object.assign({}, E.declaredVersions); else if (d.compiler_version === '0.3.0-local') d.compiler_version = E.contract.COMPILER_VERSION; } return x; };
const run = (E, i) => { try { return { g: E.compiler.compileEvidenceGraph({ submission: dv(E, i.submission), candidateResponseText: i.response, executionMode: i.mode, clock: '2026-10-27T00:00:00.000Z', fixtureId: i.id }), err: null }; } catch (e) { return { g: null, err: String(e.message).slice(0, 160) }; } };
const VERS = /0\.3\.[234](?:-research)?-candidate/g;
const results = [];
for (const i of inputs) {
  const a = run(E2, i), b = run(E3, i);
  const same = !!a.err === !!b.err && (a.err ? a.err.replace(VERS, '<V>') === b.err.replace(VERS, '<V>') : normalize(a.g) === normalize(b.g));
  const vg = b.g ? E3.graphValidate.validateGraph(b.g, i.submission && i.submission.record_text) : [];
  results.push({ id: i.id, family: i.family, identical_after_normalization: same, error_032: a.err, error_033: b.err, graph_validation_033: vg,
    research_profile_key_absent: b.g ? !('research_profile' in b.g) : null, intake: b.g ? b.g.intake.decision : null });
}
const rel2 = iso2.release(), rel3 = iso3.release();
const fam = {}; for (const r of results) fam[r.family] = (fam[r.family] || 0) + 1;
const out = { results_format: 'jrs-0.3.4-differential/2.0.0', candidate: CANDIDATE, date: new Date().toISOString(),
  method: 'Full-graph comparison after normalizing version labels, compiler and pack hashes and the identifiers derived from them. No research profile is passed to the candidate.',
  engines: { '0.3.2-candidate': { snapshot_sha256: iso2.snapshot_sha256, manifest_sha256: iso2.manifest_sha256, released: rel2 }, [CANDIDATE]: { snapshot_sha256: iso3.snapshot_sha256, manifest_sha256: iso3.manifest_sha256, released: rel3 } },
  totals: { inputs: results.length, by_family: fam, identical: results.filter((r) => r.identical_after_normalization).length, different: results.filter((r) => !r.identical_after_normalization).map((r) => r.id),
    errors_032: results.filter((r) => r.error_032).length, errors_candidate: results.filter((r) => r.error_033).length, graph_validation_failures_candidate: results.filter((r) => r.graph_validation_033.length).length,
    research_key_present_without_profile: results.filter((r) => r.research_profile_key_absent === false).length,
    intake: Object.fromEntries(['proceed', 'refuse', 'escalate'].map((d) => [d, results.filter((r) => r.intake === d).length])), network_attempts: attempts.length },
  results };
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out.totals));
