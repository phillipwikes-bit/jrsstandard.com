#!/usr/bin/env node
// JRS PHASE 7: remediation regression scenarios, authoring.
//
//   node research/engine-remediation-phase7-2026-10-19/scenarios/author-scenarios.mjs
//
// SYNTHETIC AND ENGINEERING-AUTHORED (2026-10-19). Writes one JSON file per
// scenario. It imports no compiler. Expectations come from the remediation
// contract and the frozen v0.3 source, written before the v0.3.1 candidate
// logic exists. Every scenario derives from the fictional GC-001 record
// (asserted byte-identical) by a stated edit.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P7_FORMAT, P7_MARKER, P7_PROVENANCE, AREAS, validateP7Scenario } from '../tooling/scenario-schema.mjs';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const BASE = readFileSync(join(REPO, 'research/evidence-graph-compiler-2026-10-10/fixtures/cases/GC-001.record.txt'), 'utf8');
const L = BASE.split('\n');
const [SUPPLIER, BASIS, RISK, CTRL, AUTH, DEC, EXPIRY, REVOKE, CHRON] = [L[3], L[6], L[7], L[8], L[9], L[10], L[11], L[12], L[13]];
if (!DEC.startsWith('Decision:') || !CHRON.startsWith('Chronology:')) throw new Error('base record layout changed; authoring stopped');
const NEED = 'The supplier needs them to reconcile its invoices under contract CTR-2025-118 section 4.';
const FOUND = 'Risk assessment RA-2026-0311, completed 2026-03-05, found that the reports contain shipment reference numbers and delivery dates only.';
const CTRL_Q = 'Compensating controls: Access is limited to the LOG-RPT-04 report view';
const OBS = () => [
  { observation_id: 'O1', condition_id: 'reconstructability', proposed_status: 'supported', quote: DEC, assertion_type: 'stated_decision' },
  { observation_id: 'O2', condition_id: 'reconstructability', proposed_status: 'supported', quote: NEED, assertion_type: 'stated_rationale' },
  { observation_id: 'O3', condition_id: 'identifiable_basis', proposed_status: 'supported', quote: AUTH, assertion_type: 'stated_authority' },
  { observation_id: 'O4', condition_id: 'chronology_integrity', proposed_status: 'supported', quote: CHRON, assertion_type: 'stated_date' },
  { observation_id: 'O5', condition_id: 'reasoning_traceability', proposed_status: 'supported', quote: NEED, assertion_type: 'stated_rationale' },
  { observation_id: 'O6', condition_id: 'sufficiency', proposed_status: 'supported', quote: CTRL_Q, assertion_type: 'stated_control' },
];
const respText = (obs) => JSON.stringify({ contract_version: 'jrs-engine-local-0.3.0-evidence-graph', prompt_version: 'jrs-engine-local-0.3.0/prompt-1', observations: obs }, null, 2);
const once = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('edit target not unique: ' + a.slice(0, 50)); return s.replace(a, b); };
const replaceLine = (r, line, next) => once(r, line + '\n', next === null ? '' : next + '\n');
const insertAfter = (r, line, added) => once(r, line + '\n', line + '\n' + added + '\n');
const insertBefore = (r, line, added) => once(r, line + '\n', added + '\n' + line + '\n');
const moveAfter = (r, line, anchor) => insertAfter(replaceLine(r, line, null), anchor, line);
const swap = (r, a, b) => { const x = r.split('\n'); const i = x.indexOf(a), j = x.indexOf(b); if (i < 0 || j < 0) throw new Error('swap target missing'); [x[i], x[j]] = [x[j], x[i]]; return x.join('\n'); };
const patch = (id, p) => (o) => o.map((x) => (x.observation_id === id ? Object.assign({}, x, p) : x));
const add = (...m) => (o) => [...o, ...m];
const resp = (...mods) => respText(mods.reduce((o, m) => m(o), OBS()));
const invalid = (text) => 'Here is the analysis:\n' + text;

