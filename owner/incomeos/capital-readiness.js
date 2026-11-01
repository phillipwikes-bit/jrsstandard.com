"use strict";
(function () {
  // A pure owner-review calculator. No bank authentication, custody, transfer,
  // trade, account opening, or ability to approve a proposed investment.
  var MAX_CENTS=100000000000000;
  function validDate(x){
    if(typeof x!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;
    var n=Date.parse(x+"T00:00:00Z");
    return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===x;
  }
  function cents(n){return Number.isSafeInteger(n)&&n>=0&&n<=MAX_CENTS;}
  function id(x){return typeof x==="string"&&/^[a-z0-9][a-z0-9._:-]{3,119}$/i.test(x);}
  function issue(code,detail){return {code:code,detail:detail};}
  function assess(input){
    if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Capital readiness requires an input record");
    if(!window.IncomeOSStatementClose)throw Error("Statement reconciliation dependency missing");
    var issues=[],asOf=input.asOf;
    if(!validDate(asOf))throw Error("Valid assessment date required");
    if(!input.statementPackage||typeof input.statementPackage!=="object")throw Error("Statement source package required");
    var close=window.IncomeOSStatementClose.assess(input.statementPackage);
    if(input.statementPackage.to!==asOf)issues.push(issue("STATEMENT_AS_OF_MISMATCH","Statements must close on the capital assessment date"));
    if(close.gate.status!=="READY_FOR_ACCOUNTANT_SOURCE_REVIEW")
      issues.push(issue("UNRECONCILED_SOURCE_COVERAGE","Account population, posting evidence or statement arithmetic is incomplete"));
    if(!Array.isArray(input.accountUse)||!Array.isArray(input.obligations))
      throw Error("Account usage and near-term obligation arrays are mandatory");
    if(input.accountUse.length>100||input.obligations.length>1000)throw Error("Review input exceeds bounded size");
    var manifest=new Map(),states=new Map(),totalCash=0,restrictions=0,unsettled=0,obligations=0,refs=new Set();
    input.statementPackage.expectedAccounts.forEach(function(a){
      if(a&&typeof a.institution==="string"&&typeof a.accountToken==="string")
        manifest.set(a.institution.trim()+"|"+a.accountToken,a);
    });
    input.accountUse.forEach(function(a,i){
      if(!a||typeof a!=="object"||typeof a.accountId!=="string"||!manifest.has(a.accountId)){
        issues.push(issue("UNKNOWN_ACCOUNT_USE","Account use row "+(i+1)+" has no declared, reviewed source"));return;
      }
      if(states.has(a.accountId)){issues.push(issue("DUPLICATE_ACCOUNT_USE","An account must be categorized exactly once"));return;}
      states.set(a.accountId,a);
      if(!["cash","noncash","liability"].includes(a.kind)||!id(a.evidenceId)||a.ownerReviewed!==true){
        issues.push(issue("ACCOUNT_USE_NOT_REVIEWED","A supported use designation and owner evidence are required"));return;
      }
      var declaration=manifest.get(a.accountId);
      if((a.kind==="liability")!==(declaration.balanceType==="liability")){
        issues.push(issue("ACCOUNT_TYPE_CONFLICT","Liability and asset designations must agree with statement coverage"));return;
      }
      if(a.kind==="liability"||a.kind==="noncash")return;
      if(!cents(a.restrictedCents)||!cents(a.unsettledDebitCents)){
        issues.push(issue("UNKNOWN_LIQUIDITY_HOLDS","Restricted cash and unsettled debits must be explicitly quantified"));return;
      }
      var matching=input.statementPackage.statements.filter(function(s){
        return s.institution.trim()+"|"+s.accountToken===a.accountId;
      }).sort(function(x,y){return x.endDate.localeCompare(y.endDate);});
      var latest=matching[matching.length-1];
      if(!latest||latest.endDate!==asOf||!Number.isSafeInteger(latest.closingCents)||latest.closingCents<0){
        issues.push(issue("CASH_SOURCE_NOT_CURRENT","Cash balance needs a reconciled, nonnegative closing statement on assessment date"));return;
      }
      if(a.restrictedCents+a.unsettledDebitCents>latest.closingCents){
        issues.push(issue("HOLDS_EXCEED_CASH","Restricted and unsettled debits exceed reported cash"));return;
      }
      totalCash+=latest.closingCents;
      restrictions+=a.restrictedCents;
      unsettled+=a.unsettledDebitCents;
    });
    manifest.forEach(function(_,key){
      if(!states.has(key))issues.push(issue("UNCLASSIFIED_ACCOUNT","Every declared account must be classified as cash, noncash or liability"));
    });
    var start=Date.parse(asOf+"T00:00:00Z");
    var horizonDays=input.horizonDays;
    if(!Number.isInteger(horizonDays)||horizonDays<30||horizonDays>180)
      issues.push(issue("INVALID_OBLIGATION_HORIZON","Future obligation coverage must be an explicit 30–180 days"));
    var coveredThrough=Number.isInteger(horizonDays)&&horizonDays>=30&&horizonDays<=180
      ?new Date(start+horizonDays*86400000).toISOString().slice(0,10):null;
    input.obligations.forEach(function(o,i){
      if(!o||typeof o!=="object"||!id(o.id)||!id(o.evidenceId)||!cents(o.amountCents)||!validDate(o.dueDate)){
        issues.push(issue("INVALID_OBLIGATION","Unverified or malformed obligation "+(i+1)));return;
      }
      if(refs.has(o.id)){issues.push(issue("DUPLICATE_OBLIGATION","Same obligation is counted more than once"));return;}
      refs.add(o.id);
      if(o.dueDate<asOf){issues.push(issue("OVERDUE_OBLIGATION","An overdue obligation requires separate resolution"));return;}
      if(coveredThrough&&o.dueDate>coveredThrough){
        issues.push(issue("OBLIGATION_OUTSIDE_HORIZON","Commitment exceeds declared coverage period"));return;
      }
      obligations+=o.amountCents;
    });
    if(input.obligationsReviewed!==true||!id(input.obligationCoverageEvidenceId))
      issues.push(issue("OBLIGATIONS_NOT_ATTESTED","Owner has not established completeness of near-term obligations"));
    var reserves=input.reserves||{};
    if(!cents(reserves.emergencyCents)||!cents(reserves.taxCents)||!cents(reserves.otherCents)
      ||!id(reserves.evidenceId)||reserves.ownerReviewed!==true)
      issues.push(issue("RESERVE_PLAN_NOT_REVIEWED","Documented emergency, tax and other reserves are mandatory"));
    if(!cents(input.proposedAllocationCents)||input.proposedAllocationCents===0)
      issues.push(issue("NO_SPECIFIC_ALLOCATION","A positive proposed investment allocation must be entered"));
    var all=[totalCash,restrictions,unsettled,obligations,
      reserves.emergencyCents,reserves.taxCents,reserves.otherCents,input.proposedAllocationCents];
    if(all.some(function(v){return !Number.isSafeInteger(v)||Math.abs(v)>MAX_CENTS}))
      issues.push(issue("UNSAFE_AGGREGATE","Calculated amounts exceed safe bounded integer-cent precision"));
    // Never publish a potentially misleading available-cash figure with missing sources.
    var ready=issues.length===0,sourceCash=ready?totalCash:null,
      budget=ready?Math.max(0,totalCash-restrictions-unsettled-obligations
        -reserves.emergencyCents-reserves.taxCents-reserves.otherCents):null;
    if(ready&&input.proposedAllocationCents>budget){
      issues.push(issue("PROPOSAL_EXCEEDS_PRELIMINARY_CAPACITY","Proposed investment exceeds modeled uncommitted cash"));
      ready=false;budget=null;sourceCash=null;
    }
    return {
      asOf:asOf,modeledCashCents:sourceCash,preliminaryUncommittedCents:budget,
      sourceCloseStatus:close.gate.status,sourceIssues:close.issues,
      accountCount:manifest.size,classifiedAccounts:states.size,reviewedObligations:refs.size,
      obligationHorizonThrough:coveredThrough,
      status:ready?"READY_FOR_OWNER_CAPITAL_REVIEW_ONLY":"HOLD",
      issues:issues,executable:false,ownerApprovalStillRequired:true,
      independentlyVerifiedBankBalance:false,providerReinvestmentSetUp:false,
      note:"Modeled capacity relies on owner-described account purposes and complete source coverage. It is neither independently verified spendable cash nor authorization for any funding, withdrawal or investment."
    };
  }
  window.IncomeOSCapitalReadiness=Object.freeze({assess:assess});
}());