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

import { openReview } from '../lib/ds-n1/index.mjs';

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

test('one programme supplies open defects, next engineering task and evidence counts without another store', () => {
  const seeded = program();
  let p = DS.add(seeded, 'defects', {
    id:'BUG-DS-SYN-01', title:'Constructed provenance edge case',
    severity:'HIGH', identity:'DS-C',
  }, '2026-11-05');
  p = DS.add(p, 'tasks', {
    id:'TASK-DS-SYN-01', title:'Check the constructed provenance fixture',
    module:'engineering', dependsOn:[], value:5, cost:1, risk:1,
  }, '2026-11-05');
  const original = structuredClone(p);
  const v = inspectProduct(p);
  assert.deepEqual(v.openDefects, [{id:'BUG-DS-SYN-01', title:'Constructed provenance edge case',
    severity:'HIGH', identity:'DS-C'}]);
  assert.equal(v.nextExecutableEngineeringTask.id,'TASK-DS-SYN-01');
  assert.equal(v.nextExecutableEngineeringTask.evidenceLinked,false);
  assert.equal(v.unresolvedEngineeringTasks,1);
  assert.deepEqual(v.programmeStudyRuns,{synthetic:0,independent:0});
  assert.equal(v.programmeEvidenceEntries,p.evidence.length);
  assert.equal(v.githubCIStatus,'NOT_CONNECTED');
  assert.equal(v.release,'NOT_AUTHORIZED');
  assert.ok(!('ledger' in v), 'private owner accounting data never enters the reviewer bridge');
  assert.deepEqual(p,original,'projection is read-only');
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


test('forged status claims cannot bypass the authoritative owner programme validator', () => {
  const p = program();
  p.acceptance[0].status = 'ACCEPTED';
  assert.throws(() => inspectProduct(p), /SP-01|accepted|evidence/i);
  assert.throws(() => startSyntheticReview(p, fixture('P01'), T0), /SP-01|accepted|evidence/i);
});

test('unsupported gate approval cannot be misrepresented as authorized product access', () => {
  const p = program();
  p.gates[0].approval = { by: 'OWNER', on: '2026-11-05', ref: 'unsupported-self-assertion' };
  assert.throws(() => inspectProduct(p), /Gate G1|approval|evidence/i);
});

test('broken programme evidence links cannot be laundered through the product runtime', () => {
  const p = program();
  p.acceptance[0].evidenceIds = ['E-NOT-PRESENT'];
  assert.throws(() => inspectProduct(p), /unknown evidence|references/i);
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


test('direct DS-N1 sessions cannot bypass the IncomeOS constructed-fictional review boundary', () => {
  const p = program();
  const external = openReview(fixture('D06'), { at:T0 });
  const fakeAction = {
    type:'request_evidence', finding_id:'SYN-NOT-ISSUED',
    at:'2026-11-05T13:31:00Z', reviewer:{reviewer_id:'rev-test-01',name:'Fictional Test Reviewer'},
    request:'Check the constructed record.',
  };
  assert.throws(() => reviewerSnapshot(p, external), /bridge-issued constructed fictional/);
  assert.throws(() => applyReviewerAction(p, external, fakeAction), /bridge-issued constructed fictional/);
  assert.throws(() => syntheticReport(p, external, '2026-11-05T13:32:00Z'), /bridge-issued constructed fictional/);
  // A JSON copy is not automatically an authorized resumed session. There is
  // currently no authenticated, durable reviewer-session restoration contract.
  const issued = startSyntheticReview(p, fixture('D06'), T0).session;
  assert.throws(() => reviewerSnapshot(p, structuredClone(issued)), /bridge-issued constructed fictional/);
});

test('issued synthetic session stays scoped to its originating IncomeOS programme', () => {
  const issuingProgramme = program();
  const unrelatedProgramme = program();
  const opened = startSyntheticReview(issuingProgramme, fixture('D06'), T0);
  assert.equal(opened.accepted, true);

  // A second, structurally valid owner programme must not take over a
  // session merely because it passes the shared programme validator.
  // JSON copying also must not grant access to a different workspace.
  const copiedProgramme = structuredClone(issuingProgramme);
  for (const foreign of [unrelatedProgramme, copiedProgramme]) {
    assert.throws(() => reviewerSnapshot(foreign, opened.session),
      /bridge-issued constructed fictional/);
    assert.throws(() => syntheticReport(foreign, opened.session, '2026-11-05T13:32:00Z'),
      /bridge-issued constructed fictional/);
    assert.throws(() => applyReviewerAction(foreign, opened.session, {
      type: 'request_evidence', finding_id: 'SYN-UNAUTHORIZED',
      at: '2026-11-05T13:31:00Z',
      reviewer: { reviewer_id: 'rev-synthetic', name: 'Fictional Test Reviewer' },
      request: 'Do not act in a different programme context.',
    }), /bridge-issued constructed fictional/);
  }
  // Issuing programme still performs the same deterministic review.
  assert.equal(reviewerSnapshot(issuingProgramme, opened.session).reviewStatus, 'HOLD');
});

test('all three bridge operations recheck synthetic scope and original history', () => {
  const p = program();
  const fakeAction = {
    type:'request_evidence', finding_id:'SYN-NOT-ACTIONABLE',
    at:'2026-11-05T13:31:00Z', reviewer:{reviewer_id:'rev-test-01',name:'Fictional Test Reviewer'},
    request:'Check the constructed record.',
  };
  const input = fixture('D06');
  const opened = startSyntheticReview(p, input, T0);
  input.data_classification = 'confidential';
  assert.equal(reviewerSnapshot(p, opened.session).reviewStatus, 'HOLD',
    'initial input is copied; later caller changes must not alter an issued session');

  opened.session.input.data_classification = 'confidential';
  for (const operation of [
    () => reviewerSnapshot(p, opened.session),
    () => applyReviewerAction(p, opened.session, fakeAction),
    () => syntheticReport(p, opened.session, '2026-11-05T13:32:00Z'),
  ]) assert.throws(operation, /constructed fictional/);

  const corrupted = startSyntheticReview(p, fixture('D06'), T0).session;
  corrupted.events[0].record_digest = 'forged';
  for (const operation of [
    () => reviewerSnapshot(p, corrupted),
    () => applyReviewerAction(p, corrupted, fakeAction),
    () => syntheticReport(p, corrupted, '2026-11-05T13:32:00Z'),
  ]) assert.throws(operation, /integrity check failed/);

  const changed = startSyntheticReview(p, fixture('D06'), T0).session;
  changed.input.record_version = 'tampered-version';
  assert.throws(() => reviewerSnapshot(p, changed), /integrity check failed/);
});
