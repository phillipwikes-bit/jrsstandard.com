"use strict";
(function(root){
  // Conservative review-only release gate; no client-supplied flag constitutes source authentication.
  function assess(input){
    var failures=[];
    if(!input||typeof input!=="object"||Array.isArray(input))return {status:"HOLD",failures:["INVALID_INPUT"],incomeCents:null,availableToInvestCents:null,transferAuthorized:false,investmentExecutionEnabled:false};
    if(!Array.isArray(input.events)||input.events.length===0)failures.push("NO_EVENTS");
    if(!Array.isArray(input.statementEntries)||input.statementEntries.length===0)failures.push("NO_STATEMENTS");
    if(input.serverAuthenticated!==true)failures.push("NO_TRUSTED_SERVER_ATTESTATION");
    if(input.ownerAccessVerified!==true)failures.push("OWNER_ACCESS_UNVERIFIED");
    if(input.reconciliationComplete!==true)failures.push("RECONCILIATION_INCOMPLETE");
    if(input.auditLogDurable!==true)failures.push("AUDIT_LOG_UNVERIFIED");
    if(input.releaseSecurityApproved!==true)failures.push("SECURITY_RELEASE_NOT_APPROVED");
    // Even all supplied assertions cannot establish external authenticity in a static client.
    failures.push("INDEPENDENT_SOURCE_VERIFICATION_REQUIRED");
    return {status:"HOLD",failures:failures,incomeCents:null,availableToInvestCents:null,
      transferAuthorized:false,investmentExecutionEnabled:false,
      note:"A trusted backend must independently authenticate evidence and authorize each consequential operation."};
  }
  var api=Object.freeze({assess:assess});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSReleaseGate=api;
}(typeof window!=="undefined"?window:null));
