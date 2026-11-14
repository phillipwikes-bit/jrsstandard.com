// Synthetic-only regression checks for the fourth review of spend-intelligence.js and recovery-engine.js.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runInNewContext} from "node:vm";
const read=p=>readFileSync(resolve("owner/incomeos",p),"utf8");
const ctx={window:{},Date,Math,Array,Object,Map,Set,Number,String,JSON,Error,URL};
runInNewContext(read("spend-intelligence.js"),ctx);runInNewContext(read("recovery-engine.js"),ctx);
const S=ctx.window.IncomeOSIntelligence,R=ctx.window.IncomeOSRecovery;
const plain=v=>JSON.parse(JSON.stringify(v));
const bank=id=>({institution:"Synthetic Bank",accountToken:"masked-1",transactionId:id});
const charge=(id,date,amountUsd,payer="Test Vendor",bankSource=bank(id))=>({id,kind:"outflow",type:"expense",date,amountUsd,label:"charge",payer,bankSource});
const spend=(id,date,amountUsd,payer="Sample software",extra={})=>Object.assign({id,kind:"outflow",type:"expense",category:"software",date,amountUsd,payer,evidenceStatus:"both",businessUse:1,reconciled:true},extra);

// 1. A refund recorded through the cost form (outflow/refund) is reviewed, not ignored.
let rf=plain(R.refundCases([charge("c1","2026-10-01",20),{id:"r1",kind:"outflow",type:"refund",date:"2026-10-05",amountUsd:20,refundOf:"c1"}],null));
assert.equal(rf.length,1,"cost-form refund is reviewed");
assert.equal(rf[0].originalId,"c1");

// 2. Incomplete bank keys must not make two real debits look like one import.
const partial={institution:"Synthetic Bank",accountToken:"masked-1"};
assert.equal(R.duplicateCandidates([charge("a","2026-10-01",25,"V",partial),charge("b","2026-10-01",25,"V",partial)]).length,1,"partial bank keys still surface the pair");

// 3. Partial refunds together may not exceed the charge.
rf=plain(R.refundCases([charge("c2","2026-10-01",20),
  {id:"p1",kind:"income",scope:"nonincome",status:"paid",date:"2026-10-03",grossUsd:15,refundOf:"c2"},
  {id:"p2",kind:"income",scope:"nonincome",status:"paid",date:"2026-10-04",grossUsd:15,refundOf:"c2"}],null));
assert.notEqual(rf[0].state,"AMOUNT_OR_DATE_CONFLICT");
assert.equal(rf[1].state,"AMOUNT_OR_DATE_CONFLICT","second partial refund exceeds the charge");

// 4. Planned payments keep their anchor day across short months.
assert.equal(plain(S.duePlans([{id:"p",name:"Rent",nextDate:"2026-01-31",cadence:"monthly",amount:100}],"2026-04-15"))[0].nextDate,"2026-04-30");

// 5. Floating-point amounts are rounded to cents, not silently dropped.
assert.equal(R.duplicateCandidates([charge("f1","2026-10-01",0.1+0.2),charge("f2","2026-10-01",0.3)]).length,1);

// 6. A documented saving persists after a fourth reduced bill.
const bill=(month,amountUsd)=>({provider:"Net Co",service:"Internet",month,amountUsd,confirmedEquivalentService:true,sourceStatus:"owner-reviewed-bill-and-bank"});
const sv=plain(R.savingReview([bill("2026-01",100),bill("2026-02",80),bill("2026-03",80),bill("2026-04",80)]));
assert.equal(sv.length,1,"saving still observed after four bills");
assert.equal(sv[0].observedTwoCycleSavingsUsd,40);

// 7. One old same-day pair does not block recurring detection forever.
const rec=plain(S.recurring([spend("o1","2026-01-01",10),spend("o2","2026-01-01",10),spend("m1","2026-05-01",10),spend("m2","2026-06-01",10),spend("m3","2026-07-01",10),spend("m4","2026-08-01",10)],"2026-08-10"));
assert.equal(rec.length,1);assert.equal(rec[0].cadence,"monthly");

// 8. Non-standard evidence values are not treated as complete.
const q=plain(S.analyze([spend("e1","2026-10-01",10,"V",{evidenceStatus:"verified"})],{},"2026-10-30")).reviewQueue;
assert.ok(q.length===1&&q[0].flags.includes("Supporting evidence incomplete"));

// 9. One invalid budget is reported on its row; the panel still renders.
const an=plain(S.analyze([spend("b1","2026-10-01",10)],{budgets:{software:-1,travel:50}},"2026-10-30"));
assert.equal(an.budgets.find(b=>b.category==="software").invalid,true);
assert.equal(an.budgets.find(b=>b.category==="travel").target,50);
assert.throws(()=>S.budgetVsActual([],{software:-1},"2026-10-30"),"direct calls still reject an invalid target");

// 10. Both engines normalize merchant names the same way.
assert.equal(R.duplicateCandidates([charge("n1","2026-10-01",9,"Acme Inc."),charge("n2","2026-10-01",9,"acme inc")]).length,1);
assert.equal(plain(S.recurring([spend("g1","2026-08-01",10,"Acme Inc."),spend("g2","2026-09-01",10,"acme inc"),spend("g3","2026-10-01",10,"ACME, INC")],"2026-10-10")).length,1);
console.log("IncomeOS spend and recovery review checks passed (10 findings).");
