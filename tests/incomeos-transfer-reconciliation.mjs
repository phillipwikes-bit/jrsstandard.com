// Synthetic-only transfer and credit card payment reconciliation acceptance tests.
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script,runInNewContext} from "node:vm";
const read=p=>readFileSync(resolve("owner/incomeos",p),"utf8");
const ctx={window:{},crypto:webcrypto,Date,TextEncoder,Uint8Array,Number,Array,Object,String,Map,Set,JSON,Math,Error};
for(const path of ["financial-event-journal.js","accounting-controls.js","statement-close.js","transfer-reconciliation.js"]){
 const src=read(path);new Script(src);runInNewContext(src,ctx);
}
const J=ctx.window.IncomeOSEventJournal,T=ctx.window.IncomeOSTransferReconciliation;
const accounts=[
 {institution:"Mock Checking",accountToken:"masked-checking-1001",balanceType:"asset",ownerConfirmed:true},
 {institution:"Mock Savings",accountToken:"masked-savings-1002",balanceType:"asset",ownerConfirmed:true},
 {institution:"Mock Card",accountToken:"masked-card-1003",balanceType:"liability",ownerConfirmed:true}
];
const accountRef=a=>a.institution+"|"+a.accountToken;
const bankRow=(acct,tx,amountCents,dir,day)=>({
 institution:acct.institution,accountToken:acct.accountToken,transactionId:tx,date:day,
 amountUsd:(amountCents/100).toFixed(2),direction:dir,posted:true,currency:"USD",description:"Synthetic statement posting"
});
const bankRows=[
 bankRow(accounts[0],"checking.to.savings",10000,"debit","2026-10-10"),
 bankRow(accounts[1],"savings.from.checking",10000,"credit","2026-10-11"),
 bankRow(accounts[0],"checking.to.card",5000,"debit","2026-10-20"),
 bankRow(accounts[2],"card.payment",5000,"credit","2026-10-21")
];
const fullId=r=>[r.institution,r.accountToken,r.transactionId].join("|");
const statement=(a,n,openingCents,closingCents,credits,debits,count)=>({
 institution:a.institution,accountToken:a.accountToken,statementId:n,evidenceId:"mock.statement.001",
 startDate:"2026-10-01",endDate:"2026-10-31",openingCents,closingCents,
 totalCreditsCents:credits,totalDebitsCents:debits,postingCount:count,
 documentSha256:"a".repeat(64),sourceVerified:true,currency:"USD"
});
const pkg={
 from:"2026-10-01",to:"2026-10-31",scopeConfirmed:true,expectedAccounts:accounts,bankRows,
 statements:[
 statement(accounts[0],"statement.checking.10",100000,85000,0,15000,2),
 statement(accounts[1],"statement.savings.10",10000,20000,10000,0,1),
 statement(accounts[2],"statement.card.10",5000,0,5000,0,1)
 ],
 accountingMatches:bankRows.map((r,i)=>({entryId:"ledger.item."+i,bankId:fullId(r),state:"OWNER_REVIEWED_BANK_MATCH"}))
};
let journal=[],bindings=[];
async function post(name,row,label){
 const id="posted."+name,sourceId="journal.source."+name,evidenceId="mock.statement.001";
 const base=(id,type,data)=>({id,type,timestamp:"2026-11-01T18:00:00.000Z",data});
 journal=await J.append(journal,base(id,"POSTED",{sourceId,postedDate:row.date,
   direction:row.direction,amountCents:Math.round(Number(row.amountUsd)*100),currency:"USD",evidenceId}));
 journal=await J.append(journal,base("class."+name,"CLASSIFIED",{postedEventId:id,classification:label,evidenceId:"owner.classification.001"}));
 journal=await J.append(journal,base("review."+name,"OWNER_RECONCILED",{postedEventId:id,classificationEventId:"class."+name,reviewEvidenceId:"owner.review.001"}));
 bindings.push({postedEventId:id,bankSourceId:fullId(row),journalSourceId:sourceId,sourceEvidenceId:evidenceId});
 return id;
}
const debitSave=await post("debit.savings",bankRows[0],"transfer_out");
const creditSave=await post("credit.savings",bankRows[1],"transfer_in");
const debitCard=await post("debit.card",bankRows[2],"transfer_out");
const creditCard=await post("credit.card",bankRows[3],"transfer_in");
const pairs=[
 {id:"pair.internal.001",kind:"INTERNAL_BANK_TRANSFER",debitEventId:debitSave,creditEventId:creditSave,reviewEvidenceId:"owner.transfer.001"},
 {id:"pair.card.001",kind:"CREDIT_CARD_PAYMENT",debitEventId:debitCard,creditEventId:creditCard,reviewEvidenceId:"owner.cardpayment.001"}
];
const input={journal,statementPackage:pkg,bindings,pairs};
let result=await T.assess(input);
assert.equal(result.status,"READY_FOR_ACCOUNTANT_PAIR_REVIEW_ONLY");
assert.equal(result.matchedPairs.length,2);
assert.equal(result.ownerReviewedInternalTransferCents,10000);
assert.equal(result.ownerReviewedCardPaymentCents,5000);
assert.equal(result.earnedIncomeAddedCents,0);
assert.equal(result.operatingExpenseAddedCents,0);
assert.equal(result.executable,false);
assert.equal(result.actualOwnerAccountAccess,false);
assert.equal(result.independentStatementAuthentication,false);
assert.equal(result.taxConclusion,false);
assert.equal((await J.report(journal)).earnedIncomeUsd,0);
assert.equal((await J.report(journal)).totalReceivedIncomeUsd,0);
function codes(r){return r.issues.map(x=>x.code);}
async function hold(overrides,code){
 const r=await T.assess({...input,...overrides});
 assert.equal(r.status,"HOLD","Expected HOLD on "+code);
 assert.ok(codes(r).includes(code),"Expected "+code+"; found "+codes(r).join(","));
 return r;
}
await hold({pairs:[]},"NO_PAIR_EVIDENCE");
await hold({pairs:[pairs[0]]},"UNPAIRED_CLASSIFIED_TRANSFER");
await hold({pairs:[pairs[0],pairs[0]]},"TRANSFER_PAIR_HOLD");
await hold({pairs:[pairs[0],{...pairs[1],debitEventId:debitSave}]},"TRANSFER_PAIR_HOLD");
await hold({pairs:[{...pairs[0],creditEventId:debitSave},pairs[1]]},"TRANSFER_PAIR_HOLD");
await hold({pairs:[{...pairs[0],kind:"CREDIT_CARD_PAYMENT"},pairs[1]]},"TRANSFER_PAIR_HOLD");
await hold({pairs:[pairs[0],{...pairs[1],kind:"INTERNAL_BANK_TRANSFER"}]},"TRANSFER_PAIR_HOLD");
await hold({bindings:bindings.slice(1)},"TRANSFER_PAIR_HOLD");
await hold({bindings:bindings.map((b,i)=>i===0?{...b,journalSourceId:"journal.unknown.999"}:b)},"TRANSFER_PAIR_HOLD");
await hold({bindings:bindings.map((b,i)=>i===0?{...b,sourceEvidenceId:"wrong.evidence.001"}:b)},"TRANSFER_PAIR_HOLD");
await hold({bindings:bindings.map((b,i)=>i===0?{...b,bankSourceId:bindings[1].bankSourceId}:b)},"INVALID_OR_DUPLICATE_SOURCE_BINDING");
await hold({bindings:[...bindings,bindings[0]]},"INVALID_OR_DUPLICATE_SOURCE_BINDING");
await hold({pairs:[{...pairs[0],privateAccountNumber:"1234"},pairs[1]]},"TRANSFER_PAIR_HOLD");
await hold({statementPackage:{...pkg,accountingMatches:pkg.accountingMatches.slice(0,3)}},"STATEMENT_COVERAGE_HOLD");
await hold({statementPackage:{...pkg,scopeConfirmed:false}},"STATEMENT_COVERAGE_HOLD");
await hold({statementPackage:{...pkg,bankRows:bankRows.slice(0,3)}},"STATEMENT_COVERAGE_HOLD");
const mismatch=pairs.map((p,i)=>i===0?{...p,creditEventId:creditCard}:p);
await hold({pairs:mismatch},"TRANSFER_PAIR_HOLD");
const broken=JSON.parse(JSON.stringify(journal));broken[0].data.amountCents=999;
await assert.rejects(T.assess({...input,journal:broken}),/modified/);
await assert.rejects(T.assess({...input,bindings:null}),/arrays required/);
assert.doesNotMatch(read("transfer-reconciliation.js"),/fetch\s*\(|localStorage|XMLHttpRequest|sendBeacon|WebSocket|document\.cookie/);
const ui=read("transfer-review-ui.js"),html=read("index.html");
new Script(ui);
assert.match(html,/id="transfer-review-panel"/);
assert.match(html,/id="transfer-review-status"/);
assert.match(html,/financial-event-journal\.js/);
assert.match(html,/transfer-reconciliation\.js/);
assert.match(html,/transfer-review-ui\.js/);
assert.match(ui,/scopeConfirmed:false/);
assert.match(ui,/journal:\[\]/);
assert.match(ui,/bindings:\[\],pairs:\[\]/);
assert.doesNotMatch(ui,/fetch\s*\(|localStorage|XMLHttpRequest|WebSocket|sendBeacon/);
console.log("IncomeOS transfer QA passed: posted transfer pair, card payment, account ownership, unique links, no duplicated expense/income, and fail-closed mismatches.");