const S5 = (rc, ib, ci, rt, su) => ({ reconstructability: rc, identifiable_basis: ib, chronology_integrity: ci, reasoning_traceability: rt, sufficiency: su });
const BASE_ST = S5('supported', 'supported', 'supported', 'supported', 'review_required');
const NONE = S5('not_assessed', 'not_assessed', 'not_assessed', 'not_assessed', 'not_assessed');
const UNCH = { mode: 'unchanged', rules: [] };
const INT = (...rules) => ({ mode: 'intended', rules });
const LIMS = {
  chronology: 'Dates are read only where they are explicit ISO dates with a recognised role. The rule checks one ordering, duplication or duration pattern on constructed text and does not establish when anything happened.',
  reasoning: 'Negation is detected by a bounded lexical pattern near a rationale word. Other negation forms, hedges and context are not interpreted; this is not a judgment about whether any reasoning was sound.',
  evidence: 'Evidence linkage checks only the section in which a cited quotation sits. It does not establish that the quotation supports the condition, and text presence remains distinct from semantic support.',
  conflict: 'One additional paraphrase family (review of access logs) is recognised. Other paraphrases are not, and a detected conflict says nothing about which statement is true.',
  scope: 'Only the exact keep or lose a job phrasing with a possessive is recognised. Other rewordings, including contract non-renewal for a person, are not refused and remain an open boundary.',
  structural: 'The repair renames one internal inference label so the compiler can report the rejection instead of failing. Other note wordings are not covered beyond the listed patterns.',
};
const presence = (...cs) => Object.fromEntries(cs.map((c) => [c, ['presence']]));
const withConflict = { chronology_integrity: ['conflict', 'presence'] };

const out = [];
const S = (id, rule_id, role, safe, limitation, record, response, expected, opts = {}) => out.push(Object.assign({
  library_format_version: P7_FORMAT, scenario_id: id, area: AREAS[id.split('-')[1]].name, rule_id, role, synthetic_marker: P7_MARKER, provenance_note: P7_PROVENANCE,
  expected_safe_behavior: safe, limitation, expected_limitation_kinds: opts.lims || {}, expected_route: opts.route || 'human_review', differential: opts.diff || UNCH,
  record_text: record, candidate_response_text: response, execution_mode: 'local_mocked', expected }, opts.overrides ? { submission_overrides: opts.overrides } : {}));

// ---------------------------------------------------------------- P6-RT-07 safe routing (RP-STR-01)
const R = 'RP-STR-01';
S('P7-R07-01', R, 'positive', 'A note attributing a motive ("wanted to") is withheld as a prohibited inference and reasoning traceability is routed to review; the compiler does not fail.', LIMS.structural,
  BASE, resp(patch('O5', { note: 'The manager wanted to help the supplier.' })), { statuses: S5('supported', 'supported', 'supported', 'review_required', 'review_required'), refusal_codes_include: ['assertion_rejected'] },
  { diff: { mode: 'base_error', rules: [R] }, lims: presence('reasoning_traceability') });
S('P7-R07-02', R, 'positive', 'A note attributing a motive ("motivated by") to the board is withheld and identifiable basis is routed to review without a compiler failure.', LIMS.structural,
  BASE, resp(patch('O3', { note: 'The board was motivated by the deadline.' })), { statuses: S5('supported', 'review_required', 'supported', 'supported', 'review_required'), refusal_codes_include: ['assertion_rejected'] },
  { diff: { mode: 'base_error', rules: [R] }, lims: presence('identifiable_basis') });
S('P7-R07-03', R, 'positive', 'A note attributing purpose ("tried to") to the approver is withheld and reconstructability is routed to review without a compiler failure.', LIMS.structural,
  BASE, resp(patch('O1', { note: 'The approver tried to speed things up.' })), { statuses: S5('review_required', 'supported', 'supported', 'supported', 'review_required'), refusal_codes_include: ['assertion_rejected'] },
  { diff: { mode: 'base_error', rules: [R] }, lims: presence('reconstructability') });
