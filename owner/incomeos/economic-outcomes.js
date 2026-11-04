"use strict";
(function(root){
  // Pure evidence review. Does not calculate investable cash or initiate payment.
  var types=new Set(["EARNED_INCOME","INVESTMENT_DISTRIBUTION","BILL_SAVINGS","REFUND","RETURNED_PRINCIPAL"]);
  function review(events){
    if(!Array.isArray(events))return {status:"HOLD",issues:["INVALID_EVENTS"],verifiedBenefitCents:null,availableToInvestCents:null};
    var seen=new Set(),evidenceSeen=new Set(),issues=[],totals={EARNED_INCOME:0,INVESTMENT_DISTRIBUTION:0,BILL_SAVINGS:0,REFUND:0,RETURNED_PRINCIPAL:0};
    if(events.length===0)issues.push({code:"NO_OUTCOME_EVIDENCE"});
    events.forEach(function(e,i){
      if(!e||typeof e!=="object"||typeof e.id!=="string"||!e.id.trim()||seen.has(e.id.trim())){
        issues.push({index:i,code:"DUPLICATE_OR_INVALID_ID"});return;
      }
      seen.add(e.id.trim());
      if(!types.has(e.type)){issues.push({index:i,code:"UNKNOWN_CLASSIFICATION"});return;}
      if(!Number.isSafeInteger(e.amountCents)||e.amountCents<=0){issues.push({index:i,code:"INVALID_AMOUNT"});return;}
      if(e.posted!==true||e.sourceVerified!==true||typeof e.evidenceId!=="string"||!e.evidenceId.trim()){
        issues.push({index:i,code:"UNVERIFIED_OUTCOME"});return;
      }
      var evidenceKey=e.evidenceId.trim();
      if(evidenceSeen.has(evidenceKey)){
        issues.push({index:i,code:"DUPLICATE_EVIDENCE_REFERENCE"});return;
      }
      if(e.type==="BILL_SAVINGS"&&e.baselineVerified!==true){
        issues.push({index:i,code:"SAVINGS_BASELINE_MISSING"});return;
      }
      if(e.type==="REFUND"&&e.originalChargeVerified!==true){
        issues.push({index:i,code:"REFUND_LINK_MISSING"});return;
      }
      if(e.type==="RETURNED_PRINCIPAL"&&e.principalBasisVerified!==true){
        issues.push({index:i,code:"PRINCIPAL_BASIS_MISSING"});return;
      }
      // Evidence counts as used only once its event is accepted, so a rejected event cannot block a valid one.
      evidenceSeen.add(evidenceKey);
      if(!Number.isSafeInteger(totals[e.type]+e.amountCents)){
        issues.push({index:i,code:"TOTAL_OVERFLOW"});return;
      }
      totals[e.type]+=e.amountCents;
    });
    var verifiedBenefitCents=totals.EARNED_INCOME+totals.INVESTMENT_DISTRIBUTION;
    if(!Number.isSafeInteger(verifiedBenefitCents)){issues.push({code:"BENEFIT_OVERFLOW"});verifiedBenefitCents=null;}
    return {status:issues.length?"HOLD":"EVIDENCE_REVIEW_ONLY",issues:issues,totals:issues.length?null:totals,
      verifiedBenefitCents:issues.length?null:verifiedBenefitCents,avoidedCostCents:issues.length?null:totals.BILL_SAVINGS,availableToInvestCents:null,transferAuthorized:false,
      note:"Bill savings are avoided costs, not deposits. Refunds and returned principal are not new income."};
  }
  var api=Object.freeze({review:review});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSEconomicOutcomes=api;
}(typeof window!=="undefined"?window:null));
