import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
// SYNTHETIC FIXTURES ONLY. No live listing or owner data. A pass here is not evidence of any live integration.
const ctx={window:{},URL,WeakSet};
for(const f of ["eligibility-engine.js","listing-requirements.js","compensation.js","opportunity-normalizer.js","project-radar.js"])
  vm.runInNewContext(readFileSync(new URL("../owner/incomeos/"+f,import.meta.url),"utf8"),ctx);
const {review,digest}=ctx.window.IncomeOSProjectRadar;
const Elig=ctx.window.IncomeOSEligibility;
const doc=(ref)=>({status:"documented",ref,verifiedOn:"2026-11-01"});
const profile={schema:"incomeos.owner-profile.v1",education:[{level:"masters",fieldKeys:["negotiation"],evidence:doc("synthetic-diploma")}],
  conflicts:{organizations:[],evidence:doc("synthetic-conflict-review")},preferences:{remoteOnly:true}};
const decide=(id,reqs=[{id:"r1",category:"education",minLevel:"bachelors",mandatory:true,sourceText:"Bachelor's degree required"}],confirmed=true)=>
  Elig.evaluate({id,platform:"Handshake AI",employer:"Handshake",remoteMode:"remote",requirements:reqs,requirementSet:{ownerConfirmed:confirmed,confirmedOn:"2026-11-02"}},profile,"2026-11-02",{});

const sample={id:"job-123",title:"AI response evaluator",platform:"Handshake AI",sourceUrl:"https://example.org/listing",applyUrl:"https://example.org/apply",reviewed:"2026-11-02",deadline:null,remote:true,openingsVerified:false,paymentVerified:false,payUsd:400,workHours:10,screenHours:2,feesUsd:0,paymentModel:"fixed"};
assert.equal(review(sample,"2026-11-02",{}).status,"HOLD");
// Listing self-assertion of eligibility is ignored: still HOLD without an engine decision.
const selfAsserted={...sample,id:"job-124",eligibility:"verified",eligibilityEvidenceUrl:"https://example.org/requirements",eligibilityCheckedOn:"2026-11-02",openingsVerified:true,paymentVerified:true};
const sa=review(selfAsserted,"2026-11-02",{});
assert.equal(sa.status,"HOLD");
assert.ok(sa.problems.includes("ELIGIBILITY_NOT_ENGINE_DETERMINED"));
assert.ok(sa.warnings.includes("LISTING_ELIGIBILITY_CLAIM_IGNORED"));
// A forged decision object copied from JSON is rejected.
const forged=JSON.parse(JSON.stringify(decide("job-124")));
assert.equal(review(selfAsserted,"2026-11-02",{},forged).status,"HOLD");
// Engine-issued ELIGIBLE decision for the same id passes.
const eligible={...sample,id:"job-125",openingsVerified:true,paymentVerified:true};
assert.equal(review(eligible,"2026-11-02",{},decide("job-125")).status,"REVIEW");
// Decision for a different listing, or a WITHHELD decision, does not transfer.
assert.ok(review(eligible,"2026-11-02",{},decide("job-999")).problems.includes("ELIGIBILITY_DECISION_MISMATCH"));
assert.equal(review(eligible,"2026-11-02",{},decide("job-125",undefined,false)).status,"HOLD");
// Corrected 2026-11-03: the previous version reused id "job-123" for two different listings,
// which the duplicate-ID control added in 81bb9d1 correctly holds. Distinct ids are required.
assert.equal(digest([sample,eligible],"2026-11-02",{},{"job-125":decide("job-125")}).results.length,1);
assert.equal(digest([sample],"2026-11-02",{}).withheld,1);
assert.equal(review(sample,"2026-11-02",{}).effectiveHourlyUsd,33.33);
assert.equal(review({...sample,reviewed:"2026-10-20"},"2026-11-02",{}).status,"HOLD");
assert.equal(review({...sample,requiresUpfrontPayment:true},"2026-11-02",{}).status,"HOLD");
assert.equal(review({...sample,remote:false},"2026-11-02",{}).status,"HOLD");
assert.equal(review({...sample,payUsd:0},"2026-11-02",{}).status,"HOLD");
assert.equal(review({...sample,sourceUrl:"http://example.org"},"2026-11-02",{}).status,"HOLD");
assert.equal(digest([sample,sample],"2026-11-02",{}).results.length,0);
assert.equal(digest([eligible,{...eligible,title:"Conflicting duplicate"}],"2026-11-02",{},{"job-125":decide("job-125")}).results.length,0);
assert.equal(digest([eligible,eligible],"2026-11-02",{},{"job-125":decide("job-125")}).withheld,2);
assert.equal(review({...eligible,payUsd:100},"2026-11-02",{},decide("job-125")).status,"HOLD");
assert.equal(review(eligible,"2026-11-02",{minHourlyUsd:40},decide("job-125")).status,"HOLD");
assert.equal(review(sample,"2026-11-02",{}).earnedUsd,0);
assert.equal(review(sample,"2026-11-02",{}).applicationSubmitted,false);
console.log("IncomeOS project radar tests passed: engine-only eligibility, forged/self-asserted decisions rejected, duplicate and rate controls");
