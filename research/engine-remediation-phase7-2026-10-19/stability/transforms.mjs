// JRS PHASE 7: metamorphic transforms for the v0.3.1 candidate.
// SYNTHETIC AND ENGINEERING-AUTHORED (2026-10-19). Written and hashed into the
// Phase 7 seal before the candidate logic existed. Run through the Phase 6
// stability runner (unchanged) with the candidate compiler.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CASES = fileURLToPath(new URL('../scenarios/cases/', import.meta.url));
const sc = (id) => JSON.parse(readFileSync(join(CASES, id + '.json'), 'utf8'));
const IDS = ['P7-R07-04', 'P7-CHR-06', 'P7-NEG-04', 'P7-EVL-04', 'P7-CON-03', 'P7-CON-01', 'P7-CHR-01', 'P7-CHR-05', 'P7-CHR-09', 'P7-CHR-13', 'P7-NEG-01', 'P7-EVL-01', 'P7-EVL-03', 'P7-SCO-01', 'P7-R07-01'];
export const BASES = Object.fromEntries(IDS.map((id) => [id, sc(id)]));

const SUPPLIER = 'Supplier: Harrowgate Freight Services Ltd (fictional)';
const RISK = 'Residual risk: low, per RA-2026-0311 section 3.';
const CTRL = 'Compensating controls: Access is limited to the LOG-RPT-04 report view; sessions require multi-factor authentication; access logs are reviewed weekly by the Logistics Systems Manager, as set out in RA-2026-0311 section 5.';
const AUTH = 'Authority: Information Security Exception Board, minutes ISEB-2026-07 item 4, dated 2026-03-09.';
const DEC = 'Decision: Exception granted for 90 days.';
const EXPIRY = 'Expiry and renewal: Expires 2026-06-07. Renewal requires a new request with an updated risk assessment.';
const REVOKE = 'Revocation: The Logistics Systems Manager will revoke access on 2026-06-07 unless a renewal is approved before that date.';
const CHRON = 'Chronology: 2026-03-02 request received; 2026-03-05 risk assessment RA-2026-0311 completed; 2026-03-09 board decision recorded.';
const NEED = 'The supplier needs them to reconcile its invoices under contract CTR-2025-118 section 4.';
const N1 = 'The supplier does not need them to reconcile its invoices under contract CTR-2025-118 section 4.';
const N4 = 'There is no alternative, so the supplier needs them to reconcile its invoices under contract CTR-2025-118 section 4.';
const K1 = 'Control note: Weekly review of access logs has not started.';
const X1 = 'Background: The supplier contact will not keep their job after March.';
const once = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('transform target not unique: ' + a.slice(0, 50)); return s.replace(a, b); };
const insertAfter = (r, line, added) => once(r, line + '\n', line + '\n' + added + '\n');
const swap = (r, a, b) => { const x = r.split('\n'); const i = x.indexOf(a), j = x.indexOf(b); if (i < 0 || j < 0) throw new Error('swap target missing'); [x[i], x[j]] = [x[j], x[i]]; return x.join('\n'); };
const obs = (resp, id, p) => { const r = JSON.parse(resp); Object.assign(r.observations.find((o) => o.observation_id === id), p); return JSON.stringify(r, null, 2); };
const INV = ['no_behavioral_difference', 'presentation_only'];
const OFF = { offsets_recomputed: 'record text changed by the transform; the compiler recomputed every offset' };
const CHG = Object.assign({}, OFF, { expected_degradation: true, expected_refusal: true, structure_change: 'the transform adds or removes evidence, refusal or conflict nodes' });
const QC = (why) => Object.assign({}, CHG, { quote_changes: why });
const S5 = (rc, ib, ci, rt, su) => ({ reconstructability: rc, identifiable_basis: ib, chronology_integrity: ci, reasoning_traceability: rt, sufficiency: su });
const NONE = S5('not_assessed', 'not_assessed', 'not_assessed', 'not_assessed', 'not_assessed');
const blank = (b) => ({ record: b.record.replace(/\n/g, '\n\n') });
const background = (b) => ({ record: insertAfter(b.record, SUPPLIER, 'Background: The supplier has carried freight for the logistics team for several years.') });
const weaken = (c) => (g) => { g.nodes.find((n) => n.id === 'lim:' + c).text = 'Textual presence only.'; return g; };
const inv = (id, name, base, base_state, make, explanation = OFF) => ({ id, name, kind: 'invariant', base, base_state, make, explanation, expected: { verdict_in: INV } });

