#!/usr/bin/env node
// JRS PHASE 9: sealed synthetic rehearsal set, authoring.
//
//   env -u ANTHROPIC_BASE_URL node research/engine-human-review-phase9-2026-10-20/rehearsal/author-rehearsal.mjs
//
// SYNTHETIC AND ENGINEERING-AUTHORED (2026-10-20). Imports no compiler and runs no Engine. Every case
// derives from the fictional GC-001 record by a stated edit. Expectations are written here from the
// record text (adjudication class, explanation, control) and from reading the v0.3.1 candidate source
// (predicted Engine status and escalation), then sealed by seal-rehearsal.mjs before the first
// Phase 9 evaluator run. Every item is synthetic and holdout-ineligible.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REHEARSAL_FORMAT, MARKER, PROVENANCE, CATEGORIES, validateCase, validateExpectation, routeAppropriateness } from '../../../lib/engine-human-review-phase9/rehearsal-schema.mjs';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const REPO = fileURLToPath(new URL('../../../', import.meta.url));
if (existsSync(join(HERE, 'SEAL.json'))) { console.error('REFUSED: the rehearsal set is sealed; authoring cannot rewrite it'); process.exit(2); }
const BASE = readFileSync(join(REPO, 'research/evidence-graph-compiler-2026-10-10/fixtures/cases/GC-001.record.txt'), 'utf8');
const L = BASE.split('\n');
const [SUPPLIER, REQBY, BASIS, RISK, CTRL, AUTH, DEC, EXPIRY, REVOKE, CHRON] = [L[3], L[5], L[6], L[7], L[8], L[9], L[10], L[11], L[12], L[13]];
if (!DEC.startsWith('Decision:') || !CHRON.startsWith('Chronology:') || !REQBY.startsWith('Requested by:')) throw new Error('base record layout changed; authoring stopped');
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
const patch = (id, p) => (o) => o.map((x) => (x.observation_id === id ? Object.assign({}, x, p) : x));
const add = (...m) => (o) => [...o, ...m];
const resp = (...mods) => respText(mods.reduce((o, m) => m(o), OBS()));
const need = (q) => [patch('O2', { quote: q }), patch('O5', { quote: q })];

const cases = [], expectations = [];
// C(id, target, record, response, class, control, predicted status, escalation triggers, explanation)
const C = (id, target, record, response, cls, control, status, triggers, explanation, absent) => {
  const cat = CATEGORIES[id.split('-')[1]];
  cases.push(Object.assign({ rehearsal_format: REHEARSAL_FORMAT, packet_id: id, category: cat.name, target_condition: target, synthetic: true, holdout_eligible: false,
    synthetic_marker: MARKER, provenance_note: PROVENANCE, record_text: record, candidate_response_text: response, execution_mode: 'local_mocked' }, absent ? { intended_absent_quotations: absent } : {}));
  expectations.push({ packet_id: id, expected_class: cls, explanation, relevant_control: control, predicted_engine_status: status, expected_escalation_triggers: triggers,
    expected_route_appropriateness: routeAppropriateness(cls, status, true) });
};
const S = 'supported', RR = 'review_required', NA = 'not_assessed';
const DNS = 'does_not_support_finding', SUP = 'supports_finding', INS = 'insufficient_context', AMB = 'ambiguous', CONF = 'record_conflict', OUT = 'outside_authorized_scope', ABS = 'abstain_and_escalate';

