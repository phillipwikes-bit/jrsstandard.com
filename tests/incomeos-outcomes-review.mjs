// Synthetic-only regression checks for the review of research-outcomes.js, outcome-reconciliation.js and decision-engine.js.
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const read=p=>readFileSync("owner/incomeos/"+p,"utf8");
const ctx={window:{},crypto:webcrypto,Date,JSON,Array,Object,Map,Set,Math,Number,String,Uint8Array,TextEncoder,Error};
runInNewContext(read("financial-event-journal.js"),ctx);runInNewContext(read("research-outcomes.js"),ctx);
const J=ctx.window.IncomeOSEventJournal,O=ctx.window.IncomeOSResearchOutcomes;
async function journal(postedDate){
  const t=postedDate+"T21:30:00.000Z",ev=(id,type,data)=>({id,type,timestamp:t,data});
  let h=[];for(const e of [ev("post.s1","POSTED",{sourceId:"bank.s1",postedDate,direction:"credit",amountCents:20000,currency:"USD",evidenceId:"bank.statement.1"}),
    ev("class.s1","CLASSIFIED",{postedEventId:"post.s1",classification:"earned_income",evidenceId:"owner.class.1"}),
    ev("doc.s1","DOCUMENT_MATCHED",{postedEventId:"post.s1",documentId:"study.payout.1",amountCents:20000}),
    ev("recon.s1","OWNER_RECONCILED",{postedEventId:"post.s1",classificationEventId:"class.s1",reviewEvidenceId:"owner.review.1"})])h=await J.append(h,e);
  return h;}
const stage=(id,study,s,date,minutes=null,extra={})=>({id,studyId:study,stage:s,date,evidenceId:"owner.stage.evidence",minutes,...extra});
const trail=(study,date,pfx="")=>[stage(pfx+"st.a",study,"APPLIED",date,10),stage(pfx+"st.c",study,"COMPLETED",date,50),stage(pfx+"st.ac",study,"ACCEPTED",date,0),
  stage(pfx+"st.p",study,"PAID",date,0,{bankEventId:"post.s1",payoutDocumentId:"study.payout.1"})];

// R13-1: a payout posted after the as-of date does not count.
{const r=await O.analyze(trail("study.one","2026-10-30"),await journal("2026-11-03"),"2026-10-31");
 assert.equal(r.ownerReviewedResearchReceiptsUsd,0);assert.ok(r.results[0].issues.includes("PAYMENT_POSTED_AFTER_AS_OF"));}
// R13-2: a payout posted before the study was completed is not its payment.
{const r=await O.analyze(trail("study.two","2026-09-20"),await journal("2026-03-01"),"2026-10-31");
 assert.equal(r.ownerReviewedResearchReceiptsUsd,0);assert.ok(r.results[0].issues.includes("PAYMENT_PRECEDES_PARTICIPATION"));}
// R13-3: a payment claimed by two studies is held for both, in either input order.
{const j=await journal("2026-10-01"),a=trail("study.a","2026-09-20","a."),b=trail("study.b","2026-09-20","b.");
 for(const rows of [a.concat(b),b.concat(a)]){const r=await O.analyze(rows,j,"2026-10-31");assert.equal(r.ownerReviewedResearchReceiptsUsd,0);
   assert.ok(r.results.every(x=>x.issues.includes("BANK_PAYMENT_ALREADY_ATTRIBUTED")));}}
// R13-6: blank effort is unknown, not zero.
{const rows=trail("study.e","2026-09-20").map(x=>x.stage==="APPLIED"||x.stage==="COMPLETED"?{...x,minutes:""}:x);
 const r=await O.analyze(rows,await journal("2026-10-01"),"2026-10-31");assert.equal(r.results[0].effortMinutes,null);
 assert.throws(()=>O.validateRows([{...rows[0],minutes:true}]),/Invalid reported effort/);}
// R13-10: a missing stage is reported once, not also as an order problem.
{const rows=trail("study.m","2026-09-20").filter(x=>x.stage!=="ACCEPTED");
 const r=await O.analyze(rows,await journal("2026-10-01"),"2026-10-31");
 assert.ok(r.results[0].issues.includes("INCOMPLETE_PARTICIPATION_TRAIL"));assert.ok(!r.results[0].issues.includes("INVALID_PARTICIPATION_ORDER"));}

const rc={window:{}};runInNewContext(read("outcome-reconciliation.js"),rc);const R=rc.window.IncomeOSOutcomeReconciliation;
const entry=(id,currency="USD",direction="credit")=>({id,accountId:"acct-a",amountCents:10000,posted:true,sourceVerified:true,currency,institutionId:"bank-a",postedDate:"2026-11-01",direction});
const outcome=(id,currency="USD")=>({statementEntryId:id,accountId:"acct-a",amountCents:10000,type:"EARNED_INCOME",currency,institutionId:"bank-a",postedDate:"2026-11-01"});
// R13-4: different currencies are held, not summed.
{const r=R.reconcile([outcome("t1"),outcome("t2","EUR")],[entry("t1"),entry("t2","EUR")]);assert.equal(r.status,"HOLD");assert.ok(r.issues.some(i=>i.code==="MIXED_CURRENCIES"));}
// R13-5: a debit cannot reconcile as income.
{const r=R.reconcile([outcome("t3")],[entry("t3","USD","debit")]);assert.equal(r.status,"HOLD");assert.ok(r.issues.some(i=>i.code==="ENTRY_NOT_A_CREDIT"));}
// R13-9: the invalid-input result carries the same fail-closed fields.
assert.equal(R.reconcile(null,[]).availableToInvestCents,null);

const dc={window:{},Date,Math,Number,String,Array,Object,JSON,Error,RangeError};runInNewContext(read("decision-engine.js"),dc);const D=dc.window.IncomeOSDecisionEngine;
const base={initial:1000,monthly:0,years:1,annualReturnPct:0,annualFeePct:0,taxDragPct:0,inflationPct:0};
// R13-7: whitespace and booleans are not entered numbers.
assert.throws(()=>D.scenario({...base,initial:"  "}),/required/);
assert.throws(()=>D.scenario({...base,initial:true}),/must be a number/);
// R13-8: an invalid source-age limit holds the review instead of throwing.
{const r=D.review({id:"a1",sourceUrl:"https://example.org/x",reviewed:"2026-11-01"},{},{today:"2026-11-01",maxAgeDays:400});
 assert.equal(r.status,"HOLD");assert.ok(r.reasons.some(x=>/age limit is invalid/.test(x)));}
console.log("IncomeOS outcomes review checks passed (10 findings: 9 fixed in full, 1 partly; double journal verification rejected).");
