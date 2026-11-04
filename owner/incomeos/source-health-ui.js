"use strict";
(function(){
  function show(){
    var target=document.getElementById("capital-readiness-results");
    if(!target||!window.IncomeOSSourceHealth)return;
    var old=document.getElementById("source-health-display");
    if(old)old.remove();
    var p=document.createElement("p");
    p.id="source-health-display";
    p.className="muted";
    var result=window.IncomeOSSourceHealth.assess([]);
    p.textContent="Financial source verification: "+result.status+". Staging has no authenticated bank-source inventory. Available capital cannot be established.";
    target.prepend(p);
  }
  // Called by capital-review-ui after every render, so the HOLD line survives any re-render.
  window.IncomeOSSourceHealthUI=Object.freeze({show:show});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",show);
  else show();
}());