S('P7-R07-04', R, 'benign', 'A neutral factual note is accepted and changes nothing from the base pattern.', LIMS.structural,
  BASE, resp(patch('O5', { note: 'The supplier reconciles invoices monthly.' })), { statuses: BASE_ST, refusal_codes_exclude: ['assertion_rejected'] }, { lims: presence('reasoning_traceability') });
S('P7-R07-05', R, 'malformed', 'A motive note inside a response with prose before the JSON is never read: the response is refused and nothing is assessed.', LIMS.structural,
  BASE, invalid(resp(patch('O5', { note: 'The manager wanted to help the supplier.' }))), { candidate_valid: false, statuses: NONE, refusal_codes_include: ['candidate_response_invalid'] }, { route: 'refusal' });
S('P7-R07-06', R, 'duplicate_or_reordered', 'Two motive notes on a record with reordered sections are both withheld; identifiable basis and reasoning traceability are routed to review.', LIMS.structural,
  swap(BASE, RISK, CTRL), resp(patch('O5', { note: 'The manager wanted to help the supplier.' }), patch('O3', { note: 'Their motive was a quick sign-off.' })),
  { statuses: S5('supported', 'review_required', 'supported', 'review_required', 'review_required'), refusal_codes_include: ['assertion_rejected'] },
  { diff: { mode: 'base_error', rules: [R] }, lims: presence('identifiable_basis', 'reasoning_traceability') });

// ---------------------------------------------------------------- chronology (RP-CHR-01 to 04)
const CHRON_LATE = 'Chronology: 2026-03-02 request received; 2026-03-12 risk assessment RA-2026-0311 completed; 2026-03-09 board decision recorded.';
const LATE = replaceLine(BASE, CHRON, CHRON_LATE);
const CI_R = S5('supported', 'supported', 'review_required', 'supported', 'review_required');
S('P7-CHR-01', 'RP-CHR-01', 'positive', 'A risk assessment dated after the decision is a sequence conflict; chronology is routed to review and neither date is chosen.', LIMS.chronology,
  LATE, resp(patch('O4', { quote: CHRON_LATE })), { statuses: CI_R, conflicts_include: ['assessment_after_decision'], cc_include: ['assessment_after_decision'] }, { diff: INT('RP-CHR-01'), lims: withConflict });
S('P7-CHR-02', 'RP-CHR-01', 'benign', 'A later access review in a follow-up section is not a risk assessment after the decision; nothing changes.', LIMS.chronology,
  insertAfter(BASE, REVOKE, 'Follow-up: Access review completed 2026-04-15.'), resp(), { statuses: BASE_ST, conflicts_exact: [] }, { lims: presence('chronology_integrity') });
S('P7-CHR-03', 'RP-CHR-01', 'malformed', 'With an invalid candidate response nothing is assessed, but the record-level sequence conflict is still reported.', LIMS.chronology,
  LATE, invalid(resp(patch('O4', { quote: CHRON_LATE }))), { candidate_valid: false, statuses: NONE, conflicts_include: ['assessment_after_decision'], refusal_codes_include: ['candidate_response_invalid'] },
  { diff: INT('RP-CHR-01'), route: 'refusal' });
S('P7-CHR-04', 'RP-CHR-01', 'duplicate_or_reordered', 'With the chronology line moved to the top, the late risk assessment is still a conflict and chronology is routed to review.', LIMS.chronology,
  moveAfter(LATE, CHRON_LATE, SUPPLIER), resp(patch('O4', { quote: CHRON_LATE })), { statuses: CI_R, conflicts_include: ['assessment_after_decision'] }, { diff: INT('RP-CHR-01'), lims: withConflict });
