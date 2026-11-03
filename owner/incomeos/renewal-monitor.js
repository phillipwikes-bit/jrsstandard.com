"use strict";
(function(root){
  // IncomeOS renewal and price monitor. Builds on recurring patterns detected
  // by IncomeOSIntelligence.recurring (spend-intelligence.js) plus the owner's
  // own notes per service. It proposes reviews; it never cancels, negotiates or
  // contacts a vendor. A service the owner marks necessary is never proposed for
  // cancellation, only for price review.
  var VERSION="incomeos.renewals.v1";
  function isDate(x){return typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T00:00:00Z"));}
  function daysBetween(a,b){return Math.round((Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/86400000);}
  function addDays(d,n){return new Date(Date.parse(d+"T00:00:00Z")+n*86400000).toISOString().slice(0,10);}
  function key(s){return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}
  var PER_YEAR={weekly:52,monthly:12,quarterly:4,annual:1};

  // patterns: output of IncomeOSIntelligence.recurring(entries, asOf)
  // notes: [{vendor, necessary:true|false, cancelNoticeDays?, lastUsedOn?, contractEnd?}]
  function review(patterns,notes,asOf,opts){
    opts=opts||{};
    if(!isDate(asOf))throw Error("asOf date required");
    var horizon=Number.isFinite(opts.horizonDays)?opts.horizonDays:30,unusedDays=Number.isFinite(opts.unusedDays)?opts.unusedDays:90;
    var byVendor={};(notes||[]).forEach(function(n){if(n&&n.vendor)byVendor[key(n.vendor)]=n;});
    var items=[];
    (patterns||[]).forEach(function(p){
      if(!p||p.stale||!isDate(p.nextEstimated))return;
      var n=byVendor[key(p.vendor)]||null,flags=[];
      var until=daysBetween(asOf,p.nextEstimated);
      var noticeBy=n&&Number.isFinite(n.cancelNoticeDays)?addDays(p.nextEstimated,-n.cancelNoticeDays):null;
      if(until>=0&&until<=horizon)flags.push("RENEWS_WITHIN_"+horizon+"_DAYS");
      if(noticeBy&&noticeBy>=asOf&&daysBetween(asOf,noticeBy)<=14)flags.push("CANCELLATION_NOTICE_DEADLINE_SOON");
      if(noticeBy&&noticeBy<asOf&&until>=0)flags.push("CANCELLATION_NOTICE_WINDOW_PASSED");
      if(p.spike)flags.push("PRICE_INCREASE");
      if(!n)flags.push("NO_OWNER_NOTE: mark whether this service is necessary");
      else if(n.necessary!==true&&isDate(n.lastUsedOn)&&daysBetween(n.lastUsedOn,asOf)>unusedDays)flags.push("UNUSED_"+unusedDays+"_DAYS_REVIEW");
      if(!flags.length)return;
      var annual=PER_YEAR[p.cadence]?Math.round(p.typicalAmount*PER_YEAR[p.cadence]*100)/100:null;
      var increase=p.spike?Math.round((p.lastAmount-p.baseline)*(PER_YEAR[p.cadence]||0)*100)/100:0;
      items.push({vendor:p.vendor,cadence:p.cadence,nextEstimated:p.nextEstimated,noticeBy:noticeBy,typicalAmount:p.typicalAmount,lastAmount:p.lastAmount,
        estimatedAnnualCostUsd:annual,annualizedIncreaseUsd:increase||null,flags:flags,
        proposal:n&&n.necessary===true?"PRICE_REVIEW_ONLY":flags.some(function(f){return /^UNUSED/.test(f);})?"CANCELLATION_REVIEW_WITH_IMPACT_CHECK":"REVIEW",
        impactCheck:"Before cancelling, confirm nothing depends on this account (professional access, stored records, domains, email)."});
    });
    items.sort(function(a,b){return a.nextEstimated.localeCompare(b.nextEstimated);});
    return {version:VERSION,asOf:asOf,items:items,
      notice:"Next dates are estimates from payment history, not vendor renewal dates. A cancelled service becomes a saving only after two comparable later bills confirm it (recovery engine rule)."};
  }
  var api=Object.freeze({VERSION:VERSION,review:review});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSRenewals=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
