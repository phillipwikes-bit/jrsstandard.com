"use strict";
(function(root){
  // Independent source evidence gate. No financial data or account credentials.
  function verify(input, nowIso){
    var reasons=[];
    var now=Date.parse(nowIso);
    if(!Number.isFinite(now))return {status:"HOLD",reasons:["INVALID_REVIEW_TIME"],verified:false};
    if(!input||typeof input!=="object"||Array.isArray(input))
      return {status:"HOLD",reasons:["INVALID_EVIDENCE"],verified:false};
    if(input.connectionStatus!=="linked")reasons.push("CONNECTION_NOT_LINKED");
    if(input.coverageComplete!==true)reasons.push("COVERAGE_INCOMPLETE");
    if(input.balanceSourceVerified!==true)reasons.push("BALANCE_SOURCE_UNVERIFIED");
    if(input.statementReconciled!==true)reasons.push("STATEMENT_NOT_RECONCILED");
    if(typeof input.sourceEvidenceId!=="string"||!input.sourceEvidenceId.trim())
      reasons.push("EVIDENCE_REFERENCE_MISSING");
    var checked=typeof input.verifiedAt==="string"?Date.parse(input.verifiedAt):NaN;
    if(!Number.isFinite(checked))reasons.push("VERIFICATION_TIME_MISSING");
    else if(checked>now)reasons.push("VERIFICATION_IN_FUTURE");
    else if(now-checked>24*60*60*1000)reasons.push("VERIFICATION_STALE");
    return {status:reasons.length?"HOLD":"EVIDENCE_REVIEW_ONLY",reasons:reasons,
      verified:reasons.length===0,availableToInvestCents:null,
      authorizationToTransfer:false};
  }
  var api=Object.freeze({verify:verify});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSSourceAttestation=api;
}(typeof window!=="undefined"?window:null));
