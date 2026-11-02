// Synthetic month-end source-to-double-entry reconciliation, no owner files.
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script,runInNewContext} from "node:vm";
const read=x=>readFileSync(resolve("owner/incomeos",x),"utf8");
const ctx={window:{},crypto:webcrypto,Date,TextEncoder,Uint8Array,JSON,Array,Map,Set,Number,String,Math,Object,Error};
for(const file of ["financial-event-journal.js","accounting-controls.js","statement-close.js","double-entry.js","monthly-close.js"]){
 const s=read(file);new Script(s);runInNewContext(s,ctx);
}
const J=ctx.window.IncomeOSEventJournal,M=ctx.window.IncomeOSMonthlyClose;
const cash={institution:"Demo Checking",accountToken:"masked-checking-1001",balanceType:"asset",ownerConfirmed:true},
 card={institution:"Demo Card",accountToken:"masked-card-1002",balanceType:"liability",ownerConfirmed:true};
const accounts=[cash,card],ref=a=>a.institution+"|"+a.accountToken;
const bank=(a,id,n,dir)=>({institution:a.institution,accountToken:a.accountToken,transactionId:id,
 date:"2026-10-31",amountUsd:(n/100).toFixed(2),direction:dir,posted:true,currency:"USD"});
const bankRows=[
 bank(cash,"bank.earned.01",10000,"credit"),
 bank(card,"bank.purchase.01",2000,"debit"),
 bank(cash,"bank.cardpay.out",2000,"debit"),
 bank(card,"bank.cardpay.in",2000,"credit")
];
const bankId=b=>[b.institution,b.accountToken,b.transactionId].join("|");
let journal=[];
const timestamp="2026-11-01T20:10:00.000Z",day="2026-10-31";
const ev=(id,type,data)=>({id,type,timestamp,data});
async function add(name,classification,index){
 const row=bankRows[index],eventId="post."+name,sourceId="journal.bank."+name,evidenceId="bank.statement.001",cl="class."+name;
 for(const x of [
  ev(eventId,"POSTED",{sourceId,postedDate:day,direction:row.direction,amountCents:Math.round(Number(row.amountUsd)*100),currency:"USD",evidenceId}),
  ev(cl,"CLASSIFIED",{postedEventId:eventId,classification,evidenceId:"owner.classification.001"}),
  ev("review."+name,"OWNER_RECONCILED",{postedEventId:eventId,classificationEventId:cl,reviewEvidenceId:"owner.review.001"})
 ])journal=await J.append(journal,x);
 return {eventId,sourceId,evidenceId,bankSourceId:bankId(row)};
}
const received=await add("earned","earned_income",0);
const charged=await add("purchase","business_expense",1);
const outgoing=await add("card.out","transfer_out",2);
const incoming=await add("card.in","transfer_in",3);
const chart=[["cash.general","cash_asset"],["card.general","card_liability"],
 ["earned.revenue","earned_revenue"],["expense.office","business_expense"]]
 .map(([id,kind])=>({id,kind,ownerReviewed:true,evidenceId:"owner.chart.001"}));
