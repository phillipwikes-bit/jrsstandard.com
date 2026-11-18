// Sentence splitting around legal and business abbreviations (2026-11-18).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sentences } from '../../lib/ds-n1/text.mjs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';

const texts = (s) => sentences(s).map((x) => x.text);

test('a case name with "v." stays one sentence', () => {
  assert.deepEqual(texts('In Arden Logistics v. Corvo Systems, the court held X. Next.'),
    ['In Arden Logistics v. Corvo Systems, the court held X.', 'Next.']);
});

test('company, title and Latin abbreviations do not split', () => {
  assert.deepEqual(texts('Halden Freight Inc. sent it. Then Dr. Ray replied, e.g. by email. Done.'),
    ['Halden Freight Inc. sent it.', 'Then Dr. Ray replied, e.g. by email.', 'Done.']);
});

test('numbered abbreviations hold only before a number', () => {
  assert.deepEqual(texts('See case No. 5 here. Under s. 4 a controller must act.'),
    ['See case No. 5 here.', 'Under s. 4 a controller must act.']);
  assert.deepEqual(texts('The vote was no. It failed.'), ['The vote was no.', 'It failed.']);
});

test('the legal memo quotes the whole case sentence when a condition is dropped', () => {
  const r = JSON.parse(readFileSync(new URL('./fixtures-partner/MEMO-D01.json', import.meta.url), 'utf8'));
  const st = deriveState(openReview(r, { at: '2026-11-18T12:00:00Z' }));
  const f = st.findings.find((x) => x.claim_id === 'C2' && x.code === 'QUALIFICATION_OMITTED');
  assert.match(f.explanation, /"In Arden Logistics v\. Corvo Systems, the court held/);
});
