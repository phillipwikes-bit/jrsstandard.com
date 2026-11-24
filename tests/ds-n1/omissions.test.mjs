// Omission check (2026-11-24): advisory, never changes status, and its sealed
// evaluation reproduces exactly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findOmissions } from '../../lib/ds-n1/omissions.mjs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';

const fx = (d, f) => JSON.parse(readFileSync(new URL(`./${d}/${f}`, import.meta.url), 'utf8'));

test('a favourable "no high-risk findings" is not read as an adverse finding', () => {
  const rec = fx('fixtures', 'P01.json');
  assert.deepEqual(findOmissions(rec), []);
});

test('no flags on the sound developer records; flags on the planted omissions', () => {
  const sound = ['P01', 'P02', 'P03', 'P04', 'P05'].map((id) => fx('fixtures', `${id}.json`))
    .concat(['AUTH-P01', 'DISC-P01', 'INV-P01', 'MEMO-P01'].map((id) => fx('fixtures-partner', `${id}.json`)));
  for (const r of sound) assert.deepEqual(findOmissions(r), [], r.record_id);
  assert.equal(findOmissions(fx('fixtures', 'D11.json')).length, 1);
  assert.equal(findOmissions(fx('fixtures-partner', 'AUTH-D01.json')).length, 2);
});

test('advisory only: running it does not change the review status or findings', () => {
  const rec = fx('fixtures-partner', 'AUTH-D01.json');
  const before = JSON.stringify(deriveState(openReview(rec, { at: '2026-11-24T00:00:00Z' })).findings);
  const hits = findOmissions(rec);
  assert.ok(hits.every((h) => h.changes_review_status === false && h.mode === 'advisory'));
  assert.equal(JSON.stringify(deriveState(openReview(rec, { at: '2026-11-24T00:00:00Z' })).findings), before);
});

test('sealed evaluation set reproduces the committed result', () => {
  const script = fileURLToPath(new URL('./eval-omissions.mjs', import.meta.url));
  const now = JSON.parse(execFileSync(process.execPath, [script], { encoding: 'utf8' }));
  const committed = fx('.', 'OMISSION_EVAL.json');
  assert.deepEqual(now, committed);
  assert.equal(committed.caught.n + committed.false_flags_on_sound_records.n, 8);
});