const REV2 = 'Revocation: Access expires 2026-07-07 unless a renewal is approved before that date.';
const TWO_EXP = replaceLine(BASE, REVOKE, REV2);
S('P7-CHR-05', 'RP-CHR-02', 'positive', 'Two different expiry dates are a record conflict; chronology is routed to review and neither date is chosen.', LIMS.chronology,
  TWO_EXP, resp(), { statuses: CI_R, conflicts_include: ['expiry_date_conflict'], cc_include: ['expiry_date_conflict'] }, { diff: INT('RP-CHR-02'), lims: withConflict });
S('P7-CHR-06', 'RP-CHR-02', 'benign', 'The same expiry date stated twice is not a conflict; nothing changes.', LIMS.chronology,
  replaceLine(BASE, REVOKE, 'Revocation: Access expires 2026-06-07 unless a renewal is approved before that date.'), resp(), { statuses: BASE_ST, conflicts_exact: [] }, { lims: presence('chronology_integrity') });
S('P7-CHR-07', 'RP-CHR-02', 'malformed', 'With an invalid candidate response nothing is assessed, but the two expiry dates are still reported as a conflict.', LIMS.chronology,
  TWO_EXP, invalid(resp()), { candidate_valid: false, statuses: NONE, conflicts_include: ['expiry_date_conflict'] }, { diff: INT('RP-CHR-02'), route: 'refusal' });
S('P7-CHR-08', 'RP-CHR-02', 'duplicate_or_reordered', 'With the expiry and revocation lines swapped, both the expiry conflict and the resulting duration mismatch are reported; chronology is routed to review.', LIMS.chronology,
  swap(TWO_EXP, EXPIRY, REV2), resp(), { statuses: CI_R, conflicts_include: ['expiry_date_conflict', 'duration_date_conflict'] }, { diff: INT('RP-CHR-02', 'RP-CHR-04'), lims: withConflict });
const AUTH_ND = 'Authority: Information Security Exception Board, minutes ISEB-2026-07 item 4.';
const CHRON_ND = 'Chronology: 2026-03-02 request received; 2026-03-05 risk assessment RA-2026-0311 completed.';
const NO_DEC = replaceLine(replaceLine(BASE, AUTH, AUTH_ND), CHRON, CHRON_ND);
const ND_RESP = (...m) => resp(patch('O3', { quote: AUTH_ND }), patch('O4', { quote: CHRON_ND }), ...m);
S('P7-CHR-09', 'RP-CHR-03', 'positive', 'A record that states no decision date has a visible chronology gap; chronology is routed to review with a neutral record-completion question.', LIMS.chronology,
  NO_DEC, ND_RESP(), { statuses: CI_R, cc_include: ['no_dated_decision'] }, { diff: INT('RP-CHR-03'), lims: presence('chronology_integrity') });
S('P7-CHR-10', 'RP-CHR-03', 'benign', 'A decision date stated only in the authority line is still a dated decision; nothing changes.', LIMS.chronology,
  replaceLine(BASE, CHRON, CHRON_ND), resp(patch('O4', { quote: CHRON_ND })), { statuses: BASE_ST }, { lims: presence('chronology_integrity') });
S('P7-CHR-11', 'RP-CHR-03', 'malformed', 'With an invalid candidate response nothing is assessed, and the missing decision date is still surfaced as a record-completion question.', LIMS.chronology,
  NO_DEC, invalid(ND_RESP()), { candidate_valid: false, statuses: NONE, cc_include: ['no_dated_decision'] }, { diff: INT('RP-CHR-03'), route: 'refusal' });
S('P7-CHR-12', 'RP-CHR-03', 'duplicate_or_reordered', 'With the chronology line moved to the top, the record still states no decision date and chronology is routed to review.', LIMS.chronology,
  moveAfter(NO_DEC, CHRON_ND, SUPPLIER), ND_RESP(), { statuses: CI_R, cc_include: ['no_dated_decision'] }, { diff: INT('RP-CHR-03'), lims: presence('chronology_integrity') });
