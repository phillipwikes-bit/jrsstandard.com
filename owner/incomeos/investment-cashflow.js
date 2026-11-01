"use strict";
(function(){
  // Pure, source-linked asset cash-flow register for a future protected owner service.
  // This is NOT cost-basis accounting, a complete brokerage statement, an order
  // system, a tax return, or provider-verified automated reinvestment.
  var KINDS={
    DISTRIBUTION:{direction:"credit",classification:"investment_income"},
    CAPITAL_DEPLOYED:{direction:"debit",classification:"capital_contribution"},
    RETURNED_PRINCIPAL:{direction:"credit",classification:"returned_principal"},
    SALE_PROCEEDS:{direction:"credit",classification:"sale_proceeds"}
  };
  var MAX=5000,MAX_CENTS=1000000000000;
  function id(x){return typeof x==="string"&&/^[a-z0-9][a-z0-9._:-]{3,119}$/i.test(x);}
  function date(x){
    if(typeof x!=="string"||!/^20\d\d-\d\d-\d\d$/.test(x))return false;
    var t=Date.parse(x+"T00:00:00Z");
    return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===x;
  }
  function cents(x){return Number.isSafeInteger(x)&&x>0&&x<=MAX_CENTS;}
  function allKeys(row,allowed){
    return Object.keys(row).every(function(k){return allowed.includes(k);});
  }
  function normalize(x){
    if(!x||typeof x!=="object"||Array.isArray(x)||!id(x.id)||!id(x.assetId)||!date(x.date))
      throw Error("Investment cash-flow record requires an opaque identity, asset and valid date");
    if(x.kind==="REINVESTMENT_LINK"){
      var allowed=["id","assetId","date","kind","distributionId","deploymentId","evidenceId"];
      if(!allKeys(x,allowed)||!id(x.distributionId)||!id(x.deploymentId)||!id(x.evidenceId))
        throw Error("Reinvestment link requires separate referenced distribution, deployed capital and source evidence");
      return {id:x.id,assetId:x.assetId,date:x.date,kind:x.kind,
        distributionId:x.distributionId,deploymentId:x.deploymentId,evidenceId:x.evidenceId};
    }
    if(!Object.prototype.hasOwnProperty.call(KINDS,x.kind)||!allKeys(x,["id","assetId","date","kind","amountCents","bankEventId","documentId","evidenceId"]))
      throw Error("Unknown investment financial movement or unsupported fields");
    if(!cents(x.amountCents)||!id(x.bankEventId)||!id(x.documentId)||!id(x.evidenceId))
      throw Error("Cash movement needs cents and independently referenced financial and document records");
    return {id:x.id,assetId:x.assetId,date:x.date,kind:x.kind,amountCents:x.amountCents,
      bankEventId:x.bankEventId,documentId:x.documentId,evidenceId:x.evidenceId};
  }
  function issue(code,transactionId){return {code:code,transactionId:transactionId};}
  function sourceMatch(x,state){
    var post=state.posted.get(x.bankEventId);
    if(!post)return "BANK_POSTING_NOT_ACTIVE";
    var expected=KINDS[x.kind];
    if(post.data.direction!==expected.direction||post.data.amountCents!==x.amountCents)
      return "BANK_AMOUNT_OR_DIRECTION_MISMATCH";
    if(Math.abs((Date.parse(x.date+"T00:00:00Z")-Date.parse(post.data.postedDate+"T00:00:00Z"))/86400000)>7)
      return "BANK_POSTING_DATE_MISMATCH";
    var classes=state.classes.get(x.bankEventId)||[],matches=state.matches.get(x.bankEventId)||[],
      reviews=state.reconciled.get(x.bankEventId)||[];
    if(classes.length!==1||classes[0].data.classification!==expected.classification)
      return "JOURNAL_CLASSIFICATION_MISMATCH";
    if(reviews.length!==1||reviews[0].data.classificationEventId!==classes[0].id)
      return "JOURNAL_OWNER_REVIEW_MISSING";
    if(!matches.some(function(m){return m.data.documentId===x.documentId&&m.data.amountCents===x.amountCents;}))
      return "INVESTMENT_EVIDENCE_NOT_MATCHED";
    return null;
  }
  async function analyze(raw,journal,asOf){
    if(!date(asOf))throw Error("Assessment date required");
    if(!Array.isArray(raw)||raw.length>MAX)throw Error("Investment register size invalid");
    if(!window.IncomeOSEventJournal)throw Error("Verified financial source journal unavailable");
    var check=await window.IncomeOSEventJournal.verify(journal),
      ids=new Set(),postedIds=new Set(),accepted=new Map(),links=[],issues=[],cash={};
    var records=raw.map(function(row){
      var x=normalize(row);
      if(ids.has(x.id))throw Error("Duplicate investment movement ID");
      if(x.date>asOf)throw Error("Future-dated financial movements are prohibited");
      ids.add(x.id);return x;
    });
    records.forEach(function(x){
      if(x.kind==="REINVESTMENT_LINK"){links.push(x);return;}
      if(postedIds.has(x.bankEventId)){
        issues.push(issue("BANK_POSTING_ALREADY_ATTRIBUTED",x.id));return;
      }
      var problem=sourceMatch(x,check.state);
      if(problem){issues.push(issue(problem,x.id));return;}
      postedIds.add(x.bankEventId);accepted.set(x.id,x);
      cash[x.kind]=(cash[x.kind]||0)+x.amountCents;
    });
    var linkedIncome=new Set(),linkedCapital=new Set(),linkedReinvestmentCents=0;
    links.forEach(function(x){
      var d=accepted.get(x.distributionId),p=accepted.get(x.deploymentId);
      if(!d||!p||d.kind!=="DISTRIBUTION"||p.kind!=="CAPITAL_DEPLOYED"
        ||d.assetId!==x.assetId||p.assetId!==x.assetId
        ||p.amountCents!==d.amountCents||p.date<x.date||d.date>x.date
        ||p.date<d.date||Math.abs((Date.parse(p.date+"T00:00:00Z")-Date.parse(d.date+"T00:00:00Z"))/86400000)>7){
        issues.push(issue("REINVESTMENT_EVIDENCE_CONFLICT",x.id));return;
      }
      if(linkedIncome.has(d.id)||linkedCapital.has(p.id)){
        issues.push(issue("DUPLICATED_REINVESTMENT_LINK",x.id));return;
      }
      linkedIncome.add(d.id);linkedCapital.add(p.id);
      linkedReinvestmentCents+=d.amountCents;
    });
    var byAsset=new Map();
    accepted.forEach(function(x){
      if(!byAsset.has(x.assetId))byAsset.set(x.assetId,{assetId:x.assetId,capitalDeployedCents:0,
        investmentIncomeCents:0,returnedPrincipalCents:0,saleProceedsCents:0,estimatedUnreturnedPrincipalCents:null,
        costBasisEstablished:false,realizedGainCents:null,marketValueCents:null});
      var a=byAsset.get(x.assetId);
      if(x.kind==="CAPITAL_DEPLOYED")a.capitalDeployedCents+=x.amountCents;
      if(x.kind==="DISTRIBUTION")a.investmentIncomeCents+=x.amountCents;
      if(x.kind==="RETURNED_PRINCIPAL")a.returnedPrincipalCents+=x.amountCents;
      if(x.kind==="SALE_PROCEEDS")a.saleProceedsCents+=x.amountCents;
    });
    byAsset.forEach(function(a){
      if(a.returnedPrincipalCents>a.capitalDeployedCents)
        issues.push(issue("PREEXISTING_CAPITAL_OR_BASIS_NOT_IMPORTED",a.assetId));
      if(a.saleProceedsCents>0)issues.push(issue("SALE_BASIS_AND_LOTS_NOT_ESTABLISHED",a.assetId));
      // A cost-basis or remaining-capital figure is not inferred from proceeds.
    });
    var result={asOf:asOf,acceptedMovements:accepted.size,rejectedMovementCount:records.length-accepted.size-links.length,
      journalHeadHash:check.headHash,
      ownerReviewedCashIncomeCents:cash.DISTRIBUTION||0,
      ownerReviewedCapitalDeployedCents:cash.CAPITAL_DEPLOYED||0,
      ownerReviewedReturnedPrincipalCents:cash.RETURNED_PRINCIPAL||0,
      ownerReviewedSaleProceedsCents:cash.SALE_PROCEEDS||0,
      linkedPotentialReinvestmentsCents:linkedReinvestmentCents,
      linkedReinvestmentPairs:linkedIncome.size,assets:Array.from(byAsset.values()),issues:issues,
      gate:{status:issues.length?"HOLD":"OWNER_SOURCE_LINKED_REVIEW_ONLY",executable:false,
        bankOrBrokerIndependentlyAuthenticated:false,completePositionInventory:false,
        providerReinvestmentVerified:false,taxCostBasisVerified:false,
        note:"Amounts are matched to an owner-reviewed journal. They are neither audited investment performance nor proof of trade execution; linked reinvestment pairs require provider confirmation."}};
    if(Object.keys(cash).some(function(k){return !Number.isSafeInteger(cash[k])||cash[k]>Number.MAX_SAFE_INTEGER;})
      ||!Number.isSafeInteger(linkedReinvestmentCents))throw Error("Financial aggregate exceeds integer precision");
    return result;
  }
  window.IncomeOSInvestmentCashflow=Object.freeze({normalize:normalize,analyze:analyze});
}());