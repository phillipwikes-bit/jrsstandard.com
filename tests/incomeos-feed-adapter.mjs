// Public opportunity-feed interoperability, synthetic and public sample metadata only.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script,runInNewContext} from "node:vm";
const root=resolve("owner/incomeos"),read=p=>readFileSync(resolve(root,p),"utf8");
const radarCode=read("research-radar.js"),adapterCode=read("public-feed-adapter.js"),uiCode=read("research-ui.js");
const page=read("index.html"),snapshot=JSON.parse(read("opportunities.json"));
for(const js of [radarCode,adapterCode,uiCode])new Script(js);
const ctx={window:{},Date,Number,Array,Object,Set,Map,String,JSON,Math,URL,Error};
runInNewContext(radarCode,ctx);runInNewContext(adapterCode,ctx);
const A=ctx.window.IncomeOSPublicFeedAdapter,R=ctx.window.IncomeOSResearchRadar;
let native=A.collect(snapshot);
assert.equal(native.received,4);
assert.equal(native.accepted,4,"Existing four sourced studies must remain visible in new radar");
assert.equal(native.rejected.length,0);
assert.equal(native.items[0].dateType,"published-session-end");
assert.equal(native.items[0].eventEnd,"2026-11-06");
const publicRow={
  id:"prc-demo-1001",title:"Example participant survey",recruiter:"Synthetic Research Provider",
  incentive_usd:180,incentive_label:"$180 advertised",incentive_type:"Digital gift card",
  duration_minutes:90,format:"Online research",online_only:true,participation_dates:"November 2026",
  apply_deadline:null,eligibility:["US residents"],flags:["Selection not guaranteed"],
  application_url:"https://example.org/screener/1001",source_url:"https://example.org/listing/1001",
  access_type:"direct",availability_status:"Public screener accessible; places unconfirmed",
  source_checked_on:"2026-11-01",is_active:true,summary:null,
  created_at:"2026-11-01T00:00:00Z",updated_at:"2026-11-01T01:00:00Z"
};
let normalized=A.toCanonical(publicRow);
assert.equal(normalized.provider,"Synthetic Research Provider");
assert.equal(normalized.eventEnd,null,"Missing deadline must stay missing");
assert.equal(normalized.dateType,"application-deadline");
assert.equal(normalized.mode,"online");
assert.equal(normalized.screenMinutes,null);
const d=R.digest([normalized],{minPay:100,maxScreenMinutes:15,remoteOnly:true},"2026-11-01");
assert.equal(d.scanned,1);
assert.equal(d.results[0].priority,"PRIORITY_TO_SCREEN");
assert.equal(d.results[0].deadline,null);
assert.ok(d.results[0].warnings.some(x=>/No application deadline/.test(x)));
assert.equal(d.results[0].availability,"UNCONFIRMED");
assert.equal(d.results[0].paid,false);
assert.equal(d.results[0].sessionPlusScreenRate,null,"No unknown screening minutes invented");
assert.equal(A.collect({items:[publicRow]}).accepted,1);
assert.equal(A.collect({data:[publicRow]}).accepted,1);
assert.equal(A.collect([publicRow]).accepted,1);
let rejected=A.collect({items:[publicRow,{...publicRow,id:"prc-private-1002",participant_email:"secret@example.com"}]});
assert.equal(rejected.accepted,1);
assert.equal(rejected.rejected.length,1);
assert.match(rejected.rejected[0].reason,/Private or unrecognized/);
assert.throws(()=>A.toCanonical({...publicRow,is_active:false}),/Inactive/);
assert.throws(()=>A.toCanonical({...publicRow,apply_deadline:"2026-02-30"}),/deadline/);
assert.throws(()=>A.toCanonical({...publicRow,application_url:"http://example.org"}),/HTTPS/);
assert.throws(()=>A.toCanonical({...publicRow,application_url:"https://localhost:8000"}),/HTTPS/);
assert.throws(()=>A.toCanonical({...publicRow,incentive_usd:null}),/compensation/);
assert.throws(()=>A.toCanonical({...publicRow,duration_minutes:null}),/compensation/);
assert.throws(()=>A.toCanonical({...publicRow,source_checked_on:"2026-02-29"}),/source date/);
assert.throws(()=>A.toCanonical({...publicRow,bank_transaction:"sensitive"}),/Private or unrecognized/);
const inPerson=A.toCanonical({...publicRow,id:"prc-demo-1003",online_only:false,format:"Online and in person"});
assert.equal(inPerson.mode,"hybrid");
assert.equal(R.assess(inPerson,{minPay:100,remoteOnly:true,maxScreenMinutes:15},"2026-11-01").priority,"HOLD");
const some=A.collect({items:[publicRow,{...publicRow,id:"prc-demo-1004",apply_deadline:"2026-10-31"}]});
assert.equal(some.accepted,2);
assert.equal(R.assess(some.items[1],{minPay:100,maxScreenMinutes:15,remoteOnly:true},"2026-11-01").priority,"HOLD");
const listed=R.digest(some.items,{minPay:100,maxScreenMinutes:15,remoteOnly:true},"2026-11-01");
assert.equal(listed.results[0].candidate.id,"prc-demo-1001","Candidate with no published deadline should not expire automatically");
assert.match(page,/public-feed-adapter\.js/);
assert.match(uiCode,/adapter\.collect\(doc\)/);
assert.match(uiCode,/adapter\.collect\(data\)/);
assert.doesNotMatch(adapterCode,/fetch\s*\(|localStorage|sessionStorage|XMLHttpRequest|WebSocket|sendBeacon/);
console.log("IncomeOS public feed adapter QA passed: existing source snapshot, public database schema, nullable deadlines, field allowlist, fail-closed URL/dates, and no fabricated earnings.");
