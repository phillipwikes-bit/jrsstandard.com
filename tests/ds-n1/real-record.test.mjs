import test from 'node:test';
import assert from 'node:assert/strict';
import { extractRecord } from '../../lib/ds-n1/extract.mjs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';
import { sentences } from '../../lib/ds-n1/text.mjs';

// Constructed text in the style of a published appellate decision (no real case).
const SRC = 'On March 3, 2021, Complainant filed a formal EEO complaint. S1 stated that she assigned the route on April 9, 2021, because of staffing. Complainant alleged that S2 followed her around the office. S2 denied that he followed her around the office. Consequently, the Investigator completed the investigation using the formal complaint. See ROI at 100. The training ran from 8:00 a.m. until noon on May 4, 2021, at the station.';
function run(text, src = SRC) {
  const { record, validation } = extractRecord({ record_id: 'RR-1', title: 'RR-1', record_class: 'workplace_investigation_report', data_classification: 'public_record_test', text, sources: [{ source_id: 'SRC', title: 'Decision', text: src, version: 'v1' }] });
  assert.ok(!validation.status, JSON.stringify(validation.errors));
  return { record, st: deriveState(openReview(record, { at: '2026-11-25T00:00:00Z' })) };
}
const codes = (st) => st.findings.filter((f) => f.status === 'OPEN').map((f) => f.code);

test('a record identical to its source decision reaches READY', () => {
  const { st } = run(SRC);
  assert.deepEqual(codes(st), []);
  assert.equal(st.status, 'READY_FOR_HUMAN_FINALIZATION');
});
test('a dropped date is raised as DATE_OMITTED', () => {
  const { st } = run(SRC.replace('On March 3, 2021, Complainant', 'Complainant'));
  assert.ok(codes(st).includes('DATE_OMITTED'));
});
test('a dropped speaker is raised as SPEAKER_OMITTED, without keying on the replacement words', () => {
  for (const who of ['an individual', 'someone', 'a witness']) {
    const { st } = run(SRC.replace('S1 stated that she', `${who} stated that she`));
    assert.ok(codes(st).includes('SPEAKER_OMITTED'), who);
  }
});
test('a wrong date is a date mismatch, not also a dropped date', () => {
  const { st } = run(SRC.replace('On March 3, 2021', 'On March 5, 2021'));
  assert.ok(!codes(st).includes('DATE_OMITTED'));
});
test('a conclusion the source states word for word is cited, not held', () => {
  const { record } = run(SRC);
  const c = record.claims.find((x) => x.quote.startsWith('Consequently'));
  assert.equal(c.kind, 'conclusion'); assert.equal(c.citations.length, 1);
});
test('a conclusion with no source and no reasoning is still held', () => {
  const { st } = run(SRC + ' Consequently, management acted lawfully in every respect throughout.');
  assert.ok(codes(st).includes('UNSUPPORTED_CLAIM'));
});
test('"a.m." followed by a lower-case word does not end the sentence; pin-cites are not claims', () => {
  assert.equal(sentences('It ran from 8:00 a.m. until noon. Next.').length, 2);
  const { record } = run(SRC);
  assert.ok(!record.claims.some((c) => /^See ROI/.test(c.quote)));
});
test('a repeated sentence is anchored to each of its occurrences', () => {
  const twice = SRC + ' S2 denied that he followed her around the office.';
  const { record, st } = run(twice);
  const dup = record.claims.filter((c) => c.quote.startsWith('S2 denied'));
  assert.deepEqual(dup.map((c) => c.occurrence), [0, 1]);
  assert.ok(!codes(st).includes('CLAIM_LOCATION_AMBIGUOUS'));
});
test('policy check: reliance on an unsupplied policy is still raised; a report that something was not done under it is not', () => {
  const relies = run(SRC + ' Access was granted in accordance with the remote work policy for the station.');
  assert.ok(codes(relies.st).includes('AUTHORITY_TEXT_NOT_SUPPLIED'));
  const notDone = run(SRC + ' Complainant alleged that the review was not conducted in accordance with Agency policy.');
  assert.ok(!codes(notDone.st).includes('AUTHORITY_TEXT_NOT_SUPPLIED'));
});