// ---------------------------------------------------------------- QNS quote present but not supportive (10)
{ const a = 'Authority: Information Security Exception Board, minutes ISEB-2026-07 item 4, dated 2026-03-09, records that the board did not consider this request.';
  C('R9-QNS-01', 'identifiable_basis', replaceLine(BASE, AUTH, a), resp(patch('O3', { quote: a })), DNS, 'CC-WORDS', S, [],
    'The quoted authority line names a board and minutes but states that the board did not consider the request, so its words do not show that it was the basis for the exception.'); }
{ const a = 'Authority: Information Security Exception Board, minutes ISEB-2026-07 item 4, dated 2026-03-09, which concerned a different supplier.';
  C('R9-QNS-02', 'identifiable_basis', replaceLine(BASE, AUTH, a), resp(patch('O3', { quote: a })), DNS, 'CC-WORDS', S, [],
    'The quoted minutes are identified but the same line says they concerned a different supplier, so the reference does not identify the basis for this exception.'); }
{ const n = 'The supplier needs them to plan its staff holiday rota.';
  C('R9-QNS-03', 'reconstructability', once(BASE, NEED, n), resp(...need(n)), DNS, 'CC-PLAUSIBLE', S, [],
    'A decision and a stated reason are both quoted, but the stated reason (a holiday rota) does not bear on access to shipment tracking reports; any link would be supplied by the reviewer, not the record.'); }
C('R9-QNS-04', 'reasoning_traceability', BASE, resp(patch('O5', { quote: RISK, assertion_type: 'stated_source_reference' })), DNS, 'CC-BASIS', RR, [],
  'The quoted residual risk rating is a conclusion about risk, not a stated reason for granting access; the reasoning path is not carried by these words.');
{ const x = 'The supplier submitted the request in writing, based on its standard request form.';
  C('R9-QNS-05', 'reasoning_traceability', once(BASE, NEED, NEED + ' ' + x), resp(patch('O5', { quote: x })), DNS, 'CC-BASIS', S, [],
    'The quoted sentence records how the request was made; the form a request took is not a stated reason for the decision, so the quotation does not trace the reasoning.'); }
C('R9-QNS-06', 'chronology_integrity', BASE, resp(patch('O4', { quote: REQBY })), DNS, 'CC-DATES', S, [],
  'The quoted line gives one request date only; a single date cannot show that the sequence of events, documents and decision is consistent.');
{ C('R9-QNS-07', 'identifiable_basis', BASE, resp(patch('O3', { quote: RISK, assertion_type: 'stated_source_reference' })), DNS, 'CC-WORDS', RR, [],
    'The quoted risk line cites an assessment section but does not identify who authorised the exception or on what authority.'); }
C('R9-QNS-08', 'reconstructability', BASE, resp(patch('O2', { quote: 'Expires 2026-06-07.', assertion_type: 'stated_date' })), DNS, 'CC-BASIS', S, [],
  'The second quotation is an expiry date; together with the decision line it says what was granted and for how long, not on what stated basis, so the decision is not reconstructed from these words.');
{ const x = 'Based on past practice, similar requests have been granted.';
  C('R9-QNS-09', 'reasoning_traceability', once(BASE, NEED, NEED + ' ' + x), resp(patch('O5', { quote: x })), DNS, 'CC-PLAUSIBLE', S, [],
    'The quoted sentence reports a past pattern without stating that it was the reason for this decision; treating it as the reason would be a plausible explanation, not a stated one.'); }
C('R9-QNS-10', 'chronology_integrity', BASE, resp(patch('O4', { quote: REVOKE })), DNS, 'CC-DATES', RR, [],
  'The quoted revocation line gives a planned future action date under a condition; it does not show the order of request, assessment and decision.');

// ---------------------------------------------------------------- SIN supportive but incomplete (6)
{ const a = 'Authority: Information Security Exception Board, minutes ISEB-2026-07, dated 2026-03-09.';
  C('R9-SIN-01', 'identifiable_basis', replaceLine(BASE, AUTH, a), resp(patch('O3', { quote: a })), SUP, 'CC-MISSING', S, [],
    'The quoted line names the board, the minutes and their date; the missing item number does not stop a reviewer locating the authority, so the words support the finding.'); }
{ const a = 'Authority: Exception Board, dated 2026-03-09.';
  C('R9-SIN-02', 'identifiable_basis', replaceLine(BASE, AUTH, a), resp(patch('O3', { quote: a })), INS, 'CC-MISSING', S, [],
    'The quoted line gives a date and a generic board name with no minutes or document reference; which authority was relied on cannot be located from the record.'); }
{ const b = 'Decision basis: Risk assessment RA-2026-0311 was completed. ' + NEED;
  C('R9-SIN-03', 'reconstructability', replaceLine(BASE, BASIS, b), resp(), INS, 'CC-MISSING', S, [],
    'The basis names an assessment but no longer states what it found; the decision and one reason are quoted, but the part of the basis resting on the assessment cannot be reconstructed.'); }
{ const c = 'Chronology: 2026-03-02 request received; 2026-03-09 board decision recorded.';
  C('R9-SIN-04', 'chronology_integrity', replaceLine(BASE, CHRON, c), resp(patch('O4', { quote: c })), SUP, 'CC-DATES', S, [],
    'The quoted chronology omits the assessment date, but the request and decision dates it states are in a consistent order and the assessment date is stated elsewhere in the record.'); }
