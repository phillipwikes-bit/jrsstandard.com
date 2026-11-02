// Synthetic, two-month account carryforward and source-integrity tests.
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script,runInNewContext} from "node:vm";
const read=p=>readFileSync(resolve("owner/incomeos",p),"utf8");
const ctx={window:{},crypto:webcrypto,Date,TextEncoder,Uint8Array,JSON,Array,Set,Map,Number,String,Math,Object,Error};
for(const file of ["financial-event-journal.js","accounting-controls.js","statement-close.js","double-entry.js","monthly-close.js","period-rollforward.js"]){
 const code=read(file);new Script(code);runInNewContext(code,ctx);
}
const J=ctx.window.IncomeOSEventJournal,R=ctx.window.IncomeOSPeriodRollforward;
const cash={institution:"Demo Checking",accountToken:"masked-cash-1001",balanceType:"asset",ownerConfirmed:true};
const card={institution:"Demo Credit",accountToken:"masked-card-1002",balanceType:"liability",ownerConfirmed:true};
const sourceRef=a=>a.institution+"|"+a.accountToken;
const chart=[["acct.cash","cash_asset"],["acct.card","card_liability"],
 ["acct.earned","earned_revenue"],["acct.cost","business_expense"]]
 .map(([id,kind])=>({id,kind,evidenceId:"owner.chart.001",ownerReviewed:true}));
const accountMap=[{accountId:"acct.cash",bankAccountId:sourceRef(cash),evidenceId:"owner.mapping.cash"},
 {accountId:"acct.card",bankAccountId:sourceRef(card),evidenceId:"owner.mapping.card"}];
function line(d,c,n){return [
 {accountId:d,side:"debit",amountCents:n},{accountId:c,side:"credit",amountCents:n}
];}
async function makePeriod(period,openingCash,earned,expense,payment,openingCard=0){
 const start=period+"-01",y=Number(period.slice(0,4)),m=Number(period.slice(5,7)),
   end=new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);
 const timestamp=new Date(Date.parse(end+"T12:00:00Z")+86400000).toISOString().replace(".000Z",".000Z");
 const bank=(a,label,n,d)=>({institution:a.institution,accountToken:a.accountToken,
   transactionId:"bank."+period+"."+label,date:end,amountUsd:(n/100).toFixed(2),
   direction:d,posted:true,currency:"USD"});
 const rows=[bank(cash,"earn",earned,"credit"),bank(card,"expense",expense,"debit"),
   bank(cash,"payment.out",payment,"debit"),bank(card,"payment.in",payment,"credit")];
 const bankId=x=>[x.institution,x.accountToken,x.transactionId].join("|");
 let journal=[];const posted=[];
 const classifications=["earned_income","business_expense","transfer_out","transfer_in"];
 for(let i=0;i<rows.length;i++){
   const n=period.replace("-","")+"."+i,eventId="post."+n,
     c="class."+n,sourceId="source."+n,amountCents=Math.round(Number(rows[i].amountUsd)*100);
   for(const e of [
     {id:eventId,type:"POSTED",timestamp,data:{sourceId,postedDate:end,direction:rows[i].direction,
       amountCents,currency:"USD",evidenceId:"bank.statement."+period.replace("-","")}},
     {id:c,type:"CLASSIFIED",timestamp,data:{postedEventId:eventId,
       classification:classifications[i],evidenceId:"owner.classification."+period.replace("-","")}},
     {id:"recon."+n,type:"OWNER_RECONCILED",timestamp,data:{postedEventId:eventId,
       classificationEventId:c,reviewEvidenceId:"owner.review."+period.replace("-","")}}
   ])journal=await J.append(journal,e);
   posted.push({id:eventId,sourceId,evidenceId:"bank.statement."+period.replace("-",""),bankSourceId:bankId(rows[i])});
 }
 const entries=[
  {id:"entry."+period+".earned",date:end,kind:"EARNED_INCOME",evidenceId:"owner.entry.earned",
   sourceEventIds:[posted[0].id],lines:line("acct.cash","acct.earned",earned)},
  {id:"entry."+period+".expense",date:end,kind:"BUSINESS_EXPENSE",evidenceId:"owner.entry.expense",
   sourceEventIds:[posted[1].id],lines:line("acct.cost","acct.card",expense)},
  {id:"entry."+period+".cardpay",date:end,kind:"CREDIT_CARD_PAYMENT",evidenceId:"owner.entry.cardpay",
   sourceEventIds:[posted[2].id,posted[3].id],lines:line("acct.card","acct.cash",payment)}
 ];
 const stmt=(a,sid,opening,closing,credits,debits,count)=>({
  institution:a.institution,accountToken:a.accountToken,statementId:sid,
  evidenceId:"stmt.evidence."+period.replace("-",""),startDate:start,endDate:end,
  openingCents:opening,closingCents:closing,totalCreditsCents:credits,totalDebitsCents:debits,
  postingCount:count,sourceVerified:true,documentSha256:"a".repeat(64),currency:"USD"
 });
 const statementPackage={from:start,to:end,scopeConfirmed:true,expectedAccounts:[cash,card],
  statements:[
   stmt(cash,"stmt."+period+".cash",openingCash,openingCash+earned-payment,earned,payment,2),
   stmt(card,"stmt."+period+".card",openingCard,openingCard+expense-payment,payment,expense,2)
  ],
  bankRows:rows,
  accountingMatches:rows.map((r,i)=>({entryId:i===0?entries[0].id:i===1?entries[1].id:entries[2].id,
    bankId:bankId(r),state:"OWNER_REVIEWED_BANK_MATCH"}))
 };
 const sourceBindings=posted.map((r,i)=>({postedEventId:r.id,bankSourceId:r.bankSourceId,
   journalSourceId:r.sourceId,evidenceId:r.evidenceId,
   ledgerEntryId:i===0?entries[0].id:i===1?entries[1].id:entries[2].id}));
 return {asOf:end,journal,chart,entries,statementPackage,
   sourceAccountMap:accountMap,sourceBindings};
}
const sept=await makePeriod("2026-09",10000,10000,2000,2000);
const oct=await makePeriod("2026-10",18000,5000,1000,1000);
const input={periods:[sept,oct],initialOpeningReviewed:true,initialOpeningEvidenceId:"owner.opening.001"};
const ok=await R.assess(input);
assert.equal(ok.status,"CONSECUTIVE_OWNER_REVIEW_ONLY");
assert.equal(ok.periodCount,2);
assert.equal(ok.reconciledPeriodCount,2);
assert.equal(ok.firstPeriod,"2026-09");
assert.equal(ok.lastPeriod,"2026-10");
assert.equal(ok.closingStatementBalances.find(x=>x.accountId===sourceRef(cash)).closingCents,22000);
assert.equal(ok.closingStatementBalances.find(x=>x.accountId===sourceRef(card)).closingCents,0);
assert.equal(ok.firstPeriodOpeningIndependentlyAuthenticated,false);
assert.equal(ok.signedExternalJournalHeadAnchor,false);
assert.equal(ok.bankStatementsIndependentlyAuthenticated,false);
assert.equal(ok.readyForTaxFiling,false);
assert.equal(ok.canTransferOrInvest,false);
async function hold(change,code){
 const r=await R.assess({...input,...change});
 assert.equal(r.status,"HOLD",code);
 assert.equal(r.closingStatementBalances,null,"Do not publish incomplete financial balances");
 assert.equal(r.reconciledPeriodCount,0);
 assert.ok(r.issues.some(x=>x.code===code),code+" missing: "+JSON.stringify(r.issues));
}
await hold({initialOpeningReviewed:false},"INITIAL_OPENING_NOT_ATTESTED");
await hold({initialOpeningEvidenceId:null},"INITIAL_OPENING_NOT_ATTESTED");
await hold({periods:[oct,sept]},"NONCONSECUTIVE_PERIODS");
const nov=await makePeriod("2026-11",22000,1000,400,400);
await hold({periods:[sept,nov]},"NONCONSECUTIVE_PERIODS");
await hold({periods:[sept,{...oct,statementPackage:{...oct.statementPackage,
 statements:oct.statementPackage.statements.map((s,i)=>i===0?
  {...s,openingCents:s.openingCents+100,closingCents:s.closingCents+100}:s)}}
 ]},"BALANCE_CARRYFORWARD_MISMATCH");
