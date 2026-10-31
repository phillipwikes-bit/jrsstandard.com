import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateIntegratedRelease,REQUIRED_PST} from '../tools/check-integrated-release-evidence.mjs';
const baseline=JSON.parse(readFileSync(new URL('../docs/program-status/INCREMENT_11_OBSERVED_EVIDENCE_SNAPSHOT_2026-10-31.json',import.meta.url)));
const copy=()=>structuredClone(baseline);
const evaluate=mutate=>{const x=copy();mutate?.(x);return evaluateIntegratedRelease(x)};
const has=(o,track,code)=>o[track].blockers.some(b=>b.code===code);
test('exactly twelve distinct PST gates required',()=>{
  assert.equal(REQUIRED_PST.length,12);
  for(const n of [0,11]){const x=copy();x.website.pst_gates.splice(n,1);assert.throws(()=>evaluateIntegratedRelease(x),/Exactly twelve/)}
});
test('duplicate and unknown PST IDs rejected',()=>{
  const x=copy();x.website.pst_gates[0].id='PST-02';
  assert.throws(()=>evaluateIntegratedRelease(x),/Duplicate/);
  const y=copy();y.website.pst_gates[0].id='PST-13';
  assert.throws(()=>evaluateIntegratedRelease(y),/unsupported/);
});
test('PR62 open and stale deployment block website',()=>{
  const o=evaluate();assert.equal(o.website.status,'HOLD');
  assert(has(o,'website','PREVIEW_SHA_MISMATCH'));
  assert(has(o,'website','UNMERGED_CANDIDATE'));
});
test('READY-like preview without gates or owner decision cannot clear release',()=>{
  const o=evaluate(x=>{x.website.preview_live_verified=true;x.website.preview_git_sha=x.website.pr_head_sha});
  assert(has(o,'website','OWNER_RELEASE_DECISION_MISSING'));
  assert(has(o,'website','GATE_NOT_PASSED'));
});
test('R9 synthetic tests and R6 hashes never authenticate original product',()=>{
  const o=evaluate();assert.equal(o.original_spellchecker.status,'NO_GO_NOT_VERIFIED');
  assert.equal(o.source_reports.r9_tests.passed,80);
  assert(has(o,'original_spellchecker','DSA_AUTHENTICITY_NOT_ESTABLISHED'));
});
test('constructed blocked demonstration is not a real H2/H3 study',()=>{
  const o=evaluate();assert(has(o,'independent_study','STUDY_NOT_CONDUCTED'));
  assert.equal(o.source_reports.simulated_156.status,'BLOCKED');
});
test('0/32 rights cannot become an authorized transfer',()=>{
  const o=evaluate();assert.equal(o.transfer.status,'NOT_AUTHORIZED');
  assert(has(o,'transfer','R6_TRANSFER_NOT_CLEARED'));
});
test('all-green statuses with no pointers are not recognized as passing',()=>{
  const o=evaluate(x=>x.website.pst_gates.slice(0,11).forEach(g=>g.status='PASS'));
  assert(has(o,'website','GATE_EVIDENCE_INCOMPLETE'));
});
test('unsupported self-reported owner approval still leaves HOLD',()=>{
  const o=evaluate(x=>x.website.owner_decision={action:'APPROVE',candidate_sha:x.website.pr_head_sha});
  assert(has(o,'website','OWNER_RELEASE_DECISION_MISSING'));
});
test('PST-12 is postrelease; predeclared watch plan required',()=>{
  const o=evaluate();assert(has(o,'website','PST12_PLAN_MISSING'));
  assert(!o.website.blockers.some(b=>b.detail.includes('PST-12: NOT_ASSESSED')));
});
test('website improvement does not clear software, study or rights',()=>{
  const o=evaluate(x=>{x.website.pr_state='closed';x.website.pr_draft=false;x.website.pr_merged=true});
  assert.equal(o.transfer.status,'NOT_AUTHORIZED');
  assert.equal(o.independent_study.status,'NOT_ESTABLISHED');
});
test('rights count outside 0..32 must error',()=>{
  assert.throws(()=>evaluate(x=>x.rights.r6_authorized=33),/rights figures/);
  assert.throws(()=>evaluate(x=>x.rights.r6_total=0),/rights figures/);
});
test('incomplete or altered schema fails closed',()=>{
  assert.throws(()=>evaluate(x=>x.schema='other'),/schema/);
  assert.throws(()=>evaluate(x=>delete x.study),/Four separate/);
});
test('no report output is a release authorization',()=>{
  assert.match(evaluate().qualification,/cannot issue a release authorization/);
});