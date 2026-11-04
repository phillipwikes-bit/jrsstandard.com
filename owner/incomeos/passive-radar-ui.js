"use strict";
(function(){
  // Shows reviewed passive-radar findings. Read only: nothing is fetched, saved or submitted.
  var $=function(id){return document.getElementById(id);};
  var usd=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
  var REASONS={ID_MISSING:"no identifier",DUPLICATE_ID:"repeats an earlier identifier",TITLE_MISSING:"no title",SOURCE_NAME_MISSING:"no source named",
    SOURCE_LINK_MISSING_OR_UNSAFE:"no safe https source link",DIRECT_LINK_MISSING_OR_UNSAFE:"no safe https direct link",DUPLICATE_DIRECT_LINK:"same direct link as an earlier finding",
    DATE_MISSING_OR_INVALID:"no valid date found",DATE_IN_FUTURE:"date is in the future",FINDING_STALE:"found more than 14 days ago",VALUE_TYPE_UNKNOWN:"type is not new income, returned capital, savings or projection",
    DEADLINE_PASSED_OR_INVALID:"deadline passed or invalid",AMOUNT_INVALID:"amount is not a valid number",COST_INVALID:"cost is not a valid number",AMOUNT_BASIS_UNKNOWN:"amount basis unknown",
    RISK_SIGNAL:"shows scam or paid-finder signs",SENSITIVE_DATA:"contains personal or account data",NOT_AN_OBJECT:"not a finding"};
  function today(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
  function add(x,tag,value,cls){var e=document.createElement(tag);if(cls)e.className=cls;if(value!=null)e.textContent=String(value);x.appendChild(e);return e;}
  function anchor(x,href,label){var a=add(x,"a",label);a.href=href;a.target="_blank";a.rel="noopener noreferrer";return a;}
  function render(res){
    var out=$("passive-results");out.replaceChildren();
    var p=res.potentialUsd;
    $("passive-status").textContent=res.accepted.length+" finding(s) accepted, "+res.refused.length+" refused. Received so far from these findings: "+usd.format(res.receivedUsd)+". "+res.notice;
    var sum=add(out,"div",null,"callout");
    add(sum,"strong","Potential value stated by sources (not received)");
    add(sum,"p","New income "+usd.format(p.new_income)+" · Returned capital "+usd.format(p.returned_capital)+" · Savings "+usd.format(p.savings)+(res.projectionCount?" · "+res.projectionCount+" projection(s), never counted":""));
    res.accepted.forEach(function(f){
      var c=add(out,"article",null,"card passive-finding");c.setAttribute("data-finding-id",f.id);
      var chips=add(c,"div",null,"chips");
      add(chips,"span",f.valueLabel,"chip"+(f.valueType==="projection"?" warn":""));
      if(f.official)add(chips,"span","Official .gov link","chip gray");
      if(f.warnings.indexOf("COSTS_MONEY_TO_PURSUE")>=0)add(chips,"span","Costs "+usd.format(f.costToPursueUsd)+" to pursue","chip warn");
      add(c,"h3",f.title);
      var amt=f.valueType==="projection"?"Projection: not income"+(f.amountUsd!=null?" ("+usd.format(f.amountUsd)+" estimated)":""):
        f.amountUsd==null?"Amount not stated":usd.format(f.amountUsd)+(f.amountBasis==="stated"?" stated by source":" estimate, not stated by source");
      add(c,"p",amt,"assetAmount");
      add(c,"p","Source: "+f.sourceName+" · found "+f.foundOn+(f.deadline?" · deadline "+f.deadline:""),"provider");
      if(f.summary)add(c,"p",f.summary,"detail");
      if(f.eligibilityText)add(c,"p","Eligibility (from source): "+f.eligibilityText,"detail");
      var links=add(c,"p",null,"cardalt");anchor(links,f.directUrl,"Open direct link");anchor(links,f.sourceUrl,"Open source");
    });
    if(res.refused.length){
      add(out,"h4","Refused findings");
      res.refused.slice(0,50).forEach(function(r){
        var d=add(out,"div",null,"spend-issue passive-refused");
        add(d,"strong",(r.title||r.id||"Finding "+(r.index+1)));
        add(d,"p","Refused: "+r.reasons.map(function(k){return REASONS[k]||k;}).join("; ")+".");
      });
    }
  }
  function importFile(){
    var f=$("passive-import-file").files&&$("passive-import-file").files[0];
    if(!f){$("passive-status").textContent="Choose a findings file first.";return;}
    if(f.size>2000000){$("passive-status").textContent="Findings file is too large (over 2 MB).";return;}
    f.text().then(function(t){
      try{render(window.IncomeOSPassiveRadar.importFindings(JSON.parse(t),today()));}
      catch(e){$("passive-results").replaceChildren();$("passive-status").textContent="Findings not reviewed: "+e.message;}
    }).catch(function(){$("passive-status").textContent="The file could not be read.";});
  }
  function downloadTemplate(){
    var u=URL.createObjectURL(new Blob([JSON.stringify(window.IncomeOSPassiveRadar.template(today()),null,2)],{type:"application/json"}));
    var a=document.createElement("a");a.href=u;a.download="incomeos-passive-findings-sample.json";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},1000);
  }
  function init(){
    if(!$("passive-radar-panel")||!window.IncomeOSPassiveRadar)return;
    $("passive-import").addEventListener("click",importFile);
    $("passive-template").addEventListener("click",downloadTemplate);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());
