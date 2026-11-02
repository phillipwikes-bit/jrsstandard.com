"use strict";
(function(){
  // This is an intentionally unconditional staging interlock, NOT authentication.
  // Set before any financial module is evaluated; DOM disabling alone is insufficient.
  window.IncomeOSFinancialReadOnly=true;
  // Remove only in a separate, reviewed, owner-authenticated deployment.
  function lock(){
    var lockIds=["receipt-form","cost-form","import-trigger","import-csv-trigger","import-ledger","import-csv","vault-file","vault-import"];
    lockIds.forEach(function(id){
      var el=document.getElementById(id);if(!el)return;
      if(el.tagName==="FORM"){
        el.querySelectorAll("input,select,textarea,button").forEach(function(child){child.disabled=true;child.setAttribute("aria-disabled","true");});
      }else{el.disabled=true;el.setAttribute("aria-disabled","true");}
    });
    var banner=document.getElementById("financial-staging-interlock");
    if(banner)banner.hidden=false;
    var status=document.getElementById("accounting-control-status");
    if(status)status.dataset.stagingLock="active";
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",lock);else lock();
}());