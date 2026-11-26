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

test('all 43 templates are registered in the five groups', () => {
  const groups = {};
  for (const t of Object.values(TEMPLATES)) groups[t.group] = (groups[t.group] || 0) + 1;
  assert.equal(Object.keys(TEMPLATES).length, 43);
  assert.deepEqual(groups, { authority_governance: 16, conclusion_reasoning: 6, chronology: 11, evidence_quotation: 9, certainty: 1 });
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
  for (const id of ['INV-P01', 'DISC-P01', 'MEMO-P01']) {
    assert.deepEqual(hits(fx('fixtures-partner', id)), [], id);
  }
  // 2026-11-25: AUTH-P01 cites a policy it does not supply and no source shows the
  // approver's entitlement; supplying the policy clears both.
  assert.deepEqual(hits(fx('fixtures-partner', 'AUTH-P01')).map((h) => h.template), ['cited_authority_not_supplied', 'approver_entitlement_not_shown']);
  const withPolicy = fx('fixtures-partner', 'AUTH-P01'); withPolicy.sources.push({ source_id: 'S9', title: 'Finance automation policy, section 4', version: 'v3', text: 'Section 4. The finance director may authorize an AI assistant to send routine customer messages, with human sign-off of each batch.' });
  assert.deepEqual(hits(withPolicy), []);
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
  // 2026-11-25 (owner decision from the practitioner study): a bare result with no
  // stated basis ("no material issues were identified") is now also a review finding.
  const s61 = st(ar61());
  assert.equal(s61.status, 'REVIEW_REQUIRED');
  assert.deepEqual(s61.findings.filter((f) => f.status === 'OPEN').map((f) => f.code), ['CONCLUSORY_ASSESSMENT', 'CONCLUSION_ON_UNRESOLVED_BASIS']);
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

// Templates added 2026-11-19 (second round). Record AR-62 is constructed for
// these tests; it is not the record whose review exposed the gaps.
function ar62() {
  const t1 = 'On 2026-07-10, Hana Okoye, the billing operations manager, authorized Quillon Agent to apply account credits to subscribers without human review.';
  const t2 = 'Credits are limited to amounts under $40.';
  const t3 = 'The authorization expires on 2026-09-30.';
  const t4 = 'A pilot in June surfaced no problems.';
  const t5 = 'Quillon Agent may therefore apply credits from 2026-07-12.';
  const memo = `Authorization memo AM-62. ${t1} ${t2} ${t3} Any subscriber may ask for credits to stop, and billing can suspend the agent.`;
  return {
    schema: 'ds-n1.record/1.0', record_id: 'AR-62', record_version: '1', record_class: 'ai_action_authorization',
    data_classification: 'constructed_fictional', title: 'Authorization record AR-62 (fictional)',
    text: [t1, t2, t3, t4, t5, 'Any subscriber may ask for credits to stop, and billing can suspend the agent.'].join(' '),
    entities: [{ entity_id: 'E1', name: 'Quillon Agent' }, { entity_id: 'E2', name: 'Hana Okoye' }],
    sources: [
      { source_id: 'S1', title: 'Pilot note PN-3', version: 'v1', text: 'Pilot note PN-3. A pilot in June surfaced no problems.', events: [{ role: 'evaluation_completed', date: '2026-06-30' }] },
      { source_id: 'S2', title: 'Authorization memo AM-62', version: 'v1', text: memo, events: [{ role: 'authorization', date: '2026-07-10', actor: 'E2' }, { role: 'expiry', date: '2026-09-30' }] },
    ],
    claims: [
      { claim_id: 'C1', kind: 'authority', quote: t1, actor: 'E2', event: { role: 'authorization', date: '2026-07-10' }, citations: [{ source_id: 'S2', quote: t1 }] },
      { claim_id: 'C2', kind: 'fact', quote: t2, citations: [{ source_id: 'S2', quote: t2 }] },
      { claim_id: 'C3', kind: 'fact', quote: t3, event: { role: 'expiry', date: '2026-09-30' }, citations: [{ source_id: 'S2', quote: t3 }] },
      { claim_id: 'C4', kind: 'fact', quote: t4, citations: [{ source_id: 'S1', quote: t4 }] },
      { claim_id: 'C5', kind: 'conclusion', quote: t5, reasoning: 'C1 gives the authorization; C2 and C3 set its limits; C4 gives the pilot result.', citations: [] },
      { claim_id: 'C6', kind: 'fact', quote: 'Any subscriber may ask for credits to stop, and billing can suspend the agent.', citations: [{ source_id: 'S2', quote: 'Any subscriber may ask for credits to stop, and billing can suspend the agent.' }] },
    ],
  };
}
function add62(r, id, sentence) {
  r.text += ' ' + sentence;
  r.sources[1].text += ' ' + sentence;
  r.claims.push({ claim_id: id, kind: 'fact', quote: sentence, citations: [{ source_id: 'S2', quote: sentence }] });
  return r;
}
const ROUND2 = ['no_authority_basis_cited', 'human_oversight_removed', 'amount_limit_without_volume_cap', 'no_post_expiry_terms', 'date_not_in_sources', 'conclusory_evidence_summary'];

test('round-two templates fire on a record with each gap, as advisories only', () => {
  const h = hits(ar62());
  for (const t of ROUND2) {
    const x = h.find((y) => y.template === t);
    assert.ok(x, t);
    assert.equal(x.changes_review_status, false, t);
  }
  assert.match(h.find((y) => y.template === 'date_not_in_sources').detail, /2026-07-12/);
  assert.equal(h.find((y) => y.template === 'human_oversight_removed').claim_id, 'C1');
  assert.ok(!names(ar62()).has('approver_role_not_stated'), 'the role is stated, so that check stays quiet');
  assert.ok(!names(ar62()).has('no_stop_or_redress_path'), 'a stop route is stated');
});

test('result-summary wording variants are recognised, and a stated scope clears them', () => {
  for (const w of ['The pilot raised no concerns.', 'The trial found no issues.', 'The pilot went smoothly.', 'The pilot was satisfactory.', 'The pilot ran without incident.']) {
    const r = ar62();
    r.claims[3].quote = w; r.sources[0].text = `Pilot note PN-3. ${w}`; r.claims[3].citations[0].quote = w;
    r.text = r.text.replace('A pilot in June surfaced no problems.', w);
    assert.ok(names(r).has('conclusory_evidence_summary'), w);
  }
  assert.ok(!names(add62(ar62(), 'C9', 'The pilot tested 200 sample credits against the billing ledger.')).has('conclusory_evidence_summary'));
});

test('each round-two gap clears when the record states the missing element', () => {
  assert.ok(!names(add62(ar62(), 'C9', 'The approval was given under section 2 of the billing delegation policy.')).has('no_authority_basis_cited'));
  assert.ok(!names(add62(ar62(), 'C9', 'No more than 50 credits may be applied per day.')).has('amount_limit_without_volume_cap'));
  assert.ok(!names(add62(ar62(), 'C9', 'The authorization lapses on that date unless re-approved.')).has('no_post_expiry_terms'));
  const r = ar62();
  r.sources[1].text += ' Credits may be applied from 2026-07-12.';
  assert.ok(!names(r).has('date_not_in_sources'), 'a date the memo gives is traceable');
});

test('human review that is kept, and an amount-free limit, do not trigger the AI-action checks', () => {
  const r = ar62();
  r.text = r.text.replace(' without human review', ''); r.claims[0].quote = r.claims[0].quote.replace(' without human review', '');
  r.claims[0].citations[0].quote = r.claims[0].quote; r.sources[1].text = r.sources[1].text.replace(' without human review', '');
  assert.ok(!names(r).has('human_oversight_removed'));
  const s = ar62();
  s.record_class = 'supplier_access_exception';
  for (const t of ['human_oversight_removed', 'amount_limit_without_volume_cap', 'no_stop_or_redress_path']) assert.ok(!names(s).has(t), t);
});

// Round three (2026-11-19): a hedged source stated as firm, more result and
// limit wording. Record AR-63 is constructed for these tests only.
function ar63() {
  const t1 = 'On 2026-04-07, Tomas Reyes, the records manager, approved Fernhill Archiving remote access to the case archive under the third-party access standard, section 2.';
  const t2 = 'Remote sessions are subject to session recording.';
  const t3 = 'The security review found the exposure adequate.';
  const t4 = 'Access lapses on 2026-06-30 unless renewed.';
  const t5 = 'The access can therefore proceed.';
  return {
    schema: 'ds-n1.record/1.0', record_id: 'AR-63', record_version: '1', record_class: 'supplier_access_exception',
    data_classification: 'constructed_fictional', title: 'Supplier access exception AR-63 (fictional)',
    text: [t1, t2, t3, t4, t5].join(' '),
    entities: [{ entity_id: 'E1', name: 'Fernhill Archiving' }, { entity_id: 'E2', name: 'Tomas Reyes' }],
    sources: [
      { source_id: 'S1', title: 'Access request RQ-63', version: 'v1', text: 'Access request RQ-63. Fernhill Archiving requests remote access to the case archive. Session recording should be enabled where possible.', events: [{ role: 'request', date: '2026-04-01' }] },
      { source_id: 'S2', title: 'Security review SR-63', version: 'v1', text: 'Security review SR-63. The security review found the exposure adequate.', events: [{ role: 'assessment_completed', date: '2026-04-03' }] },
      { source_id: 'S3', title: 'Approval AP-63', version: 'v1', text: `Approval AP-63. ${t1} ${t4}`, events: [{ role: 'authorization', date: '2026-04-07', actor: 'E2' }, { role: 'expiry', date: '2026-06-30' }] },
    ],
    claims: [
      { claim_id: 'C1', kind: 'authority', quote: t1, actor: 'E2', event: { role: 'authorization', date: '2026-04-07' }, citations: [{ source_id: 'S3', quote: t1 }] },
      { claim_id: 'C2', kind: 'fact', quote: t2, citations: [{ source_id: 'S1', quote: 'Session recording should be enabled' }] },
      { claim_id: 'C3', kind: 'fact', quote: t3, citations: [{ source_id: 'S2', quote: t3 }] },
      { claim_id: 'C4', kind: 'fact', quote: t4, event: { role: 'expiry', date: '2026-06-30' }, citations: [{ source_id: 'S3', quote: t4 }] },
      { claim_id: 'C5', kind: 'conclusion', quote: t5, reasoning: 'C1 gives the approval, C2 the control, C3 the review and C4 the end terms.', citations: [] },
    ],
  };
}

test('a hedged source restated as firm is flagged, with the source wording', () => {
  const h = hits(ar63()).find((x) => x.template === 'hedged_source_stated_firmly');
  assert.ok(h, 'expected hedged_source_stated_firmly');
  assert.equal(h.claim_id, 'C2');
  assert.match(h.detail, /should be enabled/);
  assert.equal(h.changes_review_status, false);
  const r = ar63();
  r.sources[0].text = 'Access request RQ-63. Fernhill Archiving requests remote access to the case archive. Session recording must be enabled.';
  r.claims[1].citations[0].quote = 'Session recording must be enabled';
  assert.ok(!names(r).has('hedged_source_stated_firmly'), 'a firm source stated firmly is not flagged');
});

test('"found the exposure adequate" is a bare result; "lapses on" is an end date; numeric caps are controls', () => {
  const n = names(ar63());
  assert.ok(n.has('conclusory_evidence_summary'));
  assert.ok(!n.has('no_stated_expiry_date'), '"lapses on" states an end date');
  assert.ok(!n.has('no_post_expiry_terms'), '"unless renewed" states what happens');
  const r = ar63();
  for (const w of ['Fernhill may open at most 3 sessions per week.', 'No more than 2 staff may connect at once.']) {
    const x = ar63();
    x.text = x.text.replace('Remote sessions are subject to session recording. ', '');
    x.claims.splice(1, 1);
    x.text += ' ' + w; x.sources[2].text += ' ' + w;
    x.claims.push({ claim_id: 'C9', kind: 'fact', quote: w, citations: [{ source_id: 'S3', quote: w }] });
    assert.ok(!names(x).has('no_compensating_control_stated'), w);
  }
  assert.ok(r);
});

// Round four (2026-11-19): versions, collective approvers, action before
// approval, broad access. AR-64 and AR-65 are constructed for these tests only.
function ar64() {
  const t1 = 'On 2026-02-16, the risk committee approved Lumen Sorter to route incoming complaints to case handlers.';
  const t2 = 'Lumen Sorter has routed complaints since 2026-02-02.';
  const t3 = 'It was assessed in test summary TS-40, version 3.';
  const t4 = 'The approval covers model version 2.1 and was given under the operational AI policy, section 6.';
  const t5 = 'Routing therefore continues under the approval.';
  return {
    schema: 'ds-n1.record/1.0', record_id: 'AR-64', record_version: '1', record_class: 'ai_action_authorization',
    data_classification: 'constructed_fictional', title: 'Authorization record AR-64 (fictional)',
    text: [t1, t2, t3, t4, t5].join(' '),
    entities: [{ entity_id: 'E1', name: 'Lumen Sorter' }, { entity_id: 'E2', name: 'risk committee' }],
    sources: [
      { source_id: 'S1', title: 'Test summary TS-40', version: 'v2', text: 'Test summary TS-40. Lumen Sorter model version 2.0 was tested on 400 sample complaints.', events: [{ role: 'test_completed', date: '2026-02-05' }] },
      { source_id: 'S2', title: 'Committee minute RC-9', version: 'v1', text: `Committee minute RC-9. ${t1} ${t4}`, events: [{ role: 'authorization', date: '2026-02-16', actor: 'E2' }] },
    ],
    claims: [
      { claim_id: 'C1', kind: 'authority', quote: t1, actor: 'E2', event: { role: 'authorization', date: '2026-02-16' }, citations: [{ source_id: 'S2', quote: t1 }] },
      { claim_id: 'C2', kind: 'fact', quote: t2, citations: [] },
      { claim_id: 'C3', kind: 'fact', quote: t3, citations: [{ source_id: 'S1', quote: 'Lumen Sorter model version 2.0 was tested on 400 sample complaints.' }] },
      { claim_id: 'C4', kind: 'fact', quote: t4, citations: [{ source_id: 'S2', quote: t4 }] },
      { claim_id: 'C5', kind: 'conclusion', quote: t5, reasoning: 'C1 and C4 give the approval and its scope; C3 the test.', citations: [] },
    ],
  };
}
function ar65() {
  const t1 = 'On 2026-05-11, Ines Moretti, head of infrastructure, granted Arclight Support administrator access to the billing servers under the vendor access standard, section 3.';
  const t2 = 'Access is subject to multi-factor authentication and expires on 2026-06-11 unless renewed.';
  const t3 = 'The access can therefore proceed.';
  return {
    schema: 'ds-n1.record/1.0', record_id: 'AR-65', record_version: '1', record_class: 'supplier_access_exception',
    data_classification: 'constructed_fictional', title: 'Supplier access exception AR-65 (fictional)',
    text: [t1, t2, t3].join(' '),
    entities: [{ entity_id: 'E1', name: 'Arclight Support' }, { entity_id: 'E2', name: 'Ines Moretti' }],
    sources: [{ source_id: 'S1', title: 'Exception EX-65', version: 'v1', text: `Exception EX-65. ${t1} ${t2}`, events: [{ role: 'authorization', date: '2026-05-11', actor: 'E2' }, { role: 'expiry', date: '2026-06-11' }] }],
    claims: [
      { claim_id: 'C1', kind: 'authority', quote: t1, actor: 'E2', event: { role: 'authorization', date: '2026-05-11' }, citations: [{ source_id: 'S1', quote: t1 }] },
      { claim_id: 'C2', kind: 'fact', quote: t2, citations: [{ source_id: 'S1', quote: t2 }] },
      { claim_id: 'C3', kind: 'conclusion', quote: t3, reasoning: 'C1 grants access; C2 limits it.', citations: [] },
    ],
  };
}

test('round-four templates fire on the gaps they target', () => {
  const h = hits(ar64());
  const get = (t) => h.find((x) => x.template === t);
  assert.match(get('cited_version_mismatch').detail, /TS-40 version 3.*v2/);
  assert.match(get('version_mismatch_between_sources').detail, /2\.1.*2\.0|2\.0.*2\.1/);
  assert.equal(get('collective_approver_unnamed').claim_id, 'C1');
  assert.match(get('action_before_authorization').detail, /2026-02-02.*2026-02-16/);
  assert.ok(names(ar65()).has('broad_access_without_scope'));
  for (const x of h.filter((y) => y.mode === 'advisory')) assert.equal(x.changes_review_status, false, x.template);
});

test('round-four templates stay quiet when the record covers the point', () => {
  const r = ar64();
  r.text = r.text.replace('version 3', 'version 2');
  r.claims[2].quote = r.claims[2].quote.replace('version 3', 'version 2');
  r.sources[0].text = r.sources[0].text.replace('2.0', '2.1');
  r.text = r.text.replace('since 2026-02-02', 'since 2026-02-17'); r.claims[1].quote = r.claims[1].quote.replace('2026-02-02', '2026-02-17');
  r.text += ' The committee met with a quorum of four members.';
  const n = names(r);
  for (const t of ['cited_version_mismatch', 'version_mismatch_between_sources', 'collective_approver_unnamed', 'action_before_authorization']) assert.ok(!n.has(t), t);
  const s = ar65();
  s.text += ' Access is limited to the billing job scheduler.';
  assert.ok(!names(s).has('broad_access_without_scope'));
  const ai = ar65(); ai.record_class = 'ai_action_authorization';
  assert.ok(!names(ai).has('broad_access_without_scope'), 'scoped to supplier access');
});

// 2026-11-26: a record dated in words ("On 1 June 2026") was reported as having
// no explicit date and no dated decision, because both checks read only
// 2026-06-01. Found by running the starter edition on a fictional record.
test('dates written in words count as explicit dates', () => {
  const r = fx('fixtures-partner', 'AUTH-P01');
  const c3 = r.claims.find((c) => c.kind === 'authority');
  const q = 'On 1 June 2026 Priya Nandakumar authorized Ledgerline Assistant to send invoice reminder emails.';
  r.text = q; c3.quote = q; delete c3.event;
  r.claims = [c3];
  const n = names(r);
  assert.ok(!n.has('no_explicit_dates'), 'written date read');
  assert.ok(!n.has('no_dated_decision'), 'written date on the approval read');
  c3.quote = 'Priya Nandakumar authorized Ledgerline Assistant to send invoice reminder emails.';
  r.text = c3.quote;
  assert.ok(names(r).has('no_explicit_dates'), 'still fires with no date');
});
