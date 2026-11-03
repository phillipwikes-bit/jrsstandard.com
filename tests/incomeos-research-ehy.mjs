import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const context={window:{},URL,Map,Set,Date,Number,Math,String,Array,Object};
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL("../owner/incomeos/research-radar.js",import.meta.url),"utf8"),context);
vm.runInContext(fs.readFileSync(new URL("../owner/incomeos/public-feed-adapter.js",import.meta.url),"utf8"),context);
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
// ---------- Extended regression scenarios (2026-11-03 review) ----------
const plain=x=>JSON.parse(JSON.stringify(x));
const S=(id,o={})=>({...study(id,100,60,10,10,10,"verified"),...o});
// Each missing component is named; none is treated as zero.
for(const [field,name] of [["screenMinutes","screener"],["prepMinutes","preparation"],["adminMinutes","follow-up"]]){
  const r=radar.assess(S("miss-"+name,{[field]:null}),prefs,asOf);
  assert.equal(r.effectiveHourlyYield,null,name+" missing leaves EHY unavailable");
  assert.deepEqual(plain(r.ehyMissing),[name]);assert.ok(r.warnings.some(w=>w.includes("missing "+name)));
}
const allMissing=radar.assess(S("miss-all",{screenMinutes:null,prepMinutes:null,adminMinutes:null}),prefs,asOf);
assert.deepEqual(plain(allMissing.ehyMissing),["screener","preparation","follow-up"]);
// Invalid negative values are rejected for every component.
for(const f of ["screenMinutes","prepMinutes","adminMinutes"])assert.throws(()=>radar.candidate(S("neg-"+f,{[f]:-5})));
assert.throws(()=>radar.candidate(S("neg-pay",{paymentUsd:-1})));
// Zero is accepted when time confidence is stated; an unconfirmed zero is not.
const zeroVerified=radar.assess(S("zero-ok",{prepMinutes:0,timeConfidence:"verified"}),prefs,asOf);
assert.equal(zeroVerified.totalMinutes,80);assert.equal(zeroVerified.effectiveHourlyYield,75);
const zeroUnknown=radar.assess(S("zero-unk",{prepMinutes:0,timeConfidence:"unknown"}),prefs,asOf);
assert.equal(zeroUnknown.effectiveHourlyYield,null);assert.ok(zeroUnknown.ehyMissing.includes("preparation (zero unconfirmed)"));
// Estimated and unverified time are labelled; verified time carries no time warning.
assert.ok(radar.assess(S("est-time",{timeConfidence:"estimated"}),prefs,asOf).warnings.includes("EHY uses estimated time"));
assert.ok(!radar.assess(S("ver-time"),prefs,asOf).warnings.some(w=>/estimated time|provisional/.test(w)));
// Rounding to cents: $100 over 70 minutes.
assert.equal(radar.assess(S("round",{screenMinutes:0,prepMinutes:0,adminMinutes:10}),prefs,asOf).effectiveHourlyYield,85.71);
// Directive examples: low payout with high EHY outranks high payout with low EHY.
const big=S("big-payout",{paymentUsd:300,minutes:240,screenMinutes:30,prepMinutes:30,adminMinutes:0});
const small=S("small-payout",{paymentUsd:60,minutes:20,screenMinutes:5,prepMinutes:0,adminMinutes:5});
let d=radar.digest([big,small],prefs,asOf);
assert.equal(d.results[0].candidate.id,"small-payout");assert.equal(d.results[0].effectiveHourlyYield,120);assert.equal(d.results[1].effectiveHourlyYield,60);
// A fully verified study is not ranked below unverified ones (bucket no longer overrides EHY).
const verifiedTop=S("verified-top",{paymentUsd:200,minutes:60,screenMinutes:0,prepMinutes:0,adminMinutes:0,status:"Open, confirmed by recruiter",paymentForm:"cash",eventEnd:"2026-11-20",dateType:"application-deadline"});
assert.equal(radar.assess(verifiedTop,prefs,asOf).priority,"REVIEW_CANDIDATE","fixture has no warnings, so it falls in the bucket the old sort ranked lower");
const warned=S("warned",{paymentUsd:90,minutes:60,screenMinutes:0,prepMinutes:0,adminMinutes:0});
d=radar.digest([warned,verifiedTop],prefs,asOf);
assert.equal(d.results[0].candidate.id,"verified-top","highest EHY first regardless of warning count");
// Eligibility failure or expiry is held and ranked last despite the highest EHY.
const inel=S("inel-high",{paymentUsd:1000,minutes:30,screenMinutes:0,prepMinutes:0,adminMinutes:0,eligibilityStatus:"owner-reports-ineligible"});
const expired=S("expired-high",{paymentUsd:900,minutes:30,screenMinutes:0,prepMinutes:0,adminMinutes:0,eventEnd:"2026-11-01",dateType:"application-deadline"});
d=radar.digest([inel,expired,small],prefs,asOf);
assert.equal(d.results[0].candidate.id,"small-payout");
assert.ok(d.results.slice(1).every(r=>r.priority==="HOLD"));
assert.ok(d.results.find(r=>r.candidate.id==="expired-high").reasons.some(x=>/date passed/.test(x)));
// Unavailable EHY ranks after available EHY; gross pay orders within unavailable.
d=radar.digest([S("unav-1",{paymentUsd:500,adminMinutes:null}),S("unav-2",{paymentUsd:50,adminMinutes:null}),small],prefs,asOf);
assert.deepEqual(d.results.map(r=>r.candidate.id),["small-payout","unav-1","unav-2"]);
// Gross is a secondary floor: with no settings, the $75 / 40-minute study is not held.
assert.notEqual(radar.assess(study("study-high",75,30,5,0,5,"verified"),{},asOf).priority,"HOLD");
// Duplicates: same id keeps the newest review; same link counted once.
d=radar.digest([S("dup-a",{reviewed:"2026-11-02"}),S("dup-a",{reviewed:"2026-11-03",paymentUsd:120}),S("dup-b",{url:"https://example.org/apply/dup-a"})],prefs,asOf);
assert.equal(d.scanned,1);assert.equal(d.duplicateCount,2);assert.equal(d.results[0].candidate.paymentUsd,120);
// Payment form: cash recognized, gift cards flagged, cash-only setting holds non-cash.
assert.equal(radar.assess(S("pf-cash",{paymentMethod:"PayPal"}),prefs,asOf).paymentForm,"cash");
const gift=radar.assess(S("pf-gift",{paymentMethod:"Amazon gift card"}),prefs,asOf);
assert.equal(gift.paymentForm,"gift_card");assert.ok(gift.warnings.some(w=>/gift card, not cash/.test(w)));
assert.equal(radar.assess(S("pf-gift2",{paymentMethod:"Amazon gift card"}),{...prefs,cashOnly:true},asOf).priority,"HOLD");
assert.ok(radar.assess(S("pf-none"),prefs,asOf).warnings.some(w=>/Payment form not stated/.test(w)));
// Imported public feed: time components stay unknown (not zero); incentive type carried through.
const adapter=context.window.IncomeOSPublicFeedAdapter;
const feed=adapter.collect({studies:[{id:"feed-study-1",title:"Feed interview",recruiter:"Feed recruiter",incentive_usd:80,incentive_type:"gift card",duration_minutes:45,format:"online",online_only:true,apply_deadline:null,eligibility:[],flags:[],application_url:"https://example.org/f/1",source_url:"https://example.org/s/1",access_type:"direct",availability_status:"Open",source_checked_on:asOf,is_active:true}]});
assert.equal(feed.accepted,1);
const fr=radar.assess(feed.items[0],prefs,asOf);
assert.equal(fr.effectiveHourlyYield,null,"feed records without screener/prep/follow-up never get a silent zero");
assert.deepEqual(plain(fr.ehyMissing),["screener","preparation","follow-up"]);assert.equal(fr.paymentForm,"gift_card");
// Older stored records without the new fields still load (backward compatibility).
const legacy={id:"legacy-1234",title:"Legacy",provider:"Old",paymentUsd:100,minutes:60,screenMinutes:10,mode:"online",reviewed:asOf,eventEnd:null,url:"https://example.org/l",sourceUrl:"https://example.org/ls",linkKind:"Direct screener"};
const lr=radar.assess(legacy,prefs,asOf);assert.equal(lr.effectiveHourlyYield,null);assert.equal(lr.sessionPlusScreenRate,85.71);
console.log("IncomeOS EHY: calculation, unknown time, ranking, threshold and validation passed; extended: per-component missing, negatives, confirmed vs unconfirmed zero, estimated vs verified, rounding, EHY-first ranking, holds last, gross secondary, duplicates, payment form, feed import, legacy records");
