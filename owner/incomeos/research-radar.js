"use strict";
(function(){
  // Research detection means scoring sourced candidate records. It is not a live crawler or recruiter confirmation.
  function date(s){
    if(typeof s!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(s))return NaN;
    var v=new Date(s+"T00:00:00Z");
    return Number.isFinite(v.getTime())&&v.toISOString().slice(0,10)===s?v.getTime():NaN;
  }
  function clean(x,max){return String(x==null?"":x).trim().slice(0,max);}
  function url(x){
    if(typeof x!=="string"||x.length>600)return false;
    try{var u=new URL(x);return u.protocol==="https:"&&!u.username&&!u.password&&!!u.hostname&&!/^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/i.test(u.hostname);}catch(e){return false;}
  }
  function candidate(raw){
    if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new Error("Opportunity must be a structured record");
    var id=clean(raw.id,90),title=clean(raw.title,110),provider=clean(raw.provider,90);
    if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{3,89}$/.test(id)||!title||!provider)throw new Error("Valid id, title and provider required");
    if(!url(raw.sourceUrl)||!url(raw.url))throw new Error("Both source and direct study HTTPS links are required");
    var payment=Number(raw.paymentUsd),mins=Number(raw.minutes),screen=raw.screenMinutes===null||raw.screenMinutes===undefined||raw.screenMinutes===""?null:Number(raw.screenMinutes);
    if(!Number.isFinite(payment)||payment<=0||payment>100000||!Number.isFinite(mins)||mins<5||mins>10080||screen!==null&&(!Number.isFinite(screen)||screen<0||screen>720))throw new Error("Invalid advertised compensation or participation time");
    function optionalMinutes(value,name){if(value===null||value===undefined||value==="")return null;var n=Number(value);if(!Number.isFinite(n)||n<0||n>1440)throw new Error("Invalid "+name+" minutes");return n;}
    var prep=optionalMinutes(raw.prepMinutes,"preparation"),admin=optionalMinutes(raw.adminMinutes,"follow-up administration");
    var confidence=["verified","estimated"].includes(raw.timeConfidence)?raw.timeConfidence:"unknown";
    // Compensation form: cash, gift card, points or unknown. Non-cash value is not equivalent to cash.
    var pf=String(raw.paymentForm||raw.paymentMethod||"").toLowerCase();
    var paymentForm=/gift|amazon|visa card|prepaid|voucher/.test(pf)?"gift_card":/point|credit|token/.test(pf)?"points":/cash|paypal|bank|ach|direct deposit|check|cheque|zelle|venmo|wire/.test(pf)?"cash":"unknown";
    if(!Number.isFinite(date(raw.reviewed))||(raw.eventEnd!==null&&raw.eventEnd!==undefined&&!Number.isFinite(date(raw.eventEnd))))throw new Error("Verified source date and valid published end date when available required");
    var eventEnd=raw.eventEnd===null||raw.eventEnd===undefined?null:raw.eventEnd;
    var dateType=["application-deadline","published-session-end"].includes(raw.dateType)?raw.dateType:"published-session-end";
    if(!["online","hybrid","in-person"].includes(raw.mode))throw new Error("Mode must be online, hybrid or in-person");
    var eligibility=Array.isArray(raw.eligibility)?raw.eligibility.slice(0,8).map(function(x){return clean(x,160);}):[];
    var risks=Array.isArray(raw.risk)?raw.risk.slice(0,8).map(function(x){return clean(x,160);}):[];
    return {id:id,title:title,provider:provider,paymentUsd:payment,paymentForm:paymentForm,minutes:mins,screenMinutes:screen,prepMinutes:prep,adminMinutes:admin,timeConfidence:confidence,mode:raw.mode,reviewed:raw.reviewed,eventEnd:eventEnd,dateType:dateType,
      url:raw.url,sourceUrl:raw.sourceUrl,dates:clean(raw.dates,100),linkKind:clean(raw.linkKind,80),eligibility:eligibility,risk:risks,status:clean(raw.status,150)||"Availability unconfirmed",eligibilityStatus:["unknown","owner-reports-possible","owner-reports-ineligible"].includes(raw.eligibilityStatus)?raw.eligibilityStatus:"unknown"};
  }
  function assess(raw,prefs,asOf){
    var x=candidate(raw);
    if(!Number.isFinite(date(asOf)))throw new Error("Valid current review date required");
    prefs=prefs||{};
    var minPay=Number(prefs.minPay),maxScreen=Number(prefs.maxScreenMinutes);
    // Gross compensation is a secondary floor; EHY is the primary economic criterion.
    if(!Number.isFinite(minPay)||minPay<0||minPay>100000)minPay=0;
    if(!Number.isFinite(maxScreen)||maxScreen<0||maxScreen>720)maxScreen=15;
    var remoteOnly=prefs.remoteOnly!==false, reasons=[],warnings=[],expired=x.eventEnd!==null&&x.eventEnd<asOf,
      staleDays=Math.floor((date(asOf)-date(x.reviewed))/86400000),stale=staleDays>3||staleDays<0,
      disqualified=x.eligibilityStatus==="owner-reports-ineligible";
    if(expired)reasons.push("Published study date passed; confirm any reopening");
    if(x.eventEnd===null)warnings.push("No application deadline published; status must be rechecked with the recruiter");
    if(stale)reasons.push("Source review is more than three days old or future-dated");
    if(disqualified)reasons.push("Owner marked eligibility as ineligible");
    if(remoteOnly&&x.mode!=="online")reasons.push("Not a fully remote study");
    if(x.paymentUsd<minPay)reasons.push("Advertised payment is below the configured threshold");
    if(x.screenMinutes===null)warnings.push("Screening effort has not been confirmed");
    else if(x.screenMinutes>maxScreen)reasons.push("Screening exceeds the configured effort limit");
    if(x.eligibilityStatus==="unknown")warnings.push("Owner eligibility not established");
    if(!x.linkKind||!/direct|study-specific|screener/i.test(x.linkKind))warnings.push("Direct application status not substantiated");
    if(/unconfirmed|unknown|requires account/i.test(x.status))warnings.push("Recruiter availability is not confirmed");
    var rate=Math.round(x.paymentUsd*60/x.minutes*100)/100;
    // EHY = advertised compensation / (session + screener + preparation + follow-up) hours.
    // Missing components are never treated as zero. A zero is accepted only when the
    // time values carry a stated confidence (verified or estimated).
    var parts=[["screener",x.screenMinutes],["preparation",x.prepMinutes],["follow-up",x.adminMinutes]];
    var missing=parts.filter(function(p){return p[1]===null;}).map(function(p){return p[0];});
    var unconfirmedZero=x.timeConfidence==="unknown"?parts.filter(function(p){return p[1]===0;}).map(function(p){return p[0];}):[];
    var complete=missing.length===0&&unconfirmedZero.length===0;
    var totalMinutes=complete?x.minutes+x.screenMinutes+x.prepMinutes+x.adminMinutes:null;
    var ehy=totalMinutes===null?null:Math.round(x.paymentUsd*60/totalMinutes*100)/100;
    if(missing.length)warnings.push("EHY unavailable: missing "+missing.join(", ")+" time");
    if(unconfirmedZero.length)warnings.push("EHY unavailable: zero "+unconfirmedZero.join(", ")+" time not confirmed");
    if(complete&&x.timeConfidence==="unknown")warnings.push("Time confidence not verified; EHY is provisional");
    if(complete&&x.timeConfidence==="estimated")warnings.push("EHY uses estimated time");
    if(x.paymentForm!=="cash")warnings.push(x.paymentForm==="unknown"?"Payment form not stated (cash or gift card)":"Paid as "+x.paymentForm.replace("_"," ")+", not cash");
    if(prefs.cashOnly===true&&x.paymentForm!=="cash")reasons.push("Cash payment required by your settings");
    var minEhy=Number(prefs.minEhy);
    if(Number.isFinite(minEhy)&&minEhy>0){
      if(ehy===null)reasons.push("Effective hourly yield cannot be verified against the configured threshold");
      else if(ehy<minEhy)reasons.push("Effective hourly yield below configured threshold");
    }
    var wholeTime=x.screenMinutes===null?null:x.minutes+x.screenMinutes;
    var fullRate=wholeTime===null?null:Math.round(x.paymentUsd*60/wholeTime*100)/100;
    return {candidate:x,priority:reasons.length?"HOLD":warnings.length?"PRIORITY_TO_SCREEN":"REVIEW_CANDIDATE",reasons:reasons,warnings:warnings,
      sessionRate:rate,sessionPlusScreenRate:fullRate,effectiveHourlyYield:ehy,totalMinutes:totalMinutes,ehyMissing:missing.concat(unconfirmedZero.map(function(p){return p+" (zero unconfirmed)";})),timeConfidence:x.timeConfidence,paymentForm:x.paymentForm,sourceAgeDays:staleDays,deadline:x.eventEnd,availability:"UNCONFIRMED",paid:false};
  }
  function dedupe(items){
    var map=new Map(),links=new Set(),skipped=0;
    (items||[]).forEach(function(raw){
      var x=candidate(raw),k=x.url.split("#")[0].replace(/\/$/,"");
      if(map.has(x.id)){skipped++;var prior=map.get(x.id);if(x.reviewed>prior.reviewed)map.set(x.id,x);return;}
      if(links.has(k)){skipped++;return;}
      links.add(k);map.set(x.id,x);
    });
    return {items:Array.from(map.values()),skipped:skipped};
  }
  function digest(items,prefs,asOf){
    var d=dedupe(items),results=d.items.map(function(x){return assess(x,prefs,asOf);});
    // Held items (expired, ineligible, below thresholds) always rank last, whatever their EHY.
    // Among the rest, EHY is primary; items without EHY follow; gross pay is secondary.
    function held(v){return v.priority==="HOLD"?1:0;}
    function ehyKey(v){return v.effectiveHourlyYield===null?-1:v.effectiveHourlyYield;}
    results.sort(function(a,b){return held(a)-held(b)||ehyKey(b)-ehyKey(a)||b.candidate.paymentUsd-a.candidate.paymentUsd||(a.deadline||"9999-12-31").localeCompare(b.deadline||"9999-12-31");});
    return {date:asOf,scanned:d.items.length,duplicateCount:d.skipped,results:results,priority:results.filter(function(x){return x.priority==="PRIORITY_TO_SCREEN"||x.priority==="REVIEW_CANDIDATE";}).length,
      notice:"Sourced candidates only. This interface neither crawls recruiters nor confirms selection or earnings."};
  }
  window.IncomeOSResearchRadar=Object.freeze({candidate:candidate,assess:assess,dedupe:dedupe,digest:digest});
}());
