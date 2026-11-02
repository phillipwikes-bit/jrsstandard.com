"use strict";
(function(){
  // Read-only staging display: no bank source, authenticated financial history,
  // or attestations are available to this static client. Always fail closed.
  var $=function(id){return document.getElementById(id);};
  function element(parent,tag,content,cls){
    var x=document.createElement(tag);if(cls)x.className=cls;
    x.textContent=String(content);parent.appendChild(x);return x;
  }
  function dateNow(){var n=new Date();return [n.getFullYear(),String(n.getMonth()+1).padStart(2,"0"),String(n.getDate()).padStart(2,"0")].join("-");}
  function render(){
    var result=$("capital-readiness-results"),status=$("capital-readiness-status");
    if(!result||!status||!window.IncomeOSCapitalReadiness)return;
    var day=dateNow();
    var evidence={
      asOf:day,
      statementPackage:{from:day,to:day,expectedAccounts:[],statements:[],bankRows:[],accountingMatches:[],scopeConfirmed:false},
      accountUse:[],obligations:[],obligationsReviewed:false,obligationCoverageEvidenceId:null,
      reserves:{emergencyCents:null,taxCents:null,otherCents:null,evidenceId:null,ownerReviewed:false},
      horizonDays:90,proposedAllocationCents:0
    };
    var report=window.IncomeOSCapitalReadiness.assess(evidence);
    result.replaceChildren();
    status.textContent="Capital release: "+report.status+". No verified financial source coverage. No allocation, transfer, or reinvestment is authorized.";
    element(result,"p","Preliminary uncommitted capital: unavailable. Staging intentionally supplies no bank statements, cash balances, or obligation attestations.","muted");
    var titles={
      NO_EXPECTED_ACCOUNTS:"Account population has not been established",
      SCOPE_NOT_CONFIRMED:"Financial institution coverage has not been confirmed",
      UNRECONCILED_SOURCE_COVERAGE:"Source reconciliation remains incomplete",
      OBLIGATIONS_NOT_ATTESTED:"Upcoming obligations have not been reconciled",
      RESERVE_PLAN_NOT_REVIEWED:"Emergency and tax reserves have not been documented",
      NO_SPECIFIC_ALLOCATION:"No specific allocation has been approved"
    };
    var list=element(result,"ul","","capital-control-list"),seen=new Set();
    report.issues.forEach(function(x){
      if(seen.has(x.code))return;seen.add(x.code);
      if(titles[x.code])element(list,"li",titles[x.code]);
    });
    element(result,"p","Investment income, returned principal, sale proceeds and provider-reported reinvestment require protected statement evidence. This interface has no live trading or banking permissions.","muted");
  }
  function init(){
    var button=$("capital-readiness-refresh");if(!button)return;
    button.addEventListener("click",render);render();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());