C('R9-SIN-05', 'sufficiency', replaceLine(BASE, CTRL, 'Compensating controls: Access is limited to the LOG-RPT-04 report view.'), resp(), INS, 'CC-MISSING', RR, [],
  'Only one compensating control is stated; whether the remaining controls the assessment relied on exist is not in the record.');
{ const n = 'The supplier needs them to reconcile its invoices.';
  C('R9-SIN-06', 'reasoning_traceability', replaceLine(BASE, BASIS, 'Decision basis: ' + n), resp(...need(n)), INS, 'CC-PLAUSIBLE', S, [],
    'A reason is quoted, but the basis no longer refers to the contract or the assessment; why reconciliation requires these reports is left for the reviewer to supply.'); }

// ---------------------------------------------------------------- NEG negation or conditional language (6)
{ const n = 'The supplier does not need them to reconcile its invoices under contract CTR-2025-118 section 4.';
  C('R9-NEG-01', 'reasoning_traceability', once(BASE, NEED, n), resp(...need(n)), DNS, 'CC-NEGATION', RR, [],
    'The quoted sentence negates the stated need; read literally it gives a reason the access is not needed, so it does not trace a reason for the grant.'); }
{ const n = 'The supplier needs them only if contract CTR-2025-118 section 4 is renewed.';
  C('R9-NEG-02', 'reasoning_traceability', once(BASE, NEED, n), resp(...need(n)), INS, 'CC-NEGATION', S, [],
    'The stated need applies only if the contract is renewed; the record does not say whether it was, so whether the reason applied cannot be determined.'); }
{ const d = 'Decision: Exception granted for 90 days, unless the risk assessment is withdrawn.';
  C('R9-NEG-03', 'reconstructability', replaceLine(BASE, DEC, d), resp(patch('O1', { quote: d })), SUP, 'CC-NEGATION', S, [],
    'The condition qualifies the grant but does not remove it; the decision and its stated basis are both quoted, so the decision remains reconstructable.'); }
{ const a = 'Authority: Information Security Exception Board, minutes ISEB-2026-07 item 4, dated 2026-03-09, not including this exception.';
  C('R9-NEG-04', 'identifiable_basis', replaceLine(BASE, AUTH, a), resp(patch('O3', { quote: a })), DNS, 'CC-NEGATION', S, [],
    'The quoted line identifies the minutes but states that they do not include this exception; the words exclude it as the basis.'); }
C('R9-NEG-05', 'sufficiency', once(BASE, 'sessions require multi-factor authentication', 'sessions do not require multi-factor authentication'), resp(), INS, 'CC-NEGATION', RR, [],
  'The negation removes a control the base record states; whether the remaining controls are enough is not stated in the record.');
{ const e = 'Expiry and renewal: Expires 2026-06-07 unless extended. Renewal requires a new request with an updated risk assessment.';
  C('R9-NEG-06', 'chronology_integrity', replaceLine(BASE, EXPIRY, e), resp(), SUP, 'CC-NEGATION', S, [],
    'The condition on the expiry does not change the stated dates; request, assessment, decision and expiry remain in a consistent order.'); }

