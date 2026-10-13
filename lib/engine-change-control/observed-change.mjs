// JRS ADAPTIVE RELIABILITY: observed-change records.
//
// Runs a proposal's isolated patch against the synthetic fixtures in a temporary
// copy of the libraries (outside the repository, deleted afterwards), compares
// it with the frozen baseline, and returns a deterministic record of what was
// observed. The compiler classifies risk from this record, not from what the
// proposer declares. Nothing here edits the repository.

import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildDriftLedger } from './drift-ledger.mjs';
import { runIdentity, validateRunIdentity, sha, canon } from './identity.mjs';

const LIB = fileURLToPath(new URL('../', import.meta.url));
export const OBSERVATION_COMMAND = 'node research/adaptive-reliability-2026-10-13/build-artifacts.mjs (observeChange)';

export const requestHash = (request) => sha(canon(request));

export async function isolatedCompiler(patch) {
  if (!patch || typeof patch.file !== 'string' || typeof patch.from !== 'string' || typeof patch.to !== 'string') throw new Error('isolated patch malformed');
  if (!/^engine-(?:evidence-graph|evidence-contract|assurance)\/[A-Za-z0-9_./-]+\.mjs$/.test(patch.file) || patch.file.includes('..')) throw new Error('isolated patch target not permitted');
  const tmp = mkdtempSync(join(tmpdir(), 'jrs-iso-'));
  try {
    for (const d of ['engine-assurance', 'engine-evidence-contract', 'engine-evidence-graph']) cpSync(join(LIB, d), join(tmp, d), { recursive: true });
    const p = join(tmp, patch.file), s = readFileSync(p, 'utf8');
    if (s.split(patch.from).length !== 2) throw new Error('isolated patch target not unique in ' + patch.file);
    writeFileSync(p, s.replace(patch.from, patch.to));
    const mod = await import(pathToFileURL(join(tmp, 'engine-evidence-graph/compiler.mjs')).href);
    return { compile: mod.compileEvidenceGraph, cleanup: () => rmSync(tmp, { recursive: true, force: true }) };
  } catch (e) { rmSync(tmp, { recursive: true, force: true }); throw e; }
}

// cases: [{ id, submission, response, mode, label }]; baselineCompile: frozen v0.3 compiler.
export async function observeChange(request, cases, baselineCompile, clock) {
  const patch = request.isolated_patch;
  const iso = await isolatedCompiler(patch);
  try {
    const run = (compile) => { const graphs = {}, failures = []; for (const c of cases) { try { graphs[c.id] = compile({ submission: c.submission, candidateResponseText: c.response, executionMode: c.mode, clock, fixtureId: c.id }); } catch (e) { failures.push({ fixture_id: c.id, error: String(e.message).slice(0, 160) }); } } return { graphs, failures }; };
    const base = run(baselineCompile), cand = run(iso.compile);
    const labels = Object.fromEntries(cases.map((c) => [c.id, c.label]));
    const ledger = buildDriftLedger({ version: '0.3.0-local', graphs: base.graphs, labels }, { version: '0.3.0-local + isolated patch', graphs: cand.graphs, labels });
    const fixtures = Object.entries(base.graphs).map(([id, g]) => ({ fixture_id: id, fixture_hash: g.identity.fixture_hash }));
    const identity = runIdentity({ patch, fixtures, command: OBSERVATION_COMMAND, mode: 'local_isolated_copy', clock });
    const count = (code) => ledger.violations.filter((v) => v.code === code).length;
    const body = {
      record_type: 'jrs-observed-change/0.4.1-local', request_sha256: requestHash(request), identity,
      baseline_compile_failures: base.failures, candidate_compile_failures: cand.failures,
      summary: { rows: ledger.rows.length, fixtures_changed: [...new Set(ledger.rows.map((r) => r.fixture_id))].length,
        favourable_transitions: count('favourable_transition_unsafe_until_human_disposition'), refusals_removed: count('refusal_disappeared'),
        limitations_removed: count('limitation_disappeared'), proof_edges: count('edge_meaning_implies_proof'), excluded_domain_unrefused: count('excluded_domain_no_longer_refused'),
        conflict_review_lost: count('contradiction_not_routed_to_review'), relabelled_independent: count('synthetic_fixture_relabelled_independent'), fixtures_missing: count('fixture_missing_from_run'),
        refusals_added: ledger.rows.filter((r) => r.changed_refusal_behavior && r.prior_outcome !== 'not_assessed' && r.candidate_outcome === 'not_assessed').length },
      rows: ledger.rows, violations: ledger.violations, human_disposition: 'not_recorded',
    };
    body.record_sha256 = sha(canon(body));
    return body;
  } finally { iso.cleanup(); }
}

// Returns problems; empty means the record is complete, intact and bound to this request.
export function verifyObservedChange(record, request, current) {
  const p = [];
  if (!record || typeof record !== 'object') return ['observed-change record absent'];
  if (record.record_type !== 'jrs-observed-change/0.4.1-local') p.push('record_type not recognised');
  for (const x of validateRunIdentity(record.identity)) p.push(x);
  const { record_sha256, ...body } = record;
  if (record_sha256 !== sha(canon(body))) p.push('record hash mismatch (record altered)');
  if (record.request_sha256 !== requestHash(request)) p.push('record is bound to a different request');
  if (!request.isolated_patch || (record.identity && record.identity.patch_sha256 !== sha(canon(request.isolated_patch)))) p.push('record patch does not match the request patch');
  if (record.identity && current && record.identity.change_control_sha256 !== current.change_control_sha256) p.push('record produced by a different change-control package');
  if (record.identity && current && record.identity.baseline_sha256 !== current.baseline_sha256) p.push('record produced against a different baseline package');
  if (record.identity && record.identity.execution_mode !== 'local_isolated_copy') p.push('record not produced from an isolated copy');
  if (!Array.isArray(record.candidate_compile_failures) || record.candidate_compile_failures.length) p.push('candidate failed to compile ' + ((record.candidate_compile_failures || []).length) + ' fixture(s); observation incomplete');
  if (!Array.isArray(record.baseline_compile_failures) || record.baseline_compile_failures.length) p.push('baseline failed to compile; observation incomplete');
  if (record.human_disposition !== 'not_recorded') p.push('human_disposition set by a non-human process');
  if (!record.summary || typeof record.summary.favourable_transitions !== 'number') p.push('summary missing');
  return p;
}
