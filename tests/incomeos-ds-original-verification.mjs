// Synthetic control-model regression. This does NOT test or accept original DS-A.
import assert from 'node:assert/strict';
import '../owner/incomeos/ds-program.js';
import {inspectOwnerProduct} from '../owner/incomeos/ds-owner-inspection.mjs';
const D=globalThis.IncomeOSDSProgram,on='2026-11-08';
const copy=x=>JSON.parse(JSON.stringify(x));
let p=D.newProgram(on);
const snapshot=copy(p),plan=D.originalVerificationPlan(p);
assert.deepEqual(p,snapshot,'Preparing the SP harness must not mutate the authoritative programme');
assert.equal(plan.identity,'DS-A');
assert.equal(plan.releaseAuthorized,false);
assert.equal(plan.checks.length,18);
assert.ok(plan.checks.every(x=>x.acceptance==='NOT_ACCEPTED'&&x.execution==='NOT_EXECUTED'&&x.verification==='BLOCKED'));
assert.equal(new Set(plan.checks.map(x=>x.id)).size,18);
assert.equal(plan.checks[0].id,'SP-01');assert.equal(plan.checks.at(-1).id,'SP-18');
assert.deepEqual(inspectOwnerProduct(p).originalVerification,plan,
  'The existing Owner Desk must project the same programme verification plan');

const evidence={id:'E-CONTROL-FIXTURE',title:'Synthetic gate-control fixture, not original-product proof',level:2,
  source:'fictional control test only',date:on,assumptions:'No actual DS-A source or acceptance run',
  contradictions:'none found',informs:'Acceptance control behavior',subject:'DS-A',independent:true};
p=D.add(p,'evidence',evidence,on);
p=D.linkEvidence(p,'acceptance','SP-01',evidence.id,on);
assert.throws(()=>D.acceptCheck(p,'SP-01',on),/Authenticate original DS-A source/,
  'An independent-evidence label alone cannot accept a feature on an unrecovered original');
const forged=copy(p);forged.acceptance[0].status='ACCEPTED';
assert.throws(()=>D.validate(forged),/authenticated original source/);

p=D.linkEvidence(p,'gates','G1',evidence.id,on);
p=D.approveGate(p,'G1',{by:'OWNER',ref:'Fictional model approval, no real asset acceptance'},on);
assert.throws(()=>D.acceptCheck(p,'SP-01',on),/sourced original criterion/,
  'Even a recorded source gate cannot replace an exact sourced original criterion');
assert.throws(()=>D.recordOriginalCriterion(p,'SP-01',{text:'Fictional criterion',source:'NOT IN REPOSITORY',evidenceIds:[evidence.id]},on),/Exact original criterion/);
assert.throws(()=>D.recordOriginalCriterion(p,'SP-01',{text:'x'.repeat(10001),source:'fictional source',evidenceIds:[evidence.id]},on),/without truncation/);
p=D.recordOriginalCriterion(p,'SP-01',{text:'Fictional exact clause for control-model testing only',
  source:'Fictional source, section 1',evidenceIds:[evidence.id]},on);
const prepared=D.originalVerificationPlan(p);
assert.equal(prepared.checks[0].verification,'READY_FOR_CONTROLLED_VERIFICATION');
assert.equal(prepared.checks[0].execution,'NOT_EXECUTED');
assert.equal(prepared.checks[0].acceptance,'NOT_ACCEPTED','A prepared check is not an acceptance result');
assert.ok(prepared.checks.slice(1).every(x=>x.verification==='BLOCKED'));
assert.equal(prepared.releaseAuthorized,false);

// Malformed imports cannot silently shrink the 18-check denominator or launder
// experimental results through a changed identity, invalid evidence or gate.
for(const alter of [
  x=>x.acceptance.pop(),x=>{x.acceptance[0].id='SP-99';},
  x=>{x.acceptance[0].identity='DS-N1';},x=>{x.acceptance[0].status='PASSED';},
  x=>{x.evidence.find(e=>e.id===evidence.id).level=0;},
  x=>{x.evidence.find(e=>e.id===evidence.id).subject='DS-C';}
]){
  const bad=copy(p);alter(bad);
  assert.throws(()=>D.originalVerificationPlan(bad));
}
const seed=D.newProgram(on);
assert.equal(D.originalVerificationPlan(seed).checks.filter(x=>x.acceptance==='ACCEPTED').length,0);
console.log('PASS: all 18 original SP slots remain blocked without source and exact clause evidence; no original-product tests executed');
