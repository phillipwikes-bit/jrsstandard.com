// The 23 named detection templates (2026-11-18) and three added on 2026-11-19
// from a practitioner's blind review. Constructed records only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';
import { runDetectionTemplates, TEMPLATES } from '../../lib/ds-n1/detection-templates.mjs';

const T0 = '2026-11-18T12:00:00Z';
const fx = (dir, id) => JSON.parse(readFileSync(new URL(`./${dir}/${id}.json`, import.meta.url), 'utf8'));
const st = (r) => deriveState(openReview(r, { at: T0 }));
const hits = (r) => runDetectionTemplates(st(r));
const names = (r) => new Set(hits(r).map((h) => h.template));

test('all 26 templates are registered in the five groups', () => {
  const groups = {};
  for (const t of Object.values(TEMPLATES)) groups[t.group] = (groups[t.group] || 0) + 1;
  assert.equal(Object.keys(TEMPLATES).length, 26);
  assert.deepEqual(groups, { authority_governance: 8, conclusion_reasoning: 5, chronology: 8, evidence_quotation: 4, certainty: 1 });
});

test('finding-based templates name the finding they rest on', () => {
  const h = hits(fx('fixtures', 'D03'));
  assert.ok(h.some((x) => x.template === 'authority_source_not_identified' && x.code === 'UNTRACEABLE_AUTHORITY'));
  assert.ok(h.some((x) => x.template === 'decision_date_conflict' && x.code === 'DATE_MISMATCH'));
  assert.ok(names(fx('fixtures', 'D10')).has('absent_quotation'));
  assert.ok(names(fx('fixtures-partner', 'AUTH-D01')).has('cited_evidence_conflict'));
  assert.ok(names(fx('fixtures-partner', 'MEMO-D01')).has('certainty_language'));
});

test('advisory templates never change a status and never fire on the supported partner records', () => {
  for (const id of ['AUTH-P01', 'INV-P01', 'DISC-P01', 'MEMO-P01']) {
    assert.deepEqual(hits(fx('fixtures-partner', id)), [], id);
  }
  for (const h of hits(fx('fixtures', 'P03'))) {
    assert.equal(h.mode, 'advisory');
    assert.equal(h.changes_review_status, false);
  }
  assert.equal(st(fx('fixtures', 'P03')).status, 'READY_FOR_HUMAN_FINALIZATION', 'advisory hits leave a supported record READY');
});

test('a thin but supported authorization is flagged as incomplete, not as unsupported', () => {
  const n = names(fx('fixtures', 'P03'));
  for (const t of ['no_compensating_control_stated', 'no_stated_expiry_date', 'no_locatable_conclusion', 'basis_without_conclusion']) assert.ok(n.has(t), t);
});

test('an evaluation completed after the authorization it supports', () => {
  const r = fx('fixtures-partner', 'AUTH-P01');
  r.sources[1].events = [{ role: 'evaluation_completed', date: '2026-10-20', actor: 'E1' }];
  const h = hits(r).find((x) => x.template === 'assessment_after_decision');
  assert.ok(h, 'expected assessment_after_decision');
  assert.match(h.detail, /2026-10-20.*2026-10-14/);
});

test('a request dated after the decision is an impossible sequence', () => {
  const r = fx('fixtures-partner', 'AUTH-P01');
  r.sources[0].events = [{ role: 'request', date: '2026-10-30' }];
  assert.ok(names(r).has('impossible_sequence'));
});

test('a quotation that occurs twice in its source is ambiguous', () => {
  const r = fx('fixtures-partner', 'AUTH-P01');
  r.sources[2].text += ' Sending is limited to invoices more than thirty days overdue, and each batch requires human sign-off.';
  assert.ok(names(r).has('ambiguous_quotation'));
});

test('a stated duration that does not match the source dates', () => {
  const r = fx('fixtures-partner', 'AUTH-P01');
  r.sources[2].text += ' The authorization expires on 2026-11-13.';
  r.sources[2].events.push({ role: 'expiry', date: '2026-11-13' });
  r.text += ' The authorization lasts ninety days.';
  r.claims.push({ claim_id: 'C9', kind: 'fact', quote: 'The authorization lasts ninety days.', citations: [] });
  const h = hits(r).find((x) => x.template === 'duration_date_conflict');
  assert.ok(h, 'expected duration_date_conflict');
  assert.match(h.detail, /90 days.*30 days/);
});

test('date and authority templates apply only to record types that need them', () => {
  assert.ok(!names(fx('fixtures-partner', 'MEMO-P01')).has('no_explicit_dates'), 'a legal memo need not carry dates');
  assert.ok(!names(fx('fixtures-partner', 'INV-P01')).has('no_authority_section'), 'an investigation report is not an authorization');
});

test('an authorization with no authority statement, no dates and an undated decision', () => {
  const noAuth = fx('fixtures-partner', 'AUTH-P01');
  noAuth.claims = noAuth.claims.filter((c) => c.kind !== 'authority');
  assert.ok(names(noAuth).has('no_authority_section'));
  const undated = fx('fixtures-partner', 'AUTH-P01');
  const c3 = undated.claims.find((c) => c.kind === 'authority');
  undated.text = undated.text.replace(c3.quote, 'Priya Nandakumar authorized Ledgerline Assistant to send invoice reminder emails.');
  c3.quote = 'Priya Nandakumar authorized Ledgerline Assistant to send invoice reminder emails.';
  delete c3.event;
  assert.ok(names(undated).has('no_dated_decision'));
  const r = fx('fixtures-partner', 'AUTH-P01');
  r.text = 'Ledgerline Assistant may send invoice reminder emails.';
  r.claims = [{ claim_id: 'C1', kind: 'fact', quote: r.text, citations: [{ source_id: 'S1', quote: 'Ledgerline Assistant to send invoice reminder emails' }] }];
  assert.ok(names(r).has('no_explicit_dates'));
});

