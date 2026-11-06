import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const context={window:{}};
vm.runInNewContext(readFileSync(new URL("../owner/incomeos/release-gate.js",import.meta.url),"utf8"),context);
const assess=context.window.IncomeOSReleaseGate.assess;
assert.equal(assess(null).status,"HOLD");
assert.equal(assess({}).failures.includes("NO_EVENTS"),true);
const forged={events:[{id:"fake"}],statementEntries:[{id:"fake"}],serverAuthenticated:true,ownerAccessVerified:true,reconciliationComplete:true,auditLogDurable:true,releaseSecurityApproved:true};
const result=assess(forged);
assert.equal(result.status,"HOLD");
assert.equal(result.failures.includes("INDEPENDENT_SOURCE_VERIFICATION_REQUIRED"),true);
assert.equal(result.incomeCents,null);
assert.equal(result.availableToInvestCents,null);
assert.equal(result.transferAuthorized,false);
assert.equal(result.investmentExecutionEnabled,false);
// A static client cannot grant release authority by supplying its own evidence flags.
for (const mutation of [
  { independentSourceVerified: true, externalAuditApproved: true },
  { productionReady: true, releaseApproved: true, bankAuthenticated: true },
  { incomeCents: 500000, availableToInvestCents: 500000, transferAuthorized: true, investmentExecutionEnabled: true },
  { events: [{id:"a", amountCents:500000}], statementEntries:[{id:"a", amountCents:500000}] }
]) {
  const checked=assess({...forged,...mutation});
  assert.equal(checked.status,"HOLD");
  assert.ok(checked.failures.includes("INDEPENDENT_SOURCE_VERIFICATION_REQUIRED"));
  assert.equal(checked.incomeCents,null);
  assert.equal(checked.availableToInvestCents,null);
  assert.equal(checked.transferAuthorized,false);
  assert.equal(checked.investmentExecutionEnabled,false);
}
for (const invalid of [[], "approved", true, 1]) {
  const checked=assess(invalid);
  assert.equal(checked.status,"HOLD");
  assert.ok(checked.failures.includes("INVALID_INPUT"));
  assert.equal(checked.transferAuthorized,false);
}
console.log("IncomeOS release gate tests passed");
