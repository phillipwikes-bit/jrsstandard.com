import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCognitiveControls } from '../../lib/ds-n1/cognitive-controls.mjs';
import { buildReflectiveGuidance, REFLECTIVE_GUIDANCE_VERSION } from '../../lib/ds-n1/reflective-guidance.mjs';
const state = () => ({
  status: 'HOLD', record: { sources: [{ source_id: 'S1', version: '1' }] },
  claims: [{ claim_id: 'C1', text: 'Approval occurred.', citations: [{ source_id: 'S1' }] }],
  findings: [{ finding_id: 'F1', claim_id: 'C1', code: 'UNSUPPORTED_CLAIM', condition: 'RC2', status: 'OPEN' }],
  events: [{ type: 'open' }],
});
const guidance = (s) => buildReflectiveGuidance(buildCognitiveControls(s)[0]);
test('bounded note is tied to existing finding and condition, not new facts', () => {
  const g = guidance(state());
  assert.equal(g.version, REFLECTIVE_GUIDANCE_VERSION);
  assert.equal(g.finding_id, 'F1');
  assert.equal(g.condition, 'RC2');
  assert.match(g.learning.explanation, /attributable source/);
  assert.match(g.learning.source_context, /S1/);
  assert.match(g.learning.source_context, /not established/);
});
test('four reflection stages never create a readiness state or automatic release', () => {
  const g = guidance(state());
  assert.deepEqual(g.reflection.map(x => x.stage), ['Restrain','Reframe','Recalibrate','Release']);
  assert.equal(g.reflection[1].prompt, buildCognitiveControls(state())[0].question);
  assert.match(g.reflection[3].prompt, /cannot approve or release/);
  assert.equal(g.changes_review_status, false);
  assert.equal(g.requires_additional_review_action, false);
  assert.equal(g.action_surface, 'existing_findings_and_actions');
});
test('guidance is deterministic and neither mutates events nor changes findings', () => {
  const s = state(), before = structuredClone(s);
  const first = guidance(s);
  assert.deepEqual(first, guidance(s));
  assert.deepEqual(s, before);
  assert.equal(s.status, 'HOLD');
});
test('unrecognized and incomplete controls receive no fabricated learning note', () => {
  assert.equal(buildReflectiveGuidance(null), null);
  assert.equal(buildReflectiveGuidance({ finding_id:'F1', question:'Why?', condition:'RCX' }), null);
  assert.equal(buildReflectiveGuidance({ finding_id:'F1', condition:'RC1', question:'' }), null);
});
test('overridden findings retain override status; guidance does not convert to ready', () => {
  const s = state(); s.findings[0].status = 'OVERRIDDEN';
  assert.equal(guidance(s).finding_status, 'OVERRIDDEN');
  assert.equal(s.status, 'HOLD');
});
test('uncited findings cannot acquire invented source identifiers', () => {
  const s = state(); s.claims[0].citations=[];
  const g = guidance(s);
  assert.match(g.learning.source_context, /No source ID/);
  assert.doesNotMatch(g.learning.source_context, /S1/);
});
