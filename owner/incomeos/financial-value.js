"use strict";
(function(){
  // Combines independent financial evidence categories without allowing revenue
  // inflation or interpreting local owner review as a bank audit.
  // This is a pure reporting model. No financial activity is performed.
  function amount(v){
    if(!Number.isFinite(v)||v<0||Math.round(v*100)!==v*100&&Math.abs(Math.round(v*100)-v*100)>1e-7)throw Error("Invalid currency amount");
    return Math.round(v*100);
  }
  function usd(c){return c/100;}
  function validDate(x){
    if(typeof x!=="string"||!/^20\d\d-\d\d-\d\d$/.test(x))return false;
    var d=Date.parse(x+"T00:00:00Z");
    return Number.isFinite(d)&&new Date(d).toISOString().slice(0,10)===x;
  }
  async function summarize(args){
    if(!args||typeof args!=="object"||Array.isArray(args)||!validDate(args.asOf))throw Error("Explicit as-of date required");
    if(!window.IncomeOSEventJournal||!window.IncomeOSResearchOutcomes||!window.IncomeOSRecovery)throw Error("Financial evidence engines unavailable");
    if(!Array.isArray(args.journal)||!Array.isArray(args.studyStages)||!Array.isArray(args.paidBills))throw Error("Source evidence arrays required");
    var j=await window.IncomeOSEventJournal.report(args.journal);
    var research=await window.IncomeOSResearchOutcomes.analyze(args.studyStages,args.journal,args.asOf);
    var savings=window.IncomeOSRecovery.savingReview(args.paidBills);
    var byClass=j.ownerReviewedByClass,earned=amount(byClass.earned_income||0),
      investment=amount(byClass.investment_income||0),refund=amount(byClass.refund||0),
      returned=amount(byClass.returned_principal||0),saleProceeds=amount(byClass.sale_proceeds||0),
      researchSubset=amount(research.ownerReviewedResearchReceiptsUsd);
    if(researchSubset>earned)throw Error("Research attribution exceeds recorded owner-reviewed earned income");
    var observed=0;
    savings.forEach(function(s){observed+=amount(s.observedTwoCycleSavingsUsd);});
    if(!Number.isSafeInteger(observed))throw Error("Observed savings exceed safe integer range");
    var coverage={
      journalOwnerReviewedOnly:true,bankStatementsComplete:false,
      ownerIdentityVerified:false,independentAudit:false,taxClassificationComplete:false,
      appliedProviderReinvestment:false
    };
    return {
      asOf:args.asOf,
      ownerReviewedEarnedIncomeUsd:usd(earned),
      ownerReviewedInvestmentIncomeUsd:usd(investment),
      ownerReviewedCashIncomeUsd:usd(earned+investment),
      researchReceiptsWithinEarnedIncomeUsd:usd(researchSubset),
      ownerReviewedRefundsUsd:usd(refund),
      ownerReviewedReturnedPrincipalUsd:usd(returned),
      ownerReviewedSaleProceedsUsd:usd(saleProceeds),
      observedBillSavingsTwoCyclesUsd:usd(observed),
      recurringSavingsFutureGuaranteedUsd:null,
      moneyAvailableToInvestUsd:null,
      netAfterTaxBenefitUsd:null,
      currency:"USD",
      documentation:{
        activePostedTransactions:j.activePostings,ownerReviewedPostedTransactions:j.ownerReviewedPostings,
        pendingOwnerReviews:j.nonReviewedPostings,
        attributedResearchStudies:research.paidStudies,studyRecords:research.studyCount,
        comparableLowerBillPatterns:savings.length,
        journalCloseStatus:j.closeGate.status
      },
      controls:coverage,
      financialOutcomeStatus:"OWNER_REVIEWED_ONLY_NOT_EXTERNALLY_VERIFIED",
      note:"Research is a subset of earned income, not an additional addend. Recovered money, sale proceeds and observed lower bills are distinct from earned income. No net tax benefit, guaranteed future savings, investable cash or autonomous returns are inferred."
    };
  }
  window.IncomeOSFinancialValue=Object.freeze({summarize:summarize});
}());