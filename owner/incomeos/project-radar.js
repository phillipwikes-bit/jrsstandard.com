"use strict";
(function(root){
  // Project-contract screening. Public listings only; no scraping, account access or applications.
  // HARDENED 2026-11-03: eligibility is never read from listing fields. A listing
  // reaches REVIEW only with a decision object issued by IncomeOSEligibility.evaluate
  // for the owner profile. Listing fields such as eligibility:"verified" or
  // eligibilityEvidenceUrl are untrusted self-assertions and are ignored.
  var Elig=root&&root.IncomeOSEligibility||(typeof require==="function"?require("./eligibility-engine.js"):null);
  var Opp=root&&root.IncomeOSOpportunity||(typeof require==="function"?require("./opportunity-normalizer.js"):null);
  var Comp=root&&root.IncomeOSCompensation||(typeof require==="function"?require("./compensation.js"):null);
  var platforms=["Handshake AI","Mercor","Outlier","Alignerr","DataAnnotation","Appen","TELUS Digital","OneForma","Invisible Technologies","Mindrift"];
  var SELF_ASSERTED=["eligibility","eligibilityEvidenceUrl","eligibilityCheckedOn","sourceVerified","verified"];
  function validUrl(value){try{var u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&!["localhost","127.0.0.1"].includes(u.hostname);}catch(e){return false;}}
  function validDate(x){if(typeof x!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;var t=Date.parse(x+"T00:00:00Z");return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===x;}
  function minRate(prefs){return Number.isFinite(Number(prefs&&prefs.minHourlyUsd))?Number(prefs.minHourlyUsd):25;}

  // Legacy flat-listing review (manually imported listings).
  function review(x,asOf,prefs,decision){
    prefs=prefs||{};
    var problems=[],warnings=[];
    if(!x||typeof x!=="object"||Array.isArray(x))return {status:"HOLD",problems:["INVALID_LISTING"],warnings:[],effectiveHourlyUsd:null};
    if(typeof x.id!=="string"||!x.id.trim()||typeof x.title!=="string"||!x.title.trim()||typeof x.platform!=="string"||!x.platform.trim())problems.push("IDENTITY_MISSING");
    if(!validUrl(x.sourceUrl)||!validUrl(x.applyUrl))problems.push("SOURCE_URL_MISSING");
    if(!validDate(x.reviewed)||!validDate(asOf))problems.push("DATE_INVALID");
    else {var age=(Date.parse(asOf+"T00:00:00Z")-Date.parse(x.reviewed+"T00:00:00Z"))/86400000;if(age<0||age>3)problems.push("SOURCE_STALE");}
    if(x.deadline!=null&&(!validDate(x.deadline)||x.deadline<asOf))problems.push("DEADLINE_EXPIRED_OR_INVALID");
    if(x.remote!==true&&prefs.remoteOnly!==false)problems.push("NOT_CONFIRMED_REMOTE");
    if(SELF_ASSERTED.some(function(k){return Object.prototype.hasOwnProperty.call(x,k);}))warnings.push("LISTING_ELIGIBILITY_CLAIM_IGNORED");
    if(!Elig||!Elig.isEngineDecision(decision))problems.push("ELIGIBILITY_NOT_ENGINE_DETERMINED");
    else if(decision.opportunityId!==x.id)problems.push("ELIGIBILITY_DECISION_MISMATCH");
    else if(decision.asOf!==asOf)problems.push("ELIGIBILITY_DECISION_STALE");
    else if(decision.status==="INELIGIBLE")problems.push("INELIGIBLE");
    else if(decision.status!=="ELIGIBLE")problems.push("ELIGIBILITY_UNCONFIRMED");
    if(x.requiresUnverifiedCredential===true||x.requiresUnknownWorkAuthorization===true||x.requiresUnmetExperience===true)problems.push("QUALIFICATION_NOT_ESTABLISHED");
    if(x.openingsVerified!==true)problems.push("OPENINGS_UNCONFIRMED");
    if(x.paymentVerified!==true)warnings.push("COMPENSATION_UNCONFIRMED");
    if(x.requiresUpfrontPayment===true||x.requestsCredentials===true)problems.push("POTENTIAL_SCAM");
    var pay=Number(x.payUsd),hours=Number(x.workHours),screen=Number(x.screenHours),fees=Number(x.feesUsd||0);
    if(!Number.isFinite(pay)||pay<=0||!Number.isFinite(hours)||hours<=0||!Number.isFinite(screen)||screen<0||!Number.isFinite(fees)||fees<0)problems.push("PAY_OR_EFFORT_INVALID");
    var effective=problems.includes("PAY_OR_EFFORT_INVALID")?null:Math.round((pay-fees)/(hours+screen)*100)/100;
    if(effective!==null&&effective<minRate(prefs))problems.push("BELOW_TARGET_RATE");
    if(x.paymentModel!=="hourly"&&x.paymentModel!=="fixed")warnings.push("PAYMENT_MODEL_UNCONFIRMED");
    return {status:problems.length?"HOLD":warnings.length?"SCREEN":"REVIEW",problems:problems,warnings:warnings,effectiveHourlyUsd:effective,
      opportunityType:"ACTIVE_PROJECT_WORK",availability:x.openingsVerified===true?"LISTING_REPORTED_OPEN":"UNCONFIRMED",earnedUsd:0,applicationSubmitted:false,
      note:"Advertised compensation is not earned income. Screening, onboarding, unpaid tests and taxes may reduce realized value."};
  }
  function digest(items,asOf,prefs,decisions){
    if(!Array.isArray(items)||items.length>200)throw Error("Expected at most 200 sourced project listings");
    decisions=decisions||{};
    var counts=new Map(),rows=[];
    items.forEach(function(x){var key=x&&typeof x.id==="string"?x.id.trim():"";if(key)counts.set(key,(counts.get(key)||0)+1);});
    items.forEach(function(x){
      var key=x&&typeof x.id==="string"?x.id.trim():"",assessment=review(x,asOf,prefs,key?decisions[key]:null);
      if(key&&counts.get(key)>1){assessment.status="HOLD";assessment.problems.push("DUPLICATE_LISTING_ID");}
      rows.push({listing:x,assessment:assessment});
    });
    var rank={REVIEW:0,SCREEN:1,HOLD:2};
    rows.sort(function(a,b){return rank[a.assessment.status]-rank[b.assessment.status]||(b.assessment.effectiveHourlyUsd||0)-(a.assessment.effectiveHourlyUsd||0);});
    return {results:rows.filter(function(row){return row.assessment.status!=="HOLD";}),withheld:rows.filter(function(row){return row.assessment.status==="HOLD";}).length,notice:"Only engine-determined eligible listings are displayed. Eligibility is listing-specific, not proof of recruiter acceptance. No application submission."};
  }

  // Screen a normalized discovery snapshot against the private owner profile.
  // ownerState: {confirmations:{[opportunityId]:{confirmedOn, contentHash}}} held by the owner only.
  function screen(snapshot,profile,asOf,prefs,ownerState){
    prefs=prefs||{};ownerState=ownerState||{};
    if(!snapshot||snapshot.schema!=="incomeos.discovery-snapshot.v1"||!Array.isArray(snapshot.opportunities))throw Error("Expected an incomeos.discovery-snapshot.v1 file");
    if(snapshot.opportunities.length>5000)throw Error("Snapshot exceeds 5,000 opportunities");
    var confirmations=ownerState.confirmations||{};
    var groups=Opp.dedupe(snapshot.opportunities);
    var eligible=[],pending=[],excluded=[],reasons={};
    function exclude(row,why){excluded.push({opportunityId:row.opportunity.opportunityId,title:row.opportunity.title,reasons:why});why.forEach(function(r){reasons[r]=(reasons[r]||0)+1;});}
    groups.forEach(function(g){
      var o=g.opportunity,blocking=[];
      var fresh=Opp.freshness(o,asOf,prefs);
      if(fresh!=="FRESH")blocking.push("LISTING_"+fresh);
      if(o.riskSignals&&o.riskSignals.length)blocking=blocking.concat(o.riskSignals.map(function(r){return "RISK_"+r;}));
      if(o.problems&&o.problems.length)blocking=blocking.concat(o.problems);
      g.flags.forEach(function(f){if(f!=="SAME_SOURCE_DUPLICATE")blocking.push(f);});
      // Owner confirmation applies only to the exact content version that was reviewed.
      var c=confirmations[o.opportunityId];
      var confirmed=!!(c&&c.contentHash===o.contentHash&&validDate(c.confirmedOn));
      var decision=Elig.evaluate({id:o.opportunityId,platform:o.platform,employer:o.employer,remoteMode:o.remoteMode,
        requirements:o.requirements.concat(o.employmentClassification?[{id:"attr-classification",category:"employment_classification",mandatory:true,type:o.employmentClassification,sourceText:"listing attribute"}]:[]),
        requirementSet:{ownerConfirmed:confirmed,confirmedOn:c&&c.confirmedOn}},profile,asOf,prefs);
      var econ=Comp.estimate(Comp.termsFromAdvertised(o.compensation,prefs),asOf);
      var row={opportunity:o,decision:decision,economics:econ,duplicates:g.duplicates,independentPrimarySources:g.independentPrimarySources,freshness:fresh};
      if(blocking.length){exclude(row,blocking);return;}
      if(decision.status==="INELIGIBLE"){exclude(row,decision.blocking.map(function(b){return "INELIGIBLE:"+b.split(":")[1];}));return;}
      if(econ.effectiveHourlyUsd!==null&&econ.effectiveHourlyUsd<minRate(prefs)){exclude(row,["BELOW_TARGET_RATE"]);return;}
      row.meetsEconomicThreshold=econ.effectiveHourlyUsd!==null;
      (decision.status==="ELIGIBLE"?eligible:pending).push(row);
    });
    function byValue(a,b){
      return (b.meetsEconomicThreshold?1:0)-(a.meetsEconomicThreshold?1:0)||(b.economics.effectiveHourlyUsd||0)-(a.economics.effectiveHourlyUsd||0)||String(a.opportunity.deadline||"9999").localeCompare(String(b.opportunity.deadline||"9999"));
    }
    eligible.sort(byValue);pending.sort(byValue);
    return {asOf:asOf,eligible:eligible,pending:pending,excludedCount:excluded.length,excluded:excluded,exclusionReasons:reasons,
      alerts:eligible.filter(function(r){return r.meetsEconomicThreshold;}).map(function(r){return {opportunityId:r.opportunity.opportunityId,title:r.opportunity.title,platform:r.opportunity.platform,effectiveHourlyUsd:r.economics.effectiveHourlyUsd,deadline:r.opportunity.deadline,sourceUrl:r.opportunity.sourceUrl,eligibilityBasis:r.decision.requirements.filter(function(q){return q.status==="SATISFIED";}).map(function(q){return q.category+": "+q.ownerEvidence;})};}),
      connectors:Array.isArray(snapshot.connectors)?snapshot.connectors:[],
      notice:"Eligible means every mandatory requirement is documented as satisfied or not applicable. It is not acceptance, assignment or guaranteed pay. No application was submitted and nothing was earned."};
  }
  var api=Object.freeze({platforms:platforms.slice(),review:review,digest:digest,screen:screen});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSProjectRadar=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