const lines=(d,c,n)=>[
 {accountId:d,side:"debit",amountCents:n},
 {accountId:c,side:"credit",amountCents:n}
];
const entries=[
 {id:"entry.earned.01",date:day,kind:"EARNED_INCOME",evidenceId:"owner.posting.001",
  sourceEventIds:[received.eventId],lines:lines("cash.general","earned.revenue",10000)},
 {id:"entry.charge.01",date:day,kind:"BUSINESS_EXPENSE",evidenceId:"owner.posting.002",
  sourceEventIds:[charged.eventId],lines:lines("expense.office","card.general",2000)},
 {id:"entry.card.payment.01",date:day,kind:"CREDIT_CARD_PAYMENT",evidenceId:"owner.posting.003",
  sourceEventIds:[outgoing.eventId,incoming.eventId],lines:lines("card.general","cash.general",2000)}
];
const statement=(a,id,opening,closing,credits,debits,count)=>({
 institution:a.institution,accountToken:a.accountToken,statementId:id,
 evidenceId:"bank.statement.001",documentSha256:"a".repeat(64),
 startDate:"2026-10-01",endDate:day,openingCents:opening,closingCents:closing,
 totalCreditsCents:credits,totalDebitsCents:debits,postingCount:count,
 sourceVerified:true,currency:"USD"
});
const statementPackage={
 from:"2026-10-01",to:day,scopeConfirmed:true,expectedAccounts:accounts,bankRows,
 statements:[
  statement(cash,"checking.statement.001",10000,18000,10000,2000,2),
  statement(card,"card.statement.001",0,0,2000,2000,2)],
 accountingMatches:bankRows.map((b,i)=>({bankId:bankId(b),
   entryId:i===0?entries[0].id:i===1?entries[1].id:entries[2].id,
   state:"OWNER_REVIEWED_BANK_MATCH"}))
};
const sourceAccountMap=[
 {accountId:"cash.general",bankAccountId:ref(cash),evidenceId:"owner.mapping.001"},
 {accountId:"card.general",bankAccountId:ref(card),evidenceId:"owner.mapping.002"}
];
const sourceBindings=[received,charged,outgoing,incoming].map((r,i)=>({
 postedEventId:r.eventId,bankSourceId:r.bankSourceId,
 journalSourceId:r.sourceId,evidenceId:r.evidenceId,
 ledgerEntryId:i===0?entries[0].id:i===1?entries[1].id:entries[2].id
}));
const input={asOf:day,journal,chart,entries,statementPackage,sourceAccountMap,sourceBindings};
let result=await M.assess(input);
assert.equal(result.status,"READY_FOR_ACCOUNTANT_SOURCE_REVIEW_ONLY");
assert.equal(result.matchedBankPostings,4);
assert.equal(result.balancedEntries,3);
assert.equal(result.ownerReviewedEarnedIncomeCents,10000);
assert.equal(result.ownerReviewedInvestmentIncomeCents,0);
assert.equal(result.movementCreditsCents,result.movementDebitsCents);
assert.equal(result.bankStatementsIndependentlyAuthenticated,false);
assert.equal(result.readyForTaxFiling,false);
assert.equal(result.allRealWorldAccountsKnown,false);
assert.equal(result.hasAuthenticatedOwnerBackend,false);
assert.equal(result.canTransferOrInvest,false);
async function hold(over,code){
 const out=await M.assess({...input,...over});
 assert.equal(out.status,"HOLD",code);
 assert.equal(out.ownerReviewedEarnedIncomeCents,null,"Do not publish partial verified earnings");
 assert.equal(out.matchedBankPostings,null,"Do not publish partial source matches");
 assert.ok(out.issues.some(x=>x.code===code),"Missing "+code+" in "+JSON.stringify(out.issues));
}
await hold({asOf:"2026-11-01"},"CLOSE_DATE_MISMATCH");
await hold({statementPackage:{...statementPackage,from:"2026-10-02"}},"INVALID_CALENDAR_MONTH_WINDOW");
await hold({statementPackage:{...statementPackage,to:"2026-10-30"}},"INVALID_CALENDAR_MONTH_WINDOW");
await hold({entries:[{...entries[0],date:"2026-09-30"},...entries.slice(1)]},"ENTRY_OUTSIDE_CLOSE_WINDOW");

await hold({sourceBindings:sourceBindings.slice(1)},"UNBOUND_JOURNAL_POSTING");
await hold({sourceBindings:[...sourceBindings,sourceBindings[0]]},"INVALID_BANK_TO_LEDGER_BINDING");
await hold({sourceBindings:sourceBindings.map((x,i)=>i===0?{...x,journalSourceId:"bad.source.001"}:x)},"INVALID_BANK_TO_LEDGER_BINDING");
await hold({sourceBindings:sourceBindings.map((x,i)=>i===0?{...x,ledgerEntryId:entries[2].id}:x)},"INVALID_BANK_TO_LEDGER_BINDING");
await hold({sourceBindings:sourceBindings.map((x,i)=>i===0?{...x,bankSourceId:sourceBindings[2].bankSourceId}:x)},"INVALID_BANK_TO_LEDGER_BINDING");
await hold({sourceAccountMap:sourceAccountMap.slice(0,1)},"UNMAPPED_STATEMENT_ACCOUNT");
await hold({sourceAccountMap:[sourceAccountMap[0],{...sourceAccountMap[1],bankAccountId:ref(cash)}]},"INVALID_SOURCE_ACCOUNT_MAPPING");
await hold({statementPackage:{...statementPackage,scopeConfirmed:false}},"STATEMENT_RECONCILIATION_HOLD");
await hold({statementPackage:{...statementPackage,bankRows:bankRows.slice(0,3)}},"STATEMENT_RECONCILIATION_HOLD");
await hold({statementPackage:{...statementPackage,
 accountingMatches:statementPackage.accountingMatches.map((r,i)=>i===0?{...r,entryId:entries[2].id}:r)
}},"INVALID_BANK_TO_LEDGER_BINDING");
await hold({entries:entries.slice(0,2)},"DOUBLE_ENTRY_REVIEW_HOLD");
await hold({entries:entries.map((e,i)=>i===2?{...e,lines:lines("card.general","cash.general",2001)}:e)},"DOUBLE_ENTRY_REVIEW_HOLD");
await hold({chart:chart.map(a=>a.id==="cash.general"?{...a,ownerReviewed:false}:a)},"DOUBLE_ENTRY_REVIEW_HOLD");
const broken=JSON.parse(JSON.stringify(journal));broken[0].data.amountCents=10;
await assert.rejects(M.assess({...input,journal:broken}),/modified/);
await assert.rejects(M.assess({...input,statementPackage:null}),/source packages/);
assert.doesNotMatch(read("monthly-close.js"),/fetch\s*\(|localStorage|XMLHttpRequest|WebSocket|sendBeacon/);
console.log("IncomeOS monthly close QA passed: bank source-to-account mapping, card payment, debits/credits, statement coverage, strict fail-closed reports.");
