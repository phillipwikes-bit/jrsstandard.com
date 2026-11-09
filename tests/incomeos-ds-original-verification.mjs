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
const approval={by:'OWNER',ref:'Fictional model approval, no real asset acceptance'};
assert.throws(()=>D.approveGate(p,'G1',approval,on),/custody, Codebook, build reproduction and rights/,
  'One generic evidence record must not satisfy the original source gate');
const legacy=copy(p);legacy.gates[0].approval={...approval,on};
assert.equal(D.originalVerificationPlan(legacy).recordedSourceGateReady,false,
  'A historical approval with incomplete evidence stays visible and on hold');
assert.equal(D.command(legacy,null,on).gates[0].status,'BLOCKED');
const sourceSha256='1'.repeat(64),buildSha256='2'.repeat(64);
const addProof=(doc,id,kind,artifactSha256,extra={},level=2,source='fictional primary source')=>D.add(doc,'evidence',
  {...evidence,id,level,source,originalProof:{kind,artifactSha256,sourceSha256,...extra}},on);
const evidenceForGate=[['E-SOURCE','source',sourceSha256,{version:'synthetic source 1'}],
  ['E-CODEBOOK','codebook','3'.repeat(64),{version:'synthetic Codebook 1'}],
  ['E-BUILD','reproduction','4'.repeat(64),{buildSha256,outcome:'REPRODUCED'}],
  ['E-RIGHTS','rights','5'.repeat(64),{scope:'Fictional internal verification only',outcome:'VERIFICATION_AUTHORIZED'}]];
for(const row of evidenceForGate){p=addProof(p,...row);p=D.linkEvidence(p,'gates','G1',row[0],on);}
const mismatched=copy(p);mismatched.evidence.find(e=>e.id==='E-BUILD').originalProof.sourceSha256='e'.repeat(64);
assert.throws(()=>D.approveGate(mismatched,'G1',approval,on),/custody, Codebook, build reproduction and rights/);
p=D.approveGate(p,'G1',approval,on);
const substitutedBook=copy(p);substitutedBook.evidence.find(e=>e.id==='E-CODEBOOK').originalProof.artifactSha256='b'.repeat(64);
assert.equal(D.originalVerificationPlan(substitutedBook).recordedSourceGateReady,false,'Changing a Codebook digest requires fresh approval');
assert.throws(()=>D.acceptCheck(p,'SP-01',on),/sourced original criterion/,
  'Even a recorded source gate cannot replace an exact sourced original criterion');
const clause='Fictional exact clause for control-model testing only',clauseSource='Fictional source, section 1';
p=addProof(p,'E-CLAUSE','clause','6'.repeat(64),{checkId:'SP-01',clause},2,clauseSource);
assert.throws(()=>D.recordOriginalCriterion(p,'SP-01',{text:'Fictional criterion',source:'NOT IN REPOSITORY',evidenceIds:['E-CLAUSE']},on),/Exact original criterion/);
assert.throws(()=>D.recordOriginalCriterion(p,'SP-01',{text:'x'.repeat(10001),source:'fictional source',evidenceIds:['E-CLAUSE']},on),/without truncation/);
assert.throws(()=>D.recordOriginalCriterion(p,'SP-02',{text:clause,source:clauseSource,evidenceIds:['E-CLAUSE']},on),/matching original clause evidence/);
p=D.recordOriginalCriterion(p,'SP-01',{text:clause,source:clauseSource,evidenceIds:['E-CLAUSE']},on);
const prepared=D.originalVerificationPlan(p);
assert.equal(prepared.checks[0].verification,'READY_FOR_CONTROLLED_VERIFICATION');
assert.equal(prepared.checks[0].execution,'NOT_EXECUTED');
assert.equal(prepared.checks[0].recordedResultReady,false);
assert.equal(prepared.checks[0].acceptance,'NOT_ACCEPTED','A prepared check is not an acceptance result');
assert.ok(prepared.checks.slice(1).every(x=>x.verification==='BLOCKED'));
assert.equal(prepared.releaseAuthorized,false);
assert.throws(()=>D.acceptCheck(p,'SP-01',on),/independent passing execution/);
const run={checkId:'SP-01',criterionEvidenceId:'E-CLAUSE',criterionSha256:'6'.repeat(64),buildSha256,outcome:'PASS'};
const wrongBuild=D.linkEvidence(addProof(p,'E-WRONG-RUN','execution','7'.repeat(64),{...run,buildSha256:'a'.repeat(64)},1),
  'acceptance','SP-01','E-WRONG-RUN',on);
assert.throws(()=>D.acceptCheck(wrongBuild,'SP-01',on),/independent passing execution/);
const passed=D.linkEvidence(addProof(p,'E-PASS','execution','8'.repeat(64),run,1),'acceptance','SP-01','E-PASS',on);
assert.equal(D.originalVerificationPlan(passed).checks[0].recordedResultReady,true);
const adverse=addProof(passed,'E-FAIL','execution','9'.repeat(64),{...run,outcome:'FAIL'},1);
assert.equal(D.originalVerificationPlan(adverse).checks[0].recordedResultReady,false);
assert.throws(()=>D.acceptCheck(adverse,'SP-01',on),/independent passing execution/,
  'An adverse result for the same build and clause cannot be omitted by linking only the pass');
const syntheticAccepted=D.acceptCheck(passed,'SP-01',on);
assert.equal(syntheticAccepted.acceptance[0].status,'ACCEPTED');
const reopened=addProof(syntheticAccepted,'E-LATER-FAIL','execution','a'.repeat(64),{...run,outcome:'FAIL'},1);
assert.equal(reopened.acceptance[0].status,'NOT_ACCEPTED','Later adverse evidence reopens a recorded acceptance');
assert.ok(reopened.evidence.some(e=>e.id==='E-LATER-FAIL'));
assert.ok(reopened.changeLog.some(e=>e.action==='SP_ACCEPTANCE_REOPENED'));
const alteredClause=copy(syntheticAccepted);alteredClause.acceptance[0].criterion+=' edited';
assert.throws(()=>D.validate(alteredClause),/sourced original criterion/);

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
