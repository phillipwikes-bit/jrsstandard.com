"use strict";
(function(root){
  // IncomeOS compensation intelligence.
  // Effective hourly = (expected gross - known fees) / (paid hours + unpaid screening/admin hours).
  // Taxes are reported separately and never netted silently. Advertised pay is
  // not guaranteed pay. Missing workload, screening burden or a currency rate
  // makes the estimate UNVERIFIED rather than guessed.
  var VERSION="incomeos.compensation.v1";
  function num(x){return typeof x==="number"&&Number.isFinite(x)?x:(typeof x==="string"&&x.trim()!==""&&Number.isFinite(Number(x))?Number(x):NaN);}
  function round2(x){return Math.round(x*100)/100;}
  function isDate(x){return typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T00:00:00Z"));}

  // Convert to USD using explicit, timestamped exchange-rate evidence only.
  function toUsd(amount,currency,fx,asOf){
    var c=typeof currency==="string"?currency.toUpperCase():"USD";
    if(c==="USD")return {ok:true,usd:amount,fx:null};
    if(!fx||fx.base!==c||fx.quote!=="USD"||!(num(fx.rate)>0)||!isDate(fx.asOf)||typeof fx.source!=="string"||!/^https:\/\//.test(fx.source))return {ok:false,reason:"EXCHANGE_RATE_EVIDENCE_MISSING"};
    if(isDate(asOf)&&(Date.parse(asOf)-Date.parse(fx.asOf))/86400000>7)return {ok:false,reason:"EXCHANGE_RATE_STALE"};
    return {ok:true,usd:amount*num(fx.rate),fx:{rate:num(fx.rate),asOf:fx.asOf,source:fx.source}};
  }

  // terms: {model, currency, fx, feesFixed, feePercent, unpaidHours, ...model fields}
  // Models: hourly{rate,expectedHours} fixed{amount,expectedHours} per_task{ratePerTask,tasks,minutesPerTask}
  // paid_interview{amount,minutes} consultation{rate,hours} retainer{monthlyAmount,hoursPerMonth,months}
  // milestone{milestones:[{amount,hours}]} performance{...} -> always unverified (contingent pay excluded).
  function estimate(terms,asOf){
    var r={version:VERSION,status:"UNVERIFIED",reasons:[],grossUsd:null,feesUsd:null,paidHours:null,unpaidHours:null,effectiveHourlyUsd:null,
      taxes:"NOT_DEDUCTED: income and self-employment taxes are owner-specific and reported separately.",guaranteed:false,assumptions:[]};
    if(!terms||typeof terms!=="object"){r.reasons.push("TERMS_MISSING");return r;}
    var gross=NaN,paid=NaN;
    switch(terms.model){
      case "hourly":gross=num(terms.rate)*num(terms.expectedHours);paid=num(terms.expectedHours);break;
      case "consultation":gross=num(terms.rate)*num(terms.hours);paid=num(terms.hours);break;
      case "fixed":gross=num(terms.amount);paid=num(terms.expectedHours);break;
      case "per_task":gross=num(terms.ratePerTask)*num(terms.tasks);paid=num(terms.tasks)*num(terms.minutesPerTask)/60;break;
      case "paid_interview":gross=num(terms.amount);paid=num(terms.minutes)/60;break;
      case "retainer":var months=Number.isFinite(num(terms.months))?num(terms.months):1;gross=num(terms.monthlyAmount)*months;paid=num(terms.hoursPerMonth)*months;break;
      case "milestone":
        if(!Array.isArray(terms.milestones)||!terms.milestones.length){r.reasons.push("MILESTONES_MISSING");break;}
        gross=0;paid=0;terms.milestones.forEach(function(m){gross+=num(m&&m.amount);paid+=num(m&&m.hours);});break;
      case "performance":r.reasons.push("CONTINGENT_PAY_NOT_ESTIMATED");return r;
      default:r.reasons.push("PAYMENT_MODEL_UNKNOWN");return r;
    }
    if(!(gross>0))r.reasons.push("PAY_AMOUNT_UNKNOWN");
    if(!(paid>0))r.reasons.push("WORKLOAD_UNKNOWN");
    var unpaid=num(terms.unpaidHours);
    if(!(unpaid>=0)){r.reasons.push("SCREENING_BURDEN_UNKNOWN");}
    var feePct=terms.feePercent==null?0:num(terms.feePercent),feeFixed=terms.feesFixed==null?0:num(terms.feesFixed);
    if(!(feePct>=0&&feePct<100)||!(feeFixed>=0))r.reasons.push("FEES_INVALID");
    if(r.reasons.length)return r;
    var conv=toUsd(gross,terms.currency,terms.fx,asOf);
    if(!conv.ok){r.reasons.push(conv.reason);return r;}
    var feeConv=toUsd(feeFixed,terms.currency,terms.fx,asOf);
    var grossUsd=conv.usd,fees=grossUsd*feePct/100+(feeConv.ok?feeConv.usd:0);
    r.grossUsd=round2(grossUsd);r.feesUsd=round2(fees);r.paidHours=round2(paid);r.unpaidHours=round2(unpaid);r.fx=conv.fx;
    r.effectiveHourlyUsd=round2((grossUsd-fees)/(paid+unpaid));
    r.assumptions=Array.isArray(terms.assumptions)?terms.assumptions.slice(0,10).map(String):[];
    r.status=r.assumptions.length?"ESTIMATED_WITH_OWNER_ASSUMPTIONS":"ESTIMATED";
    return r;
  }

  // Parse advertised compensation from structured connector fields or listing text.
  // Returns {model, rate|amount, currency, period, basis:"structured"|"text", sourceText} or null.
  function parseAdvertised(text){
    if(typeof text!=="string")return null;
    var t=text.replace(/\s+/g," ");
    var cur="(?:(USD|US\\$|\\$|EUR|€|GBP|£|CAD|C\\$|AUD|A\\$|INR|₹))";
    var amt="(\\d{1,3}(?:,\\d{3})*(?:\\.\\d{1,2})?|\\d+(?:\\.\\d{1,2})?)(\\s*[kK])?";
    var re=new RegExp(cur+"\\s?"+amt+"(?:\\s*(?:-|–|—|to)\\s*"+cur+"?\\s?"+amt+")?\\s*(USD|EUR|GBP|CAD|AUD)?\\s*(?:\\/|per|an|a)\\s*(hour|hr|h\\b|task|year|yr|annum|month|session|interview)","i");
    var m=t.match(re);
    if(!m)return null;
    function val(n,k){var v=Number(String(n).replace(/,/g,""));return k?v*1000:v;}
    var sym=(m[1]||"").toUpperCase(),code=(m[7]||"").toUpperCase();
    var currency=code||({"$":"USD","US$":"USD","USD":"USD","€":"EUR","EUR":"EUR","£":"GBP","GBP":"GBP","CAD":"CAD","C$":"CAD","AUD":"AUD","A$":"AUD","INR":"INR","₹":"INR"}[sym]||"UNKNOWN");
    var lo=val(m[2],m[3]),hi=m[5]?val(m[5],m[6]):null,per=m[8].toLowerCase();
    var period=/^(hour|hr|h)$/.test(per)?"hour":/^(year|yr|annum)$/.test(per)?"year":per;
    var upTo=/\bup to\s*$/i.test(t.slice(Math.max(0,m.index-8),m.index));
    var start=Math.max(0,m.index-120),excerpt=t.slice(start,Math.min(t.length,m.index+m[0].length+60)).trim();
    return {currency:currency,min:upTo?null:lo,max:hi!==null?hi:lo,period:period,upperBoundOnly:upTo,basis:"text",sourceText:excerpt.slice(0,300)};
  }

  // Build estimate terms from an advertised range plus explicit owner assumptions.
  // Uses the LOW end of a range (conservative). Upper-bound-only pay is unverified.
  function termsFromAdvertised(adv,prefs){
    prefs=prefs||{};
    if(!adv)return null;
    if(adv.upperBoundOnly||!(adv.min>0))return {model:"unknown"};
    var unpaid=num(prefs.defaultScreeningHours),assume=[];
    if(Number.isFinite(unpaid))assume.push("owner default unpaid screening/onboarding hours: "+unpaid);
    if(adv.period==="hour"){
      var hrs=num(prefs.defaultEngagementHours);
      if(Number.isFinite(hrs))assume.push("owner default engagement hours: "+hrs);
      return {model:"hourly",rate:adv.min,expectedHours:hrs,unpaidHours:unpaid,currency:adv.currency,fx:prefs.fx&&prefs.fx[adv.currency],assumptions:assume};
    }
    if(adv.period==="year"){
      assume.push("annual salary converted at 2,080 paid hours per year");
      return {model:"hourly",rate:adv.min/2080,expectedHours:2080,unpaidHours:unpaid,currency:adv.currency,fx:prefs.fx&&prefs.fx[adv.currency],assumptions:assume};
    }
    return {model:"unknown"};
  }
  var api=Object.freeze({VERSION:VERSION,estimate:estimate,parseAdvertised:parseAdvertised,termsFromAdvertised:termsFromAdvertised,toUsd:toUsd});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSCompensation=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