export const TRANSFORMS = [
  inv('P7-ST-01', 'wording: supplier name spelled out', 'P7-R07-04', 'favorable', (b) => ({ record: once(b.record, SUPPLIER, SUPPLIER.replace(' Ltd ', ' Limited ')) })),
  inv('P7-ST-02', 'wording: supplier name spelled out (late-assessment base)', 'P7-CHR-01', 'non_favorable', (b) => ({ record: once(b.record, SUPPLIER, SUPPLIER.replace(' Ltd ', ' Limited ')) })),
  inv('P7-ST-03', 'punctuation: hyphen and full stop in the record type (negated-rationale base)', 'P7-NEG-01', 'non_favorable', (b) => ({ record: once(b.record, 'Record type: Supplier access exception draft', 'Record type: Supplier-access exception draft.') })),
  inv('P7-ST-04', 'section reorder: risk and controls swapped (two-expiry base)', 'P7-CHR-05', 'non_favorable', (b) => ({ record: swap(b.record, RISK, CTRL) })),
  inv('P7-ST-05', 'section reorder: risk and controls swapped (unlinked-identifier base)', 'P7-EVL-01', 'non_favorable', (b) => ({ record: swap(b.record, RISK, CTRL) })),
  inv('P7-ST-06', 'section reorder: risk and controls swapped', 'P7-NEG-04', 'favorable', (b) => ({ record: swap(b.record, RISK, CTRL) })),
  inv('P7-ST-07', 'formatting: blank line after every line (scope-refused base)', 'P7-SCO-01', 'non_favorable', blank),
  inv('P7-ST-08', 'formatting: blank line after every line (no-decision-date base)', 'P7-CHR-09', 'non_favorable', blank),
  inv('P7-ST-09', 'irrelevant narrative line added (log-review conflict base)', 'P7-CON-01', 'favorable', background),
  inv('P7-ST-10', 'irrelevant narrative line added (motive-note base)', 'P7-R07-01', 'non_favorable', background),
  inv('P7-ST-11', 'benign pattern word: batch job keeps running', 'P7-EVL-04', 'favorable', (b) => ({ record: insertAfter(b.record, SUPPLIER, 'Background: The nightly batch job keeps running during the exception.') })),
  inv('P7-ST-12', 'benign pattern word: invoice review not started (duration-conflict base)', 'P7-CHR-13', 'non_favorable', (b) => ({ record: insertAfter(b.record, CTRL, 'Control note: Review of supplier invoices has not started.') })),
  inv('P7-ST-13', 'benign pattern word: later access review completed (negated-rationale base)', 'P7-NEG-01', 'non_favorable', (b) => ({ record: insertAfter(b.record, REVOKE, 'Follow-up: Access review completed 2026-04-15.') })),
  inv('P7-ST-14', 'duplicate date: same decision date repeated (two-expiry base)', 'P7-CHR-05', 'non_favorable', (b) => ({ record: insertAfter(b.record, CHRON, 'Note: Board decision recorded 2026-03-09.') })),
  inv('P7-ST-15', 'duplicate date: same decision date repeated', 'P7-CHR-06', 'favorable', (b) => ({ record: insertAfter(b.record, CHRON, 'Note: Board decision recorded 2026-03-09.') })),
  inv('P7-ST-31', 'wording in a quoted line: granted becomes approved', 'P7-R07-04', 'favorable', (b) => ({ record: once(b.record, DEC, 'Decision: Exception approved for 90 days.'), response: obs(b.response, 'O1', { quote: 'Decision: Exception approved for 90 days.' }) }),
    Object.assign({}, OFF, { quote_changes: 'O1 quotes the reworded decision line' })),
  inv('P7-ST-32', 'punctuation: full stop after the exception identifier', 'P7-CON-03', 'favorable', (b) => ({ record: once(b.record, 'Exception ID: SAE-2026-0101', 'Exception ID: SAE-2026-0101.') })),
  { id: 'P7-ST-16', name: 'omitted dates: every decision date removed', kind: 'changed', base: 'P7-R07-04', base_state: 'favorable',
    make: (b) => ({ record: once(once(b.record, AUTH, 'Authority: Information Security Exception Board, minutes ISEB-2026-07 item 4.'), CHRON, 'Chronology: 2026-03-02 request received; 2026-03-05 risk assessment RA-2026-0311 completed.'),
      response: obs(obs(b.response, 'O3', { quote: 'Authority: Information Security Exception Board, minutes ISEB-2026-07 item 4.' }), 'O4', { quote: 'Chronology: 2026-03-02 request received; 2026-03-05 risk assessment RA-2026-0311 completed.' }) }),
    explanation: QC('O3 and O4 quote the edited lines'), expected: { verdict_in: ['human_review_required'], classes_include: ['expected_safe_degradation'], graph: { statuses: { chronology_integrity: 'review_required' }, cc_include: ['no_dated_decision'] } } },
  { id: 'P7-ST-17', name: 'omitted dates: expiry date removed', kind: 'changed', base: 'P7-CON-03', base_state: 'favorable',
    make: (b) => ({ record: once(b.record, EXPIRY, 'Expiry and renewal: Renewal requires a new request with an updated risk assessment.') }), explanation: CHG,
    expected: { verdict_in: ['human_review_required'], graph: { statuses: { chronology_integrity: 'review_required' }, cc_include: ['no_stated_expiry_date'] } } },
  { id: 'P7-ST-18', name: 'negated language replaces the stated need', kind: 'changed', base: 'P7-NEG-04', base_state: 'favorable',
    make: (b) => ({ record: once(b.record, N4, N1), response: obs(obs(b.response, 'O2', { quote: N1 }), 'O5', { quote: N1 }) }), explanation: QC('O2 and O5 quote the negated sentence'),
    expected: { verdict_in: ['human_review_required'], classes_include: ['expected_safe_degradation'], graph: { statuses: { reasoning_traceability: 'review_required' } } } },
  { id: 'P7-ST-19', name: 'negated language replaces the stated need (basis-reference base)', kind: 'changed', base: 'P7-EVL-04', base_state: 'favorable',
    make: (b) => ({ record: once(b.record, NEED, N1), response: obs(obs(b.response, 'O2', { quote: N1 }), 'O5', { quote: N1 }) }), explanation: QC('O2 and O5 quote the negated sentence'),
    expected: { verdict_in: ['human_review_required'], graph: { statuses: { reasoning_traceability: 'review_required' } } } },
  { id: 'P7-ST-20', name: 'unrelated quotation: report-view identifier cited for identifiable basis', kind: 'changed', base: 'P7-CON-03', base_state: 'favorable',
    make: (b) => ({ response: obs(b.response, 'O3', { quote: 'Access is limited to the LOG-RPT-04 report view', assertion_type: 'stated_source_reference' }) }), explanation: QC('O3 quotes the controls section'),
    expected: { verdict_in: ['human_review_required'], classes_include: ['expected_safe_degradation'], graph: { statuses: { identifiable_basis: 'review_required' } } } },
  { id: 'P7-ST-21', name: 'unrelated quotation: renewal sentence cited for reasoning (late-assessment base)', kind: 'changed', base: 'P7-CHR-01', base_state: 'non_favorable',
    make: (b) => ({ response: obs(b.response, 'O5', { quote: 'Renewal requires a new request with an updated risk assessment.' }) }), explanation: QC('O5 quotes the expiry section'),
    expected: { verdict_in: ['human_review_required'], graph: { statuses: { reasoning_traceability: 'review_required', chronology_integrity: 'review_required' } } } },
  { id: 'P7-ST-22', name: 'paraphrased conflict: log review not started', kind: 'changed', base: 'P7-R07-04', base_state: 'favorable', make: (b) => ({ record: insertAfter(b.record, CTRL, K1) }), explanation: CHG,
    expected: { verdict_in: ['human_review_required'], classes_include: ['expected_safe_degradation'], graph: { conflicts_include: ['control_state_conflict'], statuses: { sufficiency: 'review_required' } } } },
  { id: 'P7-ST-23', name: 'paraphrased conflict: log review not started (renewal-quote base)', kind: 'changed', base: 'P7-EVL-03', base_state: 'non_favorable', make: (b) => ({ record: insertAfter(b.record, CTRL, K1) }), explanation: CHG,
    expected: { verdict_in: ['human_review_required'], graph: { conflicts_include: ['control_state_conflict'] } } },
  { id: 'P7-ST-24', name: 'reworded excluded-domain language added', kind: 'changed', base: 'P7-NEG-04', base_state: 'favorable', make: (b) => ({ record: insertAfter(b.record, SUPPLIER, X1) }), explanation: CHG,
    expected: { verdict_in: ['fail_closed'], classes_include: ['expected_refusal'], graph: { gate: 'refuse', statuses: NONE } } },
  { id: 'P7-ST-25', name: 'reworded excluded-domain language added (duration-conflict base)', kind: 'changed', base: 'P7-CHR-13', base_state: 'non_favorable', make: (b) => ({ record: insertAfter(b.record, SUPPLIER, X1) }), explanation: CHG,
    expected: { verdict_in: ['fail_closed'], classes_include: ['expected_refusal'], graph: { gate: 'refuse', statuses: NONE } } },
  { id: 'P7-ST-26', name: 'multiple defects: late assessment, second expiry and negated need', kind: 'changed', base: 'P7-R07-04', base_state: 'favorable',
    make: (b) => ({ record: once(once(once(b.record, CHRON, 'Chronology: 2026-03-02 request received; 2026-03-12 risk assessment RA-2026-0311 completed; 2026-03-09 board decision recorded.'),
      REVOKE, 'Revocation: Access expires 2026-07-07 unless a renewal is approved before that date.'), NEED, N1),
      response: obs(obs(obs(b.response, 'O4', { quote: 'Chronology: 2026-03-02 request received; 2026-03-12 risk assessment RA-2026-0311 completed; 2026-03-09 board decision recorded.' }), 'O2', { quote: N1 }), 'O5', { quote: N1 }) }),
    explanation: QC('O2, O4 and O5 quote the edited lines'),
    expected: { verdict_in: ['human_review_required'], graph: { statuses: S5('supported', 'supported', 'review_required', 'review_required', 'review_required'), conflicts_include: ['assessment_after_decision', 'expiry_date_conflict'] } } },
  { id: 'P7-ST-27', name: 'multiple defects: 30-day grant and log review not started (unlinked-identifier base)', kind: 'changed', base: 'P7-EVL-01', base_state: 'non_favorable',
    make: (b) => ({ record: insertAfter(once(b.record, DEC, 'Decision: Exception granted for 30 days.'), CTRL, K1), response: obs(b.response, 'O1', { quote: 'Decision: Exception granted for 30 days.' }) }),
    explanation: QC('O1 quotes the edited decision line'),
    expected: { verdict_in: ['human_review_required'], graph: { statuses: S5('supported', 'review_required', 'review_required', 'supported', 'review_required'), conflicts_include: ['duration_date_conflict', 'control_state_conflict'] } } },
  { id: 'P7-ST-28', name: 'output damage: chronology limitation weakened (late-assessment base)', kind: 'changed', base: 'P7-CHR-01', base_state: 'non_favorable', damage: weaken('chronology_integrity'),
    expected: { verdict_in: ['fail_closed'], classes_include: ['limitation_removed_or_weakened'] } },
  { id: 'P7-ST-29', name: 'output damage: every refusal removed (scope-refused base)', kind: 'changed', base: 'P7-SCO-01', base_state: 'non_favorable',
    damage: (g) => { g.refusals = []; g.nodes = g.nodes.filter((n) => n.type !== 'refusal'); g.edges = g.edges.filter((e) => !e.from.startsWith('ref:')); return g; },
    expected: { verdict_in: ['fail_closed'], classes_include: ['scope_boundary_defect'] } },
  { id: 'P7-ST-30', name: 'output damage: review_required chronology flipped to supported (no-decision-date base)', kind: 'changed', base: 'P7-CHR-09', base_state: 'non_favorable',
    damage: (g) => { g.findings.find((f) => f.condition_id === 'chronology_integrity').status = 'supported'; g.nodes.find((n) => n.id === 'find:chronology_integrity').status = 'supported'; return g; },
    expected: { verdict_in: ['fail_closed'], classes_include: ['favorable_transition_requiring_human_review'] } },
];
