// Synthetic-only regression checks for the review of accounting-controls.js, financial-value.js and economic-outcomes.js.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {webcrypto} from "node:crypto";
import {runInNewContext} from "node:vm";
const read=p=>readFileSync("owner/incomeos/"+p,"utf8");
const ctx={window:{},Date,Number,Map,Set,Array,Math,String,Object,JSON,Error};
runInNewContext(read("accounting-controls.js"),ctx);
const E=ctx.window.IncomeOSAccountingControls;
const ref=(id,accountToken="card-last4-3321")=>({institution:"Demo Bank",accountToken,transactionId:id});
const bank=(id,date,amountUsd,direction="debit",acct)=>({...ref(id,acct),date,amountUsd,direction,posted:true,currency:"USD",description:"Synthetic"});
const income=(id,date,grossUsd,feesUsd,status="paid")=>({id,kind:"income",scope:"income",category:"research",date,grossUsd,feesUsd,status,payer:"Synthetic",reconciled:true,bankSource:ref("source-"+id),reference:"doc-"+id});
const cost=(id,date,amountUsd,extra={})=>({id,kind:"outflow",type:"expense",category:"software",date,amountUsd,businessUse:null,payer:"Synthetic",evidenceStatus:"both",reconciled:true,bankSource:ref("source-"+id),reference:"inv-"+id,...extra});
const coverage=[{institution:"Demo Bank",accountToken:"card-last4-3321",from:"2026-01-01",through:"2026-11-30",complete:true,sourceVerified:true}];
const codes=r=>r.issues.map(x=>x.code);

// R11-1: a refund recorded on the cost form is accepted as a credit, not rejected as invalid.
{const r=E.analyze([cost("rf1","2026-10-05",20,{type:"refund"})],[bank("source-rf1","2026-10-05",20,"credit")],coverage);
 assert.ok(!codes(r).includes("INVALID_LEDGER"),codes(r).join());assert.equal(r.matches[0].state,"OWNER_REVIEWED_BANK_MATCH");
 assert.ok(codes(r).includes("REFUND_NOT_NETTED"));}
// R11-2: a source ID with contradictory values cannot be matched as evidence.
{const r=E.analyze([cost("c2","2026-10-05",100)],[bank("source-c2","2026-10-05",100),bank("source-c2","2026-10-05",900)],coverage);
 assert.equal(r.ledger.ownerReviewedBankMatches,0);assert.ok(codes(r).includes("CONFLICTING_SOURCE_ID"));}
// R11-3: a pending entry carrying the same bank link does not turn the paid entry into a conflict.
{const r=E.analyze([income("p3","2026-10-05",50,0,"pending"),{...income("x3","2026-10-05",50,0),bankSource:ref("source-p3")}],[bank("source-p3","2026-10-05",50,"credit")],coverage);
 assert.ok(!codes(r).includes("BANK_LINK_COLLISION"),codes(r).join());assert.equal(r.closeGate.status,"READY_FOR_ADDITIONAL_ACCOUNTANT_REVIEW");}
// R11-4: one collision is reported once.
{const r=E.analyze([cost("a4","2026-10-05",30),{...cost("b4","2026-10-05",30),bankSource:ref("source-a4")}],[bank("source-a4","2026-10-05",30)],coverage);
 assert.equal(codes(r).filter(c=>c==="BANK_LINK_COLLISION").length,1);}
// R11-5: a row another entry links exactly is never offered as a candidate.
{const r=E.analyze([{...cost("a5","2026-10-02",50),bankSource:undefined},cost("b5","2026-10-03",50)],[bank("source-b5","2026-10-03",50)],coverage);
 assert.deepEqual([...r.suggestions.find(s=>s.entryId==="a5").bankIds],[]);}
