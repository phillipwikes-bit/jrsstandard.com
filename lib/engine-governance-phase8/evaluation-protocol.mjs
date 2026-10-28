// JRS PHASE 8: sealed, execution-disabled protocol for a future independent evaluation.
//
// This is a static description. It generates no material, recruits no one, contacts
// no one, reads no record and calls nothing external. Measures are defined, never
// calculated. executeProtocol() always refuses. Authorizing an evaluation is an owner
// decision taken outside this package (Gate A onward).

import { hashOf, STATUS_LINES, RELEASE_STATUS } from './registry.mjs';
import { scanClaims } from './claims.mjs';

export const PROTOCOL = Object.freeze({
  protocol_id: 'JRS-IEP-0.1-draft', protocol_version: '0.1.0', status_lines: STATUS_LINES, release_status: RELEASE_STATUS,
  execution_enabled: false, authorization: 'not_authorized', conducted: false,
  candidate_under_evaluation: { id: 'phase7-candidate', compiler_version: '0.3.1-candidate', base: 'v0.3-evidence-graph (0.3.0-local)', identity_rule: 'Identified by its Phase 8 package hash; any change before Gate D invalidates the freeze.' },
  questions: [
    { id: 'Q1', area: 'quote presence and offset accuracy', question: 'When the candidate marks a quotation as present, is the quoted text found in the record at the recorded offsets?' },
    { id: 'Q2', area: 'human-review routing', question: 'Does the candidate route to human review the conditions that independent labelers judge should not receive a supported status?' },
    { id: 'Q3', area: 'chronology conflict detection', question: 'Does the candidate report the chronology conflicts that independent labelers identify, and only those?' },
    { id: 'Q4', area: 'exclusion and refusal behaviour', question: 'Does the candidate refuse records in excluded domains, and avoid refusing records outside them?' },
    { id: 'Q5', area: 'Cognitive Controls neutrality', question: 'Do Cognitive Controls prompts stay neutral (no direction towards an outcome) as judged by independent labelers?' },
    { id: 'Q6', area: 'presence versus semantic support', question: 'Where the candidate reports text presence, do labelers find that the text semantically supports the condition, and does the candidate avoid presenting presence as support?' },
  ],
  roles: [
    { role: 'owner', duties: 'Authorizes each gate; does not label, adjudicate or operate.', may_view_sealed_labels: false },
    { role: 'data_custodian', duties: 'Holds and releases authorized material; keeps sealed labels outside the repository.', may_view_sealed_labels: true },
    { role: 'independent_labeler', duties: 'Labels material blind to candidate output; independent of the developers and of each other.', may_view_sealed_labels: true, must_be_independent_of: ['developer', 'technical_operator', 'owner'] },
    { role: 'adjudicator', duties: 'Resolves disputed labels under the written rule; does not label the same item.', may_view_sealed_labels: true, must_be_independent_of: ['developer', 'independent_labeler'] },
    { role: 'technical_operator', duties: 'Runs the frozen candidate in the recorded environment; never sees labels before Gate E.', may_view_sealed_labels: false },
    { role: 'counsel_or_privacy_reviewer', duties: 'Reviews material authorization, privacy and disclosure before Gate A and at Gate F.', may_view_sealed_labels: false },
  ],
  separation_rules: ['No person holds both a developer or technical_operator role and a labeler or adjudicator role.', 'Labelers do not see candidate output before labeling.', 'Developers never access sealed labels.'],
  materials: [
    { class: 'synthetic_engineering_fixtures', use: 'Development and regression only. Never used to report evaluation results.', in_repository: true },
    { class: 'calibration_material', use: 'Labeler training and rule calibration; results not reported as performance.', in_repository: false },
    { class: 'sealed_evaluation_material', use: 'Blind execution only, after protocol freeze.', in_repository: false, developer_access: false, copy_into_repository: 'prohibited' },
    { class: 'real_records', use: 'Prohibited unless separately authorized in writing under Gate A with counsel review.', in_repository: false, default: 'prohibited' },
  ],
  blinding_and_contamination: [
    'Developers have no access to sealed evaluation labels.',
    'Sealed evaluation material is never copied into the repository.',
    'No prompt, rule pack, model or code change after the protocol freeze (Gate B); any such change voids the freeze and requires a new freeze.',
    'Ambiguous or disputed labels go to the adjudicator under a written rule recorded before labeling; adjudication outcomes are recorded with reasons.',
    'The candidate package hash, environment and clock are recorded at freeze and at execution; any difference stops the evaluation.',
  ],
  measures: [
    { id: 'M1', name: 'quote-verification precision', definition: 'Of quotations the candidate marks as verified, the share that labelers confirm as present at the recorded offsets.', unit: 'proportion', calculated: false },
    { id: 'M2', name: 'quote-verification recall', definition: 'Of quotations labelers identify as present and relevant, the share the candidate marks as verified.', unit: 'proportion', calculated: false },
    { id: 'M3', name: 'routing agreement', definition: 'Share of conditions where the candidate route (supported, review_required, not_assessed, refusal) matches the adjudicated label.', unit: 'proportion', calculated: false },
    { id: 'M4', name: 'false-refusal rate', definition: 'Share of in-scope records the candidate refuses.', unit: 'proportion', calculated: false },
    { id: 'M5', name: 'missed-conflict rate', definition: 'Share of labeled chronology or control conflicts the candidate does not report.', unit: 'proportion', calculated: false },
    { id: 'M6', name: 'inter-rater agreement', definition: 'Chance-corrected agreement between independent labelers before adjudication; statistic named at freeze.', unit: 'coefficient', calculated: false },
    { id: 'M7', name: 'adjudication rate', definition: 'Share of labeled items that required adjudication.', unit: 'proportion', calculated: false },
    { id: 'M8', name: 'abstention or review-required rate', definition: 'Share of conditions the candidate routes to review_required or not_assessed.', unit: 'proportion', calculated: false },
  ],
  stop_conditions: [
    'source or data authorization gap', 'counsel objection', 'labeler independence failure', 'sealed evaluation material contamination',
    'unexplained candidate drift (package hash differs from the freeze)', 'provider or environment change', 'any attempt to claim performance before the evaluation is completed',
  ],
  gates: [
    { gate: 'A', name: 'material authorization', requires: 'Owner and counsel or privacy reviewer authorize material classes, sources and retention in writing.' },
    { gate: 'B', name: 'protocol freeze', requires: 'Candidate package hash, rule packs, prompts, environment, measures and adjudication rule frozen and sealed.' },
    { gate: 'C', name: 'independent labeling', requires: 'Labelers confirmed independent; labels completed blind and sealed by the data custodian.' },
    { gate: 'D', name: 'blind execution', requires: 'Technical operator runs the frozen candidate; package hash and environment match the freeze.' },
    { gate: 'E', name: 'adjudication', requires: 'Disputes resolved under the written rule; measures calculated only now.' },
    { gate: 'F', name: 'owner and counsel review', requires: 'Owner and counsel review results and limits before any statement is made.' },
  ],
  measures_calculated_in_this_package: false,
});

