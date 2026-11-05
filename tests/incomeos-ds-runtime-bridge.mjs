// Real integration tests against the imported DS-N1 source tree.
// Synthetic fixtures only. HOLDOUT-2 must never be used by this suite.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  inspectProduct, startSyntheticReview, reviewerSnapshot,
  applyReviewerAction, syntheticReport, CONTRACT_VERSION,
} from '../owner/incomeos/ds-runtime-bridge.mjs';

await import('../owner/incomeos/ds-program.js');
const DS = globalThis.IncomeOSDSProgram;
const base = dirname(fileURLToPath(import.meta.url));
const fixture = id => JSON.parse(readFileSync(join(base, 'ds-n1', 'fixtures', id + '.json'), 'utf8'));
const T0 = '2026-11-05T13:30:00Z';
const program = () => DS.newProgram('2026-11-05');

test('owner programme remains authoritative and original acceptance/release holds persist', () => {
  const p = program();
  const before = structuredClone(p);
  const view = inspectProduct(p);
  assert.equal(view.contract, CONTRACT_VERSION);
  assert.equal(view.ownerRecordSchema, 'incomeos.ds-program.v1');
  assert.equal(view.candidate, 'DS-N1');
  assert.notEqual(view.candidate, 'DS-A');
  assert.equal(view.originalSource, 'AUTHENTIC_SOURCE_NOT_RECOVERED');
  assert.deepEqual(view.originalAcceptance, {accepted:0,total:18});
  assert.equal(view.release, 'NOT_AUTHORIZED');
  assert.equal(view.customerAccess, 'NOT_AUTHORIZED');
  assert.deepEqual(p, before, 'inspection cannot mutate the owner source of truth');
});

test('synthetic review invokes existing DS-N1 engine and optional cognitive controls', () => {
  const p = program();
  const before = structuredClone(p);
  const opened = startSyntheticReview(p, fixture('D06'), T0);
  assert.equal(opened.accepted, true);
  const view = reviewerSnapshot(p, opened.session);
  assert.equal(view.candidate, 'DS-N1');
  assert.equal(view.reviewStatus, 'HOLD');
  assert.ok(view.findings.some(f => f.code === 'UNSUPPORTED_CLAIM'));
  assert.ok(view.cognitiveControls.some(x => x.finding_id));
  assert.ok(view.reflectiveGuidance.some(x => x.reflection?.[3]?.stage === 'Release'));
  assert.equal(view.finalDisposition, null);
  assert.deepEqual(p, before, 'review cannot alter programme acceptance or finances');
});

test('malformed and real-claimed input fails closed without opening a review', () => {
  const p = program();
  assert.throws(() => startSyntheticReview(p, {...fixture('P01'), data_classification:'confidential'}, T0), /constructed fictional/);
  assert.throws(() => startSyntheticReview(p, { schema:'bad', data_classification:'constructed_fictional' }, T0), /constructed fictional/);
  assert.throws(() => inspectProduct({schema:'incomeos.ds-program.v1',acceptance:[],gates:[]}), /validated/);
});

test('forged SP acceptance or unsupported gate approval is rejected across product entrypoints', () => {
  const p = program();
  const falseAcceptance = structuredClone(p);
  falseAcceptance.acceptance[0].status = 'ACCEPTED';
  assert.throws(() => inspectProduct(falseAcceptance), /without qualifying independent evidence/);
  assert.throws(() => startSyntheticReview(falseAcceptance, fixture('P01'), T0), /without qualifying independent evidence/);

  const falseApproval = structuredClone(p);
  falseApproval.gates[0].approval = {by:'OWNER', on:'2026-11-05', ref:'unverified assertion'};
  assert.throws(() => inspectProduct(falseApproval), /approval lacks.*primary evidence/);
  assert.deepEqual(p.acceptance.map(x => x.status), Array(18).fill('NOT_ACCEPTED'));
});

test('delegated human action preserves DS-N1 disposition and report logic', () => {
  const p = program();
  const opened = startSyntheticReview(p, fixture('D06'), T0);
  const first = reviewerSnapshot(p, opened.session);
  const f = first.findings.find(x => x.code === 'UNSUPPORTED_CLAIM' && x.status !== 'SUPERSEDED');
  assert.ok(f);
  const next = applyReviewerAction(p, opened.session, {
    type:'request_evidence', finding_id:f.finding_id,
    at:'2026-11-05T13:31:00Z', reviewer:{reviewer_id:'rev-test-01',name:'Fictional Test Reviewer'},
    request:'Please provide the missing source record before treating the claim as supported.',
  });
  assert.ok(next.events.length > opened.session.events.length);
  const after = reviewerSnapshot(p, next);
  assert.notEqual(after.finalDisposition, 'APPROVED');
  assert.equal(after.authenticity, 'UNSIGNED_INTERNAL_HASH_CHAIN_ONLY');
  const report = syntheticReport(p, next, '2026-11-05T13:32:00Z');
  assert.ok(report && typeof report === 'object');
});
