import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const context={window:{},URL,Map,Set,Date,Number,Math,String,Array,Object};
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL("../owner/incomeos/research-radar.js",import.meta.url),"utf8"),context);
const radar=context.window.IncomeOSResearchRadar;
const asOf="2026-11-03";
function study(id,paymentUsd,minutes,screenMinutes,prepMinutes,adminMinutes,timeConfidence="estimated"){
 return {id,title:id,provider:"Verified research example",paymentUsd,minutes,screenMinutes,prepMinutes,adminMinutes,timeConfidence,mode:"online",reviewed:asOf,eventEnd:null,url:"https://example.org/apply/"+id,sourceUrl:"https://example.org/source/"+id,linkKind:"Direct screener",eligibilityStatus:"owner-reports-possible"};
}
const prefs={minPay:0,minEhy:0,maxScreenMinutes:120,remoteOnly:true};
const high=radar.assess(study("study-high",75,30,5,0,5),prefs,asOf);
assert.equal(high.totalMinutes,40);
assert.equal(high.effectiveHourlyYield,112.5);
const low=radar.assess(study("study-low",150,60,15,45,15),prefs,asOf);
assert.equal(low.totalMinutes,135);
assert.equal(low.effectiveHourlyYield,66.67);
const unknown=radar.assess(study("study-unknown",200,60,null,null,null,"unknown"),prefs,asOf);
assert.equal(unknown.effectiveHourlyYield,null);
assert.ok(unknown.warnings.some(x=>x.includes("EHY unavailable")));
const ranked=radar.digest([study("study-low",150,60,15,45,15),study("study-high",75,30,5,0,5),study("study-unknown",200,60,null,null,null,"unknown")],prefs,asOf);
assert.equal(ranked.results[0].candidate.id,"study-high");
assert.equal(ranked.results[2].candidate.id,"study-unknown");
const screened=radar.assess(study("study-low",150,60,15,45,15),{...prefs,minEhy:75},asOf);
assert.equal(screened.priority,"HOLD");
assert.ok(screened.reasons.some(x=>x.includes("Effective hourly yield")));
assert.throws(()=>radar.candidate(study("study-bad",100,60,5,-1,0)),/Invalid preparation minutes/);
console.log("IncomeOS EHY: calculation, unknown time, ranking, threshold and validation passed");
