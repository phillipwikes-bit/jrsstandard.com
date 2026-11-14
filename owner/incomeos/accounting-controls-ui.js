"use strict";
(function(){
  // Read-only presentation of accounting source-control diagnostics.
  // No sensitive uploads, no external telemetry, no storage writes.
  var $=function(id){return document.getElementById(id);};
  function text(container,tag,value,cls){var n=document.createElement(tag);if(cls)n.className=cls;n.textContent=String(value);container.appendChild(n);return n;}
  var money=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
  function render(){
    var root=$("accounting-control-results"),status=$("accounting-control-status");
    if(!root||!window.IncomeOSAccountingControls||!window.IncomeOSAccountant)return;
    var entries=window.IncomeOSAccountant.entriesForAnalysis();
    // The static prototype does not possess verified posted bank transactions or
    // account-coverage attestation. Passing [] is deliberate and fail-closed.
    var audit=window.IncomeOSAccountingControls.analyze(entries,[],[]);
    root.replaceChildren();
    var grid=text(root,"div","","accounting-grid");
    var cards=[
      ["Local records",String(audit.ledger.submitted)],
      ["Bank-linked & owner reviewed",String(audit.ledger.ownerReviewedBankMatches)],
      ["Unverified posted records",String(audit.ledger.unverified)],
      ["Source coverage","NOT ESTABLISHED"]
    ];
    cards.forEach(function(p){var box=text(grid,"div","","accounting-stat");text(box,"small",p[0]);text(box,"strong",p[1]);});
    var pending=audit.ledger.pending,issueCount=audit.issues.length;
    text(root,"p","Pending receipts: "+pending+". Control exceptions: "+issueCount+". Source bank postings: "+audit.bank.distinct+". These figures describe local records only.","muted");
    var totals=text(root,"div","","accounting-totals");
    text(totals,"h4","Local paid amounts by accounting class, not verified income");
    var classes=audit.receivedByClassSelfReported;
    var labels={"earned-or-other-income":"Self-reported gross earnings","investment-income":"Self-reported investment receipts","recovery-or-return-of-principal":"Refunds / returned capital, not earned income","unallocated-sale-proceeds":"Sale proceeds, basis unknown","expense":"Recorded expenses","taxpayment":"Recorded estimated tax payments","capital":"Recorded contributions / purchases","other":"Other outflows"};
    Object.keys(labels).filter(function(k){return classes[k]!==undefined;}).forEach(function(k){
      var x=text(totals,"div","","accountant-line");text(x,"span",labels[k]);text(x,"strong",money.format(classes[k]));
    });
    if(!Object.keys(classes).length)text(totals,"p","No paid financial records entered or imported.","muted");
    text(root,"h4","Review exceptions");
    var queue=text(root,"div","","accounting-control-issues");
    if(!audit.issues.length)text(queue,"p","No row-level exceptions in the local ledger. Source coverage is still unverified.","muted");
    var display=audit.issues.slice(0,25);
    display.forEach(function(issue){
      var x=text(queue,"div","","spend-issue");
      text(x,"strong",issue.code.split("_").join(" "));
      text(x,"p",issue.detail+(issue.entryId?" · Local entry "+issue.entryId:""));
    });
    if(audit.issues.length>25)text(queue,"p","Showing 25 of "+audit.issues.length+" issues. Review full accounting records outside the public prototype.","muted");
    status.textContent="Accounting close: "+audit.closeGate.status+". No bank transaction data was accessed. No entry has been independently audited or certified for tax filing.";
  }
  function init(){
    if(!$("accounting-control-results"))return;
    $("accounting-control-refresh").addEventListener("click",render);
    window.addEventListener("incomeos:ledger-updated",render);
    render();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());