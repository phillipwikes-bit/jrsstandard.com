// Synthetic paid-research funnel and owner-reviewed bank receipt verification.
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script,runInNewContext} from "node:vm";
const get=p=>readFileSync(resolve("owner/incomeos",p),"utf8");
const srcJ=get("financial-event-journal.js"),srcO=get("research-outcomes.js");
new Script(srcJ);new Script(srcO);
const ctx={window:{},crypto:webcrypto,Date,JSON,Array,Object,Map,Set,Math,Number,String,Uint8Array,TextEncoder,Error};
runInNewContext(srcJ,ctx);runInNewContext(srcO,ctx);
const J=ctx.window.IncomeOSEventJournal,O=ctx.window.IncomeOSResearchOutcomes;
const stamp="2026-11-01T21:30:00.000Z";
const ev=(id,type,data)=>({id,type,timestamp:stamp,data});
const bank=ev("post.study.001","POSTED",{sourceId:"bank.txn.study.001",postedDate:"2026-11-01",direction:"credit",amountCents:20000,currency:"USD",evidenceId:"bank.statement.001"});
const cl=ev("class.study.001","CLASSIFIED",{postedEventId:bank.id,classification:"earned_income",evidenceId:"classification.study.001"});
const doc=ev("doc.study.001","DOCUMENT_MATCHED",{postedEventId:bank.id,documentId:"study.payout.001",amountCents:20000});
const recon=ev("recon.study.001","OWNER_RECONCILED",{postedEventId:bank.id,classificationEventId:cl.id,reviewEvidenceId:"owner.confirm.001"});
let history=[];
for(const e of [bank,cl,doc,recon])history=await J.append(history,e);
const stage=(id,studyId,status,minutes=null,extra={})=>({id,studyId,stage:status,date:"2026-11-01",evidenceId:"owner.stage.evidence",minutes,...extra});
const events=[
  stage("stage.study.applied","study.paid.001","APPLIED",8),
  stage("stage.study.invited","study.paid.001","INVITED",0),
  stage("stage.study.completed","study.paid.001","COMPLETED",60),
  stage("stage.study.accepted","study.paid.001","ACCEPTED",0),
  stage("stage.study.paid","study.paid.001","PAID",0,{bankEventId:bank.id,payoutDocumentId:doc.data.documentId})
];
let out=await O.analyze(events,history,"2026-11-01");
assert.equal(out.ownerReviewedResearchReceiptsUsd,200);
assert.equal(out.paidStudies,1);
assert.equal(out.results[0].realizedHourlyEquivalent,176.47);
assert.equal(out.applicationsRecorded,1);
assert.equal(out.conversionRate,null);
history=history.slice(0,3);
out=await O.analyze(events,history,"2026-11-01");
assert.equal(out.ownerReviewedResearchReceiptsUsd,0,"Unreconciled payment cannot be recognized");
assert.ok(out.results[0].issues.includes("PAYMENT_EVIDENCE_INCOMPLETE"));
history=await J.append(history,recon);
const inflated=events.concat([
  stage("stage.study2.applied","study.paid.002","APPLIED",9),
  stage("stage.study2.completed","study.paid.002","COMPLETED",20),
  stage("stage.study2.accepted","study.paid.002","ACCEPTED",0),
  stage("stage.study2.paid","study.paid.002","PAID",0,{bankEventId:bank.id,payoutDocumentId:doc.data.documentId})
]);
out=await O.analyze(inflated,history,"2026-11-01");
assert.equal(out.ownerReviewedResearchReceiptsUsd,200,"One bank payment cannot fund two study claims");
assert.ok(out.results[1].issues.includes("BANK_PAYMENT_ALREADY_ATTRIBUTED"));
out=await O.analyze(events.filter(e=>e.stage!=="COMPLETED"),history,"2026-11-01");
assert.equal(out.ownerReviewedResearchReceiptsUsd,0,"Missing completed participation blocks payout");
assert.ok(out.results[0].issues.includes("INCOMPLETE_PARTICIPATION_TRAIL"));
out=await O.analyze(events.map(e=>e.stage==="APPLIED"?{...e,minutes:null}:e),history,"2026-11-01");
assert.equal(out.ownerReviewedResearchReceiptsUsd,200);
assert.equal(out.results[0].realizedHourlyEquivalent,null,"Unrecorded screening effort blocks rate");
out=await O.analyze(events.map(e=>e.stage==="PAID"?{...e,payoutDocumentId:"other.payment.document"}:e),history,"2026-11-01");
assert.equal(out.ownerReviewedResearchReceiptsUsd,0);
await assert.rejects(O.analyze([{...events[0],date:"2026-11-02"}],history,"2026-11-01"),/Future-dated/);
await assert.rejects(O.analyze([...events,{...events[0]}],history,"2026-11-01"),/Duplicate research stage identity/);
await assert.rejects(O.analyze([{...events[0],stage:"PAID",bankEventId:undefined,payoutDocumentId:undefined}],history,"2026-11-01"),/source and matching payment/);
await assert.rejects(O.analyze([{...events[0],stage:"APPLIED",secretAnswer:"private answer"}],history,"2026-11-01"),/Unexpected research record fields/);
assert.doesNotMatch(srcO,/fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage/);
console.log("IncomeOS research payment attribution QA passed: complete stages, evidence-matched payout, no bank double count, missing screening and unpaid leads.");
