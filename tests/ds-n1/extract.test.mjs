// DS-N1 document extraction (2026-11-24). Fictional text only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractRecord, EXTRACTOR_VERSION, splitClauses } from '../../lib/ds-n1/extract.mjs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';
import { canonical } from '../../lib/ds-n1/text.mjs';
import { runDetectionTemplates } from '../../lib/ds-n1/detection-templates.mjs';

const AT = { at: '2026-11-24T00:00:00Z' };
const status = (record) => deriveState(openReview(record, AT)).status;

// A new fictional case written for these tests, not one of the study records.
const CASE = {
  record_id: 'EXT-T01', title: 'Refund assistant authorization (fictional)', record_class: 'ai_action_authorization',
  text: 'On 2026-06-03, Marta Lindqvist, head of customer care, authorized Refundly Assistant to issue refunds up to 50 euros. '
    + 'The pilot evaluation RE-7 was completed on 2026-05-28. '
    + 'Refunds above 50 euros still need a human agent. '
    + 'Because the evaluation was completed and refunds above 50 euros need a human agent, the authorization can proceed.',
  sources: [
    { title: 'Pilot evaluation RE-7', version: 'v2', text: 'Pilot evaluation RE-7. The pilot evaluation of Refundly Assistant was completed on 2026-05-28, with no critical findings.' },
    { title: 'Authorization note AN-3', version: 'v1', text: 'Authorization note AN-3. On 2026-06-03, Marta Lindqvist authorized Refundly Assistant to issue refunds up to 50 euros. Refunds above 50 euros still need a human agent.' },
  ],
};

test('extraction is deterministic: the same text gives byte-identical output', () => {
  assert.equal(canonical(extractRecord(CASE)), canonical(extractRecord(CASE)));
  assert.equal(extractRecord(CASE).report.extractor, EXTRACTOR_VERSION);
});

test('every claim quote is exact record text and every citation is exact source text', () => {
  const { record } = extractRecord(CASE);
  for (const c of record.claims) {
    assert.ok(record.text.includes(c.quote), c.quote);
    for (const cit of c.citations) {
      const src = record.sources.find((s) => s.source_id === cit.source_id);
      assert.ok(src.text.includes(cit.quote), cit.quote);
    }
  }
});

test('claims, kinds, dated events and the approver are found', () => {
  const { record, report } = extractRecord(CASE);
  assert.equal(record.claims.length, 4);
  const [c1, c2, c3, c4] = record.claims;
  assert.equal(c1.kind, 'authority');
  assert.deepEqual(c1.event, { role: 'approval', date: '2026-06-03' });
  assert.equal(record.entities.find((e) => e.entity_id === c1.actor).name, 'Marta Lindqvist');
  assert.deepEqual(c2.event, { role: 'evaluation_completed', date: '2026-05-28' });
  assert.equal(c3.citations[0].source_id, 'S2');
  assert.equal(c4.kind, 'conclusion');
  assert.deepEqual(c4.citations, []);
  assert.match(c4.reasoning, /relies on (C1, )?C2, C3\)/);
  assert.ok(report.claims[3].needs_confirmation.includes('reasoning links'));
});

test('a document named in the claim is the only document searched', () => {
  const { report } = extractRecord(CASE);
  assert.equal(report.claims[1].citation.basis, 'explicit');
  assert.equal(report.claims[1].citation.source_id, 'S1');
  assert.equal(report.claims[2].citation.basis, 'inferred');
});

test('a citation stays inside its clause, so an unrelated "no" is not cited', () => {
  const { record } = extractRecord(CASE);
  assert.ok(!/no critical/.test(record.claims[1].citations[0].quote));
  assert.equal(status(record), 'READY_FOR_HUMAN_FINALIZATION');
});

test('a claim that turns on "but did not" keeps its whole passage', () => {
  const r = JSON.parse(readFileSync(new URL('./fixtures-partner/INV-P01.json', import.meta.url), 'utf8'));
  const { record } = extractRecord({ ...r, sources: r.sources.map(({ events, ...s }) => s), entities: undefined, claims: undefined });
  const c = record.claims.find((x) => /did not hear/.test(x.quote));
  assert.match(c.citations[0].quote, /but did not hear any insult/);
  assert.equal(status(record), 'READY_FOR_HUMAN_FINALIZATION');
});

test('an unsupported sentence is left uncited and the review holds', () => {
  const { record, report } = extractRecord({ ...CASE, text: CASE.text + ' The vendor passed an external penetration test.' });
  const last = record.claims[record.claims.length - 1];
  assert.deepEqual(last.citations, []);
  assert.ok(report.claims[report.claims.length - 1].needs_confirmation.includes('no supporting passage found'));
  assert.equal(status(record), 'HOLD');
});

