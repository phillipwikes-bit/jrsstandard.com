"use strict";
(function(){
  // Staging-only, read-only transfer status. No financial access, imports,
  // transactions, local storage writes, or owner source attestations.
  function byId(id){return document.getElementById(id);}
  function append(parent,tag,content){var n=document.createElement(tag);n.textContent=content;parent.appendChild(n);return n;}
  function today(){
    var d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
  }
  async function render(){
    var status=byId("transfer-review-status"),root=byId("transfer-review-results");
    if(!status||!root)return;
    root.replaceChildren();
    if(!window.IncomeOSTransferReconciliation){
      status.textContent="Transfer reconciliation unavailable. Release hold remains in effect.";return;
    }
    status.textContent="Reviewing available staging evidence...";
    var asOf=today(),empty={
      journal:[],
      statementPackage:{from:asOf,to:asOf,scopeConfirmed:false,expectedAccounts:[],
        statements:[],bankRows:[],accountingMatches:[]},
      bindings:[],pairs:[]
    };
    try{
      var r=await window.IncomeOSTransferReconciliation.assess(empty);
      status.textContent="Transfer accounting: "+r.status+". Bank statement coverage and transfer pair documentation are not available in staging.";
      append(root,"p","No account-to-account transfer or credit-card payment can be certified from this development interface.");
      var ul=append(root,"ul","");
      append(ul,"li","Link each cash debit to a distinct matching bank or card credit.");
      append(ul,"li","Review original statement evidence for both financial accounts.");
      append(ul,"li","Exclude matched transfers and credit-card payments from new income and duplicate operating expenses.");
      append(root,"p","Transfer detection does not establish account ownership, tax classifications, or funds available to invest.");
    }catch(_err){
      status.textContent="Transfer review unavailable. Do not classify account movements from unverified records.";
    }
  }
  function init(){var button=byId("transfer-review-refresh");if(!button)return;button.addEventListener("click",render);render();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());