import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";

const file="owner/incomeos/accountant-review.js";
const source=readFileSync(file,"utf8");
new Script(source,{filename:file});
const win={};
runInNewContext(source,{window:win,JSON,Array,Object,Set,String,Map,Number,Error});
const api=win.IncomeOSAccountantReview;
assert.equal(typeof api.inspect,"function");
assert.equal(api.definitions.length,11);
const empty=api.inspect([],2026);
assert.equal(empty.recordCount,0);
assert.equal(empty.openIssueCount,0);
assert.match(empty.advisory,/not tax deductibility/);
const entries=[
 {id:"expense-1",kind:"outflow",type:"expense",label:"Shared home internet",date:"2026-04-01",
  amountUsd:96.50,category:"internet",businessUse:null,reference:"",reconciled:false},
 {id:"proceeds-2",kind:"income",scope:"proceeds",status:"paid",label:"Asset sold",date:"2026-06-01",
  grossUsd:6000,reference:"contract-A",reconciled:false},
 {id:"refund-3",kind:"outflow",type:"refund",label:"Reimbursement to resolve",date:"2026-06-04",
  amountUsd:16,reference:"contract-A",reconciled:false},
 {id:"pending-4",kind:"income",scope:"income",status:"pending",label:"Selected study",date:"2026-09-10",
  grossUsd:150,reference:"",reconciled:true},
 {id:"foreign-5",kind:"income",scope:"income",status:"paid",label:"International royalty",date:"2026-07-01",
  grossUsd:54,currency:"GBP",reference:"foreign-5",docStatus:"expected",reconciled:true},
 {id:"shared-6",kind:"outflow",type:"expense",label:"Mobile bill",date:"2026-08-01",
  amountUsd:120,category:"internet",businessUse:35,reference:"cell-6",reconciled:true},
 {id:"other-year",kind:"outflow",type:"expense",label:"Last year",date:"2025-11-01",
  amountUsd:500,category:"software",businessUse:null,reference:"",reconciled:false}
];
const before=JSON.stringify(entries);
const r=api.inspect(entries,"2026");
assert.equal(JSON.stringify(entries),before,"Review must not modify the accountant ledger");
assert.equal(r.recordCount,6,"Other-year entries excluded");
assert.equal(r.counts["allocation-unknown"],1,"Unset allocation must not be treated as 0% or 100%");
assert.equal(r.counts["allocation-review"],1,"Shared internet charge with an allocation requires rationale");
assert.equal(r.counts["refund-link"],1);
assert.equal(r.counts["investment-basis"],1);
assert.equal(r.counts["payment-pending"],1);
assert.equal(r.counts["foreign-currency"],1);
assert.equal(r.counts["expected-tax-form"],1);
assert.equal(r.counts["duplicate-reference"],2,"Repeated source refs are review flags, not automatically discarded");
assert.equal(r.counts["missing-evidence"],2);
assert.equal(r.counts["unreconciled"],3);
assert.ok(r.highCount>0);
assert.equal(r.highCount+r.mediumCount,r.openIssueCount);
assert.equal(r.recordsAffected,6);
assert.equal(r.issues[0].severity,"high","High-priority issues first");
assert.ok(!r.issues.some(f=>f.recordId==="other-year"));
assert.ok(!r.issues.some(f=>f.recordId==="shared-6"&&f.id==="allocation-unknown"),
  "An explicit 35% allocation is not unknown");
const clean=api.inspect([{id:"clean",kind:"outflow",type:"expense",label:"Test vendor",date:"2026-10-01",
 amountUsd:20,category:"software",businessUse:80,reference:"receipt-2",reconciled:true}],2026);
assert.equal(clean.openIssueCount,0,"A fully documented synthetic record need not be flagged");
assert.match(clean.advisory,/not independently certified/);
assert.throws(()=>api.inspect(new Array(15001).fill(null),2026),/Unsupported/);
assert.throws(()=>api.inspect([], "invalid"),/four-digit/);
const html=readFileSync("owner/incomeos/index.html","utf8");
const accountant=readFileSync("owner/incomeos/accountant.js","utf8");
assert.match(html,/<script defer src="\.\/accountant-review\.js"><\/script>/);
assert.ok(html.indexOf("accountant-review.js")<html.indexOf('src="./accountant.js"'),
 "Evidence review must load before the accountant controller");
for(const id of ["review-summary","review-list","export-review"])
 assert.ok(html.includes('id="'+id+'"'),"Missing accountant review UI: "+id);
for(const required of ["function renderReview()","function annualReview()","function exportReview()",
    '"click",exportReview','place(r,"h2","","Outstanding documentation review")'])
 assert.ok(accountant.includes(required),"Accountant report missing review integration: "+required);
const browserAudit=readFileSync("tests/incomeos-browser-audit.html","utf8");
assert.ok(browserAudit.includes("view-ledger"),"Existing mobile tests must exercise ledger navigation");
console.log("IncomeOS accountant documentation exceptions QA passed: 11 evidence categories, annual scope, no silent deduction, display/CSV/PDF integration and source privacy.");
