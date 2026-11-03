"use strict";
(function(root){
  // IncomeOS net worth and balance sheet.
  // Every line comes from a dated, source-identified balance. A balance older
  // than its staleness limit is excluded and disclosed, never carried as current.
  // Liquid cash, restricted or illiquid assets, and liabilities are separated,
  // and unrealized investment gains are shown apart from cost basis. Accounts the
  // owner has listed but not supplied appear as coverage gaps, so the total can
  // never be mistaken for a complete picture.
  var VERSION="incomeos.net-worth.v1";
  var ASSET_TYPES={checking:"liquid",savings:"liquid",money_market:"liquid",cd:"term",treasury:"term",brokerage:"invested",retirement:"restricted",hsa:"restricted",real_estate:"illiquid",vehicle:"illiquid",receivable:"receivable",other_asset:"illiquid"};
  var LIABILITY_TYPES={credit_card:1,mortgage:1,auto_loan:1,student_loan:1,personal_loan:1,tax_owed:1,other_liability:1};
  var STALE_DAYS={liquid:7,term:45,invested:7,restricted:45,illiquid:400,receivable:45,liability:45};
  var SOURCES={statement:1,institution_export:1,appraisal:1,owner_estimate:1};
  function isDate(x){return typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T00:00:00Z"));}
  function age(a,b){return (Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/86400000;}
  function c(x){var n=Math.round(Number(x)*100);return Number.isSafeInteger(n)?n:NaN;}
  function usd(n){return n/100;}

  // accounts: [{id, name, type, owner?:"self"|"joint", expected:true}]  (the owner's list of what exists)
  // balances: [{accountId, asOf, balanceUsd, source, sourceRef, costBasisUsd?}]
  function report(accounts,balances,asOf,policy){
    policy=policy||{};
    if(!isDate(asOf))throw Error("asOf date required");
    var out={version:VERSION,asOf:asOf,lines:[],excluded:[],gaps:[],issues:[],totals:null};
    var acct={};
    (Array.isArray(accounts)?accounts:[]).forEach(function(a){
      if(!a||typeof a.id!=="string"||!a.id){out.issues.push({code:"ACCOUNT_INVALID"});return;}
      if(acct[a.id]){out.issues.push({code:"ACCOUNT_DUPLICATE",accountId:a.id});return;}
      if(!ASSET_TYPES[a.type]&&!LIABILITY_TYPES[a.type]){out.issues.push({code:"ACCOUNT_TYPE_UNKNOWN",accountId:a.id});return;}
      acct[a.id]=a;
    });
    // Latest balance per account at or before asOf.
    var latest={},conflicted={};
    (Array.isArray(balances)?balances:[]).forEach(function(b){
      if(!b||!acct[b.accountId]){out.issues.push({code:"BALANCE_FOR_UNKNOWN_ACCOUNT",accountId:b&&b.accountId||null});return;}
      if(!isDate(b.asOf)||b.asOf>asOf){out.issues.push({code:"BALANCE_DATE_INVALID_OR_FUTURE",accountId:b.accountId});return;}
      if(!SOURCES[b.source]||typeof b.sourceRef!=="string"||!b.sourceRef.trim()){out.issues.push({code:"BALANCE_SOURCE_MISSING",accountId:b.accountId});return;}
      if(!Number.isFinite(c(b.balanceUsd))){out.issues.push({code:"BALANCE_AMOUNT_INVALID",accountId:b.accountId});return;}
      var cur=latest[b.accountId];
      if(cur&&cur.asOf===b.asOf&&c(cur.balanceUsd)!==c(b.balanceUsd)){out.issues.push({code:"CONFLICTING_BALANCES_SAME_DATE",accountId:b.accountId});conflicted[b.accountId+"|"+b.asOf]=1;return;}
      // Never write onto the caller's records: conflicts are tracked here, not on the saved balances.
      if(!cur||b.asOf>cur.asOf)latest[b.accountId]=b;
    });
    var t={liquidCents:0,termCents:0,investedCents:0,restrictedCents:0,illiquidCents:0,receivableCents:0,liabilitiesCents:0,unrealizedCents:0,estimatedCents:0};
    Object.keys(acct).forEach(function(id){
      var a=acct[id],b=latest[id],klass=LIABILITY_TYPES[a.type]?"liability":ASSET_TYPES[a.type];
      if(!b){if(a.expected!==false)out.gaps.push({accountId:id,name:a.name||id,code:"NO_BALANCE_SUPPLIED"});return;}
      if(conflicted[id+"|"+b.asOf]){out.excluded.push({accountId:id,code:"CONFLICTING_BALANCES"});return;}
      var limit=Number.isFinite(policy[klass+"StaleDays"])?policy[klass+"StaleDays"]:STALE_DAYS[klass];
      if(age(b.asOf,asOf)>limit){out.excluded.push({accountId:id,name:a.name||id,code:"BALANCE_STALE",balanceAsOf:b.asOf,limitDays:limit});return;}
      var amt=c(b.balanceUsd);
      if(klass==="liability"){
        // Liabilities are entered as positive amounts owed; a negative owed amount is a credit balance.
        t.liabilitiesCents+=amt;
      }else{
        t[klass+"Cents"]+=amt;
        if(klass==="invested"&&b.costBasisUsd!=null&&Number.isFinite(c(b.costBasisUsd)))t.unrealizedCents+=amt-c(b.costBasisUsd);
      }
      if(b.source==="owner_estimate")t.estimatedCents+=Math.abs(amt);
      out.lines.push({accountId:id,name:a.name||id,type:a.type,class:klass,balanceUsd:usd(amt),asOf:b.asOf,source:b.source,sourceRef:b.sourceRef.slice(0,120),
        unrealizedUsd:klass==="invested"&&b.costBasisUsd!=null&&Number.isFinite(c(b.costBasisUsd))?usd(amt-c(b.costBasisUsd)):null});
    });
    var assets=t.liquidCents+t.termCents+t.investedCents+t.restrictedCents+t.illiquidCents+t.receivableCents;
    out.totals={assetsUsd:usd(assets),liabilitiesUsd:usd(t.liabilitiesCents),netWorthUsd:usd(assets-t.liabilitiesCents),
      liquidUsd:usd(t.liquidCents),termUsd:usd(t.termCents),investedUsd:usd(t.investedCents),restrictedUsd:usd(t.restrictedCents),illiquidUsd:usd(t.illiquidCents),receivableUsd:usd(t.receivableCents),
      liquidNetOfLiabilitiesUsd:usd(t.liquidCents-t.liabilitiesCents),
      unrealizedGainUsd:usd(t.unrealizedCents),ownerEstimatedUsd:usd(t.estimatedCents)};
    out.complete=out.gaps.length===0&&out.excluded.length===0&&out.issues.length===0;
    out.label=out.complete?"COVERED_ACCOUNTS_COMPLETE":"PARTIAL: "+(out.gaps.length+out.excluded.length)+" listed account(s) missing or stale";
    out.notice="Net worth covers only the listed accounts with current, sourced balances. Unrealized gains are not income and owner estimates are not statements.";
    return out;
  }
  // Change between two reports, separating contributions the owner records from market movement.
  function change(prev,cur,flows){
    if(!prev||!cur||!prev.totals||!cur.totals)throw Error("Two reports required");
    var net=Math.round((cur.totals.netWorthUsd-prev.totals.netWorthUsd)*100);
    var recorded=(Array.isArray(flows)?flows:[]).reduce(function(a,f){return a+(Number.isFinite(c(f.amountUsd))?c(f.amountUsd):0);},0);
    return {fromAsOf:prev.asOf,toAsOf:cur.asOf,netWorthChangeUsd:net/100,recordedNetFlowsUsd:recorded/100,unexplainedUsd:(net-recorded)/100,
      comparable:prev.complete&&cur.complete,
      note:"Unexplained change includes market movement, unrecorded flows and coverage differences. It is not investment return unless both reports are complete."};
  }
  var api=Object.freeze({VERSION:VERSION,report:report,change:change,ASSET_TYPES:Object.keys(ASSET_TYPES),LIABILITY_TYPES:Object.keys(LIABILITY_TYPES)});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSNetWorth=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