// R11-6: postings outside the declared coverage hold the close.
{const r=E.analyze([cost("c6","2026-10-05",10)],[bank("source-c6","2026-10-05",10,"debit","other-acct-9999")],coverage);
 const fixed={...cost("c6","2026-10-05",10),bankSource:ref("source-c6","other-acct-9999")};
 const r2=E.analyze([fixed],[bank("source-c6","2026-10-05",10,"debit","other-acct-9999")],coverage);
 assert.ok(codes(r2).includes("BANK_ROW_OUTSIDE_COVERAGE"));assert.equal(r2.closeGate.status,"HOLD");}
// R11-7: a blank fee is zero; a blank business use stays unknown.
{const r=E.analyze([income("f7","2026-10-05",40,""),cost("g7","2026-10-05",10,{businessUse:""})],[bank("source-f7","2026-10-05",40,"credit"),bank("source-g7","2026-10-05",10)],coverage);
 assert.ok(!codes(r).includes("INVALID_LEDGER"),codes(r).join());assert.ok(r.issues.some(x=>x.code==="UNKNOWN_ALLOCATION"&&x.entryId==="g7"));}
// R11-8: the bank-backed net figure excludes withheld fees.
{const r=E.analyze([income("n8","2026-10-05",1000,30)],[bank("source-n8","2026-10-05",970,"credit")],coverage);
 assert.equal(r.reviewedBankLinkedByClass["earned-or-other-income"],1000);assert.equal(r.reviewedBankNetByClass["earned-or-other-income"],970);}

// R11-9: the journal report honours an as-of date; the value summary uses it.
{const jc={window:{},crypto:webcrypto,Date,TextEncoder,Uint8Array,Number,Array,Object,String,Map,Set,JSON,Math,Error};
 runInNewContext(read("financial-event-journal.js"),jc);const J=jc.window.IncomeOSEventJournal;let j=[];
 const add=async(n,day,amount)=>{const t=day+"T12:00:00Z";
   j=await J.append(j,{id:"post."+n,type:"POSTED",timestamp:t,data:{sourceId:"bank."+n,postedDate:day,direction:"credit",amountCents:amount,currency:"USD",evidenceId:"bank.statement.1"}});
   j=await J.append(j,{id:"class."+n,type:"CLASSIFIED",timestamp:t,data:{postedEventId:"post."+n,classification:"earned_income",evidenceId:"owner.class.1"}});
   j=await J.append(j,{id:"rev."+n,type:"OWNER_RECONCILED",timestamp:t,data:{postedEventId:"post."+n,classificationEventId:"class."+n,reviewEvidenceId:"owner.review.1"}});};
 await add("june","2026-06-15",1000);await add("sept","2026-09-15",5000);
 const all=await J.report(j),june=await J.report(j,"2026-06-30");
 assert.equal(all.earnedIncomeUsd,60);assert.equal(june.earnedIncomeUsd,10);assert.equal(june.activePostings,1);
 assert.match(read("financial-value.js"),/report\(args\.journal,args\.asOf\)/);}

// R11-10: a rejected event does not mark its evidence as used.
{const oc={window:{}};runInNewContext(read("economic-outcomes.js"),oc);const O=oc.window.IncomeOSEconomicOutcomes;
 const r=O.review([{id:"e1",type:"REFUND",amountCents:100,posted:true,sourceVerified:true,evidenceId:"E1"},{id:"e2",type:"EARNED_INCOME",amountCents:200,posted:true,sourceVerified:true,evidenceId:"E1"}]);
 assert.deepEqual([...r.issues.map(i=>i.code)],["REFUND_LINK_MISSING"]);}
// Payment states: every state other than received is NOT_RECEIVED, never an invalid record or income.
for(const st of ["expected","invoiced","disputed","refunded","cancelled"]){
 const r=E.analyze([income("s-"+st,"2026-10-05",40,0,st)],[],coverage);
 assert.ok(!codes(r).includes("INVALID_LEDGER"),st);assert.equal(r.matches[0].state,"NOT_RECEIVED",st);}
console.log("IncomeOS money controls review checks passed (10 findings).");
