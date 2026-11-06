import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const context={window:{},URL,Date,Number,Array,Object,String,Math,RangeError};
runInNewContext(readFileSync("owner/incomeos/decision-engine.js","utf8"),context);
const review=context.window.IncomeOSDecisionEngine.review;
const asset={id:"synthetic-asset",sourceUrl:"https://example.org/offer",reviewed:"2026-11-06",capitalUsd:100};
const flags={specificOffer:true,eligibility:true,counterparty:true,cashflow:true,fees:true,liquidity:true,reserve:true,ownerDecision:true,proposedCapital:100,confirmedCapacity:100};
const at={today:"2026-11-06"};
assert.equal(review(asset,flags,at).status,"READY_FOR_MANUAL_REVIEW");
for(const name of ["specificOffer","eligibility","counterparty","cashflow","fees","liquidity","reserve","ownerDecision"]){
  assert.equal(review(asset,{...flags,[name]:"true"},at).status,"HOLD",name+" requires actual attestation");
}
for(const value of ["", " ",null,undefined,"not-a-number"]){
  assert.equal(review(asset,{...flags,confirmedCapacity:value},at).status,"HOLD","invalid capacity must hold");
}
for(const sourceUrl of ["https://user:password@example.org/offer","javascript:alert(1)","http://example.org","https://"]){
  assert.equal(review({...asset,sourceUrl},flags,at).status,"HOLD","unsafe source must hold");
}
assert.equal(review(asset,{...flags,proposedCapital:101},at).status,"HOLD");
assert.equal(review(asset,flags,at).executable,false);
console.log("Investment review gate rejects unverified flags, invalid capital, and unsafe source links.");
