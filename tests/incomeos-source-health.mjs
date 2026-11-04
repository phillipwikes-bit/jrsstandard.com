import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const context={window:{}};
vm.runInNewContext(readFileSync(new URL("../owner/incomeos/source-health.js",import.meta.url),"utf8"),context);
const gate=context.window.IncomeOSSourceHealth;
// 2026-11-04: freshness now needs a sync timestamp within 24 hours of an explicit as-of instant.
const asOf="2026-11-04T12:00:00Z";
const ok={id:"bank-a",connectionStatus:"linked",coverageComplete:true,freshness:"current",balanceSourceVerified:true,lastSyncedAt:"2026-11-04T09:00:00Z"};
assert.equal(gate.assess([ok],asOf).status,"SOURCE_REVIEW_ONLY");
assert.equal(gate.assess([ok]).availableToInvestCents,null);
assert.equal(gate.assess([{...ok,connectionStatus:"error"}]).sources[0].reason,"CONNECTION_NOT_LINKED");
assert.equal(gate.assess([{...ok,coverageComplete:false}]).status,"HOLD");
assert.equal(gate.assess([{...ok,freshness:"unknown"}]).status,"HOLD");
assert.equal(gate.assess([{...ok,balanceSourceVerified:false}]).status,"HOLD");
assert.equal(gate.assess([ok,ok]).status,"HOLD");
assert.equal(gate.assess([ok,{...ok,id:" bank-a "}]).status,"HOLD");
assert.equal(gate.assess([{...ok,id:"   "}]).status,"HOLD");
assert.equal(gate.assess([]).status,"HOLD");
// R14-6: a self-declared "current" label without a recent sync timestamp is not fresh.
assert.equal(gate.assess([{...ok,lastSyncedAt:undefined}],asOf).sources[0].reason,"FRESHNESS_UNVERIFIED");
assert.equal(gate.assess([{...ok,lastSyncedAt:"2026-10-01T09:00:00Z"}],asOf).status,"HOLD");
assert.equal(gate.assess([ok]).status,"HOLD","no as-of instant, no freshness");
// R14-9: the HOLD line is rendered by the capital panel itself, not by a click listener.
const ui=readFileSync(new URL("../owner/incomeos/source-health-ui.js",import.meta.url),"utf8");
assert.doesNotMatch(ui,/addEventListener\("click"/);
assert.match(readFileSync(new URL("../owner/incomeos/capital-review-ui.js",import.meta.url),"utf8"),/IncomeOSSourceHealthUI\.show\(\)/);
// R14-1: clearing resets memory before erasing, and is blocked by the staging lock.
const main=readFileSync(new URL("../owner/incomeos/incomeos.js",import.meta.url),"utf8");
const handler=main.slice(main.indexOf('$("clear-local")'),main.indexOf("location.reload()"));
assert.ok(handler.includes("IncomeOSFinancialReadOnly === true"),"clear is blocked by the staging lock");
assert.ok(handler.indexOf("state = { saved: [], stages: {}, receipts: [] };")<handler.indexOf("IncomeOSAccountant.clear()"),"memory reset before erasing");
console.log("IncomeOS source-health tests passed");
