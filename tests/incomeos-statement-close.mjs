// Synthetic-only provider-statement reconciliation tests.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script,runInNewContext} from "node:vm";
const ctx={window:{},Date,Math,Number,Array,Map,Set,Object,String,JSON,Error};
for(const name of ["accounting-controls.js","statement-close.js"]){const src=readFileSync(resolve("owner/incomeos",name),"utf8");new Script(src);runInNewContext(src,ctx);}
const S=ctx.window.IncomeOSStatementClose,hash="a".repeat(64);
const a1={institution:"Demo Bank",accountToken:"masked-checking-1001",balanceType:"asset",ownerConfirmed:true};
const a2={institution:"Demo Card",accountToken:"masked-credit-1002",balanceType:"liability",ownerConfirmed:true};
const stmt=(ac,id,start,end,open,close,credits,debits,count)=>({
  statementId:id,evidenceId:"statement.evidence.2026",institution:ac.institution,accountToken:ac.accountToken,
  startDate:start,endDate:end,openingCents:open,closingCents:close,
  totalCreditsCents:credits,totalDebitsCents:debits,postingCount:count,documentSha256:hash,sourceVerified:true,currency:"USD"
});
const bank=(ac,id,date,cents,direction)=>({institution:ac.institution,accountToken:ac.accountToken,transactionId:id,
  date,amountUsd:(cents/100).toFixed(2),direction,posted:true,currency:"USD",description:"synthetic posting"});
const row1=bank(a1,"txn.credit.1","2026-10-10",5000,"credit");
const row2=bank(a1,"txn.debit.2","2026-10-20",2000,"debit");
const row3=bank(a2,"txn.charge.3","2026-10-08",3000,"debit");
const row4=bank(a2,"txn.payment.4","2026-10-23",1000,"credit");
const rows=[row1,row2,row3,row4];
const bankId=r=>[r.institution,r.accountToken,r.transactionId].join("|");
const matches=rows.map((r,i)=>({entryId:"ledger.entry."+i,bankId:bankId(r),state:"OWNER_REVIEWED_BANK_MATCH"}));
const statements=[
  stmt(a1,"checking.period.a","2026-10-01","2026-10-15",10000,15000,5000,0,1),
  stmt(a1,"checking.period.b","2026-10-16","2026-10-31",15000,13000,0,2000,1),
  stmt(a2,"card.period.full","2026-10-01","2026-10-31",0,2000,1000,3000,2)
];
const args={from:"2026-10-01",to:"2026-10-31",expectedAccounts:[a1,a2],
  statements,bankRows:rows,accountingMatches:matches,scopeConfirmed:true};
let result=S.assess(args);
assert.equal(result.gate.status,"READY_FOR_ACCOUNTANT_SOURCE_REVIEW");
assert.equal(result.declaredAccounts,2);
assert.equal(result.statementsReviewed,3);
assert.equal(result.bankPostingsReviewed,4);
assert.equal(result.ownerReviewedLinks,4);
assert.equal(result.accounts[0].complete,true);
assert.equal(result.accounts[1].balanceType,"liability");
assert.equal(result.gate.independentlyBankAuthenticated,false);
assert.equal(result.gate.allRealWorldAccountsKnown,false);
assert.equal(result.gate.readyForTaxFiling,false);
assert.equal(result.gate.canTransferOrInvest,false);
function failWith(newArgs,code){
  const r=S.assess({...args,...newArgs});
  assert.equal(r.gate.status,"HOLD");
  assert.ok(r.issues.some(x=>x.code===code),"Missing expected issue "+code+": "+r.issues.map(x=>x.code).join(","));
}
failWith({scopeConfirmed:false},"SCOPE_NOT_CONFIRMED");
failWith({expectedAccounts:[a1,a2,{...a1,accountToken:"masked-extra-3001"}]},"MISSING_STATEMENT");
failWith({expectedAccounts:[a1]},"UNDECLARED_STATEMENT_ACCOUNT");
failWith({accountingMatches:matches.slice(0,3)},"UNRECONCILED_POSTING");
failWith({accountingMatches:matches.concat(matches[0])},"REUSED_BANK_MATCH");
failWith({accountingMatches:matches.concat([{entryId:"ledger.extra.0",bankId:"Demo Bank|masked-checking-1001|txn.missing",state:"OWNER_REVIEWED_BANK_MATCH"}])},"MATCH_WITHOUT_SOURCE");
failWith({bankRows:rows.slice(0,3)},"POSTING_COUNT_MISMATCH");
failWith({bankRows:rows.concat(row1)},"REPEATED_POSTED_SOURCE");
failWith({bankRows:rows.concat({...row1,amountUsd:"55.00"})},"CONFLICTING_POSTED_SOURCE");
failWith({bankRows:rows.map((x,i)=>i===0?{...x,posted:false}:x)},"INVALID_POSTING");
failWith({bankRows:rows.map((x,i)=>i===0?{...x,currency:"EUR"}:x)},"INVALID_POSTING");
failWith({statements:[{...statements[0],sourceVerified:false},statements[1],statements[2]]},"INVALID_STATEMENT");
failWith({statements:[{...statements[0],postingCount:2},statements[1],statements[2]]},"POSTING_COUNT_MISMATCH");
failWith({statements:[{...statements[0],totalCreditsCents:6000},statements[1],statements[2]]},"STATEMENT_FLOW_MISMATCH");
failWith({statements:[{...statements[0],closingCents:16000},statements[1],statements[2]]},"STATEMENT_BALANCE_MISMATCH");
failWith({statements:[statements[0],{...statements[1],startDate:"2026-10-17"},statements[2]]},"GAPPED_OR_OVERLAPPING_STATEMENTS");
failWith({statements:[statements[0],{...statements[1],openingCents:14000},statements[2]]},"BALANCE_CONTINUITY_FAILURE");
failWith({statements:[statements[0],statements[2]]},"INCOMPLETE_DATE_COVERAGE");
failWith({statements:[statements[0],statements[0],statements[1],statements[2]]},"DUPLICATE_STATEMENT");
failWith({expectedAccounts:[a1,{...a1},a2]},"DUPLICATE_ACCOUNT");
failWith({expectedAccounts:[{...a1,ownerConfirmed:false},a2]},"INVALID_ACCOUNT");
assert.throws(()=>S.assess({...args,from:"2026-02-30"}),/Invalid reporting interval/);
assert.throws(()=>S.assess({...args,expectedAccounts:undefined}),/arrays are mandatory/);
assert.throws(()=>S.assess({...args,from:"2025-01-01"}),/Invalid reporting interval/);
assert.throws(()=>S.validateManifest({...a1,accountToken:"1234567890123456"}),/Invalid financial source identity/);
assert.throws(()=>S.validateStatement({...statements[0],documentSha256:"wrong"}),/source evidence/);
const source=readFileSync(resolve("owner/incomeos","statement-close.js"),"utf8");
assert.doesNotMatch(source,/fetch\s*\(|localStorage|XMLHttpRequest|WebSocket|sendBeacon/);
console.log("IncomeOS statement-close QA passed: source counts, posted flow, asset/liability balances, contiguous statements, owner matching, scope holds and safety.");
