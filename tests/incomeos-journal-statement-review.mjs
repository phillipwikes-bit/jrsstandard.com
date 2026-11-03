// Synthetic-only regression checks for the review of statement-close.js and financial-event-journal.js.
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runInNewContext} from "node:vm";
const read=p=>readFileSync(resolve("owner/incomeos",p),"utf8");
const ctx={window:{},crypto:webcrypto,Date,TextEncoder,Uint8Array,Number,Array,Object,String,Map,Set,JSON,Math,Error};
for(const f of ["accounting-controls.js","statement-close.js","financial-event-journal.js"])runInNewContext(read(f),ctx);
const S=ctx.window.IncomeOSStatementClose,J=ctx.window.IncomeOSEventJournal;
const plain=v=>JSON.parse(JSON.stringify(v));
const acct={institution:"Demo Bank",accountToken:"masked-chk-1001",balanceType:"asset",ownerConfirmed:true};
const other={institution:"Demo Save",accountToken:"masked-sav-1002",balanceType:"asset",ownerConfirmed:true};
const row=(a,tx,cents,dir)=>({institution:a.institution,accountToken:a.accountToken,transactionId:tx,date:"2026-10-05",amountUsd:(cents/100).toFixed(2),direction:dir,posted:true,currency:"USD"});
const stmt=(a,id,open,close,cr,db,n)=>({institution:a.institution,accountToken:a.accountToken,statementId:id,evidenceId:"synthetic.statement",startDate:"2026-10-01",endDate:"2026-10-31",openingCents:open,closingCents:close,totalCreditsCents:cr,totalDebitsCents:db,postingCount:n,documentSha256:"a".repeat(64),sourceVerified:true,currency:"USD"});
const pkg=(rows,statements,links,accounts=[acct])=>({from:"2026-10-01",to:"2026-10-31",scopeConfirmed:true,expectedAccounts:accounts,statements,bankRows:rows,accountingMatches:links});
const link=(r,e)=>({bankId:[r.institution,r.accountToken,r.transactionId].join("|"),entryId:e,state:"OWNER_REVIEWED_BANK_MATCH"});

// 1. A numeric bank transaction reference can be linked.
{const r=row(acct,"202611030001234",5000,"credit");
const out=plain(S.assess(pkg([r],[stmt(acct,"stmt.chk.10",0,5000,5000,0,1)],[link(r,"ledger.entry.001")])));
assert.equal(out.gate.status,"READY_FOR_ACCOUNTANT_SOURCE_REVIEW",out.issues.map(i=>i.code).join(","));}

// 3. A malformed posting marks its account incomplete.
{const good=row(acct,"tx.good.0001",5000,"credit"),bad={...row(acct,"tx.bad.0001",1,"credit"),amountUsd:"12.345"};
const out=plain(S.assess(pkg([good,bad],[stmt(acct,"stmt.chk.10",0,5000,5000,0,1)],[link(good,"ledger.entry.001")])));
assert.equal(out.accounts[0].complete,false);
assert.equal(out.issues.find(i=>i.code==="INVALID_POSTING").accountId,"Demo Bank|masked-chk-1001");}

// 6. Every per-account row has the same fields.
{const r=row(acct,"tx.good.0002",5000,"credit");
const out=plain(S.assess(pkg([r],[stmt(acct,"stmt.chk.10",0,5000,5000,0,1)],[link(r,"ledger.entry.001")],[acct,other])));
const keys=out.accounts.map(a=>Object.keys(a).sort().join(","));
assert.equal(new Set(keys).size,1,keys.join(" | "));
assert.equal(out.accounts.find(a=>a.statements===0).creditsUsd,0);}

// 9. Bank rows are grouped by account once, not rescanned per statement.
assert.doesNotMatch(read("statement-close.js"),/bank\.filter\(function\(b\)\{return b\.accountId===acct\.id/);

const ev=(id,type,timestamp,data)=>({id,type,timestamp,data});
// 2. Chronology compares instants: ".500Z" after ":00Z" in the same second is later, not earlier.
{let j=[];
j=await J.append(j,ev("post.a.0001","POSTED","2026-11-01T00:00:00Z",{sourceId:"bank.a.0001",postedDate:"2026-11-01",direction:"credit",amountCents:10,currency:"USD",evidenceId:"bank.statement.001"}));
j=await J.append(j,ev("post.b.0001","POSTED","2026-11-01T00:00:00.500Z",{sourceId:"bank.b.0001",postedDate:"2026-11-01",direction:"credit",amountCents:20,currency:"USD",evidenceId:"bank.statement.001"}));
assert.equal((await J.verify(j)).count,2);
let back=[];
back=await J.append(back,ev("post.c.0001","POSTED","2026-11-01T00:00:00.500Z",{sourceId:"bank.c.0001",postedDate:"2026-11-01",direction:"credit",amountCents:10,currency:"USD",evidenceId:"bank.statement.001"}));
await assert.rejects(J.append(back,ev("post.d.0001","POSTED","2026-11-01T00:00:00Z",{sourceId:"bank.d.0001",postedDate:"2026-11-01",direction:"credit",amountCents:10,currency:"USD",evidenceId:"bank.statement.001"})),/precede/);

}
// 5. Derived totals are summed in cents (own journal, whole-second timestamps).
{let j=[];
for(const [n,label,c] of [["e","earned_income",10],["i","investment_income",20]]){
 const t="2026-11-01T01:00:0"+(n==="e"?"0":"1")+"Z",pid="post."+n+".0002";
 j=await J.append(j,ev(pid,"POSTED",t,{sourceId:"bank."+n+".0002",postedDate:"2026-11-01",direction:"credit",amountCents:c,currency:"USD",evidenceId:"bank.statement.001"}));
 j=await J.append(j,ev("class."+n+".0002","CLASSIFIED",t,{postedEventId:pid,classification:label,evidenceId:"owner.class.001"}));
 j=await J.append(j,ev("rev."+n+".0002","OWNER_RECONCILED",t,{postedEventId:pid,classificationEventId:"class."+n+".0002",reviewEvidenceId:"owner.review.001"}));
}
assert.equal((await J.report(j)).totalReceivedIncomeUsd,0.3);

}
// 10. A document match against a missing posting says so.
{await assert.rejects(J.append([],ev("doc.x.0001","DOCUMENT_MATCHED","2026-11-02T00:00:00Z",{postedEventId:"post.none.0001",documentId:"document.x.0001",amountCents:10})),/requires an active posted source/);}

// 8. Eligibility reads the running state; it no longer rebuilds history per event.
assert.doesNotMatch(read("financial-event-journal.js"),/function assertEligible\(e,events\)/);

// 7. Without Web Crypto the intended error appears, not a ReferenceError.
{const bare={window:{},Date,TextEncoder,Uint8Array,Number,Array,Object,String,Map,Set,JSON,Math,Error};
runInNewContext(read("financial-event-journal.js"),bare);
await assert.rejects(bare.window.IncomeOSEventJournal.append([],ev("post.z.0001","POSTED","2026-11-01T00:00:00Z",{sourceId:"bank.z.0001",postedDate:"2026-11-01",direction:"credit",amountCents:1,currency:"USD",evidenceId:"bank.statement.001"})),/Cryptographic hash unavailable/);}
console.log("IncomeOS journal and statement-close review checks passed (9 findings; 1 rejected).");
