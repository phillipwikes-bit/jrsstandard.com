"use strict";
(function(root){
  // Source evidence COMPLETENESS check. No financial data or account credentials.
  // Every field here is supplied by the caller, so a complete attestation is self-asserted:
  // it never sets verified:true. Independent verification needs a trusted backend (release-gate.js).
  // nowIso must come from the server's own clock; this pure function cannot check that.
  function instant(x){return typeof x==="string"&&/^20\d\d-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{3})?Z$/.test(x)?Date.parse(x):NaN;}
  function hold(reason){return {status:"HOLD",reasons:[reason],verified:false,attestationComplete:false,selfAttested:true,availableToInvestCents:null,authorizationToTransfer:false};}
  function verify(input, nowIso){
    var reasons=[];
    var now=instant(nowIso);
    if(!Number.isFinite(now))return hold("INVALID_REVIEW_TIME");
    if(!input||typeof input!=="object"||Array.isArray(input))return hold("INVALID_EVIDENCE");
    if(input.connectionStatus!=="linked")reasons.push("CONNECTION_NOT_LINKED");
    if(input.coverageComplete!==true)reasons.push("COVERAGE_INCOMPLETE");
    if(input.balanceSourceVerified!==true)reasons.push("BALANCE_SOURCE_UNVERIFIED");
    if(input.statementReconciled!==true)reasons.push("STATEMENT_NOT_RECONCILED");
    if(typeof input.sourceEvidenceId!=="string"||!input.sourceEvidenceId.trim())
      reasons.push("EVIDENCE_REFERENCE_MISSING");
    // A reference, never a raw account or routing number.
    else if(/^\d{9,}$/.test(input.sourceEvidenceId.replace(/[\s-]/g,"")))reasons.push("EVIDENCE_REFERENCE_LOOKS_LIKE_ACCOUNT_NUMBER");
    var checked=instant(input.verifiedAt);
    if(!Number.isFinite(checked))reasons.push("VERIFICATION_TIME_MISSING");
    else if(checked>now)reasons.push("VERIFICATION_IN_FUTURE");
    else if(now-checked>24*60*60*1000)reasons.push("VERIFICATION_STALE");
    return {status:reasons.length?"HOLD":"EVIDENCE_REVIEW_ONLY",reasons:reasons,
      verified:false,attestationComplete:reasons.length===0,selfAttested:true,availableToInvestCents:null,
      authorizationToTransfer:false};
  }
  var api=Object.freeze({verify:verify});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSSourceAttestation=api;
}(typeof window!=="undefined"?window:null));
