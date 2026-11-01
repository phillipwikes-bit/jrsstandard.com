// Synthetic capital adequacy and owner-review gate regression.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script,runInNewContext} from "node:vm";
const ctx={window:{},Date,Number,Array,Map,Set,Object,String,JSON,Math,Error};
const read=p=>readFileSync(resolve("owner/incomeos",p),"utf8");
for(const file of ["accounting-controls.js","statement-close.js","capital-readiness.js"]){
 const src=read(file);new Script(src);runInNewContext(src,ctx);
}
const engine=ctx.window.IncomeOSCapitalReadiness,hash="a".repeat(64);
const cash={institution:"Demo Cash",accountToken:"masked-cash-1001",balanceType:"asset",ownerConfirmed:true};
const card={institution:"Demo Card",accountToken:"masked-card-1002",balanceType:"liability",ownerConfirmed:true};
const invest={institution:"Demo Assets",accountToken:"masked-asset-1003",balanceType:"asset",ownerConfirmed:true};
const manifest=[cash,card,invest];
const statement=(a,id,open,close,cr,db,count)=>({institution:a.institution,accountToken:a.accountToken,
 statementId:id,evidenceId:"synthetic.statement.evidence",startDate:"2026-10-01",endDate:"2026-10-31",
 openingCents:open,closingCents:close,totalCreditsCents:cr,totalDebitsCents:db,postingCount:count,
 documentSha256:hash,sourceVerified:true,currency:"USD"});
const statements=[
 statement(cash,"statement.cash.01",1000000,1200000,300000,100000,2),
 statement(card,"statement.card.01",100000,70000,50000,20000,2),
 statement(invest,"statement.noncash.01",300000,300000,0,0,0)
];
const row=(a,id,date,n,d)=>({...a,transactionId:id,date,amountUsd:(n/100).toFixed(2),direction:d,posted:true,currency:"USD"});
const rows=[
 row(cash,"tx.cash.in","2026-10-02",300000,"credit"),
 row(cash,"tx.cash.out","2026-10-03",100000,"debit"),
 row(card,"tx.card.out","2026-10-04",20000,"debit"),
 row(card,"tx.card.in","2026-10-05",50000,"credit")
];
const refs=rows.map((r,i)=>({entryId:"ledger.source."+i,
 bankId:[r.institution,r.accountToken,r.transactionId].join("|"),state:"OWNER_REVIEWED_BANK_MATCH"}));
const statementPackage={from:"2026-10-01",to:"2026-10-31",
 expectedAccounts:manifest,statements,bankRows:rows,accountingMatches:refs,scopeConfirmed:true};
const use=[
 {accountId:"Demo Cash|masked-cash-1001",kind:"cash",restrictedCents:100000,unsettledDebitCents:50000,ownerReviewed:true,evidenceId:"owner.cash.plan"},
 {accountId:"Demo Card|masked-card-1002",kind:"liability",ownerReviewed:true,evidenceId:"owner.card.plan"},
 {accountId:"Demo Assets|masked-asset-1003",kind:"noncash",ownerReviewed:true,evidenceId:"owner.assets.plan"}
];
const obligation={id:"obligation.one.001",amountCents:90000,dueDate:"2026-11-20",evidenceId:"owner.obligation.001"};
const reserves={emergencyCents:500000,taxCents:100000,otherCents:50000,evidenceId:"owner.reserve.plan",ownerReviewed:true};
const baseline={asOf:"2026-10-31",statementPackage,accountUse:use,obligations:[obligation],
 obligationsReviewed:true,obligationCoverageEvidenceId:"owner.obligation.scope",reserves,horizonDays:60,
 proposedAllocationCents:200000};
let x=engine.assess(baseline);
assert.equal(x.status,"READY_FOR_OWNER_CAPITAL_REVIEW_ONLY");
assert.equal(x.modeledCashCents,1200000);
assert.equal(x.preliminaryUncommittedCents,310000);
assert.equal(x.accountCount,3);
assert.equal(x.classifiedAccounts,3);
assert.equal(x.executable,false);
assert.equal(x.ownerApprovalStillRequired,true);
assert.equal(x.independentlyVerifiedBankBalance,false);
assert.equal(x.providerReinvestmentSetUp,false);
function hold(over,code){
 const v=engine.assess({...baseline,...over});
 assert.equal(v.status,"HOLD",code);
 assert.equal(v.preliminaryUncommittedCents,null,"Failed evidence gate must not expose an investable cash balance");
 assert.ok(v.issues.some(z=>z.code===code),"Expected "+code+"; found "+v.issues.map(z=>z.code).join(","));
}
hold({proposedAllocationCents:400000},"PROPOSAL_EXCEEDS_PRELIMINARY_CAPACITY");
hold({statementPackage:{...statementPackage,scopeConfirmed:false}},"UNRECONCILED_SOURCE_COVERAGE");
hold({statementPackage:{...statementPackage,bankRows:rows.slice(0,3)}},"UNRECONCILED_SOURCE_COVERAGE");
hold({statementPackage:{...statementPackage,to:"2026-10-30"}},"STATEMENT_AS_OF_MISMATCH");
hold({accountUse:use.slice(1)},"UNCLASSIFIED_ACCOUNT");
hold({accountUse:use.concat(use[0])},"DUPLICATE_ACCOUNT_USE");
hold({accountUse:use.map((a,i)=>i===0?{...a,restrictedCents:1150000,unsettledDebitCents:60000}:a)},"HOLDS_EXCEED_CASH");
hold({accountUse:use.map((a,i)=>i===0?{...a,restrictedCents:null}:a)},"UNKNOWN_LIQUIDITY_HOLDS");
hold({accountUse:use.map((a,i)=>i===0?{...a,ownerReviewed:false}:a)},"ACCOUNT_USE_NOT_REVIEWED");
hold({accountUse:use.map((a,i)=>i===0?{...a,kind:"liability"}:a)},"ACCOUNT_TYPE_CONFLICT");
hold({accountUse:use.map((a,i)=>i===0?{...a,accountId:"Demo Unknown|masked-unknown-9999"}:a)},"UNKNOWN_ACCOUNT_USE");
hold({obligationsReviewed:false},"OBLIGATIONS_NOT_ATTESTED");
hold({obligations:[obligation,{...obligation}]},"DUPLICATE_OBLIGATION");
hold({obligations:[{...obligation,dueDate:"2026-10-20"}]},"OVERDUE_OBLIGATION");
hold({obligations:[{...obligation,dueDate:"2027-07-01"}]},"OBLIGATION_OUTSIDE_HORIZON");
hold({obligations:[{...obligation,amountCents:-10}]},"INVALID_OBLIGATION");
hold({reserves:{...reserves,taxCents:undefined}},"RESERVE_PLAN_NOT_REVIEWED");
hold({reserves:{...reserves,ownerReviewed:false}},"RESERVE_PLAN_NOT_REVIEWED");
hold({horizonDays:365},"INVALID_OBLIGATION_HORIZON");
hold({proposedAllocationCents:0},"NO_SPECIFIC_ALLOCATION");
assert.throws(()=>engine.assess({...baseline,asOf:"2026-02-30"}),/date/);
assert.throws(()=>engine.assess({...baseline,accountUse:null}),/arrays/);
assert.doesNotMatch(read("capital-readiness.js"),/fetch\s*\(|localStorage|XMLHttpRequest|WebSocket|sendBeacon/);
console.log("IncomeOS capital-readiness QA passed: cash-only capacity, liability exclusion, obligations/reserves, statement coverage, and non-executable hold gates.");
