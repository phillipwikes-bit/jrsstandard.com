"use strict";
(function(){
  // Compound view: available-to-compound estimate from the open workspace ledger. Read only.
  var $=function(id){return document.getElementById(id);};
  var usd=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
  function add(x,tag,v,cls){var e=document.createElement(tag);if(cls)e.className=cls;if(v!=null)e.textContent=String(v);x.appendChild(e);return e;}
  function render(){
    var out=$("cc-result");if(!out||!window.IncomeOSAccountant||!window.IncomeOSCompoundCapacity)return;
    out.replaceChildren();
    var all=window.IncomeOSAccountant.entriesForAnalysis(),year=String($("cc-year").value||"").trim();
    if(year&&!/^\d{4}$/.test(year)){add(out,"p","Enter a four-digit year, or leave it empty for all years.","muted");return;}
    var entries=year?all.filter(function(e){return String(e.date||"").slice(0,4)===year;}):all;
    var scheduled=all.filter(function(e){return e.kind==="outflow"&&e.type!=="refund"&&e.paymentStatus==="scheduled";})
      .reduce(function(s,e){return s+Number(e.amountUsd||0);},0);
    if(!all.length){add(out,"p","Open your workspace and record income and expenses to see this estimate.","muted");return;}
    var r;
    try{r=window.IncomeOSCompoundCapacity.estimate(window.IncomeOSAccountant.totals(entries),{reserveUsd:Number($("cc-reserve").value||0),scheduledObligationsUsd:Math.round(scheduled*100)/100});}
    catch(e){add(out,"p","Estimate not available: "+e.message,"muted");return;}
    var box=add(out,"div",null,"projection");
    add(box,"span","Available to compound"+(year?" from "+year:"")+(r.status==="ESTIMATE_NOT_RECONCILED"?" (estimate, not reconciled)":""));
    add(box,"strong",usd.format(r.availableToCompound)).id="cc-available";
    var rows=add(out,"dl",null,"detail");
    [["Income received, after fees",r.netIncomeReceived],["Expenses, taxes and other outflows paid","-"+usd.format(r.spendingPaid)],["Operating cash flow",r.operatingCashFlow],
     ["Capital returned (not earnings)",r.capitalReturned],["Capital already contributed","-"+usd.format(r.capitalContributed)],
     ["Scheduled bills not yet paid","-"+usd.format(r.scheduledObligations)],["Reserve you set aside","-"+usd.format(r.reserve)]].forEach(function(p){
      var d=add(rows,"div",null,"line");add(d,"dt",p[0]);add(d,"dd",typeof p[1]==="number"?usd.format(p[1]):p[1]);});
    var loss=Number($("cc-loss").value||0);
    try{var dn=window.IncomeOSCompoundCapacity.downside(r.availableToCompound,loss,0);
      add(out,"p","Downside check: if all of it were invested and lost "+loss+"%, "+usd.format(dn.loss)+" would be gone and "+usd.format(dn.remaining)+" would remain.","muted").id="cc-downside";}
    catch(e){add(out,"p","Enter a loss between 0 and 100 percent.","muted");}
    if(r.issues.length){var ul=add(out,"ul",null,"bullets");r.issues.forEach(function(i){add(ul,"li",i);});}
    add(out,"p",r.notice,"muted");
  }
  function renderHoldings(){
    var out=$("ch-result");if(!out||!window.IncomeOSAccountant||!window.IncomeOSCompoundCapacity)return;out.replaceChildren();
    var r=window.IncomeOSCompoundCapacity.holdings(window.IncomeOSAccountant.entriesForAnalysis());
    if(!r.holdings.length){add(out,"p","No investment records yet. Record money you put in as an outflow of type \"Asset purchase / capital contribution\", and interest, dividends or principal back as income from the same payer name.","muted");return;}
    r.holdings.forEach(function(h){
      var c=add(out,"div",null,"spend-issue holding");c.setAttribute("data-holding",h.name);
      add(c,"strong",h.name);
      add(c,"p",{CAPITAL_RETURNED:"All money put in has come back.",CAPITAL_STILL_OUT:usd.format(h.stillInvested)+" of your money is still in it.",NO_CONTRIBUTION_RECORDED:"No money put in is recorded."}[h.status],"muted");
      var dl=add(c,"dl",null,"detail");
      [["Money put in",h.contributed],["of which reinvested earnings",h.reinvestedEarnings],["of which new money",h.newMoney],["Income received",h.incomeReceived],["Earnings reinvested in other holdings",h.earningsReinvestedElsewhere],["Principal returned (not earnings)",h.principalReturned],["Sale proceeds (not earnings)",h.saleProceeds],["Net cash so far",h.netCashSoFar]].forEach(function(p){
        var d=add(dl,"div",null,"line");add(d,"dt",p[0]);add(d,"dd",usd.format(p[1]));});
      if(h.incomeOnCapitalPct!=null){var d=add(dl,"div",null,"line");add(d,"dt","Income on money put in (not annualised)");add(d,"dd",h.incomeOnCapitalPct+"%");}
      if(h.flags.length){var ul=add(c,"ul",null,"bullets");h.flags.forEach(function(f){add(ul,"li",f);});}
    });
    add(out,"p",r.notice,"muted");
  }
  function init(){
    if(!$("cc-panel"))return;
    ["cc-year","cc-reserve","cc-loss"].forEach(function(id){$(id).addEventListener("input",render);});
    window.addEventListener("incomeos:ledger-updated",render);
    window.addEventListener("incomeos:ledger-updated",renderHoldings);
    $("cc-year").value=String(new Date().getFullYear());
    render();renderHoldings();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());