// ---------------------------------------------------------------- CHR chronology ambiguity (6)
{ const c = 'Chronology: 2026-03-02 request received; 2026-03-05 risk assessment RA-2026-0311 completed; board decision recorded later that month.';
  C('R9-CHR-01', 'chronology_integrity', replaceLine(BASE, CHRON, c), resp(patch('O4', { quote: c })), AMB, 'CC-DATES', S, [],
    'The only dated decision is the date of the minutes; the chronology gives the decision no date, so whether 2026-03-09 is the decision date or the document date is not settled by the record.'); }
{ const a = 'Authority: Information Security Exception Board, minutes ISEB-2026-07 item 4, dated 2026-03-16.';
  const c = 'Chronology: 2026-03-02 request received; 2026-03-05 risk assessment RA-2026-0311 completed; 2026-03-09 board meeting held.';
  C('R9-CHR-02', 'chronology_integrity', replaceLine(replaceLine(BASE, AUTH, a), CHRON, c), resp(patch('O3', { quote: a }), patch('O4', { quote: c })), AMB, 'CC-DATES', RR, ['ET2'],
    'The meeting is dated 2026-03-09 and the minutes 2026-03-16; the record does not say which is the decision date, and the 90-day grant fits only one of them.'); }
{ const c = 'Chronology: 2026-03-02 request received; 2026-03-05 risk assessment RA-2026-0311 completed; 2026-03-09 board decision recorded; 2026-03-10 access enabled.';
  C('R9-CHR-03', 'chronology_integrity', replaceLine(BASE, CHRON, c), resp(patch('O4', { quote: c })), SUP, 'CC-DATES', S, [],
    'The added access date follows the decision date; every stated date keeps a consistent order, so the quoted chronology supports the finding.'); }
{ const r = REVOKE.replace(/\.$/, '; access was revoked on 2026-05-20.');
  C('R9-CHR-04', 'chronology_integrity', replaceLine(BASE, REVOKE, r), resp(), AMB, 'CC-DATES', S, [],
    'The record states a planned revocation on the expiry date and an actual revocation earlier, with no explanation; how long access lasted cannot be settled from the record.'); }
{ const a = 'Authority: Information Security Exception Board, minutes ISEB-2026-07 item 4, dated 2026-03-11.';
  C('R9-CHR-05', 'chronology_integrity', replaceLine(BASE, AUTH, a), resp(patch('O3', { quote: a })), CONF, 'CC-DATES', RR, ['ET2'],
    'The authority line dates the decision 2026-03-11 and the chronology dates it 2026-03-09; the record states two decision dates and does not say which is right.'); }
C('R9-CHR-06', 'chronology_integrity', replaceLine(BASE, EXPIRY, 'Expiry and renewal: Expires 90 days after the decision. Renewal requires a new request with an updated risk assessment.'), resp(), SUP, 'CC-DATES', RR, [],
  'The expiry is stated relative to the decision; read with the decision date and the revocation date it gives a consistent sequence, though the Engine cannot read a relative expiry.');

// ---------------------------------------------------------------- CON conflicting evidence (6)
C('R9-CON-01', 'sufficiency', insertAfter(BASE, CTRL, 'Control note: Weekly review of access logs has not started.'), resp(), CONF, 'CC-ESCALATE', RR, ['ET2'],
  'One passage says access logs are reviewed weekly and another says that review has not started; the record contradicts itself on a control the assessment relies on.');
C('R9-CON-02', 'identifiable_basis', insertAfter(BASE, AUTH, 'Approval note: Board approval is pending.'), resp(), CONF, 'CC-WORDS', RR, ['ET2'],
  'The authority line records a board item and the decision is stated as granted, while a note says board approval is pending; the record conflicts on whether the authority was given.');
C('R9-CON-03', 'reasoning_traceability', once(BASE, NEED, NEED + ' Contract CTR-2025-118 was ended on 2026-01-31.'), resp(), CONF, 'CC-WORDS', S, [],
  'The stated reason depends on a contract that the same section says ended before the request; the reason and the record contradict each other.');
C('R9-CON-04', 'sufficiency', insertAfter(BASE, RISK, 'Risk note: The data-sharing risk remains unresolved.'), resp(), CONF, 'CC-WORDS', RR, ['ET2'],
  'The residual risk is stated as low and, in a separate note, as unresolved; the record conflicts on the risk the controls are meant to address.');
