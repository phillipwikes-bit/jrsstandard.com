"use strict";
(function(root){
  // Source-health triage only. Never interpret a cached balance as spendable cash.
  // Freshness needs a sync timestamp no more than 24 hours old against an explicit as-of instant;
  // a self-declared "current" label alone is not evidence of freshness.
  function instant(x){return typeof x==="string"&&/^20\d\d-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{3})?Z$/.test(x)?Date.parse(x):NaN;}
  function assess(sources,asOf){
    var now=instant(asOf);
    if(!Array.isArray(sources))throw Error("Source list required");
    var issues=[],seen=new Set(),statuses=[];
    sources.forEach(function(s,i){
      if(!s||typeof s!=="object"||typeof s.id!=="string"||!s.id.trim()||seen.has(s.id.trim())){
        issues.push({code:"INVALID_OR_DUPLICATE_SOURCE",index:i});return;
      }
      seen.add(s.id.trim());
      var connected=s.connectionStatus==="linked";
      var complete=s.coverageComplete===true;
      var synced=instant(s.lastSyncedAt);
      var current=s.freshness==="current"&&Number.isFinite(now)&&Number.isFinite(synced)&&synced<=now&&now-synced<=24*60*60*1000;
      var eligible=connected&&complete&&current&&s.balanceSourceVerified===true;
      statuses.push({id:s.id.trim(),eligibleForReview:eligible,
        reason:!connected?"CONNECTION_NOT_LINKED":!complete?"COVERAGE_INCOMPLETE":
          !current?"FRESHNESS_UNVERIFIED":s.balanceSourceVerified!==true?"BALANCE_UNVERIFIED":"SOURCE_REVIEW_ONLY"});
    });
    if(!sources.length)issues.push({code:"NO_SOURCES"});
    return {status:issues.length||statuses.some(function(s){return !s.eligibleForReview})?"HOLD":"SOURCE_REVIEW_ONLY",
      sources:statuses,issues:issues,availableToInvestCents:null,
      note:"Source health alone never establishes uncommitted funds, eligibility to invest, or owner approval."};
  }
  var api=Object.freeze({assess:assess});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSSourceHealth=api;
}(typeof window!=="undefined"?window:null));