const DEC30 = 'Decision: Exception granted for 30 days.';
const D30 = replaceLine(BASE, DEC, DEC30);
S('P7-CHR-13', 'RP-CHR-04', 'positive', 'A 30-day grant whose stated decision and expiry dates are 90 days apart is a duration conflict; chronology is routed to review.', LIMS.chronology,
  D30, resp(patch('O1', { quote: DEC30 })), { statuses: CI_R, conflicts_include: ['duration_date_conflict'], cc_include: ['duration_date_conflict'] }, { diff: INT('RP-CHR-04'), lims: withConflict });
const DEC89 = 'Decision: Exception granted for 89 days.';
S('P7-CHR-14', 'RP-CHR-04', 'benign', 'An 89-day grant against dates 90 days apart is within the one-day counting tolerance; nothing changes.', LIMS.chronology,
  replaceLine(BASE, DEC, DEC89), resp(patch('O1', { quote: DEC89 })), { statuses: BASE_ST, conflicts_exact: [] }, { lims: presence('chronology_integrity') });
S('P7-CHR-15', 'RP-CHR-04', 'malformed', 'With an invalid candidate response nothing is assessed, but the duration conflict is still reported.', LIMS.chronology,
  D30, invalid(resp(patch('O1', { quote: DEC30 }))), { candidate_valid: false, statuses: NONE, conflicts_include: ['duration_date_conflict'] }, { diff: INT('RP-CHR-04'), route: 'refusal' });
S('P7-CHR-16', 'RP-CHR-04', 'duplicate_or_reordered', 'With the decision line moved to the end, the duration conflict is still reported and chronology is routed to review.', LIMS.chronology,
  moveAfter(D30, DEC30, CHRON), resp(patch('O1', { quote: DEC30 })), { statuses: CI_R, conflicts_include: ['duration_date_conflict'] }, { diff: INT('RP-CHR-04'), lims: withConflict });

// ---------------------------------------------------------------- negated and ambiguous reasoning (RP-NEG-01)
const RT_R = S5('supported', 'supported', 'supported', 'review_required', 'review_required');
const negRec = (sentence) => once(BASE, NEED, sentence);
const negResp = (sentence, ...m) => resp(patch('O2', { quote: sentence }), patch('O5', { quote: sentence }), ...m);
const N1 = 'The supplier does not need them to reconcile its invoices under contract CTR-2025-118 section 4.';
S('P7-NEG-01', 'RP-NEG-01', 'positive', 'A negated need ("does not need") is not counted as a reason; reasoning traceability is routed to review.', LIMS.reasoning,
  negRec(N1), negResp(N1), { statuses: RT_R }, { diff: INT('RP-NEG-01'), lims: presence('reasoning_traceability') });
const N2 = 'The supplier may not need them to reconcile its invoices under contract CTR-2025-118 section 4.';
S('P7-NEG-02', 'RP-NEG-01', 'positive', 'A hedged negation ("may not need") is not counted as a reason; reasoning traceability is routed to review.', LIMS.reasoning,
  negRec(N2), negResp(N2), { statuses: RT_R }, { diff: INT('RP-NEG-01'), lims: presence('reasoning_traceability') });
const N3 = 'The supplier no longer needs them to reconcile its invoices under contract CTR-2025-118 section 4.';
S('P7-NEG-03', 'RP-NEG-01', 'positive', 'A need that no longer applies is not counted as a reason; reasoning traceability is routed to review.', LIMS.reasoning,
  negRec(N3), negResp(N3), { statuses: RT_R }, { diff: INT('RP-NEG-01'), lims: presence('reasoning_traceability') });
const N4 = 'There is no alternative, so the supplier needs them to reconcile its invoices under contract CTR-2025-118 section 4.';
S('P7-NEG-04', 'RP-NEG-01', 'benign', 'A sentence that contains "no" but states the need directly is still counted; nothing changes.', LIMS.reasoning,
  negRec(N4), negResp(N4), { statuses: BASE_ST }, { lims: presence('reasoning_traceability') });