export function sealProtocol(p = PROTOCOL) { return Object.assign({}, p, { seal_sha256: hashOf(p) }); }
export function executeProtocol() { throw new Error('REFUSED: the independent evaluation protocol is execution-disabled and not authorized'); }

export function validateProtocol(p) {
  const e = [];
  if (!p || typeof p !== 'object') return ['protocol missing'];
  if (p.execution_enabled !== false) e.push('execution enabled');
  if (p.authorization !== 'not_authorized' || p.conducted !== false) e.push('authorization or conduct state altered');
  if (p.measures_calculated_in_this_package !== false) e.push('measures marked as calculated');
  const areas = ['quote presence and offset accuracy', 'human-review routing', 'chronology conflict detection', 'exclusion and refusal behaviour', 'Cognitive Controls neutrality', 'presence versus semantic support'];
  for (const a of areas) if (!(p.questions || []).some((q) => q.area === a)) e.push('missing question area: ' + a);
  for (const r of ['owner', 'data_custodian', 'independent_labeler', 'adjudicator', 'technical_operator', 'counsel_or_privacy_reviewer']) if (!(p.roles || []).some((x) => x.role === r)) e.push('missing role: ' + r);
  const op = (p.roles || []).find((x) => x.role === 'technical_operator'); if (op && op.may_view_sealed_labels !== false) e.push('operator may view sealed labels');
  const ow = (p.roles || []).find((x) => x.role === 'owner'); if (ow && ow.may_view_sealed_labels !== false) e.push('owner may view sealed labels');
  const lab = (p.roles || []).find((x) => x.role === 'independent_labeler'); if (!lab || !(lab.must_be_independent_of || []).includes('developer')) e.push('labeler independence from developers not required');
  const sealed = (p.materials || []).find((m) => m.class === 'sealed_evaluation_material');
  if (!sealed || sealed.in_repository !== false || sealed.developer_access !== false || sealed.copy_into_repository !== 'prohibited') e.push('sealed evaluation material not separated');
  const real = (p.materials || []).find((m) => m.class === 'real_records'); if (!real || real.default !== 'prohibited') e.push('real records not prohibited by default');
  for (const m of ['synthetic_engineering_fixtures', 'calibration_material']) if (!(p.materials || []).some((x) => x.class === m)) e.push('missing material class: ' + m);
  const bc = (p.blinding_and_contamination || []).join(' ');
  if (!/no access to sealed evaluation labels/i.test(bc)) e.push('developer label access not prohibited');
  if (!/never copied into the repository/i.test(bc)) e.push('repository copy not prohibited');
  if (!/No prompt, rule pack, model or code change after the protocol freeze/i.test(bc)) e.push('post-freeze change not prohibited');
  if (!/adjudicator/i.test(bc)) e.push('disputed-label handling missing');
  for (const m of ['quote-verification precision', 'quote-verification recall', 'routing agreement', 'false-refusal rate', 'missed-conflict rate', 'inter-rater agreement', 'adjudication rate', 'abstention or review-required rate']) {
    const x = (p.measures || []).find((y) => y.name === m);
    if (!x) e.push('missing measure: ' + m); else if (x.calculated !== false || 'value' in x || 'result' in x) e.push('measure has a value: ' + m);
  }
  for (const s of ['source or data authorization gap', 'counsel objection', 'labeler independence failure', 'provider or environment change', 'any attempt to claim performance before the evaluation is completed']) if (!(p.stop_conditions || []).includes(s)) e.push('missing stop condition: ' + s);
  if (!(p.stop_conditions || []).some((s) => /contamination/.test(s))) e.push('missing stop condition: contamination');
  if (!(p.stop_conditions || []).some((s) => /drift/.test(s))) e.push('missing stop condition: drift');
  if (JSON.stringify((p.gates || []).map((g) => g.gate)) !== JSON.stringify(['A', 'B', 'C', 'D', 'E', 'F'])) e.push('gates A to F missing or out of order');
  if (scanClaims(JSON.stringify(p)).length) e.push('protocol contains an unsupported claim');
  return e;
}

// A recorded freeze is invalidated by any later change to what was frozen.
export function freezeInvalidated(freeze, current) {
  if (!freeze) return 'no freeze recorded';
  for (const k of ['candidate_package_sha256', 'rule_packs_sha256', 'prompt_sha256', 'model_identifier', 'environment', 'protocol_seal']) if (freeze[k] !== current[k]) return 'changed after freeze: ' + k;
  return null;
}
