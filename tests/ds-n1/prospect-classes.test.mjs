// Investigation, discovery and legal-memo record classes (owner instruction
// 2026-11-18, evidence record D). Constructed fictional records only. These pin
// what DS-N1 reports on six fixtures; they are regression checks, not a rate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateRecord, openReview, deriveState, buildReport, STATUS } from '../../lib/ds-n1/index.mjs';
import { RECORD_CLASS_SCOPE, DOMAIN_PERMITTED_BY_CLASS } from '../../lib/ds-n1/identity.mjs';
import { buildCognitiveObservations } from '../../lib/ds-n1/cognitive-observations.mjs';

const T0 = '2026-11-18T12:00:00Z';
const fx = (id) => JSON.parse(readFileSync(new URL(`./fixtures-partner/${id}.json`, import.meta.url), 'utf8'));
const state = (r) => deriveState(openReview(r, { at: T0 }));
const has = (st, want) => {
  const got = new Set(st.findings.map((f) => `${f.claim_id}:${f.code}`));
  for (const w of want) assert.ok(got.has(w), `expected ${w}; got ${[...got].join(', ')}`);
};

const CASES = [
  ['INV', 'workplace_investigation_report', ['C1:DATE_MISMATCH', 'C2:CONTRARY_CLAUSE_OMITTED', 'C5:NEGATION_CONFLICT', 'C4:UNSUPPORTED_CLAIM']],
  ['DISC', 'discovery_production_rationale', ['C1:DATE_MISMATCH', 'C2:QUOTE_NOT_FOUND', 'C5:NEGATION_CONFLICT', 'C4:UNSUPPORTED_CLAIM', 'null:INSTRUCTION_LIKE_CONTENT']],
  ['MEMO', 'ai_drafted_legal_memo', ['C1:QUALIFICATION_OMITTED', 'C2:QUALIFICATION_OMITTED', 'C5:SOURCE_MISSING', 'C4:UNSUPPORTED_CLAIM']],
];

for (const [p, cls, want] of CASES) {
  test(`${cls}: supported record raises nothing; scope states documentation quality only`, () => {
    const r = fx(`${p}-P01`);
    assert.equal(r.record_class, cls);
    const st = state(r);
    assert.equal(st.status, STATUS.READY);
    assert.deepEqual(st.findings, []);
    assert.deepEqual(buildCognitiveObservations(st), []);
    const scope = buildReport(openReview(r, { at: T0 }), { generated_at: T0 }).parts['1_record_identification'].scope;
    assert.equal(scope, RECORD_CLASS_SCOPE[cls]);
    assert.match(scope, /Documentation quality only/);
  });
  test(`${cls}: defective record holds with each planted defect found`, () => {
    const st = state(fx(`${p}-D01`));
    assert.equal(st.status, STATUS.HOLD);
    has(st, want);
    const kinds = new Set(buildCognitiveObservations(st).map((o) => o.kind));
    assert.ok(kinds.has('unsupported_certainty') && kinds.has('premature_closure'));
  });
}

test('employment wording is permitted in investigation reports and AI authorizations only (owner decision 2026-11-25)', () => {
  assert.deepEqual(Object.keys(DOMAIN_PERMITTED_BY_CLASS), ['workplace_investigation_report', 'ai_action_authorization']);
  const inv = fx('INV-P01');
  inv.sources[0].text += ' A grievance hearing was scheduled.';
  assert.equal(validateRecord(inv).status, null);
  const auth = fx('AUTH-P01');
  auth.sources[0].text += ' A grievance hearing was scheduled.';
  assert.equal(validateRecord(auth).status, null);
  const disc = fx('DISC-P01');
  disc.sources[0].text += ' A grievance hearing was scheduled.';
  assert.equal(validateRecord(disc).errors[0].code, 'EXCLUDED_DOMAIN_CONTENT');
});

test('every other excluded domain is still refused in the new classes', () => {
  const inv = fx('INV-P01'); inv.sources[1].text += ' The witness described a clinical diagnosis.';
  assert.equal(validateRecord(inv).errors[0].code, 'EXCLUDED_DOMAIN_CONTENT');
  const memo = fx('MEMO-P01'); memo.sources[1].text += ' The jury returned a verdict.';
  assert.equal(validateRecord(memo).errors[0].code, 'EXCLUDED_DOMAIN_CONTENT');
  const disc = fx('DISC-P01'); disc.record_class = 'employment';
  assert.equal(validateRecord(disc).errors[0].code, 'EXCLUDED_RECORD_CLASS');
});

test('the made-up case citation is reported as having no source in the record', () => {
  const st = state(fx('MEMO-D01'));
  const f = st.findings.find((x) => x.claim_id === 'C5' && x.code === 'SOURCE_MISSING');
  assert.ok(f, 'a citation to a source absent from the record must be flagged');
  assert.equal(f.severity, 'critical');
});