S('P7-NEG-05', 'RP-NEG-01', 'benign', 'A negated rationale alongside a separately cited, non-negated rationale from the basis section leaves reasoning supported.', LIMS.reasoning,
  negRec(N1), negResp(N1, add({ observation_id: 'O7', condition_id: 'reasoning_traceability', proposed_status: 'supported', quote: FOUND, assertion_type: 'stated_rationale' })), { statuses: BASE_ST, quote_statuses: { O7: 'verified_unique' } },
  { lims: presence('reasoning_traceability') });
const N6 = 'Not because of cost, the supplier needs them to reconcile its invoices under contract CTR-2025-118 section 4.';
S('P7-NEG-06', 'RP-NEG-01', 'positive', 'An ambiguous construction that negates a reason word ("Not because") is routed to review rather than counted.', LIMS.reasoning,
  negRec(N6), negResp(N6), { statuses: RT_R }, { diff: INT('RP-NEG-01'), lims: presence('reasoning_traceability') });
S('P7-NEG-07', 'RP-NEG-01', 'malformed', 'A negated rationale inside an invalid candidate response is never read; nothing is assessed.', LIMS.reasoning,
  negRec(N1), invalid(negResp(N1)), { candidate_valid: false, statuses: NONE, refusal_codes_include: ['candidate_response_invalid'] }, { route: 'refusal' });
S('P7-NEG-08', 'RP-NEG-01', 'duplicate_or_reordered', 'A negated sentence that occurs twice is ambiguous as a quotation; reconstructability and reasoning are routed to review in both versions.', LIMS.reasoning,
  insertAfter(negRec(N1), AUTH, 'Review note: The minutes repeat that ' + N1), negResp(N1), { statuses: S5('review_required', 'supported', 'supported', 'review_required', 'review_required'), quote_statuses: { O5: 'ambiguous' } },
  { lims: presence('reasoning_traceability') });

// ---------------------------------------------------------------- evidence-link abstention (RP-EVL-01)
S('P7-EVL-01', 'RP-EVL-01', 'positive', 'A report-view identifier quoted from the controls section is not linked to identifiable basis; it is routed to review.', LIMS.evidence,
  BASE, resp(patch('O3', { quote: 'Access is limited to the LOG-RPT-04 report view', assertion_type: 'stated_source_reference' })), { statuses: S5('supported', 'review_required', 'supported', 'supported', 'review_required'), quote_statuses: { O3: 'verified_unique' } },
  { diff: INT('RP-EVL-01'), lims: presence('identifiable_basis') });
S('P7-EVL-02', 'RP-EVL-01', 'positive', 'A revocation date quoted from the revocation section is not linked to the decision chronology; it is routed to review.', LIMS.evidence,
  BASE, resp(patch('O4', { quote: 'The Logistics Systems Manager will revoke access on 2026-06-07 unless a renewal is approved before that date.' })), { statuses: CI_R, quote_statuses: { O4: 'verified_unique' } },
  { diff: INT('RP-EVL-01'), lims: presence('chronology_integrity') });
S('P7-EVL-03', 'RP-EVL-01', 'positive', 'A renewal requirement quoted from the expiry section is not linked to the decision basis; reasoning is routed to review.', LIMS.evidence,
  BASE, resp(patch('O5', { quote: 'Renewal requires a new request with an updated risk assessment.' })), { statuses: RT_R, quote_statuses: { O5: 'verified_unique' } },
  { diff: INT('RP-EVL-01'), lims: presence('reasoning_traceability') });
S('P7-EVL-04', 'RP-EVL-01', 'benign', 'A source reference quoted from the decision-basis section is linked to identifiable basis; nothing changes.', LIMS.evidence,
  BASE, resp(patch('O3', { quote: FOUND, assertion_type: 'stated_source_reference' })), { statuses: BASE_ST, quote_statuses: { O3: 'verified_unique' } }, { lims: presence('identifiable_basis') });