test('a dated approval plus an undated policy sentence is not an undated decision', () => {
  const r = fx('fixtures-partner', 'AUTH-P01');
  r.text += ' Approval was given under the finance automation policy.';
  r.claims.push({ claim_id: 'C9', kind: 'authority', quote: 'Approval was given under the finance automation policy.', citations: [] });
  assert.ok(!names(r).has('no_dated_decision'), 'found while comparing against a practitioner review record (AR-52)');
});

// Templates added 2026-11-19. Record AR-61 is constructed for these tests and is
// not the record the practitioner reviewed.
function ar61() {
  const t1 = 'On 2026-09-03, Owen Marsh authorized Tallyway Agent to send payment confirmations to suppliers.';
  const t2 = 'The pilot review was completed on 2026-08-28 and no material issues were identified.';
  const t3 = 'Sending is limited to confirmed payments and requires a weekly sign-off.';
  const t4 = 'Because the review was completed first and sending carries conditions, the authorization can proceed.';
  return {
    schema: 'ds-n1.record/1.0', record_id: 'AR-61', record_version: '1', record_class: 'ai_action_authorization',
    data_classification: 'constructed_fictional', title: 'Authorization record AR-61 (fictional)',
    text: [t1, t2, t3, t4].join(' '),
    entities: [{ entity_id: 'E1', name: 'Tallyway Agent' }, { entity_id: 'E2', name: 'Owen Marsh' }],
    sources: [
      { source_id: 'S1', title: 'Pilot review PR-12', version: 'v1', text: 'Pilot review PR-12. The pilot review was completed on 2026-08-28 and no material issues were identified.', events: [{ role: 'evaluation_completed', date: '2026-08-28' }] },
      { source_id: 'S2', title: 'Authorization memo AM-61', version: 'v1', text: `Authorization memo AM-61. ${t1} ${t3}`, events: [{ role: 'authorization', date: '2026-09-03', actor: 'E2' }] },
    ],
    claims: [
      { claim_id: 'C1', kind: 'authority', quote: t1, actor: 'E2', event: { role: 'authorization', date: '2026-09-03' }, citations: [{ source_id: 'S2', quote: 'Owen Marsh authorized Tallyway Agent to send payment confirmations to suppliers' }] },
      { claim_id: 'C2', kind: 'fact', quote: t2, event: { role: 'evaluation_completed', date: '2026-08-28' }, citations: [{ source_id: 'S1', quote: 'no material issues were identified' }] },
      { claim_id: 'C3', kind: 'fact', quote: t3, citations: [{ source_id: 'S2', quote: t3 }] },
      { claim_id: 'C4', kind: 'conclusion', quote: t4, reasoning: 'C2 establishes the review; C1 and C3 establish the conditional authorization.', citations: [] },
    ],
  };
}
// Adds a sentence to the record text and to memo S2, with a supported claim.
function addStatement(r, id, sentence) {
  r.text += ' ' + sentence;
  r.sources[1].text += ' ' + sentence;
  r.claims.push({ claim_id: id, kind: 'fact', quote: sentence, citations: [{ source_id: 'S2', quote: sentence }] });
  return r;
}
const NEW3 = ['approver_role_not_stated', 'conclusory_evidence_summary', 'no_stop_or_redress_path'];

test('the three added templates fire on a record missing role, scope and a stop route', () => {
  const h = hits(ar61());
  for (const t of NEW3) {
    const x = h.find((y) => y.template === t);
    assert.ok(x, t);
    assert.equal(x.mode, 'advisory');
    assert.equal(x.changes_review_status, false);
  }
  assert.equal(h.find((y) => y.template === 'approver_role_not_stated').claim_id, 'C1');
  assert.equal(h.find((y) => y.template === 'conclusory_evidence_summary').claim_id, 'C2');
  assert.equal(st(ar61()).status, 'READY_FOR_HUMAN_FINALIZATION', 'advisory hits leave the status unchanged');
});

test('a stated approver role clears approver_role_not_stated; a role for someone else does not', () => {
  assert.ok(!names(addStatement(ar61(), 'C5', 'Owen Marsh is the accounts payable manager.')).has('approver_role_not_stated'));
  assert.ok(names(addStatement(ar61(), 'C5', 'Lena Fox is the accounts payable manager.')).has('approver_role_not_stated'));
});

test('a stated test scope clears conclusory_evidence_summary', () => {
  const r = addStatement(ar61(), 'C5', 'The review tested forty sample confirmations against the payment ledger.');
  assert.ok(!names(r).has('conclusory_evidence_summary'));
});

test('a stated stop route clears no_stop_or_redress_path, and the check applies only to AI actions', () => {
  assert.ok(!names(addStatement(ar61(), 'C5', 'Any supplier may ask for confirmations to stop, and finance can suspend sending.')).has('no_stop_or_redress_path'));
  const r = ar61();
  r.record_class = 'supplier_access_exception';
  assert.ok(!names(r).has('no_stop_or_redress_path'));
});

test('with role, scope and stop route stated, none of the three fires', () => {
  let r = ar61();
  r = addStatement(r, 'C5', 'Owen Marsh is the accounts payable manager.');
  r = addStatement(r, 'C6', 'The review tested forty sample confirmations against the payment ledger.');
  r = addStatement(r, 'C7', 'Any supplier may ask for confirmations to stop, and finance can suspend sending.');
  const n = names(r);
  for (const t of NEW3) assert.ok(!n.has(t), t);
});
