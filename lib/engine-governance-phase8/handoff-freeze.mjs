// JRS PHASE 8.1: static, execution-disabled independent-evaluation handoff freeze.
//
// Assembles recorded Phase 7 and Phase 8 evidence into one sealed record that a
// future evaluation could start from. It reads no sealed evaluation material or real
// record, labels nothing, scores nothing and authorizes nothing.

import { hashOf, STATUS_LINES, RELEASE_STATUS } from './registry.mjs';
import { scanClaims } from './claims.mjs';
import { claimsB018Resolved } from './later-packages.mjs';

export const SYNTHETIC_VS_INDEPENDENT = 'All results in this freeze are local engineering checks on synthetic material, run by the team that built the candidate. An independent evaluation would use authorized material, independent labelers blind to candidate output, an adjudicator, a frozen candidate and a sealed protocol. None has been authorized or conducted, and no result here stands in for one.';
export const REEVALUATION_TRIGGERS = Object.freeze(['any change to the candidate package hash', 'any rule-pack, prompt or response-contract change', 'any model or provider change', 'any change to intake scope or excluded domains',
  'any change to the evaluation protocol or measures', 'any change to the environment recorded at freeze', 'evidence of contamination of sealed evaluation material', 'any owner decision that widens a rule']);

// inputs: { versionRegistry, laterRegistry, qualification, protocol, changeModel, decisions, phase7Seal }
export function buildHandoffFreeze(i) {
  const p7 = i.versionRegistry.packages.find((p) => p.id === 'phase7-candidate');
  const model = i.changeModel.classes.find((c) => c.id === 'model/provider change');
  const rec = {
    record_type: 'jrs-phase8-1-independent-evaluation-handoff-freeze/1.0.0', status_lines: STATUS_LINES, release_status: RELEASE_STATUS,
    execution_enabled: false, evaluation_authorized: false, evaluation_conducted: false,
    candidate: { id: 'phase7-candidate', compiler_version: '0.3.1-candidate', package_sha256: p7.package_sha256, file_count: p7.file_count, phase7_seal_sha256: i.phase7Seal.seal_sha256,
      rule_packs: i.phase7Seal.rule_packs.map((r) => ({ file: r.file, sha256: r.sha256 })), base: 'v0.3-evidence-graph (0.3.0-local)' },
    lineage: i.versionRegistry.packages.map((p) => ({ id: p.id, status: p.status, package_sha256: p.package_sha256, file_count: p.file_count })),
    // Phase 8.2: only the retroactive seeds belong to the frozen lineage; admitted future packages never alter the freeze.
    later_packages: i.laterRegistry.packages.filter((e) => e.entry_class === 'retroactive_seed' || (!e.entry_class && e.seeded_retroactively)).map((e) => ({ id: e.package_id, version: e.package_version, status: e.status })),
    qualification_record_sha256: i.qualification.record_sha256,
    known_limitations: { candidate: 'research/engine-remediation-phase7-2026-10-19/KNOWN_LIMITATIONS.md', phase8: 'research/engine-governance-phase8-2026-10-19/KNOWN_LIMITATIONS_AND_OPEN_ISSUES.md' },
    deferred_and_open_issues: i.qualification.open_issues.map((x) => ({ id: x.issue_id, ref: x.ref, status: x.status })),
    synthetic_vs_independent: SYNTHETIC_VS_INDEPENDENT,
    roles: i.protocol.roles.map((r) => ({ role: r.role, duties: r.duties, may_view_sealed_labels: r.may_view_sealed_labels })),
    material_separation: i.protocol.materials, contamination_controls: i.protocol.blinding_and_contamination, protocol_seal_sha256: i.protocol.seal_sha256, gates: i.protocol.gates.map((g) => g.gate + ': ' + g.name),
    provider_or_model_change_criteria: { class: model.id, evidence: model.evidence, regression: model.regression, invalidates_sealed_evaluation: model.invalidates_sealed_evaluation, rollback: model.rollback, counsel_trigger: model.counsel_trigger },
    reevaluation_triggers: REEVALUATION_TRIGGERS,
    unresolved_owner_decisions: i.decisions.decisions.filter((d) => d.status === 'open').map((d) => d.id).concat(i.decisions.phase7_decisions_carried.map((d) => d.id)),
    b018: { status: 'OPEN', statement: 'B-018 remains OPEN. This freeze does not address or reconcile it.' },
  };
  rec.freeze_sha256 = hashOf(rec);
  return rec;
}

export function validateHandoffFreeze(f) {
  const e = [];
  if (!f || typeof f !== 'object') return ['freeze missing'];
  if (f.execution_enabled !== false || f.evaluation_authorized !== false || f.evaluation_conducted !== false) e.push('execution, authorization or conduct state altered');
  if (f.release_status !== RELEASE_STATUS) e.push('release status altered');
  if (!f.candidate || !/^sha256:[0-9a-f]{64}$/.test(f.candidate.package_sha256 || '')) e.push('candidate identity missing');
  if (!Array.isArray(f.lineage) || f.lineage.length < 7) e.push('lineage incomplete');
  for (const r of ['owner', 'data_custodian', 'independent_labeler', 'adjudicator', 'technical_operator', 'counsel_or_privacy_reviewer']) if (!(f.roles || []).some((x) => x.role === r)) e.push('missing role: ' + r);
  const sealed = (f.material_separation || []).find((m) => m.class === 'sealed_evaluation_material');
  if (!sealed || sealed.in_repository !== false || sealed.developer_access !== false) e.push('sealed material separation missing');
  if (!(f.contamination_controls || []).length) e.push('contamination controls missing');
  if (f.synthetic_vs_independent !== SYNTHETIC_VS_INDEPENDENT) e.push('synthetic versus independent statement missing or altered');
  if (!f.provider_or_model_change_criteria || f.provider_or_model_change_criteria.invalidates_sealed_evaluation !== true) e.push('provider or model change criteria missing');
  if (REEVALUATION_TRIGGERS.some((t) => !(f.reevaluation_triggers || []).includes(t))) e.push('re-evaluation triggers incomplete');
  if (!(f.unresolved_owner_decisions || []).length) e.push('unresolved owner decisions missing');
  if (!f.b018 || f.b018.status !== 'OPEN' || claimsB018Resolved(JSON.stringify(f))) e.push('B-018 not recorded as open');
  if (!(f.deferred_and_open_issues || []).length || f.deferred_and_open_issues.some((x) => x.status !== 'active')) e.push('deferred or open issues missing or closed');
  if (scanClaims(JSON.stringify(f)).length) e.push('unsupported claim in freeze');
  if (/"(?:score|labels?|holdout_results?|predictions?)"\s*:/i.test(JSON.stringify(f))) e.push('freeze carries labels, scores or results');
  const { freeze_sha256, ...rest } = f;
  if (freeze_sha256 !== hashOf(rest)) e.push('freeze hash mismatch');
  return e;
}
