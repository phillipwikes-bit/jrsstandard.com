import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCognitivePanel, COGNITIVE_PANEL_SCHEMA } from '../../lib/ds-n1/cognitive-controls.mjs';

const base = () => ({
  record: { record_id: 'fictional-only' },
  status: 'HOLD',
  findings: [
    { finding_id: 'F-1', claim_id: 'C1', source_id: 'S1', record_span: { start: 5, end: 12 }, source_span: { start: 1, end: 9 }, code: 'UNSUPPORTED_CLAIM', condition: 'RC2', severity: 'critical', status: 'OPEN' },
    { finding_id: 'F-2', claim_id: 'C2', source_id: 'S2', code: 'CONTRARY_CLAUSE_OMITTED', condition: 'RC5', severity: 'review', status: 'OVERRIDDEN' },
    { finding_id: 'F-3', claim_id: 'C2', source_id: 'S2', code: 'SOURCE_MISSING', condition: 'RC2', severity: 'critical', status: 'SUPERSEDED' },
    { finding_id: 'F-4', claim_id: null, source_id: null, code: 'INSTRUCTION_LIKE_CONTENT', condition: 'RC1', severity: 'review', status: 'OPEN' },
  ],
  events: [{ type: 'open' }],
});

test('read-only, deterministic projection of grounded findings and offsets', () => {
  const s = base();
  const before = structuredClone(s);
  const a = buildCognitivePanel(s);
  assert.equal(a.schema, COGNITIVE_PANEL_SCHEMA);
  assert.equal(a.candidate, 'DS-N1');
  assert.equal(a.changes_review_status, false);
  assert.deepEqual(s, before);
  assert.deepEqual(a, buildCognitivePanel(s));
  assert.deepEqual(a.items.map((x) => x.finding_id), ['F-1', 'F-2', 'F-4']);
  assert.deepEqual(a.items[0].record_span, { start: 5, end: 12 });
  assert.equal(a.items[0].source_id, 'S1');
  assert.equal(a.items[1].status, 'OVERRIDDEN');
  assert.deepEqual(s.events, [{ type: 'open' }]);
});

test('claim filter does not discard global review state or invent prompts', () => {
  const p = buildCognitivePanel(base(), { claimId: 'C2' });
  assert.deepEqual(p.items.map((x) => x.finding_id), ['F-2']);
  assert.match(p.items[0].question, /conflicting or qualifying information/);
});

test('does not manufacture findings, infer bias or claim AI authorship', () => {
  const s = base(); s.findings = [
    { finding_id: 'unknown', code: 'UNRECOGNISED', status: 'OPEN' },
    { finding_id: 'superseded', code: 'UNSUPPORTED_CLAIM', status: 'SUPERSEDED' },
  ];
  assert.equal(buildCognitivePanel(s).items.length, 0);
  const p = buildCognitivePanel(base());
  assert.match(p.limitation, /do not diagnose cognitive bias/);
  assert.match(p.limitation, /identify AI authorship/);
  assert.equal(p.items[2].lens_id, 'AI_ASSISTED_REVIEW');
  assert.doesNotMatch(p.items[2].question, /was (written|generated) by AI/);
});

test('refused, incomplete and invalid review states do not yield usable prompts', () => {
  assert.equal(buildCognitivePanel({ status: 'ERROR', findings: base().findings }).items.length, 0);
  assert.equal(buildCognitivePanel({ record: { record_id: 'r' }, findings: null }).items.length, 0);
  const s = base(); s.findings = [];
  assert.equal(buildCognitivePanel(s).items.length, 0);
});

test('SP-13 educational note is limited to the existing condition and cannot claim calibration', () => {
  const item = buildCognitivePanel(base()).items[0];
  assert.equal(item.condition, 'RC2');
  assert.match(item.learning_note, /identifiable basis/i);
  assert.doesNotMatch(item.learning_note, /certif|validated|bias reduction/i);
});

test('SP-14 reflection has four bounded stages and no release authorization', () => {
  const a = buildCognitivePanel(base()).items[0];
  assert.deepEqual(a.reflection.map((step) => step.stage), ['Restrain', 'Reframe', 'Recalibrate', 'Release']);
  assert.equal(a.reflection[1].prompt, a.question);
  assert.match(a.reflection[3].prompt, /does not approve/);
  assert.equal(Object.keys(a).includes('approval'), false);
});