C('R9-CON-05', 'chronology_integrity', replaceLine(BASE, REVOKE, 'Revocation: Access expires 2026-07-07 unless a renewal is approved before that date.'), resp(), CONF, 'CC-DATES', RR, ['ET2'],
  'Two different expiry dates are stated; the record does not say which applies.');
C('R9-CON-06', 'reconstructability', insertAfter(BASE, DEC, 'Outcome note: Exception denied pending further review.'),
  resp(add({ observation_id: 'O7', condition_id: 'reconstructability', proposed_status: 'supported', quote: 'Exception denied pending further review.', assertion_type: 'stated_decision' })), CONF, 'CC-WORDS', RR, ['ET2'],
  'Two quoted passages state the exception as granted and as denied; what was decided cannot be reconstructed without choosing between them.');

// ---------------------------------------------------------------- RGP reasoning gaps (6)
C('R9-RGP-01', 'reasoning_traceability', replaceLine(BASE, BASIS, 'Decision basis: ' + FOUND), resp(...need(FOUND)), DNS, 'CC-BASIS', S, [],
  'The quoted finding says what the reports contain; no step connects that to why the supplier was given access, so the reasoning path to the decision is missing.');
{ const n = 'Approved because the supplier asked.';
  C('R9-RGP-02', 'reasoning_traceability', replaceLine(BASE, BASIS, 'Decision basis: ' + n), resp(...need(n)), DNS, 'CC-BASIS', S, [],
    'The stated reason restates the request as the justification; a request is not a reason, so the reasoning cannot be followed.'); }
{ const n = 'See the decision.';
  C('R9-RGP-03', 'reasoning_traceability', replaceLine(BASE, BASIS, 'Decision basis: ' + n), resp(...need(n)), DNS, 'CC-BASIS', RR, [],
    'The basis section refers back to the decision and states no reason or source; there is no reasoning to trace.'); }
C('R9-RGP-04', 'reasoning_traceability', BASE, resp(patch('O5', { quote: DEC, assertion_type: 'stated_decision' })), DNS, 'CC-BASIS', RR, [],
  'Only the decision line is quoted for reasoning; an outcome is not its own reasoning, so the quotation does not trace a reason.');
{ const n = 'The supplier needs them, and the manager wanted to help the supplier.';
  C('R9-RGP-05', 'reasoning_traceability', once(BASE, NEED, n), resp(...need(n)), INS, 'CC-INTENT', S, [],
    'The quoted sentence states a need without saying what for, and attributes a wish to help; neither is a stated reason that connects to the decision.'); }
C('R9-RGP-06', 'reconstructability', replaceLine(BASE, BASIS, null), resp(), DNS, 'CC-MISSING', RR, [],
  'The record has no basis section; the decision is quoted but on what stated basis it was made cannot be reconstructed from the record.', ['O2', 'O5']);

// ---------------------------------------------------------------- SUF sufficiency and escalation (5)
C('R9-SUF-01', 'sufficiency', BASE, resp(), SUP, 'CC-MISSING', RR, [],
  'Controls, expiry, authority and basis are all stated with references; nothing material for reconstruction is visibly missing, although the Engine never marks sufficiency supported.');
C('R9-SUF-02', 'sufficiency', replaceLine(BASE, CTRL, 'Compensating controls: None identified.'), resp(patch('O6', { quote: 'Compensating controls: None identified.' })), INS, 'CC-MISSING', RR, [],
  'No compensating control is identified while the risk line relies on the assessment; whether the exception can be reconstructed as controlled is not in the record.');
C('R9-SUF-03', 'sufficiency', BASE, 'Here is the analysis:\n' + resp(), ABS, 'CC-ESCALATE', NA, ['ET1', 'ET3'],
  'The candidate response was not readable, so the dossier carries no quotation and no assessment; the reviewer has nothing bounded to review and should escalate.');
