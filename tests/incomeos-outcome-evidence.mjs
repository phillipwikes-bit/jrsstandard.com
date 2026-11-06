import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const {reconcile}=require("../owner/incomeos/outcome-reconciliation.js");
const entry={id:"bank-1",amountCents:12500,accountId:"account-1",posted:true,sourceVerified:true,currency:"USD",institutionId:"institution-1",postedDate:"2026-11-06",direction:"credit"};
const outcome={statementEntryId:"bank-1",amountCents:12500,accountId:"account-1",currency:"USD",institutionId:"institution-1",postedDate:"2026-11-06",type:"EARNED_INCOME"};
assert.equal(reconcile([outcome],[entry]).status,"RECONCILED_REVIEW_ONLY");
for(const date of ["2026-02-30","2026-13-01","2026-11-6"]){
 assert.equal(reconcile([{...outcome,postedDate:date}],[entry]).status,"HOLD");
 assert.equal(reconcile([outcome],[{...entry,postedDate:date}]).status,"HOLD");
}
for(const currency of ["usd","US","USDD"]){
 assert.equal(reconcile([{...outcome,currency}],[entry]).status,"HOLD");
 assert.equal(reconcile([outcome],[{...entry,currency}]).status,"HOLD");
}
for(const amountCents of [0,-12500]){
 assert.equal(reconcile([outcome],[{...entry,amountCents}]).status,"HOLD");
}
assert.equal(reconcile([outcome,outcome],[entry]).status,"HOLD");
assert.equal(reconcile([outcome],[entry]).transferAuthorized,false);
console.log("Statement-backed outcome reconciliation rejects invalid financial evidence.");
