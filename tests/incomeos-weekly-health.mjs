import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const ctx={window:{},Date,Number,String,Array,Object,Math,Error};
runInNewContext(readFileSync("owner/incomeos/weekly-briefing.js","utf8"),ctx);
const build=ctx.window.IncomeOSWeeklyBriefing.build;
const receipt=(finishedAt,ok,failed)=>({finishedAt,summary:{ok,failed},connectors:[]});
const run=(r)=>build({discoveryReceipt:r},"2026-11-06");
assert.equal(run(receipt("2026-11-06T12:00:00Z",2,0)).answers.systemHealth[0].ok,true);
for(const r of [receipt("2026-11-07T12:00:00Z",2,0),receipt("2026-11-03T12:00:00Z",2,0),receipt("invalid",2,0),receipt("2026-11-06T12:00:00Z",2,1)]){
 const result=run(r);
 assert.equal(result.answers.systemHealth[0].ok,false);
 assert.equal(result.notify,true);
}
assert.throws(()=>build({},"2026-02-30"));
console.log("Weekly discovery health rejects future, stale, invalid and partially failed runs.");