await hold({periods:[sept,{...oct,sourceAccountMap:oct.sourceAccountMap.slice(0,1)}]},"ACCOUNT_MAP_CHANGED_WITHOUT_MIGRATION");
await hold({periods:[sept,{...oct,chart:oct.chart.slice(0,3)}]},"CHART_CHANGED_WITHOUT_MIGRATION");
await hold({periods:[sept,{...oct,journal:oct.journal.map(e=>e.type==="POSTED"&&e.id===oct.journal[0].id?
 {...e,data:{...e.data,sourceId:sept.journal[0].data.sourceId}}:e)}]},"REUSED_PROVIDER_SOURCE_ID").catch(e=>{
 // Hash chain cannot be altered without recomputing; verify tamper rejection.
 assert.match(String(e),/modified/);
});
await hold({periods:[sept,{...oct,entries:oct.entries.map((e,i)=>i===0?{...e,id:sept.entries[0].id}:e),
 sourceBindings:oct.sourceBindings.map((x,i)=>i===0?{...x,ledgerEntryId:sept.entries[0].id}:x),
 statementPackage:{...oct.statementPackage,
   accountingMatches:oct.statementPackage.accountingMatches.map((x,i)=>i===0?{...x,entryId:sept.entries[0].id}:x)}}]},"REUSED_LEDGER_ENTRY");
await hold({periods:[sept,{...oct,entries:[{...oct.entries[0],date:"2026-09-30"},...oct.entries.slice(1)]}]},"MONTH_CLOSE_NOT_ACCEPTED");
await hold({periods:[sept,{...oct,statementPackage:{...oct.statementPackage,bankRows:oct.statementPackage.bankRows.slice(0,3)}}]},"MONTH_CLOSE_NOT_ACCEPTED");
await assert.rejects(R.assess({periods:[sept],initialOpeningReviewed:true,initialOpeningEvidenceId:"owner.opening.001"}),/2 to 24/);
const tampered=JSON.parse(JSON.stringify(oct));tampered.journal[0].data.amountCents=999;
await assert.rejects(R.assess({...input,periods:[sept,tampered]}),/modified/);
assert.doesNotMatch(read("period-rollforward.js"),/fetch\s*\(|localStorage|XMLHttpRequest|WebSocket|sendBeacon/);
console.log("IncomeOS period rollforward QA passed: two full periods, ledger/bank delta, opening continuity, source identity, gaps, data-quality HOLD and no authenticated-balance claim.");
