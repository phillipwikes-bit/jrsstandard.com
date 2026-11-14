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
// Transfers between own accounts are disclosed and never reduce the figure.
{const a=C.estimate({...t,transfers:0},{}).availableToCompound,b=C.estimate({...t,transfers:900},{});
 assert.equal(b.availableToCompound,a);assert.ok(b.issues.some(i=>/\$900\.00 moved between your own accounts is not counted/.test(i)));}
assert.throws(()=>C.estimate(null),/totals required/);
// Downside check.
assert.deepEqual(JSON.parse(JSON.stringify(C.downside(1000,20,1))),{amount:1000,loss:200,fee:10,remaining:790});
assert.throws(()=>C.downside(1000,120,0),/valid/);
// Actual results by holding.
const E=[
  {kind:"outflow",type:"capital",payer:"Synthetic Notes Fund",amountUsd:1000,date:"2026-01-05",reconciled:true},
  {kind:"income",status:"paid",scope:"income",category:"interest",payer:"Synthetic Notes Fund",grossUsd:60,feesUsd:5,date:"2026-06-30",reconciled:true},
  {kind:"income",status:"paid",scope:"nonincome",payer:"synthetic notes fund",grossUsd:400,feesUsd:0,date:"2026-07-01",reconciled:false},
  {kind:"income",status:"expected",scope:"income",category:"interest",payer:"Synthetic Notes Fund",grossUsd:999,date:"2026-12-31"},
  {kind:"outflow",type:"capital",payer:"Synthetic Notes Fund",amountUsd:500,date:"2026-02-01",paymentStatus:"scheduled"},
  {kind:"outflow",type:"capital",payer:"Synthetic Land Co",amountUsd:300,date:"2026-02-01",reconciled:true},
  {kind:"income",status:"paid",scope:"proceeds",payer:"Synthetic Land Co",grossUsd:350,date:"2026-09-01",reconciled:true},
  {kind:"income",status:"paid",scope:"income",category:"dividend",payer:"Synthetic Orphan",grossUsd:20,date:"2026-03-01",reconciled:true},
  {kind:"income",status:"paid",scope:"income",category:"research",payer:"Synthetic Recruiter",grossUsd:100,date:"2026-03-01"}];
const H=JSON.parse(JSON.stringify(C.holdings(E))).holdings;
assert.deepEqual(H.map(h=>h.name),["Synthetic Notes Fund","Synthetic Land Co","Synthetic Orphan"],"research pay is not a holding; names grouped case-insensitively");
const nf=H[0];
assert.deepEqual([nf.contributed,nf.incomeReceived,nf.principalReturned,nf.netCashSoFar,nf.stillInvested,nf.status,nf.incomeOnCapitalPct],[1000,55,400,-545,600,"CAPITAL_STILL_OUT",5.5],
  "expected income and a scheduled contribution are not counted; principal is capital back, not income");
assert.ok(nf.flags.some(f=>/1 record\(s\) not reconciled/.test(f)));
assert.equal(H[1].status,"CAPITAL_RETURNED");assert.equal(H[1].incomeReceived,0,"sale proceeds are not income");
assert.ok(H[1].flags.some(f=>/cost basis/.test(f)));
assert.equal(H[2].status,"NO_CONTRIBUTION_RECORDED");assert.equal(H[2].incomeOnCapitalPct,null);
assert.throws(()=>C.holdings(null),/Entries required/);
// Reinvestment: earnings capped at income actually received from the named holding, in date order; principal never counts.
{const R=[
  {kind:"outflow",type:"capital",payer:"Synthetic Notes Fund",amountUsd:1000,date:"2026-01-05",reconciled:true},
  {kind:"income",status:"paid",scope:"income",category:"interest",payer:"Synthetic Notes Fund",grossUsd:120,feesUsd:0,date:"2026-06-30",reconciled:true},
  {kind:"income",status:"paid",scope:"nonincome",payer:"Synthetic Notes Fund",grossUsd:500,date:"2026-07-01",reconciled:true},
  {kind:"income",status:"expected",scope:"income",category:"interest",payer:"Synthetic Notes Fund",grossUsd:900,date:"2026-12-31"},
  {kind:"outflow",type:"capital",payer:"Synthetic Land Co",amountUsd:300,date:"2026-08-01",reinvestedUsd:100,reinvestedFrom:"synthetic notes fund",reconciled:true},
  {kind:"outflow",type:"capital",payer:"Synthetic Land Co",amountUsd:200,date:"2026-09-01",reinvestedUsd:150,reinvestedFrom:"Synthetic Notes Fund",reconciled:true},
  {kind:"outflow",type:"capital",payer:"Synthetic Art LLC",amountUsd:50,date:"2026-09-02",reinvestedUsd:50,reinvestedFrom:"Nobody Known",reconciled:true}];
 const by=Object.fromEntries(JSON.parse(JSON.stringify(C.holdings(R))).holdings.map(h=>[h.name,h]));
 const land=by["Synthetic Land Co"],notes=by["Synthetic Notes Fund"],art=by["Synthetic Art LLC"];
 assert.deepEqual([land.contributed,land.reinvestedEarnings,land.newMoney],[500,120,380],"only the $120 received counts; expected interest and $500 principal do not");
 assert.ok(land.flags.some(f=>/\$130\.00 recorded as reinvested from Synthetic Notes Fund exceeds the income received/.test(f)));
 assert.equal(notes.earningsReinvestedElsewhere,120);assert.equal(notes.reinvestedEarnings,0);
 assert.deepEqual([art.reinvestedEarnings,art.newMoney],[0,50],"an unknown source counts as new money");
 assert.ok(art.flags.some(f=>/from Nobody Known exceeds/.test(f)));}
console.log("IncomeOS available-to-compound checks passed: received income only, principal kept separate, reserve and bills deducted, never negative.");