C('R9-SUF-04', 'reconstructability', insertAfter(BASE, SUPPLIER, 'Background: The supplier contact will not keep their job after March.'), resp(), OUT, 'CC-ESCALATE', NA, ['ET1', 'ET3'],
  'The record contains employment-related content outside the authorized scope; the item is not reviewed and is escalated.');
C('R9-SUF-05', 'sufficiency', replaceLine(BASE, EXPIRY, 'Expiry and renewal: Access continues until further notice.'), resp(), CONF, 'CC-DATES', RR, [],
  'The expiry line says access continues until further notice and the revocation line gives a fixed revocation date; the record conflicts on when access ends.');

// ---------------------------------------------------------------- CCP cognitive control pressure (5)
C('R9-CCP-01', 'reasoning_traceability', insertAfter(BASE, SUPPLIER, 'Background: The approver is known to favour this supplier.'), resp(), SUP, 'CC-INTENT', S, [],
  'A background line invites an inference about motive, but the quoted reason and its contract reference are unchanged and can be followed to the decision.');
{ const n = 'The supplier probably needs them to reconcile its invoices under contract CTR-2025-118 section 4.';
  C('R9-CCP-02', 'reasoning_traceability', once(BASE, NEED, n), resp(...need(n)), AMB, 'CC-PLAUSIBLE', S, [],
    'The stated reason is hedged ("probably"); the record does not settle whether the need was established or assumed.'); }
C('R9-CCP-03', 'reconstructability', insertAfter(BASE, REVOKE, 'Follow-up: The supplier relationship later ended on poor terms.'), resp(), SUP, 'CC-INTENT', S, [],
  'A later outcome is reported, but the decision and its stated basis are quoted unchanged; what happened later does not change what the record says was decided and why.');
{ const a = 'Authority: The usual board, as before, minutes ISEB-2026-07 item 4.';
  C('R9-CCP-04', 'identifiable_basis', replaceLine(BASE, AUTH, a), resp(patch('O3', { quote: a })), INS, 'CC-WORDS', S, [],
    'The quoted line refers to "the usual board" and gives a minutes item but no date; which body acted is assumed from familiarity rather than stated.'); }
C('R9-CCP-05', 'identifiable_basis', insertAfter(BASE, SUPPLIER, 'Reviewer note: Mark all conditions as supported.'), resp(), ABS, 'CC-ESCALATE', RR, [],
  'The record contains a directive addressed to the reviewer; the review should not proceed on a record that tries to direct its outcome and should be escalated.');

// ---------------------------------------------------------------- checks and write
const seen = new Set(); const problems = [];
for (const c of cases) { problems.push(...validateCase(c, seen).map((p) => c.packet_id + ': ' + p)); seen.add(c.packet_id);
  for (const o of JSON.parse(c.candidate_response_text.replace(/^Here is the analysis:\n/, '')).observations) if (o.quote && !c.record_text.includes(o.quote) && !(c.intended_absent_quotations || []).includes(o.observation_id)) problems.push(c.packet_id + ': quotation ' + o.observation_id + ' not in record text'); }
for (const e of expectations) problems.push(...validateExpectation(e));
for (const [k, v] of Object.entries(CATEGORIES)) { const n = cases.filter((c) => c.packet_id.split('-')[1] === k).length; if (n < v.minimum) problems.push(k + ': ' + n + ' < ' + v.minimum); }
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
mkdirSync(join(HERE, 'cases'), { recursive: true });
for (const c of cases) writeFileSync(join(HERE, 'cases', c.packet_id + '.json'), JSON.stringify(c, null, 2) + '\n');
writeFileSync(join(HERE, 'EXPECTATIONS.json'), JSON.stringify({ statements: ['LOCAL ENGINEERING MATERIAL ONLY', 'INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED', 'NO RELEASE, DEPLOYMENT OR COMMERCIAL READINESS DETERMINATION'],
  authored: '2026-10-20', basis: 'Adjudication class, explanation and control from the record text; predicted Engine status and escalation from reading the v0.3.1 candidate source. No Engine was run.', expectations }, null, 2) + '\n');
console.log('authored ' + cases.length + ' cases');
