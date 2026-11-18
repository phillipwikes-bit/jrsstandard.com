// Negation scope (2026-11-18). The polarity check reads the whole source clause
// that holds the quote, so a "not" just after the quoted words is caught, while
// a separate trailing clause is still ignored. Constructed fictional input.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';

const T0 = '2026-11-18T12:00:00Z';
const p01 = () => JSON.parse(readFileSync(new URL('./fixtures/P01.json', import.meta.url), 'utf8'));
const codesFor = (r, id) => deriveState(openReview(r, { at: T0 })).findings.filter((f) => f.claim_id === id).map((f) => f.code);

test('a negation just after the quoted words is caught', () => {
  const r = p01();
  r.sources[1].text = 'Assessment VSA-88. The vendor security assessment by Northwind Analytics was not completed on 2026-09-15. The assessment was submitted for approval on 2026-09-16.';
  r.claims[1].citations = [{ source_id: 'S2', quote: 'The vendor security assessment by Northwind Analytics' }];
  assert.ok(codesFor(r, 'C2').includes('NEGATION_CONFLICT'));
});

test('a negation just before the quoted words is still caught', () => {
  const r = p01();
  r.sources[1].text = 'Assessment VSA-88. Northwind Analytics did not complete the vendor security assessment by 2026-09-15. The assessment was submitted for approval on 2026-09-16.';
  r.claims[1].citations = [{ source_id: 'S2', quote: 'complete the vendor security assessment' }];
  assert.ok(codesFor(r, 'C2').includes('NEGATION_CONFLICT'));
});

test('a negation in a separate trailing clause is not misread', () => {
  // P01 unchanged: "...on 2026-09-15, with no high-risk findings."
  assert.ok(!codesFor(p01(), 'C2').includes('NEGATION_CONFLICT'));
});

test('a negation in a later clause after a semicolon is not misread', () => {
  const r = p01();
  r.sources[1].text = 'Assessment VSA-88. Northwind Analytics completed the vendor security assessment on 2026-09-15; no exceptions were raised. The assessment was submitted for approval on 2026-09-16.';
  assert.ok(!codesFor(r, 'C2').includes('NEGATION_CONFLICT'));
});
