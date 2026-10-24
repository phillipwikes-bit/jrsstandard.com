// JRS PHASE 8: unified local qualification record for the v0.3.1 candidate.
//
// Combines the recorded Phase 7 results without reinterpreting them: each component
// copies recorded values and names its source file with that file's SHA-256, which
// must equal the Phase 7 manifest. No score, percentage or grade is computed. Every
// unresolved issue is active until an owner decision or a separately authorized
// remediation record exists.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { sha256, hashOf, parseManifestText, STATUS_LINES, RELEASE_STATUS } from './registry.mjs';
import { scanClaims } from './claims.mjs';

export const P7 = 'research/engine-remediation-phase7-2026-10-19';
export const EVIDENCE_KIND = 'local_engineering_check';
export const NOT_ESTABLISHED = Object.freeze(['semantic validity', 'accuracy', 'reliability in use', 'legal compliance', 'readiness for release, deployment, sale or licensing', 'performance on real records']);
export const STATEMENT = 'These are local engineering checks on synthetic material, run by the team that built the candidate. They are not an independent evaluation. Passing them does not establish semantic validity, accuracy, reliability in use, legal compliance or readiness.';
const FORBIDDEN_KEYS = /(?:^|_)(?:score|percent|percentage|grade|readiness|confidence|rating|rank)(?:_|$)/i;

const SOURCES = {
  differential: P7 + '/results/QUALIFICATION_RESULTS.json', scenarios: P7 + '/results/SCENARIO_RESULTS.json', stability: P7 + '/stability/STABILITY_RESULTS.json',
  mutation: P7 + '/execution-record/MUTATION_EVIDENCE.json', determinism: P7 + '/execution-record/DETERMINISM_RECORD.json', over_refusal: P7 + '/results/OVER_REFUSAL_TABLE.json',
  suite: P7 + '/execution-record/TEST_RESULTS.json', backlog: P7 + '/backlog/REMEDIATION_BACKLOG.jsonl', limitations: P7 + '/KNOWN_LIMITATIONS.md',
  decisions: P7 + '/OWNER_DECISION_REGISTER.md', phase6_on_candidate: P7 + '/results/PHASE6_LIBRARY_ON_CANDIDATE.json',
};

export function buildQualificationRecord(root, phase7ManifestText, phase7Decisions) {
  const man = new Map(parseManifestText(phase7ManifestText).map((r) => [r.path, r.sha256]));
  const src = (k) => { const f = SOURCES[k]; const b = readFileSync(join(root, f)); return { path: f, sha256: sha256(b), manifest_sha256: man.get(f) || null }; };
  const J = (k) => JSON.parse(readFileSync(join(root, SOURCES[k]), 'utf8'));
  const q = J('differential'), sc = J('scenarios'), st = J('stability'), mu = J('mutation'), de = J('determinism'), ov = J('over_refusal'), su = J('suite'), p6 = J('phase6_on_candidate');
  const backlog = readFileSync(join(root, SOURCES.backlog), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const components = {
    differential: { source: src('differential'), existing_inputs: q.existing.length, existing_counts: q.existing_counts, phase7_scenarios: q.phase7.length, phase7_counts: q.phase7_counts, recorded_statement: q.statement },
    sealed_scenarios: { source: src('scenarios'), total: sc.results.length, counts: sc.counts },
    stability_transforms: { source: src('stability'), total: st.total, as_expected: st.as_expected, invariant_total: st.invariant_total, invariant_non_favorable_base: st.invariant_non_favorable_base, results_hash: st.results_hash, recorded_statement: st.statement },
    mutation: { source: src('mutation'), total: mu.total, killed: mu.killed, survived: mu.survived, load_failures: mu.load_failures, probes: mu.probes, recorded_at: mu.generated_at },
    determinism: { source: src('determinism'), passes: de.passes.length, distinct_hashes: [...new Set(de.passes)].length, hash: de.passes[0] },
    over_refusal: { source: src('over_refusal'), recorded_statement: ov.statement, rows: ov.rows.map((r) => ({ rule_id: r.rule_id, target_cases: r.target_cases, target_cases_routed_as_sealed: r.target_cases_routed_as_sealed, benign_cases: r.benign_cases, benign_cases_refused_or_degraded: r.benign_cases_refused_or_degraded })) },
    phase7_suite: { source: src('suite'), passed: su.passed, failed: su.failed, recorded_at: su.generated_at, note: 'Time-bound recorded result for the sealed Phase 7 scope.' },
    phase6_library_on_candidate: { source: src('phase6_on_candidate'), counts: p6.counts, recorded_note: p6.note },
    known_limitations: { source: src('limitations') },
    owner_decisions: { source: src('decisions') },
  };
  const issues = [];
  for (const e of backlog) issues.push({ issue_id: e.entry_id, ref: e.defect_ref, recorded_decision: e.decision, owner_decision_required: e.owner_decision_required,
    independent_evaluation_required_before_stronger_claim: e.independent_evaluation_required_before_stronger_claim, status: 'active', resolution_record: null });
  for (const d of phase7Decisions) issues.push({ issue_id: d.id, ref: 'Phase 7 owner decision', question: d.question, status: 'active', resolution_record: null });
  const rec = { record_type: 'jrs-phase8-candidate-qualification-record/1.0.0', status_lines: STATUS_LINES, release_status: RELEASE_STATUS, candidate: 'lib/engine-evidence-graph-v0.3.1-candidate (0.3.1-candidate)', base: 'lib/engine-evidence-graph (0.3.0-local)',
    evidence_kind: EVIDENCE_KIND, independent_evaluation: 'not_authorized_not_conducted', statement: STATEMENT, not_established: NOT_ESTABLISHED, components, open_issues: issues };
  rec.record_sha256 = hashOf(rec);
  return rec;
}

export function validateQualificationRecord(rec) {
  const p = [];
  if (!rec || typeof rec !== 'object') return ['record missing'];
  if (rec.evidence_kind !== EVIDENCE_KIND) p.push('evidence kind is not a local engineering check');
  if (rec.independent_evaluation !== 'not_authorized_not_conducted') p.push('independent evaluation status altered');
  if (rec.statement !== STATEMENT) p.push('limitation statement missing or altered');
  if (NOT_ESTABLISHED.some((x) => !(rec.not_established || []).includes(x))) p.push('not-established list incomplete');
  if (rec.release_status !== RELEASE_STATUS) p.push('release status altered');
  const walk = (o, path) => { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (FORBIDDEN_KEYS.test(k)) p.push('forbidden field: ' + path + k); walk(v, path + k + '.'); } };
  walk(rec, '');
  for (const [k, c] of Object.entries(rec.components || {})) {
    if (!c.source || !c.source.sha256) { p.push(k + ': no source'); continue; }
    if (c.source.sha256 !== c.source.manifest_sha256) p.push(k + ': source differs from the Phase 7 manifest');
  }
  for (const k of ['differential', 'sealed_scenarios', 'stability_transforms', 'mutation', 'determinism', 'over_refusal', 'known_limitations', 'owner_decisions']) if (!rec.components || !rec.components[k]) p.push('missing component: ' + k);
  if (!Array.isArray(rec.open_issues) || !rec.open_issues.length) p.push('no open issues recorded');
  for (const i of rec.open_issues || []) if (i.status !== 'active' && !i.resolution_record) p.push(i.issue_id + ': closed without an owner decision or remediation record');
  if (scanClaims(JSON.stringify(rec)).length) p.push('unsupported claim in record');
  const { record_sha256, ...rest } = rec;
  if (record_sha256 !== hashOf(rest)) p.push('record hash mismatch');
  return p;
}
