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
    if(!Number.isFinite(date(raw.reviewed))||!Number.isFinite(date(raw.eventEnd)))throw new Error("Verified calendar dates required");
    if(!["online","hybrid","in-person"].includes(raw.mode))throw new Error("Mode must be online, hybrid or in-person");
    var eligibility=Array.isArray(raw.eligibility)?raw.eligibility.slice(0,8).map(function(x){return clean(x,160);}):[];
    var risks=Array.isArray(raw.risk)?raw.risk.slice(0,8).map(function(x){return clean(x,160);}):[];
    return {id:id,title:title,provider:provider,paymentUsd:payment,minutes:mins,screenMinutes:screen,mode:raw.mode,reviewed:raw.reviewed,eventEnd:raw.eventEnd,
      url:raw.url,sourceUrl:raw.sourceUrl,dates:clean(raw.dates,100),linkKind:clean(raw.linkKind,80),eligibility:eligibility,risk:risks,status:clean(raw.status,150)||"Availability unconfirmed",eligibilityStatus:["unknown","owner-reports-possible","owner-reports-ineligible"].includes(raw.eligibilityStatus)?raw.eligibilityStatus:"unknown"};
  }
  function assess(raw,prefs,asOf){
    var x=candidate(raw);
    if(!Number.isFinite(date(asOf)))throw new Error("Valid current review date required");
    prefs=prefs||{};
    var minPay=Number(prefs.minPay),maxScreen=Number(prefs.maxScreenMinutes);
    if(!Number.isFinite(minPay)||minPay<0||minPay>100000)minPay=100;
    if(!Number.isFinite(maxScreen)||maxScreen<0||maxScreen>720)maxScreen=15;
    var remoteOnly=prefs.remoteOnly!==false, reasons=[],warnings=[],expired=x.eventEnd<asOf,
      staleDays=Math.floor((date(asOf)-date(x.reviewed))/86400000),stale=staleDays>3||staleDays<0,
      disqualified=x.eligibilityStatus==="owner-reports-ineligible";
    if(expired)reasons.push("Published study date passed; confirm any reopening");
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
    var wholeTime=x.screenMinutes===null?null:x.minutes+x.screenMinutes;
    var fullRate=wholeTime===null?null:Math.round(x.paymentUsd*60/wholeTime*100)/100;
    return {candidate:x,priority:reasons.length?"HOLD":warnings.length?"PRIORITY_TO_SCREEN":"REVIEW_CANDIDATE",reasons:reasons,warnings:warnings,
      sessionRate:rate,sessionPlusScreenRate:fullRate,sourceAgeDays:staleDays,deadline:x.eventEnd,availability:"UNCONFIRMED",paid:false};
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
    var order={PRIORITY_TO_SCREEN:0,REVIEW_CANDIDATE:1,HOLD:2};
    results.sort(function(a,b){return order[a.priority]-order[b.priority]||b.candidate.paymentUsd-a.candidate.paymentUsd||a.deadline.localeCompare(b.deadline);});
    return {date:asOf,scanned:d.items.length,duplicateCount:d.skipped,results:results,priority:results.filter(function(x){return x.priority==="PRIORITY_TO_SCREEN"||x.priority==="REVIEW_CANDIDATE";}).length,
      notice:"Sourced candidates only. This interface neither crawls recruiters nor confirms selection or earnings."};
  }
  window.IncomeOSResearchRadar=Object.freeze({candidate:candidate,assess:assess,dedupe:dedupe,digest:digest});
}());
