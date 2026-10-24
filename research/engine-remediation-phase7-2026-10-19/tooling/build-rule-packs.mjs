#!/usr/bin/env node
// JRS PHASE 7: writes the six candidate rule packs and the rule-pack register.
// A pack's signature is a SHA-256 seal over its canonical content (everything
// except the signature). It is an integrity seal, not a cryptographic identity.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonical, sha } from '../../../lib/engine-reliability/canonical.mjs';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const OUT = join(REPO, 'lib/engine-evidence-graph-v0.3.1-candidate/rule-packs');
const P7 = join(REPO, 'research/engine-remediation-phase7-2026-10-19');
export const CANDIDATE_VERSION = '0.3.1-candidate';
const OD = 'Any widening of the trigger, any new pattern, or any change of outcome requires a recorded owner decision and a new sealed scenario set.';
const r = (rule_id, purpose, trigger, expected_safe_outcome, limitation, false_positive_risk, linked_scenarios) => ({ rule_id, purpose, trigger, expected_safe_outcome, limitation, false_positive_risk, linked_scenarios, owner_decision_for_expansion: OD });

export const PACKS = [
  { pack_id: 'RPK-STR', pack_version: '1.0.0', purpose: 'Structural integrity: the compiler reports a withheld inference instead of failing its own self-validation.', rules: [
    r('RP-STR-01', 'Repair P6-RT-07.', 'The internal label for a candidate note that attributes motive or purpose ("motive", "motivated", "in order to hide", "wanted to", "tried to") is "attributed_purpose" instead of a word that the graph self-validation forbids.',
      'assertion_withheld_and_review', 'Covers this one label. Other inference labels are unchanged; untested labels may still trip self-validation.', 'None added: the detection pattern is unchanged; only the label text changes.',
      ['P6-RT-07', 'P7-R07-01', 'P7-R07-02', 'P7-R07-03', 'P7-R07-04', 'P7-R07-05', 'P7-R07-06'])] },
  { pack_id: 'RPK-CHR', pack_version: '1.0.0', purpose: 'Chronology integrity controls over explicitly dated, role-labelled events.', rules: [
    r('RP-CHR-01', 'Repair P6K-003.', 'An assessment-role event whose clause contains "risk assessment", outside an action-role section (revocation, follow-up, corrective action), is dated after the first decision-role event. Adds conflict "assessment_after_decision" affecting chronology_integrity.',
      'conflict_and_review', 'Only risk assessments with an ISO date are compared; reassessments in action sections are excluded by design.', 'A legitimate later reassessment written outside an action section would be flagged.', ['P6-CH-06', 'P7-CHR-01', 'P7-CHR-02', 'P7-CHR-03', 'P7-CHR-04']),
    r('RP-CHR-02', 'Repair P6K-004.', 'Expiry-role events state more than one distinct date. Adds conflict "expiry_date_conflict" affecting chronology_integrity.', 'conflict_and_review',
      'Renewal clauses are not expiry events, so a stated renewal date never conflicts.', 'A record that deliberately states an original and an extended expiry would be flagged.', ['P6-CH-07', 'P7-CHR-05', 'P7-CHR-06', 'P7-CHR-07', 'P7-CHR-08']),
    r('RP-CHR-03', 'Repair P6K-005.', 'No decision-role dated event exists. Adds visible gap "no_dated_decision" to chronology_integrity, so a proposed supported status becomes review_required.', 'review_required',
      'A decision date written in a form the date reader does not recognise counts as missing.', 'A record that dates its decision only in prose without a role keyword would be routed to review.', ['P6-CH-09', 'P7-CHR-09', 'P7-CHR-10', 'P7-CHR-11', 'P7-CHR-12']),
    r('RP-CHR-04', 'Repair P6K-006.', 'The first decision-role section states "for N days", and the first decision and first expiry dates differ from N by more than one day. Adds conflict "duration_date_conflict" affecting chronology_integrity.',
      'conflict_and_review', 'Only "for N days" is read; months, weeks and business days are not.', 'A grant counted in business days would be flagged.', ['P6-CH-10', 'P7-CHR-13', 'P7-CHR-14', 'P7-CHR-15', 'P7-CHR-16'])] },
  { pack_id: 'RPK-NEG', pack_version: '1.0.0', purpose: 'Negation and rationale controls for reasoning traceability.', rules: [
    r('RP-NEG-01', 'Repair P6K-002.', 'A cited stated_rationale for reasoning_traceability matches "not|no|never|without" followed within two words by "need|needs|needed|require|requires|required|because|based on". Such a rationale is not counted; if no other non-negated rationale or source reference is cited, reasoning is review_required with reason "negated_rationale_not_counted".',
      'review_required', 'Bounded lexical negation; other negation forms and double negatives are not interpreted.', 'A sentence such as "not because of cost, but because ..." is routed to review although it states a reason.', ['P6-SP-07', 'P7-NEG-01', 'P7-NEG-02', 'P7-NEG-03', 'P7-NEG-04', 'P7-NEG-05', 'P7-NEG-06', 'P7-NEG-07', 'P7-NEG-08'])] },
  { pack_id: 'RPK-EVL', pack_version: '1.0.0', purpose: 'Evidence-link abstention: a supported status needs at least one cited quotation from a section linked to the condition.', rules: [
    r('RP-EVL-01', 'Address P6K-001 by abstention.', 'When identifiable_basis, chronology_integrity or reasoning_traceability would be supported, at least one cited quotation for it must sit in a linked section role (identifiable_basis: authority or basis; chronology_integrity: chronology, request, authority, decision or expiry; reasoning_traceability: basis). Otherwise the status is review_required with reason "evidence_not_in_linked_section".',
      'review_required', 'Section linkage is not semantic support; a linked section can still hold irrelevant text.', 'A relevant sentence placed in an unlinked section (for example a rationale moved into residual risk, Phase 4 ST-06) is routed to review.',
      ['P6-SP-02', 'P6-SP-04', 'P6-SP-06', 'P7-EVL-01', 'P7-EVL-02', 'P7-EVL-03', 'P7-EVL-04', 'P7-EVL-05', 'P7-EVL-06', 'P7-EVL-07', 'P7-EVL-08'])] },
  { pack_id: 'RPK-CON', pack_version: '1.0.0', purpose: 'Conflict controls for one paraphrase family.', rules: [
    r('RP-CON-01', 'Address P6K-007.', 'When no other control conflict is found: one clause names log review ("log review", "review of (the) (access) logs", "(access) logs are/is reviewed") as in place, and another names it as pending, planned, not started or not begun. Adds conflict "control_state_conflict" affecting sufficiency.',
      'conflict_and_review', 'One paraphrase family only.', 'A note about a separate, later log-review programme would be flagged.', ['P6-SU-07', 'P7-CON-01', 'P7-CON-02', 'P7-CON-03', 'P7-CON-04', 'P7-CON-05', 'P7-CON-06'])] },
  { pack_id: 'RPK-SCO', pack_version: '1.0.0', purpose: 'Excluded-domain and scope controls for one rewording family.', rules: [
    r('RP-SCO-01', 'Address P6K-008.', 'The record contains "keep(s)|lose(s)|lost" + "his|her|their" + "job", not followed by queue, scheduler, runner, title, description, code, reference or log(s). Refuses intake as excluded employment content.',
      'refusal', 'Contract non-renewal for a person (Phase 4 AR-040) is not covered; it cannot be separated from supplier-contract wording and is deferred.', 'A sentence about a system keeping "their job" in another technical sense not on the exclusion list would be refused.',
      ['P6-XD-03', 'P7-SCO-01', 'P7-SCO-02', 'P7-SCO-03', 'P7-SCO-04', 'P7-SCO-05', 'P7-SCO-06'])] },
];

export const signPack = (p) => { const body = Object.assign({ candidate_version: CANDIDATE_VERSION }, p); return Object.assign({}, body, { signature: { method: 'sha256-canonical-content-seal', content_sha256: sha(canonical(body)) } }); };

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(OUT, { recursive: true });
  const signed = PACKS.map(signPack);
  for (const p of signed) writeFileSync(join(OUT, p.pack_id + '.json'), JSON.stringify(p, null, 2) + '\n');
  writeFileSync(join(P7, 'RULE_PACK_REGISTER.json'), JSON.stringify({ register_note: 'LOCAL ENGINEERING CANDIDATE ONLY. NOT INDEPENDENTLY EVALUATED. NO RELEASE OR DEPLOYMENT AUTHORIZATION.',
    candidate_version: CANDIDATE_VERSION, packs: signed.map((p) => ({ pack_id: p.pack_id, pack_version: p.pack_version, content_sha256: p.signature.content_sha256, purpose: p.purpose, rules: p.rules })) }, null, 2) + '\n');
  console.log('wrote ' + signed.length + ' packs, ' + signed.reduce((a, p) => a + p.rules.length, 0) + ' rules');
}
