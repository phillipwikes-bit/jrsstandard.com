import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const ctx={window:{}};
vm.runInNewContext(readFileSync(new URL("../owner/incomeos/source-attestation.js",import.meta.url),"utf8"),ctx);
const verify=ctx.window.IncomeOSSourceAttestation.verify;
const now="2026-11-02T18:00:00Z";
const good={connectionStatus:"linked",coverageComplete:true,balanceSourceVerified:true,statementReconciled:true,sourceEvidenceId:"statement-1",verifiedAt:"2026-11-02T17:00:00Z"};
assert.equal(verify(good,now).status,"EVIDENCE_REVIEW_ONLY");
assert.equal(verify(good,now).availableToInvestCents,null);
assert.equal(verify(good,now).authorizationToTransfer,false);
for(const [field,value,reason] of [
 ["connectionStatus","error","CONNECTION_NOT_LINKED"],
 ["coverageComplete",false,"COVERAGE_INCOMPLETE"],
 ["balanceSourceVerified",false,"BALANCE_SOURCE_UNVERIFIED"],
 ["statementReconciled",false,"STATEMENT_NOT_RECONCILED"],
 ["sourceEvidenceId"," ","EVIDENCE_REFERENCE_MISSING"],
 ["verifiedAt","2026-10-31T17:00:00Z","VERIFICATION_STALE"],
 ["verifiedAt","2026-11-03T17:00:00Z","VERIFICATION_IN_FUTURE"],
 ["verifiedAt","bad","VERIFICATION_TIME_MISSING"]
]){
 const result=verify({...good,[field]:value},now);
 assert.equal(result.status,"HOLD",field);
 assert.equal(result.reasons.includes(reason),true,field);
 assert.equal(result.authorizationToTransfer,false);
}
assert.equal(verify(null,now).status,"HOLD");
assert.equal(verify(good,"invalid").status,"HOLD");
console.log("IncomeOS financial source attestation tests passed");
