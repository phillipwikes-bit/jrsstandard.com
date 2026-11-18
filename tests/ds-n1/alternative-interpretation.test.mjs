// Alternative-interpretation lens (2026-11-18). Read-only: it asks whether the
// cited source supports another reading, and names no alternative fact.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { openReview, deriveState, STATUS } from '../../lib/ds-n1/index.mjs';
import { buildCognitiveObservations } from '../../lib/ds-n1/cognitive-observations.mjs';

const T0 = '2026-11-18T12:00:00Z';
const fx = (dir, id) => JSON.parse(readFileSync(new URL(`./${dir}/${id}.json`, import.meta.url), 'utf8'));
const alt = (r) => {
  const st = deriveState(openReview(r, { at: T0 }));
  return { st, obs: buildCognitiveObservations(st).filter((o) => o.kind === 'alternative_interpretation') };
};

test('fires for a subject mismatch, linked only to findings that exist', () => {
  const { st, obs } = alt(fx('fixtures', 'D02'));
  assert.equal(obs.length, 1);
  assert.match(obs[0].concern, /SUBJECT_MISMATCH/);
  const ids = new Set(st.findings.map((f) => f.finding_id));
  assert.ok(obs[0].related_findings.every((id) => ids.has(id)));
  assert.equal(obs[0].changes_review_status, false);
});

test('fires for an event-role confusion in an AI authorization record', () => {
  const { obs } = alt(fx('fixtures-partner', 'AUTH-D01'));
  assert.deepEqual(obs.map((o) => o.claim_id), ['C2']);
  assert.match(obs[0].question, /other reading/);
});

test('does not fire on supported records or on unrelated findings', () => {
  for (const id of ['P01', 'P02', 'P03', 'P04', 'P05']) assert.deepEqual(alt(fx('fixtures', id)).obs, [], id);
  assert.deepEqual(alt(fx('fixtures-partner', 'AUTH-P01')).obs, []);
  assert.deepEqual(alt(fx('fixtures', 'D11')).obs, [], 'a dropped qualification is not an alternative reading');
});

test('never changes the review and never supplies a fact', () => {
  const r = fx('fixtures', 'D05');
  const before = deriveState(openReview(r, { at: T0 }));
  const { st, obs } = alt(r);
  assert.equal(st.status, before.status);
  assert.equal(st.status, STATUS.HOLD);
  for (const o of obs) {
    assert.equal(o.passage, st.claims.find((c) => c.claim_id === o.claim_id).text);
    assert.doesNotMatch(o.question + o.concern, /\d{4}-\d{2}-\d{2}/, 'no date or fact is proposed');
  }
});
