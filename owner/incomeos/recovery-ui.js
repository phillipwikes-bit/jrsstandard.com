"use strict";
(function(){
  // Read-only recovery screening on local, unverified records. No claims, cancellations or payments.
  var $=function(id){return document.getElementById(id);};
  var usd=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
  function add(x,tag,value,cls){var e=document.createElement(tag);if(cls)e.className=cls;e.textContent=String(value);x.appendChild(e);return e;}
  function render(){
    var root=$("recovery-review-list"),s=$("recovery-review-status");
    if(!root||!window.IncomeOSRecovery||!window.IncomeOSAccountant||!window.IncomeOSAccountingControls)return;
    var entries=window.IncomeOSAccountant.entriesForAnalysis(),
      accounting=window.IncomeOSAccountingControls.analyze(entries,[],[]),
      review=window.IncomeOSRecovery.analyze(entries,accounting,[]);
    root.replaceChildren();
    var pending=review.duplicateChargeCandidates.length,refunds=review.refundReviews.length;
    s.textContent=pending+" potential duplicate-charge pairs and "+refunds+" locally recorded nonincome receipt(s) require evaluation. Financial source coverage is not established.";
    add(root,"h4","Charges that may warrant review");
    if(!pending)add(root,"p","No same-merchant, same-value, near-date pairs detected in available records. This does not establish the absence of duplicate billing.","muted");
    review.duplicateChargeCandidates.slice(0,15).forEach(function(x){
      var r=add(root,"div","","spend-issue");
      add(r,"strong",x.vendor+" · "+usd.format(x.amountUsd));
      add(r,"p","Records "+x.firstId+" and "+x.secondId+". "+x.reason);
    });
    add(root,"h4","Refunds and returned principal");
    if(!refunds)add(root,"p","No nonincome receipts in the local ledger. Refunds may exist in accounts not yet covered.","muted");
    review.refundReviews.slice(0,15).forEach(function(x){
      var r=add(root,"div","","spend-issue");
      add(r,"strong",usd.format(x.valueUsd)+" · "+x.state.replaceAll("_"," "));
      add(r,"p",x.note);
    });
    add(root,"p","Confirmed savings require at least two comparable post-change billed periods with linked owner-reviewed statements. No savings or refunds are certified by this browser report.","muted");
  }
  function init(){
    if(!$("recovery-review-list"))return;
    $("recovery-review-refresh").addEventListener("click",render);
    window.addEventListener("incomeos:ledger-updated",render);
    render();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());