S('P7-EVL-05', 'RP-EVL-01', 'benign', 'A date quoted from the authority line is linked to chronology; nothing changes.', LIMS.evidence,
  BASE, resp(patch('O4', { quote: AUTH })), { statuses: BASE_ST, quote_statuses: { O4: 'verified_unique' } }, { lims: presence('chronology_integrity') });
S('P7-EVL-06', 'RP-EVL-01', 'malformed', 'An unlinked quotation inside an invalid candidate response is never read; nothing is assessed.', LIMS.evidence,
  BASE, invalid(resp(patch('O3', { quote: 'Access is limited to the LOG-RPT-04 report view', assertion_type: 'stated_source_reference' }))), { candidate_valid: false, statuses: NONE }, { route: 'refusal' });
S('P7-EVL-07', 'RP-EVL-01', 'duplicate_or_reordered', 'The rationale sentence duplicated into the residual-risk section and selected there by a disambiguator is not linked to the basis; reasoning is routed to review.', LIMS.evidence,
  once(BASE, RISK, RISK + ' ' + NEED), resp(patch('O5', { disambiguator: { section: 'Residual risk' } })),
  { statuses: S5('review_required', 'supported', 'supported', 'review_required', 'review_required'), quote_statuses: { O5: 'verified_disambiguated', O2: 'ambiguous' } }, { diff: INT('RP-EVL-01'), lims: presence('reasoning_traceability') });
S('P7-EVL-08', 'RP-EVL-01', 'duplicate_or_reordered', 'With the decision-basis section moved to the end, the rationale is still in the basis section; nothing changes.', LIMS.evidence,
  moveAfter(BASE, BASIS, CHRON), resp(), { statuses: BASE_ST }, { lims: presence('reasoning_traceability') });

// ---------------------------------------------------------------- conflict controls (RP-CON-01)
const K1 = 'Control note: Weekly review of access logs has not started.';
S('P7-CON-01', 'RP-CON-01', 'positive', 'Log review stated as weekly and as not started is a control conflict; sufficiency stays routed to review.', LIMS.conflict,
  insertAfter(BASE, CTRL, K1), resp(), { statuses: BASE_ST, conflicts_include: ['control_state_conflict'], cc_include: ['control_state_conflict'] }, { diff: INT('RP-CON-01'), lims: { sufficiency: ['conflict', 'presence'] } });
S('P7-CON-02', 'RP-CON-01', 'positive', 'Review of the access logs stated as not begun is a control conflict with the weekly review.', LIMS.conflict,
  insertAfter(BASE, CTRL, 'Control note: Review of the access logs has not begun.'), resp(), { statuses: BASE_ST, conflicts_include: ['control_state_conflict'] }, { diff: INT('RP-CON-01'), lims: { sufficiency: ['conflict', 'presence'] } });
S('P7-CON-03', 'RP-CON-01', 'benign', 'A note that weekly log review started on a date is not a conflict; nothing changes.', LIMS.conflict,
  insertAfter(BASE, CTRL, 'Control note: Weekly review of access logs started on 2026-03-10.'), resp(), { statuses: BASE_ST, conflicts_exact: [] }, { lims: presence('sufficiency') });
S('P7-CON-04', 'RP-CON-01', 'benign', 'A review of supplier invoices that has not started is a different control; nothing changes.', LIMS.conflict,
  insertAfter(BASE, CTRL, 'Control note: Review of supplier invoices has not started.'), resp(), { statuses: BASE_ST, conflicts_exact: [] }, { lims: presence('sufficiency') });
S('P7-CON-05', 'RP-CON-01', 'malformed', 'With an invalid candidate response nothing is assessed, but the log-review conflict is still reported.', LIMS.conflict,
  insertAfter(BASE, CTRL, K1), invalid(resp()), { candidate_valid: false, statuses: NONE, conflicts_include: ['control_state_conflict'] }, { diff: INT('RP-CON-01'), route: 'refusal' });
