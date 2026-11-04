// Passive Opportunity Radar intake. SYNTHETIC FIXTURES ONLY; a pass is not evidence of any live finding.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const src=readFileSync(new URL("../owner/incomeos/passive-radar.js",import.meta.url),"utf8");
assert.doesNotMatch(src,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon|WebSocket/,"no network or browser storage");
const ctx={window:{},URL};vm.runInNewContext(src,ctx);
const R=ctx.window.IncomeOSPassiveRadar;
const asOf="2026-11-04";
const ok=(o={})=>({id:"f1",title:"Synthetic state rebate",sourceName:"Synthetic rebates page",sourceUrl:"https://example.org/rebates",directUrl:"https://example.gov/claim",foundOn:"2026-11-03",valueType:"savings",amountUsd:50,amountBasis:"stated",...o});
const run=(findings)=>JSON.parse(JSON.stringify(R.importFindings({schema:R.SCHEMA,findings},asOf)));

// A complete finding is accepted with its source, date, link and type, and never counted as received.
let r=run([ok()]);
assert.equal(r.accepted.length,1);assert.equal(r.refused.length,0);
const a=r.accepted[0];
assert.deepEqual([a.sourceName,a.foundOn,a.directUrl,a.valueLabel,a.official,a.countsAsIncome,a.received],["Synthetic rebates page","2026-11-03","https://example.gov/claim","Savings",true,false,false]);
assert.equal(r.receivedUsd,0);assert.equal(r.potentialUsd.savings,50);

// Missing source, date or direct link is refused.
for(const [o,code] of [[{sourceUrl:undefined},"SOURCE_LINK_MISSING_OR_UNSAFE"],[{sourceName:""},"SOURCE_NAME_MISSING"],[{foundOn:undefined},"DATE_MISSING_OR_INVALID"],
  [{foundOn:"2026-02-30"},"DATE_MISSING_OR_INVALID"],[{directUrl:undefined},"DIRECT_LINK_MISSING_OR_UNSAFE"],[{directUrl:"http://example.gov/claim"},"DIRECT_LINK_MISSING_OR_UNSAFE"],
  [{directUrl:"https://user:pw@example.gov/x"},"DIRECT_LINK_MISSING_OR_UNSAFE"],[{directUrl:"javascript:alert(1)"},"DIRECT_LINK_MISSING_OR_UNSAFE"],
  [{foundOn:"2026-10-01"},"FINDING_STALE"],[{foundOn:"2026-11-05"},"DATE_IN_FUTURE"],[{valueType:"income"},"VALUE_TYPE_UNKNOWN"],[{deadline:"2026-11-01"},"DEADLINE_PASSED_OR_INVALID"],
  [{summary:"Pay a small upfront fee to release funds"},"RISK_SIGNAL"],[{summary:"Send gift cards"},"RISK_SIGNAL"],[{eligibilityText:"Guaranteed return of 12%"},"RISK_SIGNAL"],
  [{summary:"Account 123456789012 qualifies"},"SENSITIVE_DATA"],[{amountUsd:-5},"AMOUNT_INVALID"],[{amountUsd:"50"},"AMOUNT_INVALID"]]){
  const x=run([ok(o)]);
  assert.equal(x.accepted.length,0,"refused: "+code);assert.ok(x.refused[0].reasons.includes(code),code+" in "+x.refused[0].reasons);
}
// Duplicates by id or by direct link are refused after the first.
r=run([ok(),ok({directUrl:"https://example.gov/other"}),ok({id:"f3"})]);
assert.equal(r.accepted.length,1);assert.deepEqual(r.refused.map(x=>x.reasons[0]),["DUPLICATE_ID","DUPLICATE_DIRECT_LINK"]);

// Projections are never counted; estimates do not enter potential totals; nothing is ever received.
r=run([ok({id:"p",valueType:"projection",amountUsd:900,amountBasis:"estimated",directUrl:"https://example.org/p"}),
  ok({id:"e",valueType:"new_income",amountUsd:300,amountBasis:"estimated",directUrl:"https://example.org/e"}),
  ok({id:"n",valueType:"new_income",amountUsd:120,amountBasis:"stated",directUrl:"https://example.org/n"}),
  ok({id:"c",valueType:"returned_capital",amountUsd:40,amountBasis:"stated",directUrl:"https://example.org/c"})]);
assert.deepEqual(r.potentialUsd,{new_income:120,returned_capital:40,savings:0});
assert.equal(r.projectionCount,1);assert.equal(r.receivedUsd,0);
assert.ok(r.accepted.every(x=>x.countsAsIncome===false&&x.received===false));
assert.equal(r.accepted.at(-1).valueType,"projection","projections are listed last");
assert.ok(r.accepted.find(x=>x.id==="e").warnings.includes("AMOUNT_NOT_STATED_BY_SOURCE"));
// Self-asserted fields such as received or eligible are ignored, never trusted.
r=run([ok({received:true,eligible:true})]);
assert.equal(r.accepted[0].received,false);assert.ok(r.accepted[0].warnings.some(w=>w.startsWith("FIELDS_IGNORED")));
// A cost to pursue is shown.
assert.ok(run([ok({costToPursueUsd:25})]).accepted[0].warnings.includes("COSTS_MONEY_TO_PURSUE"));
// Wrong schema, too many findings and a missing date are rejected outright.
assert.throws(()=>R.importFindings({schema:"other",findings:[]},asOf),/Not an incomeos.passive-findings.v1/);
assert.throws(()=>R.importFindings({schema:R.SCHEMA,findings:Array(501).fill(ok())},asOf),/At most 500/);
assert.throws(()=>R.importFindings({schema:R.SCHEMA,findings:[]},"bad"),/review date/);
// The sample format passes its own check.
assert.equal(R.importFindings(R.template(asOf),asOf).accepted.length,2);
console.log("IncomeOS passive radar intake checks passed: source, date and direct link required; projections never income; nothing received.");
