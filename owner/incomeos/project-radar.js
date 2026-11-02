"use strict";
(function(root){
  // Project-contract discovery. Public listings only; no scraping, account access or applications.
  var platforms=["Handshake AI","Mercor","Outlier","Alignerr","DataAnnotation","Appen","TELUS Digital","OneForma","Invisible Technologies","Mindrift"];
  function validUrl(value){try{var u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&!["localhost","127.0.0.1"].includes(u.hostname);}catch(e){return false;}}
  function validDate(x){if(typeof x!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;var t=Date.parse(x+"T00:00:00Z");return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===x;}
  function review(x,asOf,prefs){
    prefs=prefs||{};
    var problems=[],warnings=[];
    if(!x||typeof x!=="object"||Array.isArray(x))return {status:"HOLD",problems:["INVALID_LISTING"],warnings:[],effectiveHourlyUsd:null};
    if(typeof x.id!=="string"||!x.id.trim()||typeof x.title!=="string"||!x.title.trim()||typeof x.platform!=="string"||!x.platform.trim())problems.push("IDENTITY_MISSING");
    if(!validUrl(x.sourceUrl)||!validUrl(x.applyUrl))problems.push("SOURCE_URL_MISSING");
    if(!validDate(x.reviewed)||!validDate(asOf))problems.push("DATE_INVALID");
    else {var age=(Date.parse(asOf+"T00:00:00Z")-Date.parse(x.reviewed+"T00:00:00Z"))/86400000;if(age<0||age>3)problems.push("SOURCE_STALE");}
    if(x.deadline!=null&&(!validDate(x.deadline)||x.deadline<asOf))problems.push("DEADLINE_EXPIRED_OR_INVALID");
    if(x.remote!==true&&prefs.remoteOnly!==false)problems.push("NOT_CONFIRMED_REMOTE");
    if(x.eligibility==="ineligible")problems.push("INELIGIBLE");
    if(x.eligibility!=="verified")problems.push("ELIGIBILITY_UNCONFIRMED");
    if(x.eligibility==="verified"&&(!validUrl(x.eligibilityEvidenceUrl)||!validDate(x.eligibilityCheckedOn)))problems.push("ELIGIBILITY_EVIDENCE_MISSING");
    if(x.eligibility==="verified"&&validDate(x.eligibilityCheckedOn)&&validDate(asOf)&&((Date.parse(asOf+"T00:00:00Z")-Date.parse(x.eligibilityCheckedOn+"T00:00:00Z"))/86400000>7||x.eligibilityCheckedOn>asOf))problems.push("ELIGIBILITY_EVIDENCE_STALE");
    if(x.requiresUnverifiedCredential===true||x.requiresUnknownWorkAuthorization===true||x.requiresUnmetExperience===true)problems.push("QUALIFICATION_NOT_ESTABLISHED");
    if(x.openingsVerified!==true)problems.push("OPENINGS_UNCONFIRMED");
    if(x.paymentVerified!==true)warnings.push("COMPENSATION_UNCONFIRMED");
    if(x.requiresUpfrontPayment===true||x.requestsCredentials===true)problems.push("POTENTIAL_SCAM");
    var pay=Number(x.payUsd),hours=Number(x.workHours),screen=Number(x.screenHours),fees=Number(x.feesUsd||0);
    if(!Number.isFinite(pay)||pay<=0||!Number.isFinite(hours)||hours<=0||!Number.isFinite(screen)||screen<0||!Number.isFinite(fees)||fees<0)problems.push("PAY_OR_EFFORT_INVALID");
    var effective=problems.includes("PAY_OR_EFFORT_INVALID")?null:Math.round((pay-fees)/(hours+screen)*100)/100;
    if(effective!==null&&effective<(Number.isFinite(Number(prefs.minHourlyUsd))?Number(prefs.minHourlyUsd):25))problems.push("BELOW_TARGET_RATE");
    if(x.paymentModel!=="hourly"&&x.paymentModel!=="fixed")warnings.push("PAYMENT_MODEL_UNCONFIRMED");
    return {status:problems.length?"HOLD":warnings.length?"SCREEN":"REVIEW",problems:problems,warnings:warnings,effectiveHourlyUsd:effective,
      opportunityType:"ACTIVE_PROJECT_WORK",availability:x.openingsVerified===true?"LISTING_REPORTED_OPEN":"UNCONFIRMED",earnedUsd:0,applicationSubmitted:false,
      note:"Advertised compensation is not earned income. Screening, onboarding, unpaid tests and taxes may reduce realized value."};
  }
  function digest(items,asOf,prefs){
    if(!Array.isArray(items)||items.length>200)throw Error("Expected at most 200 sourced project listings");
    var counts=new Map(),rows=[];
    items.forEach(function(x){var key=x&&typeof x.id==="string"?x.id.trim():"";if(key)counts.set(key,(counts.get(key)||0)+1);});
    items.forEach(function(x){
      var key=x&&typeof x.id==="string"?x.id.trim():"",assessment=review(x,asOf,prefs);
      if(key&&counts.get(key)>1){assessment.status="HOLD";assessment.problems.push("DUPLICATE_LISTING_ID");}
      rows.push({listing:x,assessment:assessment});
    });
    var rank={REVIEW:0,SCREEN:1,HOLD:2};
    rows.sort(function(a,b){return rank[a.assessment.status]-rank[b.assessment.status]||(b.assessment.effectiveHourlyUsd||0)-(a.assessment.effectiveHourlyUsd||0);});
    return {results:rows.filter(function(row){return row.assessment.status!=="HOLD";}),withheld:rows.filter(function(row){return row.assessment.status==="HOLD";}).length,notice:"Only evidence-screened listings are displayed. Eligibility evidence is listing-specific, not proof of recruiter acceptance. No live platform connection or application submission."};
  }
  var api=Object.freeze({platforms:platforms.slice(),review:review,digest:digest});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSProjectRadar=api;
}(typeof window!=="undefined"?window:null));