test('a recommendation turned into a requirement is still flagged after extraction', () => {
  const { record } = extractRecord({
    ...CASE, record_id: 'EXT-T02',
    text: 'On 2026-06-03, Marta Lindqvist authorized Refundly Assistant to issue refunds up to 50 euros. Every refund is required to be logged.',
    sources: [{ title: 'Authorization note AN-3', text: 'On 2026-06-03, Marta Lindqvist authorized Refundly Assistant to issue refunds up to 50 euros. Logging every refund is recommended.' }],
  });
  // The check is advisory by design until validated: it is reported to the
  // reviewer but does not change the status on its own.
  const hits = runDetectionTemplates(deriveState(openReview(record, AT)));
  assert.ok(hits.some((h) => h.template === 'hedged_source_stated_firmly'));
});

test('margin notes are skipped, not treated as claims', () => {
  const { record, report } = extractRecord({ ...CASE, text: CASE.text + ' Reviewer note is attached.' });
  assert.equal(record.claims.length, 4);
  assert.equal(report.skipped_sentences[0].reason, 'annotation, not an assertion');
});

test('identifier-like personal data is refused before any review', () => {
  const { validation } = extractRecord({ ...CASE, text: CASE.text + ' Contact marta.l@example.org for questions.' });
  assert.equal(validation.status, 'REFUSED_SCOPE');
});

test('the extractor makes no network or model calls', () => {
  const src = readFileSync(new URL('../../lib/ds-n1/extract.mjs', import.meta.url), 'utf8');
  assert.ok(!/\bfetch\(|node:https?|node:net|XMLHttpRequest|anthropic|openai/i.test(src));
});

test('the fixture evaluation has no unexplained disagreement and no clean record wrongly held', () => {
  const ev = JSON.parse(readFileSync(new URL('./EXTRACT_EVAL.json', import.meta.url), 'utf8'));
  assert.deepEqual(ev.unexplained_disagreements, []);
  assert.equal(ev.status_agreement.hand_ready_extracted_hold, 0);
});

// Compound sentences (2026-11-24). Records written for this test only; never
// study records. Each half of a two-clause sentence is checked on its own.
const SPLIT_SRC = [
  { title: 'Access request AR-900', version: 'v1', text: 'On 2026-03-02, Quillon Freight requested read access to the route planning database. Session logging is required for supplier connections.' },
  { title: 'Approval EA-900', version: 'v1', text: 'On 2026-03-09, Odile Marchetti approved read access for Quillon Freight. The access ends on 2026-05-09.' },
];
const splitRun = (text) => {
  const { record, report } = extractRecord({ record_id: 'EA-900', title: 'Access exception EA-900 (fictional)', record_class: 'supplier_access_exception', text, sources: SPLIT_SRC });
  return { record, report, state: deriveState(openReview(record, { at: '2026-11-24T00:00:00Z' })) };
};

test('compound sentence: an unsupported second half is held on that half alone', () => {
  const { record, report, state } = splitRun('On 2026-03-09, Odile Marchetti approved read access for Quillon Freight, and the supplier passed a penetration test last month.');
  assert.deepEqual(record.claims.map((c) => c.quote), ['On 2026-03-09, Odile Marchetti approved read access for Quillon Freight', 'the supplier passed a penetration test last month.']);
  assert.equal(state.status, 'HOLD');
  assert.deepEqual(state.findings.map((f) => `${f.code}@${f.claim_id}`), ['UNSUPPORTED_CLAIM@C2']);
  assert.ok(report.claims.every((c) => c.needs_confirmation.includes('sentence split')));
});

test('compound sentence: a wrong date in the second half is a date mismatch on that half', () => {
  const { state } = splitRun('Quillon Freight requested read access to the route planning database on 2026-03-02; the access ends on 2026-06-09.');
  assert.deepEqual(state.findings.map((f) => `${f.code}@${f.claim_id}`), ['DATE_MISMATCH@C2']);
});

test('compound sentence: two halves supported by different documents are not held', () => {
  const { record, state } = splitRun('Quillon Freight requested read access to the route planning database on 2026-03-02; the access ends on 2026-05-09.');
  assert.equal(record.claims.length, 2);
  assert.equal(state.status, 'READY_FOR_HUMAN_FINALIZATION');
});

test('not split: lists, reasoning sentences, and halves backed by one source sentence', () => {
  assert.deepEqual(splitClauses('Logging, monitoring, and quarterly review were required for the database.'), ['Logging, monitoring, and quarterly review were required for the database.']);
  assert.equal(splitClauses('Because the assessment was completed, and the scope is limited, the exception can proceed.').length, 1);
  assert.equal(splitClauses('Ines approved the request and logged it in the register.').length, 1);
  const { record, report } = extractRecord({ record_id: 'AX-1', title: 'AX-1 (fictional)', record_class: 'supplier_access_exception',
    text: 'Sending is limited to overdue invoices for the pilot, and each batch requires human sign-off before release.',
    sources: [{ title: 'Policy P-1', version: 'v1', text: 'Sending is limited to overdue invoices for the pilot, and each batch requires human sign-off before release.' }] });
  assert.equal(record.claims.length, 1);
  assert.equal(report.split_sentences[0].kept_whole, 'all parts supported by one source sentence');
});
