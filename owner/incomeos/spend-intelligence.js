"use strict";
(function () {
  // Read-only financial intelligence. Works only on imported or manually entered local records.
  // No finance connector, refund execution, subscription cancellation, or automated edits.
  var CATEGORIES = Object.freeze(["platform","software","equipment","internet","travel","training","professional","supplies","investing","tax","homeoffice","advertising","other"]);
  var PERIODS = Object.freeze({weekly:7,monthly:1,quarterly:3,annual:12});
  function validDate(s) {
    if(typeof s!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var d=new Date(s+"T00:00:00Z");
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===s;
  }
  function days(a,b){return Math.round((Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/86400000);}
  function shiftMonth(date,n){
    if(!validDate(date)||!Number.isInteger(n)||Math.abs(n)>480)throw new Error("Invalid calendar offset");
    var p=date.split("-").map(Number), y=p[0],m=p[1]-1,d=p[2];
    var first=new Date(Date.UTC(y,m+n,1));
    var last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
    return first.getUTCFullYear()+"-"+String(first.getUTCMonth()+1).padStart(2,"0")+"-"+String(Math.min(d,last)).padStart(2,"0");
  }
  function shiftDays(date,n) {
    var t=Date.parse(date+"T00:00:00Z");
    if(!Number.isFinite(t)||!Number.isInteger(n))throw new Error("Invalid day shift");
    return new Date(t+n*86400000).toISOString().slice(0,10);
  }
  function usd(x){return Math.round((x+Number.EPSILON)*100)/100;}
  function merchant(s){return String(s||"Unspecified vendor").trim().replace(/\s+/g," ").slice(0,90);}
  function expenseEntries(entries){
    if(!Array.isArray(entries))return [];
    return entries.filter(function(e){return e && e.kind==="outflow"&&e.type==="expense"&&validDate(e.date)&&Number.isFinite(Number(e.amountUsd))&&Number(e.amountUsd)>0;}).map(function(e){
      return {id:String(e.id||""), date:e.date, month:e.date.slice(0,7), amount:usd(Number(e.amountUsd)), vendor:merchant(e.payer||e.label), category:CATEGORIES.includes(e.category)?e.category:"other", evidence:e.evidenceStatus||"missing", reconciled:e.reconciled===true, allocation:e.businessUse===null||e.businessUse===undefined?null:Number(e.businessUse)};
    });
  }
  function recurring(entries,asOf){
    var xs=expenseEntries(entries).filter(function(e){return e.date<=asOf;}),groups=new Map();
    xs.forEach(function(x){var k=x.vendor.toLowerCase()+"|"+x.category; if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x);});
    var result=[];
    groups.forEach(function(a){
      a.sort(function(x,y){return x.date.localeCompare(y.date);});
      if(a.length<2) return;
      // Multiple payments to one merchant in one day are not evidence of a single renewal.
      if(new Set(a.map(function(x){return x.date;})).size!==a.length)return;
      var recent=a.slice(-4),last=recent[recent.length-1];
      var intervals=[];for(var i=1;i<recent.length;i++)intervals.push(days(recent[i-1].date,recent[i].date));
      var cadence=null,periodCount=0;
      // Require at least three actual payments for short recurring intervals, and two for long intervals.
      if(intervals.length>=2 && intervals.slice(-2).every(function(n){return n>=6&&n<=8;})){cadence="weekly";periodCount=1;}
      else if(intervals.length>=2 && intervals.slice(-2).every(function(n){return n>=26&&n<=35;})){cadence="monthly";periodCount=1;}
      else if(intervals.length>=2 && intervals.slice(-2).every(function(n){return n>=80&&n<=100;})){cadence="quarterly";periodCount=3;}
      else if(intervals.length>=1 && intervals[intervals.length-1]>=330&&intervals[intervals.length-1]<=400){cadence="annual";periodCount=12;}
      if(!cadence)return;
      var expected=cadence==="weekly"?shiftDays(last.date,7):shiftMonth(last.date,periodCount);
      var lastGap=days(last.date,asOf),stale=lastGap>(cadence==="weekly"?20:cadence==="monthly"?76:cadence==="quarterly"?190:500);
      var amounts=recent.map(function(x){return x.amount;}).sort(function(a,b){return a-b;});
      var middle=amounts[Math.floor(amounts.length/2)];
      var prior=recent.slice(0,-1).map(function(x){return x.amount;}).sort(function(a,b){return a-b;});
      var baseline=prior[Math.floor(prior.length/2)];
      var spike=baseline>0 && last.amount-baseline>=5 && last.amount>=baseline*1.20;
      result.push({vendor:last.vendor,category:last.category,cadence:cadence,observations:recent.length, lastPaid:last.date,lastAmount:last.amount,typicalAmount:usd(middle),nextEstimated:expected,stale:stale,spike:spike,baseline:usd(baseline),status:"UNVERIFIED_PATTERN",note:"Merchant-level inferred pattern, not a confirmed subscription or bill."});
    });
    return result.sort(function(a,b){return a.nextEstimated.localeCompare(b.nextEstimated);}).slice(0,100);
  }
  function monthly(entries,asOf){
    if(!validDate(asOf))throw new Error("Valid as-of date required");
    var out=[],root=asOf.slice(0,7)+"-01";
    for(var i=11;i>=0;i--){
      var month=shiftMonth(root,-i).slice(0,7);
      var income=0,fees=0,outflows=0,nIncome=0,nExpense=0;
      (Array.isArray(entries)?entries:[]).forEach(function(e){
        if(!e || !validDate(e.date) || e.date.slice(0,7)!==month)return;
        if(e.kind==="income"&&e.status==="paid"&&e.scope==="income"&&Number.isFinite(Number(e.grossUsd))&&Number(e.grossUsd)>0){
          income+=Number(e.grossUsd);fees+=Number(e.feesUsd)||0;nIncome++;
        }
        if(e.kind==="outflow"&&e.type==="expense"&&Number.isFinite(Number(e.amountUsd))&&Number(e.amountUsd)>0){outflows+=Number(e.amountUsd);nExpense++;}
      });
      out.push({month:month,receipts:usd(income),fees:usd(fees),expenses:usd(outflows),recordedMargin:usd(income-fees-outflows),incomeEntries:nIncome,expenseEntries:nExpense});
    }
    return out;
  }
  function budgetVsActual(entries,budgets,asOf){
    var current=asOf.slice(0,7),xs=expenseEntries(entries).filter(function(e){return e.month===current;});
    return CATEGORIES.filter(function(cat){return Object.prototype.hasOwnProperty.call(budgets||{},cat);}).map(function(category){
      var planned=Number(budgets[category]);
      if(!Number.isFinite(planned)||planned<0||planned>1000000)throw new Error("Invalid budget target");
      var actual=usd(xs.filter(function(e){return e.category===category;}).reduce(function(s,e){return s+e.amount;},0));
      return {category:category,target:usd(planned),actual:actual,remaining:usd(planned-actual),over:actual>planned,coverage:"Recorded expense entries only; not a full household budget."};
    });
  }
  function reviewQueue(entries,patterns){
    var issues=[];
    expenseEntries(entries).forEach(function(e){
      var flags=[];
      if(e.allocation===null)flags.push("Business-use share is unknown");
      if(e.evidence==="missing" ||e.evidence==="bank" ||e.evidence==="email")flags.push("Supporting evidence incomplete");
      if(e.evidence==="both-unverified")flags.push("Receipt and bank linkage unresolved");
      if(!e.reconciled)flags.push("Not marked reconciled");
      if(flags.length)issues.push({type:"entry",id:e.id,date:e.date,vendor:e.vendor,amount:e.amount,flags:flags});
    });
    (patterns||[]).forEach(function(p){if(p.spike)issues.push({type:"price-change",date:p.lastPaid,vendor:p.vendor,amount:p.lastAmount,flags:["Recent charge is materially higher than the prior merchant pattern; review invoice and product mix"]});});
    return issues.sort(function(a,b){return b.date.localeCompare(a.date);});
  }
  function duePlans(plans,asOf){
    if(!Array.isArray(plans))return [];
    return plans.filter(function(p){return p&&typeof p.name==="string"&&validDate(p.nextDate)&&["monthly","quarterly","annual"].includes(p.cadence)&&Number.isFinite(Number(p.amount))&&Number(p.amount)>0;}).map(function(p){
      var due=p.nextDate,loops=0;
      while(due<asOf && loops++<500)due=shiftMonth(due,PERIODS[p.cadence]);
      return {id:String(p.id||""),name:p.name.slice(0,80),amount:usd(Number(p.amount)),nextDate:due,cadence:p.cadence,origin:"OWNER_PLAN_ONLY",catchupRequired:loops>1};
    }).sort(function(a,b){return a.nextDate.localeCompare(b.nextDate);});
  }
  function analyze(entries,config,asOf){
    if(!validDate(asOf))throw new Error("Valid as-of date required");
    config=config||{};
    var x=expenseEntries(entries),patterns=recurring(entries,asOf),plans=duePlans(config.plans,asOf),cashflow=monthly(entries,asOf),budget=budgetVsActual(entries,config.budgets||{},asOf),queue=reviewQueue(entries,patterns);
    var total=Array.isArray(entries)?entries.length:0;
    return {asOf:asOf,coverage:{all:total,expenses:x.length,warning:"Local ledger only. Missing sources and incomplete bank coverage can materially change results."},patterns:patterns,planned:plans,cashflow:cashflow,budgets:budget,reviewQueue:queue,reviewCount:queue.length,unplannedCost:usd(x.filter(function(e){return e.month===asOf.slice(0,7)&&!Object.prototype.hasOwnProperty.call(config.budgets||{},e.category);}).reduce(function(s,e){return s+e.amount;},0))};
  }
  window.IncomeOSIntelligence=Object.freeze({analyze:analyze,validDate:validDate,shiftMonth:shiftMonth,expenseEntries:expenseEntries,recurring:recurring,monthly:monthly,budgetVsActual:budgetVsActual,duePlans:duePlans});
}());
