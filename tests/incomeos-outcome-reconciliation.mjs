import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const ctx={window:{}};
vm.runInNewContext(readFileSync(new URL("../owner/incomeos/outcome-reconciliation.js",import.meta.url),"utf8"),ctx);
const reconcile=ctx.window.IncomeOSOutcomeReconciliation.reconcile;
const entry={id:"tx-1",accountId:"acct-a",amountCents:12500,posted:true,sourceVerified:true,currency:"USD",institutionId:"bank-a",postedDate:"2026-11-01"};
const outcome={statementEntryId:"tx-1",accountId:"acct-a",amountCents:12500,type:"EARNED_INCOME",currency:"USD",institutionId:"bank-a",postedDate:"2026-11-01"};
const ok=reconcile([outcome],[entry]);
assert.equal(ok.status,"RECONCILED_REVIEW_ONLY");
assert.equal(ok.matchedCents.EARNED_INCOME,12500);
assert.equal(ok.availableToInvestCents,null);
assert.equal(ok.transferAuthorized,false);
for(const [o,e,code] of [
 [{...outcome,amountCents:12501},entry,"STATEMENT_MISMATCH"],
 [{...outcome,accountId:"acct-b"},entry,"STATEMENT_MISMATCH"],
 [{...outcome,statementEntryId:"unknown"},entry,"STATEMENT_ENTRY_MISSING"],
 [{...outcome,type:"BILL_SAVINGS"},entry,"SAVINGS_NOT_CASH_DEPOSIT"],
 [{...outcome,type:"OTHER"},entry,"UNKNOWN_OUTCOME_TYPE"],
 [outcome,{...entry,sourceVerified:false},"INVALID_STATEMENT_ENTRY"],
 [outcome,{...entry,posted:false},"INVALID_STATEMENT_ENTRY"]
]){
 const result=reconcile([o],[e]);
 assert.equal(result.status,"HOLD",code);
 assert.equal(result.issues.some(x=>x.code===code),true,code);
 assert.equal(result.matchedCents,null);
}
const reused=reconcile([outcome,outcome],[entry]);
assert.equal(reused.status,"HOLD");
assert.equal(reused.issues.some(x=>x.code==="STATEMENT_ENTRY_REUSED"),true);
assert.equal(reconcile(null,[]).status,"HOLD");
console.log("IncomeOS outcome reconciliation tests passed");
