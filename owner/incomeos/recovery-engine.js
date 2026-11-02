"use strict";
(function(){
  // Recovery candidates and recurring-savings evidence. Does not execute claims or assume entitlement.
  function date(s){
    if(typeof s!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
    var d=Date.parse(s+"T00:00:00Z");
    return Number.isFinite(d)&&new Date(d).toISOString().slice(0,10)===s;
  }
  function cents(n){
    var s=String(n);
    if(!/^\d{1,11}(\.\d{1,2})?$/.test(s))throw new Error("Invalid positive USD amount");
    var p=s.split("."),out=Number(p[0])*100+Number((p[1]||"").padEnd(2,"0"));
    if(!Number.isSafeInteger(out)||out<=0)throw new Error("Amount must be a positive number of cents");
    return out;
  }
  function merchant(s){return String(s||"").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").replace(/\s+/g," ").slice(0,120);}
  function dayGap(a,b){return Math.abs((Date.parse(a+"T00:00:00Z")-Date.parse(b+"T00:00:00Z"))/86400000);}
  function source(e){
    if(!e||!e.bankSource)return null;
    var b=e.bankSource;
    return [b.institution,b.accountToken,b.transactionId].map(function(x){return String(x||"").trim();}).join("|");
  }
  function charges(entries){
    return (Array.isArray(entries)?entries:[]).filter(function(e){return e&&e.kind==="outflow"&&e.type==="expense"&&date(e.date)&&e.id&&merchant(e.payer||e.label);}).flatMap(function(e){
      try{return [{id:String(e.id),vendor:merchant(e.payer||e.label),label:String(e.label||"").slice(0,100),date:e.date,amountCents:cents(e.amountUsd),source:source(e)}];}
      catch(_err){return [];}
    });
  }
  function duplicateCandidates(entries){
    var a=charges(entries),out=[];
    for(var i=0;i<a.length;i++)for(var j=i+1;j<a.length;j++){
      var x=a[i],y=a[j];
      if(x.id===y.id||x.vendor!==y.vendor||x.amountCents!==y.amountCents||dayGap(x.date,y.date)>1)continue;
      if(x.source && y.source && x.source===y.source)continue; // Duplicate import, not two bank debits.
      out.push({firstId:x.id,secondId:y.id,vendor:x.vendor,amountUsd:x.amountCents/100,
        state:"POSSIBLE_DUPLICATE_REQUIRES_DOCUMENT_REVIEW",
        reason:"Matching merchant, amount and near-date do not establish an unauthorized second charge.",
        sourceDistinct:!!(x.source&&y.source&&x.source!==y.source)});
    }
    return out.slice(0,100);
  }
  function refundCases(entries,reconciliation){
    var a=charges(entries),byId=new Map(a.map(function(x){return [x.id,x];}));
    var approved=new Set((reconciliation&&Array.isArray(reconciliation.matches)?reconciliation.matches:[]).filter(function(m){return m.state==="OWNER_REVIEWED_BANK_MATCH";}).map(function(m){return m.entryId;}));
    var out=[];
    (Array.isArray(entries)?entries:[]).forEach(function(e){
      if(!e||e.kind!=="income"||e.scope!=="nonincome"||e.status!=="paid"||!date(e.date))return;
      var value;
      try{value=cents(e.grossUsd);}catch(_err){return;}
      var original=byId.get(String(e.refundOf||"")),plausible=!!original&&value<=original.amountCents&&e.date>=original.date;
      var bankMatched=approved.has(String(e.id)),originalMatched=original&&approved.has(original.id),bothMatched=plausible&&bankMatched&&originalMatched;
      out.push({id:String(e.id||""),originalId:original?original.id:null,valueUsd:value/100,
        state:!original?"UNLINKED_NONINCOME_RECEIPT":!plausible?"AMOUNT_OR_DATE_CONFLICT":!bankMatched?"OWNER_REFUND_ENTRY_UNCONFIRMED":!originalMatched?"ORIGINAL_CHARGE_NOT_RECONCILED":"OWNER_REVIEWED_BOTH_BANK_POSTINGS",
        countsAsNewEarnings:false,ownerReviewedRecoveredUsd:bothMatched?value/100:0,
        note:"A refund requires original-charge and credit evidence. Even two owner-reviewed bank postings are not an independent audit."});
    });
    return out;
  }
  function savingReview(bills){
    if(!Array.isArray(bills))return [];
    var groups=new Map();
    bills.forEach(function(b){
      if(!b||typeof b!=="object"||typeof b.provider!=="string"||typeof b.service!=="string"||!/^20\d\d-(0[1-9]|1[0-2])$/.test(b.month))return;
      if(b.confirmedEquivalentService!==true||b.sourceStatus!=="owner-reviewed-bill-and-bank")return;
      var amount;
      try{amount=cents(b.amountUsd);}catch(_err){return;}
      var key=merchant(b.provider)+"|"+merchant(b.service);
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push({month:b.month,amountCents:amount});
    });
    var out=[];
    groups.forEach(function(rows,key){
      rows.sort(function(x,y){return x.month.localeCompare(y.month);});
      var unique=new Map();rows.forEach(function(x){if(!unique.has(x.month))unique.set(x.month,x.amountCents);else unique.set(x.month,null);});
      var clean=Array.from(unique.entries()).filter(function(x){return x[1]!==null;});
      if(clean.length<3)return;
      var prior=clean[clean.length-3],first=clean[clean.length-2],latest=clean[clean.length-1];
      var ix=function(s){return Number(s.slice(0,4))*12+Number(s.slice(5,7));};
      if(ix(latest[0])-ix(first[0])!==1||ix(first[0])-ix(prior[0])!==1)return;
      if(first[1]>=prior[1]||latest[1]>=prior[1])return;
      // Two comparable paid bills after a reduction support observation, not future savings.
      var reduced=prior[1]*2-first[1]-latest[1];
      out.push({service:key,observedPeriod:first[0]+" to "+latest[0],
        observedTwoCycleSavingsUsd:reduced/100,monthlyRunRateNotGuaranteedUsd:reduced/200,
        state:"OBSERVED_TWO_CYCLES",earnings:false,
        note:"Savings against an evidenced equivalent service baseline. No assumed future persistence."});
    });
    return out;
  }
  function analyze(entries,reconciliation,bills){
    var dup=duplicateCandidates(entries),refund=refundCases(entries,reconciliation),savings=savingReview(bills);
    return {duplicateChargeCandidates:dup,refundReviews:refund,observedSavings:savings,
      confirmedNewIncomeUsd:0,claimActionsTaken:0,
      warning:"Discovery is not a claim, approval, refund, guaranteed continuing saving or earned income."};
  }
  window.IncomeOSRecovery=Object.freeze({analyze:analyze,duplicateCandidates:duplicateCandidates,refundCases:refundCases,savingReview:savingReview});
}());