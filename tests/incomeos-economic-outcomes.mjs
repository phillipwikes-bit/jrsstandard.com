import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const ctx={window:{}};
vm.runInNewContext(readFileSync(new URL("../owner/incomeos/economic-outcomes.js",import.meta.url),"utf8"),ctx);
const review=ctx.window.IncomeOSEconomicOutcomes.review;
const base={id:"a",type:"EARNED_INCOME",amountCents:10000,posted:true,sourceVerified:true,evidenceId:"bank-row-1"};
const verified=review([base,{...base,id:"b",type:"BILL_SAVINGS",amountCents:2500,baselineVerified:true},{...base,id:"c",type:"REFUND",amountCents:500,originalChargeVerified:true},{...base,id:"d",type:"RETURNED_PRINCIPAL",amountCents:3000,principalBasisVerified:true}]);
assert.equal(verified.status,"EVIDENCE_REVIEW_ONLY");
assert.equal(verified.verifiedBenefitCents,12500);
assert.equal(verified.totals.REFUND,500);
assert.equal(verified.totals.RETURNED_PRINCIPAL,3000);
assert.equal(verified.availableToInvestCents,null);
assert.equal(verified.transferAuthorized,false);
for(const [change,code] of [
 [{posted:false},"UNVERIFIED_OUTCOME"],
 [{sourceVerified:false},"UNVERIFIED_OUTCOME"],
 [{evidenceId:""},"UNVERIFIED_OUTCOME"],
 [{amountCents:-1},"INVALID_AMOUNT"],
 [{amountCents:1.5},"INVALID_AMOUNT"],
 [{type:"UNCLASSIFIED"},"UNKNOWN_CLASSIFICATION"],
 [{type:"BILL_SAVINGS"},"SAVINGS_BASELINE_MISSING"],
 [{type:"REFUND"},"REFUND_LINK_MISSING"],
 [{type:"RETURNED_PRINCIPAL"},"PRINCIPAL_BASIS_MISSING"]
]){
 const x=review([{...base,...change}]);
 assert.equal(x.status,"HOLD",code);
 assert.equal(x.issues[0].code,code);
}
assert.equal(review([base,{...base,id:" a "}]).status,"HOLD");
assert.equal(review(null).status,"HOLD");
console.log("IncomeOS economic outcomes tests passed");
