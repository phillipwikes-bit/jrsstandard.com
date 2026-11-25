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

import { findDroppedAnchors } from '../../lib/ds-n1/omissions.mjs';
test('paraphrase: a writer note about the record is listed, not checked as a claim', () => {
  const { record } = run(SRC + ' The record gives no date for the final order.');
  assert.ok(!record.claims.some((c) => /gives no date/.test(c.quote)));
});
test('paraphrase: structured notes are read bullet by bullet; headings are skipped', () => {
  const notes = '# Summary\n\n- On March 3, 2021, Complainant filed a formal EEO complaint.\n- **S1:** S1 stated that she assigned the route on April 9, 2021, because of staffing.';
  const { record } = run(notes);
  assert.deepEqual(record.claims.map((c) => c.quote), ['On March 3, 2021, Complainant filed a formal EEO complaint.', 'S1 stated that she assigned the route on April 9, 2021, because of staffing.']);
});
test('paraphrase: "denial of" matches "was denied"; a negation on extra words is not a conflict', () => {
  const src = 'Complainant alleged that she was denied paid leave on August 3, 2021. S1 demanded that Complainant work twelve-hour shifts.';
  const a = run('Denial of paid leave on August 3, 2021.', src);
  assert.ok(!codes(a.st).includes('NEGATION_CONFLICT'));
  const b = run('S1 demanded that Complainant work twelve-hour shifts, which she refused.', src);
  assert.ok(!codes(b.st).includes('NEGATION_CONFLICT'));
  const c = run('S1 did not demand that Complainant work twelve-hour shifts.', src);
  assert.ok(codes(c.st).includes('NEGATION_CONFLICT'));
});
test('dropped anchors: dates and speakers the source gives but the record never mentions', () => {
  const { record } = run('Complainant filed a formal EEO complaint.');
  const got = findDroppedAnchors(record).map((x) => `${x.kind}:${x.value}`);
  assert.ok(got.includes('date:2021-03-03') && got.includes('speaker:s1'), got.join(' '));
  assert.deepEqual(findDroppedAnchors(run(SRC).record), []);
});
test('paraphrase: items listed under "Not stated in the record:" are writer notes; items under other lead-ins are claims', () => {
  const notes = '# Summary\n\nNot stated in the record:\n- Any ROI page numbers\n- The date of the final order\n\nOn the merits:\n- On March 3, 2021, Complainant filed a formal EEO complaint.';
  const { record } = run(notes);
  assert.deepEqual(record.claims.map((c) => c.quote), ['On March 3, 2021, Complainant filed a formal EEO complaint.']);
});
test('calibration: a related but unconfirmed passage is SUPPORT_NOT_CONFIRMED (review); no related passage stays UNSUPPORTED_CLAIM (critical)', () => {
  const src = 'On May 4, 2021, the station manager reviewed the overtime roster and the leave records for the route.';
  const near = run('The station manager checked the overtime roster for the route in May 2021, according to the leave clerk.', src);
  const cn = codes(near.st);
  assert.ok(!cn.includes('UNSUPPORTED_CLAIM'), cn.join(' '));
  const far = run('The cafeteria menu changed to vegetarian meals every Thursday afternoon.', src);
  assert.ok(codes(far.st).includes('UNSUPPORTED_CLAIM'));
});
