// Available-to-compound estimate. SYNTHETIC TOTALS ONLY; a pass is not evidence about any real balance.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const src=readFileSync(new URL("../owner/incomeos/compound-capacity.js",import.meta.url),"utf8");
assert.doesNotMatch(src,/fetch\(|XMLHttpRequest|localStorage|sessionStorage/,"no network or storage");
const ctx={window:{}};vm.runInNewContext(src,ctx);const C=ctx.window.IncomeOSCompoundCapacity;
const t={gross:1000,fees:50,expenses:200,taxPaid:100,otherOutflow:0,returned:300,proceeds:0,capital:250,pending:5000,unreconciled:0,refundCount:0};
let r=JSON.parse(JSON.stringify(C.estimate(t,{reserveUsd:100,scheduledObligationsUsd:40})));
assert.equal(r.netIncomeReceived,950);assert.equal(r.spendingPaid,300);assert.equal(r.operatingCashFlow,650);
assert.equal(r.capitalReturned,300,"returned principal shown as capital back");assert.equal(r.capitalContributed,250);
assert.equal(r.cashGenerated,700);assert.equal(r.availableToCompound,560);
assert.ok(r.issues.some(i=>/not yet received \(\$5000\.00\) is not counted/.test(i)),"pending income disclosed, not counted");
assert.equal(r.status,"RECONCILED_RECORDS_ONLY");
// Expected income never raises the figure.
assert.equal(C.estimate({...t,pending:999999},{reserveUsd:100,scheduledObligationsUsd:40}).availableToCompound,560);
// Returned principal is never counted as operating income or earnings.
assert.equal(C.estimate({...t,returned:0},{}).operatingCashFlow,650);
// Obligations and reserve beyond the cash leave nothing, never a negative amount.
r=C.estimate(t,{reserveUsd:10000});assert.equal(r.availableToCompound,0);assert.ok(r.issues.some(i=>/nothing is available/.test(i)));
// Unreconciled records mark the figure as an estimate; no reserve is called out.
r=C.estimate({...t,unreconciled:3},{});assert.equal(r.status,"ESTIMATE_NOT_RECONCILED");assert.ok(r.issues.some(i=>/3 record\(s\) not reconciled/.test(i)));
assert.ok(r.issues.some(i=>/No reserve set/.test(i)));
assert.throws(()=>C.estimate(t,{reserveUsd:-1}),/negative/);
assert.throws(()=>C.estimate(null),/totals required/);
// Downside check.
assert.deepEqual(JSON.parse(JSON.stringify(C.downside(1000,20,1))),{amount:1000,loss:200,fee:10,remaining:790});
assert.throws(()=>C.downside(1000,120,0),/valid/);
console.log("IncomeOS available-to-compound checks passed: received income only, principal kept separate, reserve and bills deducted, never negative.");
