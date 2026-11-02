// Source-linked double-entry ledger regression tests. Synthetic records only.
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script,runInNewContext} from "node:vm";
const read=x=>readFileSync(resolve("owner/incomeos",x),"utf8");
const ctx={window:{},Date,TextEncoder,Uint8Array,JSON,Array,Set,Map,Number,String,Math,Object,Error,crypto:webcrypto};
for(const name of ["financial-event-journal.js","double-entry.js"]){const s=read(name);new Script(s);runInNewContext(s,ctx);}
const J=ctx.window.IncomeOSEventJournal,D=ctx.window.IncomeOSDoubleEntry;
let journal=[];
const bookDate="2026-11-01",sourceDate="2026-10-31",timestamp="2026-11-01T20:00:00.000Z";
const x=(id,type,data)=>({id,type,timestamp,data});
async function source(n,label,amount,direction){
 const id="post."+n,cl="class."+n;
 for(const e of [
   x(id,"POSTED",{sourceId:"bank."+n,postedDate:sourceDate,direction,amountCents:amount,currency:"USD",evidenceId:"bank.statement.001"}),
   x(cl,"CLASSIFIED",{postedEventId:id,classification:label,evidenceId:"owner.class.001"}),
   x("review."+n,"OWNER_RECONCILED",{postedEventId:id,classificationEventId:cl,reviewEvidenceId:"owner.review.001"})
 ])journal=await J.append(journal,e);
 return id;
}
const refs={
 earned:await source("earned","earned_income",15000,"credit"),
 invest:await source("interest","investment_income",500,"credit"),
 bill:await source("bill.on.card","business_expense",2000,"debit"),
 personal:await source("personal","personal_expense",1200,"debit"),
 refund:await source("refund","refund",800,"credit"),
 deployed:await source("capital","capital_contribution",10000,"debit"),
 returned:await source("principal","returned_principal",1000,"credit"),
 tax:await source("tax","tax_payment",1500,"debit"),
 transferOut:await source("transfer.out","transfer_out",4000,"debit"),
 transferIn:await source("transfer.in","transfer_in",4000,"credit"),
 cardOut:await source("cardpay.out","transfer_out",3000,"debit"),
 cardIn:await source("cardpay.in","transfer_in",3000,"credit")
};
const chart=[
 ["cash.checking","cash_asset"],["cash.savings","cash_asset"],["credit.card","card_liability"],
 ["asset.investment","investment_asset"],["revenue.earned","earned_revenue"],["revenue.investment","investment_revenue"],
 ["expense.business","business_expense"],["expense.personal","personal_expense"],
 ["refund.reversal","expense_reversal"],["draw.owner","owner_draw"]
].map(([id,kind])=>({id,kind,evidenceId:"owner.chart.001",ownerReviewed:true}));
const lines=(debit,credit,n)=>[
 {accountId:debit,side:"debit",amountCents:n},{accountId:credit,side:"credit",amountCents:n}
];
const entry=(id,kind,sourceEventIds,debit,credit,n,extra={})=>({
 id,date:bookDate,kind,sourceEventIds,lines:lines(debit,credit,n),evidenceId:"owner.posting.001",...extra
});
const entries=[
 entry("entry.earned","EARNED_INCOME",[refs.earned],"cash.checking","revenue.earned",15000),
 entry("entry.invest","INVESTMENT_INCOME",[refs.invest],"cash.savings","revenue.investment",500),
 entry("entry.bill","BUSINESS_EXPENSE",[refs.bill],"expense.business","credit.card",2000),
 entry("entry.personal","PERSONAL_EXPENSE",[refs.personal],"expense.personal","cash.checking",1200),
 entry("entry.refund","REFUND",[refs.refund],"credit.card","refund.reversal",800,{originalExpenseEventId:refs.bill}),
 entry("entry.capital","CAPITAL_DEPLOYED",[refs.deployed],"asset.investment","cash.checking",10000),
 entry("entry.returned","RETURNED_PRINCIPAL",[refs.returned],"cash.checking","asset.investment",1000),
 entry("entry.tax","TAX_PAYMENT",[refs.tax],"draw.owner","cash.checking",1500),
 entry("entry.transfer","INTERNAL_TRANSFER",[refs.transferOut,refs.transferIn],"cash.savings","cash.checking",4000),
 entry("entry.card","CREDIT_CARD_PAYMENT",[refs.cardOut,refs.cardIn],"credit.card","cash.checking",3000)
];
const args={journal,accounts:chart,entries,asOf:bookDate};
const result=await D.assess(args);
assert.equal(result.status,"BALANCED_OWNER_REVIEW_ONLY");
assert.equal(result.reviewedEntries,10);
assert.equal(result.mappedSourcePostings,12);
assert.equal(result.earnedIncomeCents,15000);
assert.equal(result.investmentCashIncomeCents,500);
assert.equal(result.refundCents,800);
assert.equal(result.internalTransferCents,4000);
assert.equal(result.cardPaymentCents,3000);
assert.equal(result.movementDebitsCents,result.movementCreditsCents);
assert.equal(result.openingBalancesConfirmed,false);
assert.equal(result.bankStatementsIndependentlyVerified,false);
assert.equal(result.readyForTaxFiling,false);
assert.equal(result.canReinvest,false);
assert.equal(result.movementTrialBalance.length,10);
assert.ok(result.movementTrialBalance.every(r=>Number.isSafeInteger(r.debitCents)&&Number.isSafeInteger(r.creditCents)));
const report=await J.report(journal);
assert.equal(report.earnedIncomeUsd,150);
assert.equal(report.investmentCashIncomeUsd,5);
assert.equal(report.ownerReviewedByClass.transfer_in,70);
function hold(newArgs,code){
 return D.assess({...args,...newArgs}).then(r=>{
   assert.equal(r.status,"HOLD",code);
   assert.equal(r.movementTrialBalance,null,"Invalid evidence cannot publish partial trial balance");
   assert.equal(r.earnedIncomeCents,null,"Invalid evidence cannot publish partial earned income");
   assert.ok(r.unresolved.some(x=>x.code===code),code+" missing: "+JSON.stringify(r.unresolved));
 });
}
await hold({entries:entries.slice(0,9)},"UNMAPPED_POSTED_SOURCE");
await hold({entries:entries.concat({...entries[0],id:"entry.earned.dup"})},"DUPLICATE_SOURCE_ALLOCATION");
await hold({entries:[{...entries[0],lines:[entries[0].lines[0],{...entries[0].lines[1],amountCents:14999}]},...entries.slice(1)]},"INVALID_OR_UNBALANCED_ENTRY");
await hold({entries:[{...entries[0],lines:lines("cash.checking","expense.business",15000)},...entries.slice(1)]},"INVALID_ACCOUNT_OR_LEDGER_TREATMENT");
await hold({entries:[{...entries[0],lines:lines("cash.unknown","revenue.earned",15000)},...entries.slice(1)]},"INVALID_ACCOUNT_OR_LEDGER_TREATMENT");
await hold({entries:[{...entries[0],lines:lines("cash.checking","revenue.earned",20000)},...entries.slice(1)]},"SOURCE_AMOUNT_MISMATCH");
await hold({entries:[{...entries[0],date:"2026-11-02"},...entries.slice(1)]},"FUTURE_ACCOUNTING_EVENT");
await hold({entries:[{...entries[0],date:"2026-10-30"},...entries.slice(1)]},"PREMATURE_BOOKING");
await hold({entries:[{...entries[8],sourceEventIds:[refs.cardOut,refs.transferIn]},...entries.slice(0,8),entries[9]]},"SOURCE_AMOUNT_MISMATCH");
await hold({entries:[{...entries[4],originalExpenseEventId:refs.earned},...entries.slice(0,4),...entries.slice(5)]},"REFUND_ORIGINAL_NOT_REVIEWED");
await hold({entries:[{...entries[4],lines:lines("credit.card","refund.reversal",2500)},...entries.slice(0,4),...entries.slice(5)]},"SOURCE_AMOUNT_MISMATCH");
await hold({entries:entries.map(e=>e.id==="entry.bill"?{...e,sourceEventIds:[refs.personal]}:e)},"UNREVIEWED_SOURCE_CLASSIFICATION");
await hold({accounts:chart.map(a=>a.id==="cash.savings"?{...a,ownerReviewed:false}:a)},"INVALID_ACCOUNT");
await hold({accounts:[...chart,{...chart[0]}]},"INVALID_ACCOUNT");
await hold({entries:entries.concat({...entries[0],id:"entry.earned",sourceEventIds:[refs.earned]})},"DUPLICATE_ENTRY");
const tampered=JSON.parse(JSON.stringify(journal));tampered[0].data.amountCents=1;
await assert.rejects(D.assess({...args,journal:tampered}),/modified/);
assert.throws(()=>D.validateAccount({...chart[0],accountNumber:"12345678901"}),/unsupported accounting fields/i);
assert.throws(()=>D.validateEntry({...entries[0],accountSecret:"shh"}),/unsupported accounting fields/i);
assert.throws(()=>D.validateEntry({...entries[0],sourceEventIds:[refs.earned,refs.earned]}),/Invalid accounting entry/);
assert.throws(()=>D.validateEntry({...entries[0],lines:lines("cash.checking","cash.checking",15000)}),/balance exactly/);
assert.doesNotMatch(read("double-entry.js"),/fetch\s*\(|localStorage|XMLHttpRequest|sendBeacon|WebSocket|document\.cookie/);
console.log("IncomeOS double-entry QA passed: source-bound debits=credits, classification routing, fund transfer, card payments, refunds, principal, source exhaustion and nonproduction holds.");
