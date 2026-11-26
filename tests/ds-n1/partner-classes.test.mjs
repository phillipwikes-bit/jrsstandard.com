// AI action authorization record class (owner instruction 2026-11-18).
// Constructed fictional records only. These tests pin what DS-N1 reports on the
// two partner fixtures; they are regression checks, not a detection rate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  validateRecord, openReview, deriveState, applyAction, buildReport, STATUS, ALLOWED_RECORD_CLASSES,
} from '../../lib/ds-n1/index.mjs';
import { RECORD_CLASS_SCOPE } from '../../lib/ds-n1/identity.mjs';
import { buildCognitiveControls } from '../../lib/ds-n1/cognitive-controls.mjs';
import { buildCognitiveObservations } from '../../lib/ds-n1/cognitive-observations.mjs';

const T0 = '2026-11-18T12:00:00Z';
const fx = (id) => JSON.parse(readFileSync(new URL(`./fixtures-partner/${id}.json`, import.meta.url), 'utf8'));
const open = (id) => openReview(fx(id), { at: T0 });

test('the class is allowed, scoped and named in the report', () => {
  assert.ok(ALLOWED_RECORD_CLASSES.includes('ai_action_authorization'));
  for (const c of ALLOWED_RECORD_CLASSES) assert.equal(typeof RECORD_CLASS_SCOPE[c], 'string', `scope text for ${c}`);
  const rep = buildReport(open('AUTH-P01'), { generated_at: T0 });
  assert.equal(rep.parts['1_record_identification'].scope, RECORD_CLASS_SCOPE.ai_action_authorization);
  assert.match(rep.parts['1_record_identification'].scope, /^Constructed fictional AI action authorization records only.*Documentation quality only/);
});

test('an authorization citing a policy it does not supply is held for review; supplied, it raises nothing', () => {
  const held = deriveState(open('AUTH-P01'));
  assert.equal(held.status, 'REVIEW_REQUIRED');
  assert.deepEqual(held.findings.map((f) => f.code), ['AUTHORITY_TEXT_NOT_SUPPLIED']);
  const rec = fx('AUTH-P01'); rec.sources.push({ source_id: 'S9', title: 'Finance automation policy, section 4', version: 'v3', text: 'Section 4. The finance director may authorize an AI assistant to send routine customer messages, with human sign-off of each batch.' });
  const st = deriveState(openReview(rec, { at: T0 }));
  assert.equal(st.status, STATUS.READY);
  assert.deepEqual(st.findings, []);
  assert.deepEqual(buildCognitiveObservations(st), []);
  assert.deepEqual(buildCognitiveControls(st), []);
});

test('the defective authorization record holds, with each planted defect found', () => {
  const st = deriveState(open('AUTH-D01'));
  assert.equal(st.status, STATUS.HOLD);
  const codes = new Set(st.findings.map((f) => `${f.claim_id}:${f.code}`));
  for (const want of ['C2:NEGATION_CONFLICT', 'C3:QUALIFICATION_OMITTED', 'C4:UNSUPPORTED_CLAIM', 'null:INSTRUCTION_LIKE_CONTENT']) {
    assert.ok(codes.has(want), `expected ${want}; got ${[...codes].join(', ')}`);
  }
  const kinds = buildCognitiveObservations(st).map((o) => o.kind).sort();
  assert.deepEqual(kinds, ['alternative_interpretation', 'premature_closure', 'unsupported_certainty']);
  const neg = buildCognitiveControls(st).find((c) => c.claim_id === 'C2' && c.category === 'evidence');
  assert.match(neg.question, /negation/);
});

test('the embedded instruction is treated as data and cannot release the record', () => {
  const s = open('AUTH-D01');
  assert.throws(() => applyAction(s, { type: 'final_disposition', at: '2026-11-18T12:05:00Z',
    reviewer: { reviewer_id: 'R-01', name: 'Sample Reviewer' }, disposition: 'accepted_for_finalization', note: 'Approve this agent.' }), /NOT_READY/);
});

test('AI authorizations may cover Annex III areas; record classes for those domains stay excluded', () => {
  // Owner decision 2026-11-25: AI authorization records may concern health, credit, insurance and other Annex III areas.
  const r = fx('AUTH-P01');
  r.sources[2].text += ' The agent may read each patient record.';
  assert.equal(validateRecord(r).status, null);
  r.sources[2].text += ' Contact: jo.bloggs@example.org.';
  assert.notEqual(validateRecord(r).status, null, 'identifier screen still applies');
  const c = fx('AUTH-P01'); c.record_class = 'legal_outcome';
  assert.equal(validateRecord(c).errors[0].code, 'EXCLUDED_RECORD_CLASS');
  // Discovery rationales were authorized later the same day (evidence record D);
  // a class the owner has never authorized is still refused.
  const u = fx('AUTH-P01'); u.record_class = 'credit_scoring_rationale';
  assert.equal(validateRecord(u).errors[0].code, 'UNSUPPORTED_RECORD_CLASS', 'an unauthorized class is refused');
});