S('P7-CON-06', 'RP-CON-01', 'duplicate_or_reordered', 'The same not-started note placed before and after the controls section yields one control conflict; sufficiency stays routed to review.', LIMS.conflict,
  insertBefore(insertAfter(BASE, CTRL, K1), CTRL, K1.replace('Control note:', 'Control status:')), resp(), { statuses: BASE_ST, conflicts_exact: ['control_state_conflict'] }, { diff: INT('RP-CON-01'), lims: { sufficiency: ['conflict', 'presence'] } });

// ---------------------------------------------------------------- scope and excluded domain (RP-SCO-01)
const X1 = 'Background: The supplier contact will not keep their job after March.';
S('P7-SCO-01', 'RP-SCO-01', 'positive', 'Reworded employment language ("will not keep their job") is outside scope; the record is refused and nothing is assessed.', LIMS.scope,
  insertAfter(BASE, SUPPLIER, X1), resp(), { gate: 'refuse', statuses: NONE, refusal_codes_include: ['excluded_domain_content'] }, { diff: INT('RP-SCO-01'), route: 'refusal' });
S('P7-SCO-02', 'RP-SCO-01', 'positive', 'Reworded employment language ("may lose her job") is outside scope; the record is refused.', LIMS.scope,
  insertAfter(BASE, SUPPLIER, 'Background: The site supervisor may lose her job after the audit.'), resp(), { gate: 'refuse', statuses: NONE, refusal_codes_include: ['excluded_domain_content'] }, { diff: INT('RP-SCO-01'), route: 'refusal' });
S('P7-SCO-03', 'RP-SCO-01', 'benign', 'A batch job that keeps running is not employment language; the record is assessed as before.', LIMS.scope,
  insertAfter(BASE, SUPPLIER, 'Background: The nightly batch job keeps running during the exception.'), resp(), { gate: 'proceed', statuses: BASE_ST }, { lims: presence('reconstructability') });
S('P7-SCO-04', 'RP-SCO-01', 'benign', 'Keeping a job queue empty is not employment language; the record is assessed as before.', LIMS.scope,
  insertAfter(BASE, SUPPLIER, 'Background: The integration will keep their job queue empty overnight.'), resp(), { gate: 'proceed', statuses: BASE_ST }, { lims: presence('reconstructability') });
S('P7-SCO-05', 'RP-SCO-01', 'malformed', 'Reworded employment language with an invalid candidate response is refused at intake before the response is read.', LIMS.scope,
  insertAfter(BASE, SUPPLIER, X1), invalid(resp()), { gate: 'refuse', statuses: NONE, refusal_codes_include: ['excluded_domain_content'] }, { diff: INT('RP-SCO-01'), route: 'refusal' });
S('P7-SCO-06', 'RP-SCO-01', 'duplicate_or_reordered', 'Reworded employment language stated twice in a record with reordered sections is refused.', LIMS.scope,
  insertAfter(swap(insertAfter(BASE, SUPPLIER, X1), RISK, CTRL), CHRON, X1.replace('Background:', 'Note:')), resp(), { gate: 'refuse', statuses: NONE, refusal_codes_include: ['excluded_domain_content'] },
  { diff: INT('RP-SCO-01'), route: 'refusal' });

const seen = new Set(), problems = {};
for (const s of out) { const p = validateP7Scenario(s, seen); seen.add(s.scenario_id); if (p.length) problems[s.scenario_id] = p; }
if (Object.keys(problems).length) { console.error(JSON.stringify(problems, null, 2)); process.exit(2); }
const byArea = {}; for (const s of out) byArea[s.area] = (byArea[s.area] || 0) + 1;
for (const a of Object.values(AREAS)) if ((byArea[a.name] || 0) < a.minimum) { console.error('area below minimum: ' + a.name); process.exit(2); }
mkdirSync(join(HERE, 'cases'), { recursive: true });
for (const s of out) writeFileSync(join(HERE, 'cases', s.scenario_id + '.json'), JSON.stringify(s, null, 2) + '\n');
console.log(out.length + ' scenarios; ' + JSON.stringify(byArea));
